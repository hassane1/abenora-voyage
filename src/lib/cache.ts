import "server-only";

/**
 * Cache mémoire court pour les lectures publiques du catalogue (accueil, destinations, circuits…).
 * - Durée de vie courte (TTL) : borne la fraîcheur même avec plusieurs instances.
 * - Invalidation immédiate dans l'instance courante dès qu'une action d'administration modifie le contenu
 *   (appel automatique depuis requireAdmin() avec une permission d'écriture et depuis audit()).
 * - Les disponibilités affichées peuvent avoir quelques secondes de retard : la réservation, elle,
 *   est TOUJOURS contrôlée en base de façon atomique (aucune survente possible).
 * En production multi-instances : remplacer par Redis (même interface) pour une invalidation partagée.
 */
type Entry = { v: unknown; exp: number; gen: number };
const g = globalThis as unknown as { __catalogCache?: Map<string, Entry>; __catalogGen?: number };
const store = (g.__catalogCache ??= new Map());
g.__catalogGen ??= 0;

export const CACHE_DISABLED = process.env.CATALOG_CACHE === "off";

export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  if (CACHE_DISABLED) return fn();
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.exp > now && hit.gen === g.__catalogGen) return hit.v as T;
  const v = await fn();
  store.set(key, { v, exp: now + ttlSeconds * 1000, gen: g.__catalogGen! });
  if (store.size > 500) store.delete(store.keys().next().value!);
  return v;
}

/** Vide le cache du catalogue (après une modification dans l'administration) */
export function invalidateCatalog() {
  g.__catalogGen = (g.__catalogGen ?? 0) + 1;
  store.clear();
}
