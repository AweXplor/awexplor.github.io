import { Config, GITHUB_PREFIX } from "@/lib/config";
import { db } from "@/lib/db/index";
import { awesomeRepoTable, githubRepoTable } from "@/lib/db/schema";
import * as D from "drizzle-orm";

export const getAwesomeSourceIdsFromConfig = (config: Config, slug: string) => {
  const url = config.repos.find(
    (x) => x.name.toLowerCase() === slug.toLowerCase(),
  )!.url;
  if (!url) return undefined;
  const awesomeIds = (Array.isArray(url) ? url : [url]).map((url) => {
    if (!url.startsWith(GITHUB_PREFIX)) throw new Error(`unkown repo ${url}`);
    return url.slice(GITHUB_PREFIX.length);
  });
  return awesomeIds;
};

export async function getConfigRepoItems(config: Config, slug: string) {
  const awesomeIds = getAwesomeSourceIdsFromConfig(config, slug);
  if (!awesomeIds) return undefined;
  const awesomes = await db
    .select({ items: awesomeRepoTable.items })
    .from(awesomeRepoTable)
    .where(D.inArray(awesomeRepoTable.id, awesomeIds));

  const awesomeItemIds = Array.from(new Set(awesomes.flatMap((x) => x.items)));
  const repos = await db
    .selectDistinct({ id: githubRepoTable.name })
    .from(githubRepoTable)
    .where(
      D.and(
        D.inArray(githubRepoTable.id, awesomeItemIds),
        D.notExists(
          db
            .select()
            .from(awesomeRepoTable)
            .where(D.eq(awesomeRepoTable.id, githubRepoTable.name)),
        ),
      ),
    );

  return repos.map(({ id }) => id);
}
