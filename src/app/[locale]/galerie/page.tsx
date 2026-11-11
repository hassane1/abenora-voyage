import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getPublicMedia } from "@/lib/queries";
import { tr } from "@/lib/i18n-content";
import { getPhotos } from "@/lib/photos";
import { PageHero } from "@/components/Cards";
import BrandArt from "@/components/BrandArt";

export async function generateMetadata({ params }: PageProps<"/[locale]/galerie">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).gallery.title };
}

export default async function GalleryPage({ params }: PageProps<"/[locale]/galerie">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const media = await getPublicMedia();
  const heroPhoto = (await getPhotos(locale))("dunes");
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={t.nav.gallery} title={t.gallery.title} text={t.gallery.intro} variant="night" seed={61} />
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        {media.length > 0 ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {media.map((m) => (
              <figure key={m.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white ring-1 ring-night/5">
                {m.kind === "VIDEO" ? (
                  <video src={m.url} controls preload="metadata" className="w-full" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={tr(m.alt, locale)} loading="lazy" className="w-full" />
                )}
                <figcaption className="p-3 text-xs text-muted">
                  {tr(m.alt, locale)} {m.credit && <>· © {m.credit}</>} {m.license && <>· {m.license}</>}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-8 rounded-2xl bg-white p-5 text-sm text-muted ring-1 ring-night/5">{t.gallery.empty}</p>
            <div className="grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-4">
              {(["sunset", "night", "dawn", "dusk", "noon", "sunset", "night", "dawn"] as const).map((v, i) => (
                <div key={i} className={`overflow-hidden rounded-2xl ${i % 5 === 0 ? "col-span-2 row-span-2" : ""}`}>
                  <BrandArt variant={v} seed={i * 23 + 7} caravan={i % 3 === 0} className="h-full w-full" />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
