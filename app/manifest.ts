import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Awesome Explorer",
    short_name: "Awesome Explorer",
    description:
      "Explore awesome lists of the best GitHub repositories. Discover new tools, libraries, and resources.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
