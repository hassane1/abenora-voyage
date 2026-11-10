import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { PageTitle } from "../ui";

/** Calendrier mensuel des départs : places occupées / capacité, voyageurs confirmés et en attente */
export default async function CalendarPage({ searchParams }: PageProps<"/admin/calendrier">) {
  await requireAdmin("bookings.read");
  const sp = await searchParams;
  const now = new Date();
  const m = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : now.toISOString().slice(0, 7);
  const [y, mo] = m.split("-").map(Number);
  const first = new Date(Date.UTC(y, mo - 1, 1));
  const last = new Date(Date.UTC(y, mo, 0));
  const deps = await db.departure.findMany({
    where: { date: { gte: first, lte: last } },
    include: { circuit: true, bookings: { where: { status: { in: ["PENDING", "CONFIRMED"] } }, select: { status: true, adults: true, children: true } } },
    orderBy: { date: "asc" },
  });
  const byDay = new Map<number, typeof deps>();
  for (const d of deps) byDay.set(d.date.getUTCDate(), [...(byDay.get(d.date.getUTCDate()) ?? []), d]);
  const lead = (first.getUTCDay() + 6) % 7; // lundi en premier
  const cells = [...Array(lead).fill(null), ...Array.from({ length: last.getUTCDate() }, (_, i) => i + 1)];
  const shift = (n: number) => new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
  const todayKey = now.toISOString().slice(0, 10);
  return (
    <div>
      <PageTitle title="Calendrier des départs">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/admin/calendrier?m=${shift(-1)}`} className="btn !py-1.5 ring-1 ring-night/15">
            ←
          </Link>
          <span className="w-40 text-center font-semibold capitalize">{first.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })}</span>
          <Link href={`/admin/calendrier?m=${shift(1)}`} className="btn !py-1.5 ring-1 ring-night/15">
            →
          </Link>
        </div>
      </PageTitle>
      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-2xl bg-night/10 ring-1 ring-night/10">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="bg-ivory px-2 py-2 text-center text-xs font-bold uppercase text-muted">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            const key = day ? `${m}-${String(day).padStart(2, "0")}` : "";
            return (
              <div key={i} className={`min-h-28 bg-white p-1.5 ${key === todayKey ? "ring-2 ring-inset ring-sand" : ""}`}>
                {day && <p className="px-1 text-xs font-semibold text-muted">{day}</p>}
                <ul className="mt-1 space-y-1">
                  {(day ? byDay.get(day) ?? [] : []).map((d) => {
                    const conf = d.bookings.filter((b) => b.status === "CONFIRMED").reduce((s, b) => s + b.adults + b.children, 0);
                    const pend = d.bookings.filter((b) => b.status === "PENDING").reduce((s, b) => s + b.adults + b.children, 0);
                    const full = d.seatsHeld >= d.capacity;
                    return (
                      <li key={d.id}>
                        <Link
                          href={`/admin/reservations?circuit=${d.circuitId}&from=${key}&to=${key}`}
                          className={`block rounded-md px-1.5 py-1 text-[11px] leading-tight ${d.status === "CLOSED" ? "bg-slate-100 text-slate-500 line-through" : full ? "bg-rose-50 text-rose-900" : conf + pend > 0 ? "bg-emerald-50 text-emerald-900" : "bg-ivory text-night/70"}`}
                          title={`${tr(d.circuit.title, "fr")} — ${d.seatsHeld}/${d.capacity} places`}
                        >
                          <span className="block truncate font-semibold">{tr(d.circuit.title, "fr")}</span>
                          {d.seatsHeld}/{d.capacity} · ✓{conf} ⏳{pend}
                          {d.isDemo && " · démo"}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">✓ voyageurs confirmés · ⏳ en attente de confirmation · rouge = complet · barré = fermé. Les départs se créent dans Circuits &amp; départs.</p>
    </div>
  );
}
