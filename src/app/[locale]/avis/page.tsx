import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPublishedReviews } from "@/lib/queries";
import { tr } from "@/lib/i18n-content";
import { formatDate } from "@/lib/format";
import { getPhotos } from "@/lib/photos";
import { PageHero } from "@/components/Cards";
import { Icon } from "@/components/Icon";

export async function generateMetadata({ params }: PageProps<"/[locale]/avis">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).nav.reviews };
}

export default async function ReviewsPage({ params }: PageProps<"/[locale]/avis">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const reviews = await getPublishedReviews();
  const heroPhoto = (await getPhotos(locale))("aitPalm");
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={t.reviews.verified} title={t.nav.reviews} variant="dusk" seed={52} />
      <section className="mx-auto max-w-5xl px-4 py-16">
        {reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-night/20 bg-white p-12 text-center">
            <Icon name="star" className="mx-auto h-10 w-10 text-sand" />
            <p className="mx-auto mt-4 max-w-xl text-muted">{t.reviews.none}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-3xl bg-white p-6 ring-1 ring-night/5">
                <div className="flex gap-0.5 text-sand">{Array.from({ length: r.rating }, (_, i) => <Icon key={i} name="star" filled className="h-4 w-4" />)}</div>
                <p className="font-display mt-3 text-2xl text-night">{r.title}</p>
                <blockquote className="mt-2 leading-relaxed text-muted">{r.comment}</blockquote>
                <figcaption className="mt-4 text-sm text-night/70">
                  {r.authorName} · {tr(r.booking.circuit.title, locale)} · {formatDate(r.booking.startDate, locale, { month: "long", year: "numeric" })} ·{" "}
                  <span className="text-terracotta">✓ {t.reviews.verified}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <div className="mt-12 rounded-3xl bg-night p-8 text-white">
          <p className="font-display text-2xl text-sand">{t.reviews.leave}</p>
          <p className="mt-2 text-white/75">{t.reviews.leaveText}</p>
          <Link href={`/${locale}/espace-client`} className="btn btn-sand mt-6">
            {t.nav.account}
          </Link>
        </div>
      </section>
    </>
  );
}
