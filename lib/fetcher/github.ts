import dayjs from "dayjs";
import { sortedIndex } from "lodash-es";
import { Octokit, RequestError } from "octokit";

const tokens = process.env["GITHUB_TOKEN"]?.split(",") || [];

function hasMoreToken() {
  return tokens.length > 0;
}
function invalidThisOctokit(octokit: any) {
  if (octokit === _octokit) {
    console.log("tokens iv");
    _octokit = undefined;
  }
}

class NoMoreTokenError extends Error {
  constructor() {
    super("no more token for github");
  }
}
let _octokit: Octokit | undefined = undefined;
export function getOctokit() {
  if (_octokit) return _octokit;
  if (hasMoreToken()) {
    const token = tokens.pop();
    _octokit = new Octokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter: any, options: any, octokit: any) => {
          invalidThisOctokit(octokit);
          return false;
        },
        onSecondaryRateLimit: () => false,
      },
    });
    return _octokit;
  } else {
    throw new NoMoreTokenError();
  }
}

export async function retryWhileRateLimit(fn: () => Promise<void>) {
  while (true) {
    try {
      await fn();
      return;
    } catch (e) {
      if (e instanceof RequestError) {
        switch (e.status) {
          case 403: {
            if (hasMoreToken()) {
              continue;
            }
          }
          case 404: {
            return;
          }
          default:
        }
      }
      throw e;
      return;
    }
  }
}
export async function fetchGithubProject(id: string) {
  const octokit = getOctokit();

  const [owner, repo] = id.split("/");
  const repoId = { owner, repo };
  const { data: repoData } = await octokit.rest.repos.get(repoId);
  const { data: languagesData } =
    await octokit.rest.repos.listLanguages(repoId);

  let primaryLanguage = "";
  let maxCount = 0;
  for (const lang of Object.keys(languagesData)) {
    if (languagesData[lang] > maxCount) {
      primaryLanguage = lang;
    }
  }

  return {
    url: repoData.html_url,
    name: repoData.full_name,
    topics: repoData.topics || [],
    stars: repoData.stargazers_count,
    owner: {
      name: repoData.owner.name || repoData.owner.login,
      avatarUrl: repoData.owner.avatar_url,
    },
    forks: repoData.forks_count || 0,
    pushedAt: new Date(repoData.pushed_at),
    createdAt: new Date(repoData.created_at),
    archived: repoData.archived,
    license: repoData.license?.name,
    description: repoData.description || "",
    primaryLanguage,
  };
}

export async function fetchAwesomeRepo(id: string) {
  const octokit = getOctokit();

  const [owner, repo] = id.split("/");
  const resp = await octokit.rest.repos.getReadme({ owner, repo });
  const content = Buffer.from(resp.data.content, "base64").toString("utf-8");
  const sha = resp.data.sha;

  const re = /https:\/\/github\.com\/([\w-.]+)\/([\w-.]+)/g;

  const matches = [...content.matchAll(re)];
  const set = new Set();
  set.add(id);
  const items: string[] = [];
  for (const match of matches) {
    if (match.length >= 3) {
      const key = `${match[1]}/${match[2]}`;
      set.add(key);
      items.push(key);
    }
  }

  return {
    readmeDigest: sha,
    content,
    items,
  };
}

export async function fetchRepoStarSummary(params: {
  owner: string;
  repo: string;
  total: number;
}) {
  const octokit = getOctokit();
  const PAGE_SIZE = 100;
  async function get(page: number): Promise<number[]> {
    const resp = await octokit.request({
      url: `https://api.github.com/repos/${params.owner}/${params.repo}/stargazers?per_page=${PAGE_SIZE}&page=${page}`,

      headers: { accept: "application/vnd.github.v3.star+json" },
    });
    return resp.data.map((x: any) => dayjs(x.starred_at).unix());
  }
  type BinarySearchState = [number, number, number] | number;

  // skip too famous or less famous star history
  if (params.total < 500 || params.total > 30 * 1000) {
    return { total: params.total };
  }

  const totalPages = Math.ceil(params.total / PAGE_SIZE);
  let i = 1;
  let states: BinarySearchState[] = [
    [1, totalPages, dayjs().subtract(1, "week").unix()],
    [1, totalPages, dayjs().subtract(1, "month").unix()],
    [1, totalPages, dayjs().subtract(1, "year").unix()],
  ];
  function updateState(
    i: number,
    j: number,
    result: number[],
  ): ["find" | "search", number] {
    const earlest = result[0];
    const latest = result.at(-1)!;
    const state = states[j];
    if (typeof state === "number") {
      return ["find", state];
    }
    if (
      (i == 1 || earlest <= state[2]) &&
      (state[2] <= latest || i == totalPages)
    ) {
      // find
      const count = PAGE_SIZE * (i - 1) + sortedIndex(result, state[2]);
      states[j] = params.total - count;
      return ["find", count];
    } else if (earlest > state[2] && i - 1 < state[2]) {
      state[1] = i - 1;
    } else if (latest < state[2] && i + 1 > state[0]) {
      state[0] = i + 1;
    }
    return ["search", Math.floor((state[1] + state[0]) / 2)];
  }
  const result = await get(i);
  for (let j = 0; j < states.length; j++) {
    updateState(i, j, result);
  }
  i = totalPages;

  while (true) {
    const result = await get(i);
    let nexti = i;
    for (let j = 0; j < states.length; j++) {
      const [action, k] = updateState(i, j, result);
      if (action === "find") {
        continue;
      } else {
        nexti = k;
      }
    }
    if (nexti === i) {
      break;
    } else {
      i = nexti;
    }
  }
  return {
    total: params.total,
    week: states[0] as number,
    month: states[1] as number,
    year: states[2] as number,
    updatedAt: dayjs().unix(),
  };
}
