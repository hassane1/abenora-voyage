import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";
import { getPage, LEGAL_SLUGS } from "@/lib/content";
import { getBrand, type Brand } from "@/lib/brand";
import { isFallback, tr } from "@/lib/i18n-content";
import { formatDate } from "@/lib/format";
import Markdown from "@/components/Markdown";

function fill(text: string, b: Brand) {
  const map: Record<string, string> = {
    nom: b.name,
    raison_sociale: b.legal.companyName || "[raison sociale à compléter]",
    forme: b.legal.legalForm || "[forme juridique à compléter]",
    capital: b.legal.capital || "[capital à compléter]",
    adresse: [b.address, b.city].filter(Boolean).join(", ") || "[adresse à compléter]",
    email: b.email || "[e-mail à compléter]",
    telephone: b.phone || "[téléphone à compléter]",
    rc: b.legal.rc || "[RC à compléter]",
    ice: b.legal.ice || "[ICE à compléter]",
    if: b.legal.ifNumber || "[IF à compléter]",
    licence: b.legal.license || "[n° de licence à compléter]",
  };
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => map[k] ?? m);
}

export async function generateMetadata({ params }: PageProps<"/[locale]/legal/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getV2(locale).legalPages[slug] ?? slug };
}

export default async function LegalPage({ params }: PageProps<"/[locale]/legal/[slug]">) {
  const { locale: l, slug } = await params;
  if (!hasLocale(l) || !(LEGAL_SLUGS as readonly string[]).includes(slug)) notFound();
  const locale = l as Locale;
  const v = getV2(locale);
  const [page, brand] = await Promise.all([getPage(slug), getBrand()]);
  const title = (page && tr<string>(page.title, locale, "")) || v.legalPages[slug];
  const body = page ? tr<string>(page.body, locale, "") : "";
  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-24">
      <p className="eyebrow">{brand.name}</p>
      <h1 className="font-display mt-2 text-4xl font-semibold text-night md:text-5xl">{title}</h1>
      {page && <p className="mt-2 text-xs text-muted">{formatDate(page.updatedAt, locale)}</p>}
      {(!page || !page.validated) && (
        <p role="note" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {v.legalDraft}
        </p>
      )}
      {page && isFallback(page.body, locale) && locale !== "fr" && <p className="mt-3 text-xs text-muted">Version française affichée.</p>}
      <div className="mt-8">{body ? <Markdown text={fill(body, brand)} /> : <p className="text-muted">—</p>}</div>
    </div>
  );
}
