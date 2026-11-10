"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatMad } from "@/lib/format";

export type CompareRow = {
  slug: string;
  title: string;
  days: number;
  nights: number;
  price: number | null;
  priceStatus: string;
  start: string;
  accommodation: string;
  transport: string;
  meals: string;
  included: string[];
  optional: string[];
};

export default function Comparator({ locale, circuits, initial }: { locale: Locale; circuits: CompareRow[]; initial: string[] }) {
  const t = getDictionary(locale);
  const [sel, setSel] = useState<string[]>(initial.length ? initial : circuits.map((c) => c.slug));
  const rows = circuits.filter((c) => sel.includes(c.slug));
  const line = (label: string, render: (c: CompareRow) => React.ReactNode) => (
    <tr className="border-b border-night/5 align-top">
      <th scope="row" className="sticky start-0 bg-ivory py-4 pe-4 text-start text-sm font-semibold text-night">
        {label}
      </th>
      {rows.map((c) => (
        <td key={c.slug} className="min-w-56 px-4 py-4 text-sm text-ink/80">
          {render(c)}
        </td>
      ))}
    </tr>
  );
  return (
    <div>
      <fieldset>
        <legend className="label">{t.compare.pick}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {circuits.map((c) => {
            const on = sel.includes(c.slug);
            return (
              <label key={c.slug} className={`cursor-pointer rounded-full px-4 py-2 text-sm ring-1 ${on ? "bg-night text-white ring-night" : "ring-night/15"}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => setSel(on ? sel.filter((s) => s !== c.slug) : [...sel, c.slug])} />
                {c.title}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-8 overflow-x-auto rounded-3xl bg-white p-4 ring-1 ring-night/5">
        <table className="w-full">
          <thead>
            <tr>
              <th className="sticky start-0 bg-ivory" />
              {rows.map((c) => (
                <th key={c.slug} className="px-4 py-3 text-start">
                  <Link href={`/${locale}/circuits/${c.slug}`} className="font-display text-2xl font-semibold text-night hover:text-terracotta">
                    {c.title}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {line(t.activity.duration, (c) => t.common.daysNights(c.days, c.nights))}
            {line(t.activity.price, (c) => (
              <>
                {c.price ? `${t.common.from} ${formatMad(c.price, locale)} ${t.common.perPerson}` : t.common.onRequest}
                {c.priceStatus !== "VALIDATED" && <span className="block text-xs text-terracotta">● {t.common.demoPrice}</span>}
              </>
            ))}
            {line(t.circuit.start, (c) => c.start)}
            {line(t.circuit.accommodation, (c) => c.accommodation)}
            {line(t.circuit.transport, (c) => c.transport)}
            {line(t.circuit.meals, (c) => c.meals)}
            {line(t.circuit.included, (c) => (
              <ul className="space-y-1">
                {c.included.map((i) => (
                  <li key={i}>✓ {i}</li>
                ))}
              </ul>
            ))}
            {line(t.circuit.optional, (c) => c.optional.join(", "))}
            {line("", (c) => (
              <Link href={`/${locale}/reservation?circuit=${c.slug}`} className="btn btn-primary !py-2 text-sm">
                {t.common.bookNow}
              </Link>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
