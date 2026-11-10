import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import { getAdmin } from "@/lib/auth";
import { logout } from "./actions";
import "../globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cormorant" });

export const metadata: Metadata = { title: "Administration — Rimal", robots: { index: false, follow: false } };

const nav = [
  ["/admin", "Tableau de bord"],
  ["/admin/reservations", "Réservations"],
  ["/admin/demandes", "Demandes & contacts"],
  ["/admin/circuits", "Circuits & disponibilités"],
  ["/admin/options", "Options & suppléments"],
  ["/admin/activites", "Activités"],
  ["/admin/destinations", "Destinations"],
  ["/admin/promos", "Codes promo"],
  ["/admin/avis", "Avis clients"],
  ["/admin/medias", "Médias"],
  ["/admin/notifications", "Notifications"],
  ["/admin/parametres", "Paramètres"],
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getAdmin();
  return (
    <html lang="fr" className={`${manrope.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-[#f4f1ea]">
        {admin ? (
          <div className="flex min-h-screen flex-col lg:flex-row">
            <aside className="bg-night text-white lg:w-64 lg:shrink-0">
              <div className="flex items-center justify-between px-6 py-5">
                <Link href="/admin" className="font-display text-2xl tracking-[0.2em] text-sand">
                  RIMAL
                </Link>
                <Link href="/fr" className="text-xs text-white/60 hover:text-sand" target="_blank">
                  Voir le site ↗
                </Link>
              </div>
              <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:overflow-visible">
                {nav.map(([href, label]) => (
                  <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">
                    {label}
                  </Link>
                ))}
              </nav>
              <form action={logout} className="hidden px-6 py-4 text-xs text-white/50 lg:block">
                <p>{admin.email}</p>
                <button className="mt-1 text-sand hover:underline">Se déconnecter</button>
              </form>
            </aside>
            <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
