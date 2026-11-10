"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/lib/site";
import { useWhatsApp } from "./BrandProvider";
import { Icon } from "./Icon";

/**
 * Bouton WhatsApp flottant et contextuel : le message prérempli reprend la page consultée.
 * Si NEXT_PUBLIC_WHATSAPP_NUMBER n'est pas configuré, il renvoie vers la page Contact.
 */
export default function WhatsAppButton({ locale, message }: { locale: Locale; message?: string }) {
  const t = getDictionary(locale);
  const pathname = usePathname();
  const whatsappLink = useWhatsApp();
  const text =
    message ??
    (locale === "ar"
      ? `مرحباً، أود الحصول على معلومات (${site.url}${pathname})`
      : locale === "en"
        ? `Hello, I'd like some information (${site.url}${pathname})`
        : `Bonjour, je souhaite des informations (${site.url}${pathname})`);
  const href = whatsappLink(text);
  const cls =
    "no-print fixed bottom-24 end-4 z-30 lg:bottom-5 lg:end-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105";
  if (!href)
    return (
      <Link href={`/${locale}/contact`} className={cls} aria-label={t.common.whatsapp} title={t.common.whatsapp}>
        <Icon name="whatsapp" className="h-7 w-7" />
      </Link>
    );
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={t.common.whatsapp} title={t.common.whatsapp}>
      <Icon name="whatsapp" className="h-7 w-7" />
    </a>
  );
}
