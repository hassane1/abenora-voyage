import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle } from "../ui";

/** Boîte de réception : conversations par dossier, non lus en premier */
export default async function InboxPage() {
  await requireAdmin("bookings.read");
  const bookings = await db.booking.findMany({
    where: { messages: { some: {} } },
    include: { messages: { orderBy: { createdAt: "desc" } } },
  });
  const threads = bookings
    .map((b) => ({ b, last: b.messages[0], unread: b.messages.filter((m) => !m.fromAgency && !m.readAt).length }))
    .sort((a, b) => b.unread - a.unread || b.last.createdAt.getTime() - a.last.createdAt.getTime());
  return (
    <div>
      <PageTitle title="Messagerie" />
      {threads.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-muted ring-1 ring-night/5">Aucune conversation. Les clients écrivent depuis leur dossier ; vous répondez depuis la fiche réservation.</p>
      ) : (
        <ul className="divide-y divide-night/5 overflow-hidden rounded-2xl bg-white ring-1 ring-night/5">
          {threads.map(({ b, last, unread }) => (
            <li key={b.id}>
              <Link href={`/admin/reservations/${b.id}#messages`} className="flex items-center gap-4 px-5 py-4 hover:bg-ivory">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-terracotta" : "bg-transparent"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {b.firstName} {b.lastName} <span className="font-mono text-xs font-normal text-muted">· {b.reference}</span>
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {last.fromAgency ? "Vous : " : ""}
                    {last.body}
                  </span>
                </span>
                <span className="text-xs text-muted">{last.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                {unread > 0 && <span className="rounded-full bg-terracotta px-2 text-xs font-bold text-white">{unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
