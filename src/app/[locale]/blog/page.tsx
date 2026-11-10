import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPosts } from "@/lib/queries";
import { tr } from "@/lib/i18n-content";
import { formatDate } from "@/lib/format";
import { getPhotos } from "@/lib/photos";
import { PageHero, hashSeed } from "@/components/Cards";
import Visual from "@/components/Visual";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).blog.title };
}

export default async function BlogPage({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const posts = await getPosts();
  const pick = await getPhotos(locale);
  const heroPhoto = pick("palm");
  const blogPhotos = [pick("tea"), pick("dunes"), pick("camp")];
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={t.nav.blog} title={t.blog.title} variant="noon" seed={33} />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {posts.map((p) => (
          <Link key={p.id} href={`/${locale}/blog/${p.slug}`} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-night/5 transition hover:-translate-y-1 hover:shadow-xl">
            <Visual photo={blogPhotos[hashSeed(p.slug) % blogPhotos.length]} variant={(["dawn", "dusk", "night", "noon"] as const)[hashSeed(p.slug) % 4]} seed={hashSeed(p.slug)} className="h-48 w-full" />
            <div className="p-6">
              <p className="eyebrow">{formatDate(p.publishedAt, locale)}</p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-night group-hover:text-terracotta">{tr(p.title, locale)}</h2>
              <p className="mt-2 text-sm text-muted">{tr(p.excerpt, locale)}</p>
              <p className="mt-4 text-sm font-semibold text-terracotta">{t.blog.readMore} →</p>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
