import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPost } from "@/lib/queries";
import { isFallback, tr } from "@/lib/i18n-content";
import { formatDate } from "@/lib/format";
import { getBrand } from "@/lib/brand";
import { PageHero, hashSeed } from "@/components/Cards";
import Markdown from "@/components/Markdown";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const p = await getPost(slug);
  if (!p) return {};
  return { title: tr(p.title, locale), description: tr(p.excerpt, locale), openGraph: { type: "article" } };
}

export default async function PostPage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = await getPost(slug);
  if (!p) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: tr(p.title, locale),
    datePublished: p.publishedAt.toISOString(),
    dateModified: p.updatedAt.toISOString(),
    publisher: { "@type": "Organization", name: (await getBrand()).name },
    inLanguage: locale,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero eyebrow={formatDate(p.publishedAt, locale)} title={tr(p.title, locale)} text={tr(p.excerpt, locale)} variant={(["dawn", "dusk", "night", "noon"] as const)[hashSeed(p.slug) % 4]} seed={hashSeed(p.slug)} />
      <article className="mx-auto max-w-3xl px-4 py-16">
        {isFallback(p.body, locale) && <p className="mb-6 text-xs text-muted">{t.common.translationPending}</p>}
        <Markdown text={tr(p.body, locale)} />
        <Link href={`/${locale}/blog`} className="mt-10 inline-block font-semibold text-terracotta hover:underline">
          ← {t.blog.title}
        </Link>
      </article>
    </>
  );
}
