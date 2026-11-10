import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, PageTitle } from "../ui";

export default async function NotificationsAdmin({ searchParams }: PageProps<"/admin/notifications">) {
  await requireAdmin();
  const sp = await searchParams;
  const list = await db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const open = typeof sp.id === "string" ? list.find((n) => n.id === sp.id) : null;
  return (
    <div>
      <PageTitle title="Notifications (e-mails)" />
      <p className="mb-4 text-sm text-muted">
        {process.env.SMTP_HOST
          ? `SMTP configuré (${process.env.SMTP_HOST}) : les e-mails sont envoyés.`
          : "SMTP non configuré : les e-mails sont enregistrés ici (statut « Journalisé ») mais ne sont pas envoyés. Renseignez SMTP_HOST dans .env pour activer l'envoi."}
      </p>
      <div className="grid gap-6 xl:grid-cols-2">
        <ul className="divide-y divide-night/5 rounded-2xl bg-white ring-1 ring-night/5">
          {list.length === 0 && <li className="p-6 text-center text-sm text-muted">Aucune notification.</li>}
          {list.map((n) => (
            <li key={n.id}>
              <a href={`?id=${n.id}`} className={`block p-4 text-sm hover:bg-ivory ${open?.id === n.id ? "bg-ivory" : ""}`}>
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{n.subject}</span>
                  <Badge cls={n.status === "SENT" ? "bg-emerald-100 text-emerald-900" : n.status === "FAILED" ? "bg-rose-100 text-rose-900" : "bg-amber-100 text-amber-900"}>
                    {n.status === "SENT" ? "Envoyé" : n.status === "FAILED" ? "Échec" : "Journalisé"}
                  </Badge>
                </div>
                <p className="text-xs text-muted">
                  → {n.to} · {n.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </p>
                {n.error && <p className="text-xs text-rose-700">{n.error}</p>}
              </a>
            </li>
          ))}
        </ul>
        {open && (
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-night/5">
            <p className="border-b border-night/5 p-3 text-sm font-semibold">Aperçu : {open.subject}</p>
            <iframe title="Aperçu de l'e-mail" srcDoc={open.body} sandbox="" className="h-[600px] w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
