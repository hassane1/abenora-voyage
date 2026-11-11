"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";

const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });

/** L'assistant n'est chargé qu'une fois la page affichée et le navigateur au repos (allège le premier affichage) */
export default function LazyChat({ locale }: { locale: Locale }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const start = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(start, 2500);
    return () => clearTimeout(t);
  }, []);
  return ready ? <ChatWidget locale={locale} /> : null;
}
