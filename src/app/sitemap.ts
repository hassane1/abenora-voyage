import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { locales } from "@/i18n/config";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [destinations, circuits, activities, posts] = await Promise.all([
    db.destination.findMany({ where: { published: true } }),
    db.circuit.findMany({ where: { published: true, destination: { published: true } } }),
    db.activity.findMany({ where: { published: true, destination: { published: true } } }),
    db.post.findMany({ where: { published: true } }),
  ]);
  const paths = [
    "",
    "/destinations",
    "/circuits",
    "/activites",
    "/sur-mesure",
    "/galerie",
    "/a-propos",
    "/avis",
    "/blog",
    "/contact",
    "/comparer",
    ...destinations.map((d) => `/destinations/${d.slug}`),
    ...circuits.map((c) => `/circuits/${c.slug}`),
    ...activities.map((a) => `/activites/${a.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
  ];
  return paths.map((p) => ({
    url: `${site.url}/fr${p}`,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${p}`])) },
    changeFrequency: "weekly",
  }));
}
