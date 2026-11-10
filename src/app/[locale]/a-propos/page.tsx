import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/lib/site";
import { getPhotos } from "@/lib/photos";
import { PageHero } from "@/components/Cards";
import { Icon } from "@/components/Icon";

const content = {
  fr: {
    intro: `${site.name} signifie « sables » en arabe. Notre ambition : faire découvrir le Maroc avec l'exigence des grandes agences internationales et la sincérité d'un accueil local.`,
    blocks: [
      ["shield", "Des engagements vérifiables", "Les programmes sont présentés comme des exemples ajustables, les temps de route sont calculés et les tarifs sont clairement identifiés. Aucune réservation n'est annoncée comme confirmée avant validation par notre équipe."],
      ["palm", "Un tourisme respectueux", "Nous privilégions les guides et prestataires de la région, limitons l'impact sur les dunes et refusons toute mise en scène des communautés locales."],
      ["sparkle", "Le Maroc, destination par destination", "Nous commençons par Merzouga et le Sahara. Chaque nouvelle destination sera ouverte uniquement lorsque ses offres auront été construites et validées."],
    ],
    note: "Présentation de l'équipe, coordonnées légales et licences de l'agence : section à compléter par l'administrateur.",
  },
  en: {
    intro: `${site.name} means "sands" in Arabic. Our ambition: to reveal Morocco with the standards of leading international agencies and the sincerity of local hospitality.`,
    blocks: [
      ["shield", "Verifiable commitments", "Programmes are presented as adjustable examples, driving times are computed and prices are clearly labelled. No booking is announced as confirmed before our team validates it."],
      ["palm", "Respectful tourism", "We favour local guides and providers, limit our impact on the dunes and refuse any staging of local communities."],
      ["sparkle", "Morocco, one destination at a time", "We begin with Merzouga and the Sahara. Each new destination will open only once its offers have been built and validated."],
    ],
    note: "Team presentation, legal details and agency licences: section to be completed by the administrator.",
  },
  ar: {
    intro: `«${site.name}» تعني الرمال بالعربية. طموحنا: تقديم المغرب بمعايير كبريات الوكالات الدولية وبصدق الضيافة المحلية.`,
    blocks: [
      ["shield", "التزامات قابلة للتحقق", "البرامج أمثلة قابلة للتعديل، وأوقات الطريق محسوبة، والأسعار واضحة. لا يُعلن عن تأكيد أي حجز قبل مصادقة فريقنا."],
      ["palm", "سياحة محترمة", "نفضل المرشدين ومقدمي الخدمات المحليين ونحد من التأثير على الكثبان."],
      ["sparkle", "المغرب وجهة بعد وجهة", "نبدأ بمرزوكة والصحراء، ولن تُفتح أي وجهة جديدة إلا بعد المصادقة على عروضها."],
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
  const heroPhoto = (await getPhotos(locale))("aitGuide");
  return (
    <>
      <PageHero photo={heroPhoto} eyebrow={site.name} title={t.about.title} text={c.intro} variant="dawn" seed={71} />
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
