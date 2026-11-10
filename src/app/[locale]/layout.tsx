import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Manrope, Tajawal } from "next/font/google";
import { hasLocale, localeMeta, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import BottomNav from "@/components/BottomNav";
import ChatWidget from "@/components/ChatWidget";
import CookieNotice from "@/components/CookieNotice";
import { BrandProvider } from "@/components/BrandProvider";
import { getBrand, publicBrand } from "@/lib/brand";
import { getActiveBanner } from "@/lib/content";
import { site } from "@/lib/site";
import "../globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cormorant" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-tajawal" });

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const t = getDictionary(locale);
  const brand = await getBrand();
  const tagline = brand.tagline[locale] || t.brandTagline;
  return {
    metadataBase: new URL(site.url),
    title: { default: `${brand.name} — ${tagline}`, template: `%s | ${brand.name}` },
    description: t.home.heroSubtitle,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])) },
    openGraph: { siteName: brand.name, locale: localeMeta[locale].intl.replace("-", "_"), type: "website" },
    icons: brand.logoUrl ? { icon: brand.logoUrl } : undefined,
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const l = locale as Locale;
  const [brand, banner] = await Promise.all([getBrand(), getActiveBanner(l)]);

  return (
    <html lang={l} dir={localeMeta[l].dir} className={`${cormorant.variable} ${manrope.variable} ${tajawal.variable}`}>
      <body className="flex min-h-screen flex-col pb-16 lg:pb-0">
        <BrandProvider brand={publicBrand(brand, l)}>
          <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
            {l === "ar" ? "انتقل إلى المحتوى" : l === "en" ? "Skip to content" : "Aller au contenu"}
          </a>
          <Header locale={l} banner={banner} />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <Footer locale={l} />
          <WhatsAppButton locale={l} />
          <BottomNav locale={l} />
          <ChatWidget locale={l} />
          <CookieNotice locale={l} />
        </BrandProvider>
      </body>
    </html>
  );
}
