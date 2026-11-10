"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

export type NavItem = { href: string; label: string; icon: string; badge?: number };
export type NavGroup = { title: string; items: NavItem[] };

/** Coquille de l'administration : barre latérale repliable, en-tête avec recherche et notifications */
export default function AdminShell({
  brand,
  groups,
  user,
  alerts,
  logoutAction,
  children,
}: {
  brand: string;
  groups: NavGroup[];
  user: { name: string; email: string; role: string; mfa: boolean };
  alerts: { label: string; href: string; n: number }[];
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const totalAlerts = alerts.reduce((s, a) => s + a.n, 0);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- préférence locale lue après hydratation
      setCollapsed(localStorage.getItem("admin-sidebar") === "1");
    } catch {}
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("admin-sidebar", c ? "0" : "1");
      } catch {}
      return !c;
    });
  };
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setBellOpen(false);
  }
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6" aria-label="Administration">
      {groups.map((g) => (
        <div key={g.title}>
          {!collapsed && <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  title={collapsed ? it.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive(it.href) ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/6 hover:text-white"} ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon name={it.icon} className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{it.label}</span>}
                  {!collapsed && !!it.badge && <span className="rounded-full bg-terracotta px-1.5 text-[11px] font-bold text-white">{it.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Barre latérale (bureau) */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-night text-white transition-[width] duration-200 lg:flex ${collapsed ? "w-[72px]" : "w-64"}`}>
        <div className={`flex items-center gap-2 px-5 py-5 ${collapsed ? "justify-center px-2" : ""}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand font-display text-lg font-bold text-night">{brand.slice(0, 1)}</span>
          {!collapsed && <span className="truncate text-sm font-semibold">{brand}</span>}
        </div>
        {sidebar}
        <button onClick={toggle} className="m-3 flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white" aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}>
          <Icon name="arrow" className={`h-4 w-4 transition ${collapsed ? "" : "rotate-180"}`} /> {!collapsed && "Replier"}
        </button>
      </aside>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex w-72 flex-col bg-night pt-4 text-white">{sidebar}</div>
          <button className="flex-1 bg-black/40" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-night/8 bg-[#f7f5f0]/90 px-4 py-3 backdrop-blur sm:px-8">
          <button className="rounded-lg p-2 hover:bg-night/5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <form action="/admin/recherche" className="relative flex-1 sm:max-w-md" role="search">
            <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input name="q" placeholder="Rechercher un dossier, un client, un devis…" className="w-full rounded-xl border border-night/10 bg-white py-2 ps-9 pe-3 text-sm outline-none focus:border-sand focus:ring-2 focus:ring-sand/25" />
          </form>
          <div className="ms-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setBellOpen(!bellOpen)} className="relative rounded-lg p-2 hover:bg-night/5" aria-label={`Notifications (${totalAlerts})`} aria-expanded={bellOpen}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 004 0" />
                </svg>
                {totalAlerts > 0 && <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white">{totalAlerts}</span>}
              </button>
              {bellOpen && (
                <div className="absolute end-0 mt-2 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-night/10">
                  {alerts.filter((a) => a.n > 0).length === 0 ? (
                    <p className="p-3 text-sm text-muted">Rien à traiter pour le moment.</p>
                  ) : (
                    alerts
                      .filter((a) => a.n > 0)
                      .map((a) => (
                        <Link key={a.href} href={a.href} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-ivory">
                          {a.label} <span className="rounded-full bg-terracotta/10 px-2 text-xs font-bold text-terracotta">{a.n}</span>
                        </Link>
                      ))
                  )}
                </div>
              )}
            </div>
            <Link href="/fr" target="_blank" className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:bg-night/5 sm:block">
              Voir le site ↗
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-night/5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-night text-xs font-bold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden text-start text-xs sm:block">
                  <span className="block font-semibold text-night">{user.name}</span>
                  <span className="block text-muted">{user.role}</span>
                </span>
              </summary>
              <div className="absolute end-0 mt-2 w-60 rounded-2xl bg-white p-2 text-sm shadow-xl ring-1 ring-night/10">
                <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
                <Link href="/admin/securite" className="block rounded-xl px-3 py-2 hover:bg-ivory">
                  Sécurité du compte {user.mfa ? "· MFA actif" : "· MFA à activer"}
                </Link>
                <form action={logoutAction}>
                  <button className="w-full rounded-xl px-3 py-2 text-start text-rose-700 hover:bg-rose-50">Se déconnecter</button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
