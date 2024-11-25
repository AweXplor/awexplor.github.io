import { loadConfig } from "#awep/lib/config";
import type { MetadataRoute } from "next";
import { getPublicUrl } from "./(lib)/meta";
export const dynamic = "force-static";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await loadConfig();
  return config.repos.map(({ name }) => ({
    url: getPublicUrl(name),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  }));
}
