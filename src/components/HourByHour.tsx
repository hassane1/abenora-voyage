"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { getExtra } from "@/i18n/extra";
import DuneArt from "./DuneArt";
import { Icon } from "./Icon";

/**
 * Signature du site : « Le Sahara, heure par heure ».
 * Un curseur fait défiler une journée à Merzouga ; le ciel de l'illustration change avec l'heure
 * et chaque moment renvoie vers l'expérience correspondante.
 */
export default function HourByHour({ locale }: { locale: Locale }) {
  const x = getExtra(locale);
  const [i, setI] = useState(2);
  const m = x.hours[i];
  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] text-white">
      {x.hours.map((h, k) => (
        <div key={h.h} className={`absolute inset-0 -z-10 transition-opacity duration-1000 ${k === i ? "opacity-100" : "opacity-0"}`} aria-hidden={k !== i}>
          <DuneArt variant={h.variant} seed={11} caravan={h.variant === "sunset"} className="h-full w-full" />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/80 via-night/10 to-transparent" />
      <div className="flex min-h-[460px] flex-col justify-end p-6 sm:p-10 md:min-h-[520px]">
        <p className="font-display text-7xl font-semibold text-sand drop-shadow md:text-8xl" aria-live="polite">
          {m.h}
        </p>
        <h3 className="font-display mt-2 text-3xl font-semibold md:text-4xl">{m.title}</h3>
        <p className="mt-2 max-w-xl text-white/85">{m.text}</p>
        <Link href={`/${locale}/activites/${m.activity}`} className="mt-4 inline-flex w-fit items-center gap-2 font-semibold text-sand hover:underline">
          {locale === "en" ? "Discover" : locale === "ar" ? "اكتشف" : "Découvrir"} <Icon name="arrow" className="h-4 w-4 rtl:rotate-180" />
        </Link>
        <div className="mt-8">
          <input
            type="range"
            min={0}
            max={x.hours.length - 1}
            step={1}
            value={i}
            onChange={(e) => setI(Number(e.target.value))}
            aria-label={x.hourTitle}
            aria-valuetext={`${m.h} — ${m.title}`}
            className="w-full accent-sand"
          />
          <div className="mt-2 flex justify-between text-xs font-semibold text-white/70">
            {x.hours.map((h, k) => (
              <button key={h.h} type="button" onClick={() => setI(k)} className={k === i ? "text-sand" : "hover:text-white"}>
                {h.h}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
