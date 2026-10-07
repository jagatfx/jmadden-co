import type { MetadataRoute } from "next";
import { archivePosts } from "@/content/archive-posts";
import { notes } from "@/content/notes";
import { projects } from "@/content/projects";
import { site } from "@/lib/format";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/notebook",
    "/about",
    ...projects.map((p) => `/work/${p.slug}`),
    ...notes.map((n) => `/notebook/${n.slug}`),
    ...archivePosts.map((p) => `/archive/${p.slug}`),
  ];
  return paths.map((path) => ({ url: `${site.url}${path}` }));
}
