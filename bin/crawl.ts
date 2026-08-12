/**
 * Refreshes the sqlite dataset the static site is built from.
 *
 * 1. reads every awesome list declared in config.yaml and extracts the
 *    repositories linked in its README
 * 2. refreshes the metadata of those repositories (stars, forks, pushedAt,
 *    language, topics, license, archived)
 *
 * The GitHub REST API allows 5000 requests/hour per *account* (1000/hour for
 * the built-in Actions token), and the dataset holds ~18k repositories, so the
 * metadata pass goes through GraphQL where one request resolves a whole batch.
 * A full refresh costs ~360 requests / ~1800 rate limit points.
 *
 * Star history (github_repo.stars_detail) is deliberately not refreshed here:
 * it needs a paginated walk over the stargazers of every repository, which
 * alone is ~50k requests. Run it separately with a dedicated token budget.
 *
 * Usage: pnpm crawl [--only=rust,golang] [--stale-days=7] [--max-repos=5000]
 */
import "dotenv/config";
import * as D from "drizzle-orm";
import { parseArgs } from "node:util";
import PQueue from "p-queue";
import { loadConfig } from "../lib/config.ts";
import { db } from "../lib/db/index.ts";
import { awesomeRepoTable, githubRepoTable } from "../lib/db/schema.ts";
import { getAwesomeSourceIdsFromConfig } from "../lib/db/utils.ts";
import {
  fetchAwesomeRepo,
  fetchGithubProjects,
  rotateOctokit,
  type GithubProject,
} from "../lib/fetcher/github.ts";

