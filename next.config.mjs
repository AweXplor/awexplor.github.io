/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  experimental: {
    optimizePackageImports: [
      "@mantine/core",
      "@mantine/hooks",
      "react-notion-x",
    ],
  },
  env: {
    NEXT_PUBLIC_WEBSITE: "https://awexplor.github.io",
  },
};

export default nextConfig;
