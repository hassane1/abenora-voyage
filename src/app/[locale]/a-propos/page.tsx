import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getBrand } from "@/lib/brand";
import { getPhotos } from "@/lib/photos";
import { PageHero } from "@/components/Cards";
import { Icon } from "@/components/Icon";

const content = {
  fr: {
    intro: (name: string) => `${name} est une agence de voyage marocaine et familiale. Nous organisons vos voyages au Maroc et vos séjours à l'étranger, l'Omra et le Hajj, les voyages sur mesure, ainsi que vos visas, billets d'avion et réservations d'hôtels. Une équipe joignable par téléphone ou WhatsApp vous conseille et vous accompagne, du premier appel jusqu'au retour.`,
    blocks: [
      ["shield", "Des engagements vérifiables", "Les programmes sont présentés comme des exemples ajustables, les temps de route sont calculés et les tarifs sont clairement identifiés. Aucune réservation n'est annoncée comme confirmée avant validation par notre équipe."],
      ["palm", "Un tourisme respectueux", "Nous privilégions les guides et prestataires de la région, limitons l'impact sur les dunes et refusons toute mise en scène des communautés locales."],
      ["globe", "Au Maroc et à l'international", "Voyages organisés nationaux et internationaux, Omra, séjours sur mesure, hôtels, transport et billetterie. Les offres sont publiées en ligne au fur et à mesure qu'elles sont validées."],
    ],
    note: "Présentation de l'équipe, coordonnées légales et licences de l'agence : section à compléter par l'administrateur.",
  },
  en: {
    intro: (name: string) => `${name} is a Moroccan, family-run travel agency. We organise trips across Morocco and stays abroad, Umrah and Hajj, tailor-made journeys, as well as visas, flights and hotel bookings. A team you can reach by phone or WhatsApp advises and supports you, from the first call until you are back home.`,
    blocks: [
      ["shield", "Verifiable commitments", "Programmes are presented as adjustable examples, driving times are computed and prices are clearly labelled. No booking is announced as confirmed before our team validates it."],
      ["palm", "Respectful tourism", "We favour local guides and providers, limit our impact on the dunes and refuse any staging of local communities."],
      ["globe", "In Morocco and abroad", "Organised domestic and international trips, Umrah, tailor-made stays, hotels, transport and ticketing. Offers are published online as they are validated."],
    ],
    note: "Team presentation, legal details and agency licences: section to be completed by the administrator.",
  },
  ar: {
    intro: (name: string) => `«${name}» وكالة أسفار مغربية عائلية. ننظم رحلاتكم داخل المغرب وإقاماتكم في الخارج، والعمرة والحج، والرحلات حسب الطلب، إلى جانب التأشيرات وتذاكر الطيران وحجوزات الفنادق. فريق متاح عبر الهاتف وواتساب ينصحكم ويرافقكم من أول اتصال حتى العودة.`,
    blocks: [
      ["shield", "التزامات قابلة للتحقق", "البرامج أمثلة قابلة للتعديل، وأوقات الطريق محسوبة، والأسعار واضحة. لا يُعلن عن تأكيد أي حجز قبل مصادقة فريقنا."],
      ["palm", "سياحة محترمة", "نفضل المرشدين ومقدمي الخدمات المحليين ونحد من التأثير على الكثبان."],
      ["globe", "في المغرب وخارجه", "رحلات منظمة وطنية ودولية، العمرة، إقامات حسب الطلب، فنادق، نقل وتذاكر. تُنشر العروض تباعاً بعد المصادقة عليها."],
    ],
    note: "تقديم الفريق والمعلومات القانونية: قسم يكمله المسؤول.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[locale]/a-propos">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).about.title };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/a-propos">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale);
  const c = content[locale];
  // bannière : emplacement « about » dans Médias (illustration de l'agence), à défaut l'ancienne photo « aitGuide »
  const heroPhoto = (await getPhotos(locale))("about", "aitGuide");
  const brand = await getBrand();
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={brand.name} title={t.about.title} text={c.intro(brand.name)} variant="dawn" seed={71} />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-3">
        {c.blocks.map(([icon, title, text]) => (
          <div key={title} className="rounded-3xl bg-white p-8 ring-1 ring-night/5">
            <Icon name={icon} className="h-8 w-8 text-terracotta" />
            <h2 className="font-display mt-4 text-2xl font-semibold text-night">{title}</h2>
            <p className="mt-3 leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <p className="rounded-2xl border border-dashed border-night/20 p-5 text-sm text-muted">{c.note}</p>
        <Link href={`/${locale}/contact`} className="btn btn-primary mt-8">
          {t.nav.contact}
        </Link>
      </section>
    </>
  );
}
