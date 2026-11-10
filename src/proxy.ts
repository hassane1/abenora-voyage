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

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasPrefix = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasPrefix) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // tout sauf l'admin, l'API, les fichiers Next et les fichiers statiques
  matcher: ["/((?!admin|api|_next|uploads|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
