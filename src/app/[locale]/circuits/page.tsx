import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCircuits, getNextDepartures } from "@/lib/queries";
import { db } from "@/lib/db";
import { getPhotos } from "@/lib/photos";
import { CircuitCard, PageHero } from "@/components/Cards";
import { formatDate, formatMad } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[locale]/circuits">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).nav.circuits };
}

export default async function CircuitsPage({ params, searchParams }: PageProps<"/[locale]/circuits">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const destination = one(sp.destination);
  const budget = Number(one(sp.budget)) || undefined;
  const travelers = Math.max(1, Number(one(sp.travelers)) || 1);
  const date = one(sp.date);

  const dm = /^(\d{1,2})-(\d{1,2})$/.exec(one(sp.duration) ?? "");
  let circuits = await getCircuits({ destination, maxPrice: budget, ...(dm ? { minDays: Number(dm[1]), maxDays: Number(dm[2]) } : {}) });
  const [photo, nextDeps] = await Promise.all([getPhotos(locale), getNextDepartures()]);
  const heroPhoto = photo("heroAlt");

  // Filtre « date » : circuits ayant un départ ouvert ce jour-là avec assez de places
  let dateNote: string | null = null;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const day = new Date(`${date}T00:00:00.000Z`);
    const deps = await db.departure.findMany({ where: { date: day, status: "OPEN", circuitId: { in: circuits.map((c) => c.id) } } });
    const ok = new Set(deps.filter((d) => d.capacity - d.seatsHeld >= travelers).map((d) => d.circuitId));
    circuits = circuits.filter((c) => ok.has(c.id));
    dateNote = formatDate(day, locale);
  }

  const filters = [destination, budget && `≤ ${formatMad(budget, locale)}`, `${travelers} ${t.home.searchTravelers.toLowerCase()}`, dateNote].filter(Boolean);

  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={t.brandTagline} title={t.nav.circuits} text={t.circuit.exampleProgram} variant="dusk" seed={14} />
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        {Object.keys(sp).length > 0 && (
          <div className="mb-10 flex flex-wrap items-center gap-2 text-sm">
            {filters.map((f) => (
              <span key={String(f)} className="rounded-full bg-white px-3 py-1 ring-1 ring-night/10">
                {f}
              </span>
            ))}
            <Link href={`/${locale}/circuits`} className="ms-2 font-semibold text-terracotta hover:underline">
              ✕
            </Link>
          </div>
        )}
        {circuits.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-night/20 p-12 text-center text-muted">
            <p>{locale === "en" ? "No tour matches these criteria." : locale === "ar" ? "لا توجد جولة مطابقة لهذه المعايير." : "Aucun circuit ne correspond à ces critères."}</p>
            <Link href={`/${locale}/sur-mesure`} className="btn btn-primary mt-6">
              {t.nav.tailorMade}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {circuits.map((c) => (
              <CircuitCard key={c.id} c={c} locale={locale} photo={photo(`circuit:${c.slug}`, `destination:${c.destination.slug}`)} next={nextDeps.get(c.id)} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
