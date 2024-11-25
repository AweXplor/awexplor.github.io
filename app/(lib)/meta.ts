import { loadConfig } from "#awep/lib/config";

export async function fetchMeta(slug: string) {
  const config = await loadConfig();
  const currentRepo = config.repos.find((x) => x.name.toLowerCase() === slug);
  return currentRepo;
}
export function getPublicUrl(name: string) {
  return `${process.env.NEXT_PUBLIC_WEBSITE}/aggregated/${name.toLowerCase()}`;
}
export const generateMeta = (repo: Awaited<ReturnType<typeof fetchMeta>>) => {
  const title = `Awesome ${repo?.name} Explorer ${repo?.icon} Discover and Explore the Best GitHub Repositories`;
  const description = `Explore curated lists of the best GitHub repositories across ${repo?.name}. Discover new tools, libraries, and resources.`;
  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: getPublicUrl(repo?.name!),
    },
    twitter: {
      card: "summary_large_image",
      site: "@adevday",
      title,
      description,
    },
    keywords: [
      repo!.name,
      "GitHub",
      "awesome list",
      "repositories",
      "open source",
      "tools",
      "libraries",
      "resources",
      "contribute",
      "explore",
    ],
    authors: [{ name: "@adevday", url: "https://x.com/adevday" }],
    robots: {
      index: true,
      follow: true,
    },
  };
};
