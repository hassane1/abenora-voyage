# Performance et tests de charge

## Mesures réelles (2026-11-10)

Conditions : **une seule instance** `next start` (Node 26) sur le PC de développement Windows, base **SQLite** locale,
avec deux autres serveurs de développement actifs sur la machine ; 100 connexions simultanées pendant 15 s
(`npm run test:load`), cache du catalogue activé.

| Scénario | Requêtes/s | Latence p50 | p99 | Erreurs |
|---|---|---|---|---|
| Accueil `/fr` (page la plus lourde) | 53 | 1,75 s | 2,4 s | 0 |
| Page Merzouga | 46 | 1,9 s | 4,0 s | 0 |
| Fiche circuit | 175 | 0,54 s | 1,3 s | 0 |
| API calcul de prix | 393 | 0,25 s | 0,61 s | 0 |

Avant l'ajout du cache du catalogue : accueil 38 req/s, Merzouga 29 req/s, fiche circuit 100 req/s.

**Survente** : 300 demandes de réservation simultanées (2 personnes chacune) sur un départ de 12 places →
6 acceptées, 12/12 places bloquées, 12 voyageurs en dossiers : **aucune survente**. 68 requêtes ont échoué
côté client (connexions refusées par le poste Windows lors de l'ouverture de 300 sockets d'un coup) ; relancé
seul, le même test donne 6 acceptées / 294 refusées « complet », 0 erreur.

## Ce que ces chiffres permettent de dire — et ce qu'ils ne permettent pas

- Une instance sur ce poste supporte environ **50 pages d'accueil rendues par seconde** sans erreur. Avec un
  visiteur qui charge une page toutes les 20 à 30 s, cela correspond à l'ordre de **1 000 visiteurs actifs**
  si l'essentiel du trafic arrive sur les pages lourdes — à confirmer sur le serveur de production.
- **Aucune capacité de 5 000, 20 000 ou 50 000 utilisateurs simultanés n'est démontrée.** Ces paliers demandent
  l'architecture ci-dessous et un test de charge **sur l'infrastructure réelle** (k6 ou Artillery depuis
  plusieurs machines), qui reste à faire avant toute annonce.

## Architecture pour monter en charge (par paliers)

1. **CDN devant le site** (Cloudflare) : images, scripts et styles servis depuis le cache ; pages publiques mises
   en cache HTML quelques dizaines de secondes (`Cache-Control: s-maxage`) — c'est le levier principal : la
   majorité des visites ne toucherait plus le serveur.
2. **PostgreSQL managé + pooling** (Supabase/Neon + PgBouncer) à la place de SQLite (voir DEPLOIEMENT.md) ;
   les requêtes de réservation sont déjà compatibles.
3. **Plusieurs instances** derrière un répartiteur de charge (ou plateforme avec autoscaling) ; remplacer le cache
   mémoire et la limitation de débit par **Redis** (même interface : `src/lib/cache.ts`, `src/lib/security.ts`).
4. **File d'attente** pour les e-mails (aujourd'hui envoyés pendant la requête) si le volume augmente.
5. Images : servir des tailles adaptées (les photos importées font 840 px ; deux en 2560 px à réduire) ;
   `next/image` ou transformation par le CDN.
6. Supervision (temps de réponse, erreurs, saturation de la base) et plan de reprise : sauvegardes testées,
   procédure de restauration documentée, second environnement.

## Reproduire

```bash
npm run build
RATE_LIMIT_MULTIPLIER=1000 npx next start -p 3001     # limites assouplies pour un test depuis une seule IP
node scripts/load-test.mjs http://localhost:3001 100 15
npm run db:reset                                       # les réservations de test restent en base
```
