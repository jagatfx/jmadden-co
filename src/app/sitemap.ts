import type { MetadataRoute } from "next";
import { areas } from "@/content/areas";
import { notes } from "@/content/notes";
import { projects } from "@/content/projects";
import { site } from "@/lib/format";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/areas",
    "/notebook",
    "/about",
    ...projects.map((p) => `/work/${p.slug}`),
    ...areas.map((a) => `/areas/${a.slug}`),
    ...notes.map((n) => `/notebook/${n.slug}`),
  ];
  return paths.map((path) => ({ url: `${site.url}${path}` }));
}
