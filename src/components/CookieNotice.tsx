"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getSignature } from "@/i18n/signature";

const KEY = "cookie-notice-v1";

/**
 * Information cookies. Le site n'utilise que des traceurs strictement nécessaires (langue, session,
 * favoris locaux) : pas de consentement à recueillir, mais une information claire.
 * Si un outil de mesure ou publicitaire est ajouté un jour, il faudra le remplacer par un vrai
 * recueil du consentement (accepter / refuser) AVANT tout dépôt.
 *
 * Pastille compacte en bas à gauche (à droite en arabe), d'une seule ligne : sur mobile elle se place au-dessus
 * de la barre de navigation et laisse libre la colonne des boutons flottants ; elle ne masque jamais les CTA.
 */
export default function CookieNotice({ locale }: { locale: Locale }) {
  const c = getSignature(locale).cookie;
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage local après hydratation
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(false);
    }
  }, []);
  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  };
  return (
    <div
      role="region"
      aria-label="Cookies"
      className="no-print fixed start-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex max-w-[calc(100vw-6rem)] items-center gap-2 rounded-pill bg-white py-1.5 ps-3 pe-1.5 text-xs text-ink shadow-lift ring-1 ring-line lg:bottom-4 lg:max-w-md"
    >
      <p className="leading-tight text-muted">
        {c.text}{" "}
        <Link href={`/${locale}/legal/cookies`} className="font-semibold whitespace-nowrap text-gold-deep underline underline-offset-2">
          {c.more}
        </Link>
      </p>
      <button type="button" className="btn btn-dark !min-h-8 shrink-0 !px-3 !py-1 text-xs" onClick={close}>
        {c.ok}
      </button>
    </div>
  );
}
