import "server-only";
import { createHmac } from "node:crypto";
import { site } from "./site";

/** Signature du lien de désinscription (sans donnée personnelle dans l'URL) */
export function unsubscribeSig(id: string) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`unsub:${id}`).digest("base64url").slice(0, 32);
}

export function unsubscribeUrl(id: string) {
  return `${site.url}/api/newsletter?action=unsubscribe&id=${id}&sig=${unsubscribeSig(id)}`;
}
