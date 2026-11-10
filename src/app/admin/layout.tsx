import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import { getAdmin } from "@/lib/auth";
import { getBrand } from "@/lib/brand";
import { db } from "@/lib/db";
import { can, ROLES, type Permission, type Role } from "@/lib/rbac";
import { logout } from "./actions";
import AdminShell, { type NavGroup } from "./AdminShell";
import "../globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cormorant" });

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

type Item = { href: string; label: string; icon: string; perm?: Permission; badgeKey?: string };
const NAV: { title: string; items: Item[] }[] = [
  { title: "Pilotage", items: [{ href: "/admin", label: "Tableau de bord", icon: "chart" }, { href: "/admin/finances", label: "Finances", icon: "shield", perm: "finance.read" }] },
  {
    title: "Ventes",
    items: [
      { href: "/admin/reservations", label: "Réservations", icon: "calendar", perm: "bookings.read", badgeKey: "pending" },
      { href: "/admin/calendrier", label: "Calendrier des départs", icon: "clock", perm: "bookings.read" },
      { href: "/admin/demandes", label: "Demandes & devis", icon: "sparkle", perm: "bookings.read", badgeKey: "requests" },
      { href: "/admin/messages", label: "Messagerie", icon: "message", perm: "bookings.read", badgeKey: "messages" },
      { href: "/admin/clients", label: "Clients", icon: "users", perm: "bookings.read" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/circuits", label: "Circuits & départs", icon: "route", perm: "catalog.write" },
      { href: "/admin/activites", label: "Activités", icon: "camel", perm: "catalog.write" },
      { href: "/admin/options", label: "Options & suppléments", icon: "plus", perm: "catalog.write" },
      { href: "/admin/destinations", label: "Destinations", icon: "pin", perm: "catalog.write" },
    ],
  },
  {
    title: "Contenus & marketing",
    items: [
      { href: "/admin/contenus", label: "Accueil, FAQ, bannières", icon: "file", perm: "content.write" },
      { href: "/admin/pages", label: "Pages légales", icon: "file", perm: "content.write" },
      { href: "/admin/medias", label: "Médias", icon: "camera", perm: "content.write" },
      { href: "/admin/avis", label: "Avis clients", icon: "star", perm: "content.write", badgeKey: "reviews" },
      { href: "/admin/promos", label: "Codes promo", icon: "sparkle", perm: "marketing.write" },
      { href: "/admin/newsletter", label: "Newsletter", icon: "mail", perm: "marketing.write" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/admin/identite", label: "Identité & coordonnées", icon: "globe", perm: "settings.write" },
      { href: "/admin/parametres", label: "Tarification & intégrations", icon: "info", perm: "settings.write" },
      { href: "/admin/utilisateurs", label: "Équipe & rôles", icon: "users", perm: "users.manage" },
      { href: "/admin/journal", label: "Journal d'audit", icon: "lock", perm: "audit.read" },
      { href: "/admin/notifications", label: "E-mails envoyés", icon: "mail", perm: "bookings.read" },
    ],
  },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getAdmin();
  const ready = admin && (admin.mfaPassed || !admin.mfaEnabled);
  let shell: React.ReactNode = children;
  if (admin && ready) {
    const [brand, pending, requests, messages, reviews, cancels] = await Promise.all([
      getBrand(),
      db.booking.count({ where: { status: "PENDING" } }),
      db.quoteRequest.count({ where: { status: "NEW" } }),
      db.message.count({ where: { fromAgency: false, readAt: null } }),
      db.review.count({ where: { published: false } }),
      db.booking.count({ where: { cancelRequestedAt: { not: null }, status: { in: ["PENDING", "CONFIRMED"] } } }),
    ]);
    const badges: Record<string, number> = { pending, requests, messages, reviews };
    const groups: NavGroup[] = NAV.map((g) => ({
      title: g.title,
      items: g.items.filter((i) => !i.perm || can(admin.role, i.perm)).map((i) => ({ href: i.href, label: i.label, icon: i.icon, badge: i.badgeKey ? badges[i.badgeKey] : undefined })),
    })).filter((g) => g.items.length);
    const alerts = [
      { label: "Réservations à confirmer", href: "/admin/reservations?status=PENDING", n: pending },
      { label: "Demandes d'annulation", href: "/admin/reservations?cancel=1", n: cancels },
      { label: "Nouvelles demandes", href: "/admin/demandes", n: requests },
      { label: "Messages non lus", href: "/admin/messages", n: messages },
      { label: "Avis à modérer", href: "/admin/avis", n: reviews },
    ].filter((a) => (a.href.includes("avis") ? can(admin.role, "content.write") : can(admin.role, "bookings.read")));
    shell = (
      <AdminShell
        brand={brand.name}
        groups={groups}
        user={{ name: admin.name, email: admin.email, role: ROLES[admin.role as Role] ? admin.role : admin.role, mfa: admin.mfaEnabled }}
        alerts={alerts}
        logoutAction={logout}
      >
        {children}
      </AdminShell>
    );
  }
  return (
    <html lang="fr" className={`${manrope.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-[#f7f5f0]">{shell}</body>
    </html>
  );
}
