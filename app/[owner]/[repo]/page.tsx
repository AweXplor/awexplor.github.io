import { generateMeta } from "#awep/app/(lib)/meta";
import { loadConfig } from "@/lib/config";
import { db } from "@/lib/db/index";
import { awesomeRepoTable } from "@/lib/db/schema";
import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
export async function generateStaticParams() {
  const ids = await db
    .select({ id: awesomeRepoTable.id })
    .from(awesomeRepoTable);
  return ids.map(({ id }) => {
    const [owner, repo] = id.split("/");
    return { owner, repo };
  });
}

export async function generateMetadata(
  { params }: { params: Promise<{ owner: string; repo: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { owner, repo } = await params;
  const path = `${owner}/${repo}`;
  const config = await loadConfig();
  for (const repo of config.repos) {
    if (repo.url.includes(path)) {
      return generateMeta(repo);
    }
  }
  return {};
}

export default async function RedirectToAggregated(props: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const params = await props.params;
  const path = `${params.owner}/${params.repo}`;
  const config = await loadConfig();
  for (const repo of config.repos) {
    if (repo.url.includes(path)) {
      return redirect(`/aggregated/${repo.name.toLowerCase()}`);
    }
  }
  return notFound();
}
