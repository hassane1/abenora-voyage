"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getV2 } from "@/i18n/v2";

const KEY = "cookie-notice-v1";

/**
 * Information cookies. Le site n'utilise que des traceurs strictement nécessaires (langue, session,
 * favoris locaux) : pas de consentement à recueillir, mais une information claire.
 * Si un outil de mesure ou publicitaire est ajouté un jour, il faudra le remplacer par un vrai
 * recueil du consentement (accepter / refuser) AVANT tout dépôt.
 */
export default function CookieNotice({ locale }: { locale: Locale }) {
  const v = getV2(locale);
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
  return (
    <div role="region" aria-label="Cookies" className="no-print fixed inset-x-3 bottom-20 z-40 mx-auto max-w-2xl rounded-2xl bg-night p-4 text-sm text-white shadow-2xl lg:bottom-5">
      <p className="text-white/85">{v.cookie.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          className="btn btn-sand !py-1.5 text-sm"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {}
            setShow(false);
          }}
        >
          {v.cookie.ok}
        </button>
        <Link href={`/${locale}/legal/cookies`} className="text-sand underline-offset-2 hover:underline">
          {v.cookie.more}
        </Link>
      </div>
    </div>
  );
}
