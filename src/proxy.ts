import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales } from "@/i18n/config";

function preferredLocale(req: NextRequest) {
  const cookie = req.cookies.get("locale")?.value;
  if (cookie && hasLocale(cookie)) return cookie;
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (hasLocale(code)) return code;
  }
  return defaultLocale;
}

/**
 * Politique de sécurité du contenu (CSP) avec nonce par requête : seuls les scripts portant le nonce
 * (ceux de Next.js) s'exécutent → protection forte contre le XSS. Autres en-têtes : anti-clickjacking,
 * anti-sniffing, politique de référent, permissions, HSTS en production.
 */
function securityHeaders(nonce: string) {
  const dev = process.env.NODE_ENV !== "production";
  const osrm = (process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org").replace(/\/$/, "");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
    "media-src 'self'",
    "font-src 'self'",
    `connect-src 'self' ${osrm}${dev ? " ws: wss:" : ""}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const h: Record<string, string> = {
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
  if (!dev) h["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  return h;
}

function allowedOrigins(req: NextRequest) {
  const list = [req.nextUrl.origin];
  if (process.env.NEXT_PUBLIC_SITE_URL) list.push(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
  for (const o of (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)) list.push(o);
  return list;
}
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) return allowedOrigins(req).includes(origin);
  // pas d'Origin (anciens navigateurs, outils) : on refuse si le navigateur signale une requête intersite
  const site = req.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicPage = !pathname.startsWith("/admin") && !pathname.startsWith("/api");
  const hasPrefix = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (isPublicPage && !hasPrefix) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  // CSRF de l'API : toute écriture doit provenir du site lui-même (en-tête Origin, ou Sec-Fetch-Site)
  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(req.method) && !sameOrigin(req)) {
    return NextResponse.json({ error: "FORBIDDEN_ORIGIN" }, { status: 403 });
  }
  // limite de taille des corps JSON de l'API (les téléversements passent par les actions serveur, limitées à part)
  const len = Number(req.headers.get("content-length") ?? 0);
  if (pathname.startsWith("/api/") && len > 256 * 1024) return NextResponse.json({ error: "TOO_LARGE" }, { status: 413 });
  const nonce = btoa(crypto.randomUUID());
  const headers = securityHeaders(nonce);
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("Content-Security-Policy", headers["Content-Security-Policy"]);
  const res = NextResponse.next({ request: { headers: reqHeaders } });
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  if (pathname.startsWith("/admin")) res.headers.set("Cache-Control", "no-store");
  // documents privés : aucune exécution possible même ouverts directement dans le navigateur
  if (pathname.startsWith("/api/documents/")) res.headers.set("Content-Security-Policy", "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
  return res;
}

export const config = {
  // pages publiques, admin et API ; on exclut les fichiers Next, les médias et les fichiers statiques
  matcher: ["/((?!_next/static|_next/image|uploads|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|svg|mp4|ico|txt|xml)$).*)"],
};