const { values: flags } = parseArgs({
  options: {
    only: { type: "string" },
    "batch-size": { type: "string", default: "50" },
    concurrency: { type: "string", default: "8" },
    "stale-days": { type: "string" },
    "max-repos": { type: "string" },
    "skip-readme": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (flags.help) {
  console.log(`pnpm crawl [options]

  --only=rust,golang   only crawl these config.yaml entries (default: all)
  --stale-days=N       skip repositories refreshed less than N days ago
  --max-repos=N        stop after N repositories (the stalest ones first)
  --batch-size=N       repositories per GraphQL request (default 50, max 100)
  --concurrency=N      parallel requests (default 8, stay well under 100)
  --skip-readme        reuse the repository lists already in the database
  --dry-run            fetch everything but write nothing
`);
  process.exit(0);
}

const BATCH_SIZE = Math.min(Number(flags["batch-size"]) || 50, 100);
const CONCURRENCY = Number(flags.concurrency) || 8;
const STALE_DAYS = flags["stale-days"]
  ? Number(flags["stale-days"])
  : undefined;
const MAX_REPOS = flags["max-repos"] ? Number(flags["max-repos"]) : undefined;
const DRY_RUN = flags["dry-run"];

if (!process.env["GITHUB_TOKEN"]) {
  console.error(
    "GITHUB_TOKEN is not set. Provide one token, or several comma separated " +
      "ones belonging to different accounts (the hourly quota is per account).",
  );
  process.exit(1);
}

// github.com paths that look like <owner>/<repo> but are not repositories
const RESERVED_OWNERS = new Set([
  "about",
  "account",
  "apps",
  "codespaces",
  "collections",
  "contact",
  "dashboard",
  "enterprise",
  "explore",
  "features",
  "issues",
  "join",
  "login",
  "marketplace",
  "new",
  "notifications",
  "organizations",
  "orgs",
  "pricing",
  "pulls",
  "search",
  "security",
  "settings",
  "site",
  "sponsors",
  "stars",
  "topics",
  "trending",
  "users",
  "watching",
]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries around the two failure modes of a long crawl: rate limits (rotate to
 * the next token, or wait for the window to reset) and transient 5xx/network
 * errors. Anything permanently gone resolves to undefined so the crawl goes on.
 */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      const status = e?.status ?? e?.response?.status;
      if (status === 404 || status === 451) return undefined;
      if (status === 403 || status === 429) {
        if (rotateOctokit()) continue;
        const reset = Number(e?.response?.headers?.["x-ratelimit-reset"]);
        const waitMs = Number.isFinite(reset)
          ? Math.max(reset * 1000 - Date.now(), 0) + 5_000
          : attempt * 60_000;
        const capped = Math.min(waitMs, 65 * 60_000);
        console.warn(
          `[rate limit] ${label}: waiting ${Math.round(capped / 1000)}s`,
        );
        await sleep(capped);
        continue;
      }
      if (attempt >= 4) {
        console.warn(`[skip] ${label}: ${e?.message ?? e}`);
        return undefined;
      }
      await sleep(attempt * 2_000);
    }
  }
}

function normalizeId(raw: string) {
  const [owner, rest] = raw.split("/");
  if (!owner || !rest) return undefined;
  if (RESERVED_OWNERS.has(owner.toLowerCase())) return undefined;
  const repo = rest.replace(/\.git$/i, "").replace(/\.+$/, "");
  if (!repo) return undefined;
  return `${owner}/${repo}`;
}

/** keeps the first spelling seen, github itself is case insensitive */
function dedupe(ids: string[]) {
  const seen = new Map<string, string>();
  for (const id of ids) {
    const key = id.toLowerCase();
    if (!seen.has(key)) seen.set(key, id);
  }
  return [...seen.values()];
}

async function collectSources() {
  const config = await loadConfig();
  const only = flags.only?.split(",").map((x) => x.trim().toLowerCase());
  const entries = only
    ? config.repos.filter((x) => only.includes(x.name.toLowerCase()))
    : config.repos;

  if (only) {
    const unknown = only.filter(
      (name) => !config.repos.some((x) => x.name.toLowerCase() === name),
    );
    if (unknown.length) {
      console.error(`unknown config.yaml entries: ${unknown.join(", ")}`);
      process.exit(1);
    }
  }

  return dedupe(
    entries.flatMap(
      (entry) =>
        getAwesomeSourceIdsFromConfig(config, entry.name.toLowerCase()) ?? [],
    ),
  );
}

/** refreshes the README of every awesome list and returns the repos they link */
async function crawlAwesomeLists(sourceIds: string[]) {
  const stored = await db
    .select({
      id: awesomeRepoTable.id,
      items: awesomeRepoTable.items,
      digest: awesomeRepoTable.readmeDigest,
    })
    .from(awesomeRepoTable)
    .where(D.inArray(awesomeRepoTable.id, sourceIds));
  const byId = new Map(stored.map((x) => [x.id, x]));

  if (flags["skip-readme"]) {
    console.log(`[lists] reusing ${stored.length} cached list(s)`);
    return dedupe(stored.flatMap((x) => x.items));
  }

  const queue = new PQueue({ concurrency: CONCURRENCY });
  const items: string[][] = [];
  let unchanged = 0;

  await queue.addAll(
    sourceIds.map((id) => async () => {
      const result = await withRetry(id, () => fetchAwesomeRepo(id));
      const cached = byId.get(id);
      if (!result) {
        if (cached) items.push(cached.items);
        console.warn(`[lists] ${id}: unreachable, keeping stored items`);
        return;
      }
      items.push(result.items);
      if (cached?.digest === result.readmeDigest) {
        unchanged++;
        return;
      }
      if (DRY_RUN) return;
      await db
        .insert(awesomeRepoTable)
        .values({
          id,
          readmeDigest: result.readmeDigest,
          items: result.items,
        })
        .onConflictDoUpdate({
          target: awesomeRepoTable.id,
          set: {
            readmeDigest: D.sql`excluded.readme_digest`,
            items: D.sql`excluded.items`,
            updatedAt: new Date(),
          },
        });
    }),
  );

  console.log(
    `[lists] ${sourceIds.length} list(s) read, ${unchanged} unchanged since last run`,
  );
  return dedupe(items.flat());
}

/** drops repos refreshed recently and orders the rest stalest first */
async function selectTargets(ids: string[]) {
  const rows = await db
    .select({ id: githubRepoTable.id, updatedAt: githubRepoTable.updatedAt })
    .from(githubRepoTable);
  const seenAt = new Map(rows.map((x) => [x.id, x.updatedAt?.getTime() ?? 0]));

  let targets = ids;
  if (STALE_DAYS !== undefined) {
    const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
    targets = targets.filter((id) => (seenAt.get(id) ?? 0) < cutoff);
    console.log(
      `[repos] ${ids.length - targets.length} refreshed less than ${STALE_DAYS}d ago, skipped`,
    );
  }
  // never seen (0) first, then oldest refresh first
  targets = targets.toSorted(
    (a, b) => (seenAt.get(a) ?? 0) - (seenAt.get(b) ?? 0),
  );
  if (MAX_REPOS !== undefined && targets.length > MAX_REPOS) {
    console.log(`[repos] capped at ${MAX_REPOS} of ${targets.length}`);
    targets = targets.slice(0, MAX_REPOS);
  }
  return targets;
}

async function persist(projects: Map<string, GithubProject>) {
  if (DRY_RUN || projects.size === 0) return;
  const now = new Date();
  const rows = [...projects].map(([id, p]) => ({
    id,
    name: p.name,
    description: p.description,
    topics: p.topics,
    owner: p.owner,
    stars: p.stars,
    license: p.license ?? null,
    forks: p.forks,
    primaryLanguage: p.primaryLanguage,
    pushedAt: p.pushedAt,
    archived: p.archived,
    createdAt: p.createdAt,
    updatedAt: now,
  }));
  // stars_detail / npm_* / go_* are owned by other passes, leave them alone
  await db
    .insert(githubRepoTable)
    .values(rows)
    .onConflictDoUpdate({
      target: githubRepoTable.id,
      set: {
        name: D.sql`excluded.name`,
        description: D.sql`excluded.description`,
        topics: D.sql`excluded.topics`,
        owner: D.sql`excluded.owner`,
        stars: D.sql`excluded.stars`,
        license: D.sql`excluded.license`,
        forks: D.sql`excluded.forks`,
        primaryLanguage: D.sql`excluded.primary_language`,
        pushedAt: D.sql`excluded.pushed_at`,
        archived: D.sql`excluded.archived`,
        createdAt: D.sql`excluded.created_at`,
        updatedAt: D.sql`excluded.updated_at`,
      },
    });
}

async function crawlRepos(ids: string[]) {
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }

  const queue = new PQueue({ concurrency: CONCURRENCY });
  let done = 0;
  let updated = 0;
  let missing = 0;

  await queue.addAll(
    batches.map((batch, i) => async () => {
      const result = await withRetry(`batch ${i}`, () =>
        fetchGithubProjects(batch),
      );
      done++;
      if (!result) return;
      await persist(result.projects);
      updated += result.projects.size;
      missing += result.missing.length;

      const { rateLimit } = result;
      if (done % 10 === 0 || done === batches.length) {
        console.log(
          `[repos] ${done}/${batches.length} batches, ${updated} updated, ${missing} gone` +
            (rateLimit ? ` (${rateLimit.remaining} points left)` : ""),
        );
      }
      // stay clear of the window rather than burning into a hard 403
      if (rateLimit && rateLimit.remaining < rateLimit.cost * 3) {
        if (!rotateOctokit()) {
          const waitMs = new Date(rateLimit.resetAt).getTime() - Date.now();
          console.warn(
            `[rate limit] budget exhausted, waiting ${Math.round(waitMs / 1000)}s`,
          );
          await sleep(Math.min(Math.max(waitMs, 0) + 5_000, 65 * 60_000));
        }
      }
    }),
  );

  return { updated, missing };
}

async function main() {
  const startedAt = Date.now();
  const sourceIds = await collectSources();
  console.log(`[lists] ${sourceIds.length} awesome list(s) from config.yaml`);

  const linked = await crawlAwesomeLists(sourceIds);
  const candidates = dedupe(
    [...sourceIds, ...linked]
      .map(normalizeId)
      .filter((x): x is string => x !== undefined),
  );
  console.log(`[repos] ${candidates.length} unique repositories linked`);

  const targets = await selectTargets(candidates);
  if (targets.length === 0) {
    console.log("[repos] nothing to refresh");
    return;
  }

  const { updated, missing } = await crawlRepos(targets);
  console.log(
    `[done] ${updated} repositories refreshed, ${missing} gone, ` +
      `${Math.round((Date.now() - startedAt) / 1000)}s` +
      (DRY_RUN ? " (dry run, nothing written)" : ""),
  );
}

await main();
