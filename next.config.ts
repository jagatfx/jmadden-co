import type { NextConfig } from "next";
import { archivePosts } from "./src/content/archive-posts";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Keep links to the old Gatsby post URLs working.
  async redirects() {
    return archivePosts.map((p) => ({
      source: p.oldPath,
      destination: `/archive/${p.slug}`,
      permanent: true,
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
