import { Config, loadConfig } from "@/lib/config";
import { db } from "@/lib/db/index";
import { githubRepoTable } from "@/lib/db/schema";
import {
  getAwesomeSourceIdsFromConfig,
  getConfigRepoItems,
} from "@/lib/db/utils";
import { AppShellMain, AppShellNavbar } from "@mantine/core";
import * as D from "drizzle-orm";
import fs from "fs/promises";
import { notFound } from "next/navigation";
import path from "path";
import {
  ContentDynamic,
  Explorer,
  SidebarDynamic,
} from "../(components)/explorer";
import { Metadata, ResolvingMetadata } from "next";
import { fetchMeta, generateMeta } from "#awep/app/(lib)/meta";
export async function generateStaticParams() {
  const config = await loadConfig();
  return config.repos.map(({ name }) => ({ slug: name.toLowerCase() }));
}
export type MoreItem = Pick<Config["repos"][0], "name" | "icon">;
// create

async function renderToPublic(slug: string) {
  const config = await loadConfig();
  const sourceIds = getAwesomeSourceIdsFromConfig(config, slug);
  if (!sourceIds) {
    return undefined;
  }
  const currentRepo = config.repos.find((x) => x.name.toLowerCase() === slug);
  const firends = currentRepo?.firends || [];
  let more: MoreItem[] = [];
  const randomRepos = config.repos.toSorted(() => Math.random() - 0.5);
  for (const repo of randomRepos) {
    const item = { name: repo.name, icon: repo.icon };

    if (firends.includes(repo.name)) {
      more = [item, ...more];
    } else {
      more.push(item);
    }
  }
  const itemIds = (await getConfigRepoItems(config, slug))!;
  const sources = await db
    .select({ name: githubRepoTable.id, license: githubRepoTable.license })
    .from(githubRepoTable)
    .where(D.inArray(githubRepoTable.id, sourceIds));
  console.log(sourceIds, sources);
  const repos = await db
    .select()
    .from(githubRepoTable)
    .where(D.inArray(githubRepoTable.id, itemIds))
    .orderBy(D.desc(D.sql`${githubRepoTable.starsDetail}->'month'`));
  const trending = await db
    .select()
    .from(githubRepoTable)
    .limit(5)
    .where(
      D.and(
        D.inArray(githubRepoTable.id, itemIds),
        D.isNotNull(githubRepoTable.starsDetail),
      ),
    )
    .orderBy(D.desc(D.sql`${githubRepoTable.starsDetail}->'month'`));
  const jsonContent = JSON.stringify(repos, null, 2);
  const filePath = path.join("public", "aggregated", `${slug}.json`);

  try {
    await fs.writeFile(filePath, jsonContent, "utf-8");
  } catch (error) {
    console.error(`Failed to save ${slug}.json:`, error);
  }
  return {
    url: `/aggregated/${slug}.json`,
    sources,
    more,
    icon: currentRepo!.icon,
    name: currentRepo!.name,
    trending,
  };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const repo = await fetchMeta((await params).slug)!;
  return generateMeta(repo);
}

export default async function AggregatedHome(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const data = await renderToPublic(params.slug);
  if (!data) {
    return notFound();
  }
  const { url, sources, more, name, icon, trending } = data;

  return (
    <>
      <Explorer
        slug={params.slug}
        url={url}
        more={more}
        name={name}
        icon={icon}
      >
        <AppShellNavbar>
          <SidebarDynamic sources={sources} more={more} />
        </AppShellNavbar>
        <AppShellMain>
          <ContentDynamic url={url} trending={trending} />
        </AppShellMain>
      </Explorer>
    </>
  );
}
