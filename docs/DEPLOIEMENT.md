# Mise en production

## Option recommandée au lancement (coût maîtrisé)

- **Application** : un VPS (2 vCPU / 4 Go, ex. OVHcloud, Hetzner, Contabo) ou une plateforme Node gérée (Railway, Render, Fly.io).
- **Base** : PostgreSQL managé (Supabase, Neon) avec sauvegardes automatiques et pooling.
- **Fichiers** : médias publics et documents privés sur un stockage objet (Supabase Storage, Cloudflare R2, S3) ;
  en VPS, les dossiers `public/uploads` et `storage/documents` peuvent rester sur disque avec sauvegarde.
- **Devant** : Cloudflare (DNS, HTTPS, CDN, WAF, anti-DDoS).
- **E-mails** : SMTP transactionnel (Brevo, Mailjet, Amazon SES) avec SPF, DKIM et DMARC sur le domaine.

Vercel/Netlify sont possibles mais imposent PostgreSQL et un stockage objet (système de fichiers éphémère).

## Passer à PostgreSQL

1. `npm install @prisma/adapter-pg pg`
2. `prisma/schema.prisma` : `provider = "postgresql"`
3. `src/lib/db.ts`, `prisma/seed.ts`, `prisma/upgrade.ts` : remplacer `PrismaBetterSqlite3` par
   `new PrismaPg({ connectionString: process.env.DATABASE_URL })`
4. Supprimer `prisma/migrations`, `npx prisma migrate dev --name init` contre la base PostgreSQL, puis `npm run db:seed`.
5. Relancer `npm run test:booking` et `npm run test:agence` (les scripts de test lisent SQLite : adapter la
   connexion ou exécuter les tests en local avant la bascule).

## Étapes (VPS)

```bash
git clone … && cd maroc-voyages
npm ci
cp .env.example .env    # NODE_ENV=production, AUTH_SECRET long et unique, SMTP, NEXT_PUBLIC_SITE_URL=https://…, TRUST_PROXY=1
npm run db:deploy && npm run db:seed
npm run build
npm start               # derrière Caddy/Nginx (HTTPS), géré par systemd ou pm2
```

Puis : se connecter à `/admin`, configurer la MFA, renseigner Identité & coordonnées, créer les comptes de l'équipe
(Équipe & rôles), valider tarifs et départs, faire valider les pages légales, envoyer un e-mail de test.

## Sauvegardes et reprise

- Base : sauvegarde quotidienne chiffrée, conservée 30 jours ; test de restauration mensuel dans une base séparée.
- Fichiers : `public/uploads`, `storage/documents` synchronisés vers un stockage distant.
- Garder `.env` (dont `AUTH_SECRET`) dans un coffre : sans lui, les secrets MFA et sessions ne sont plus lisibles.
- Procédure de reprise : nouvelle instance → `npm ci && npm run build` → restaurer base et fichiers → DNS.

## Avant l'ouverture commerciale

- [ ] Informations légales et licence renseignées ; pages légales validées par un juriste ; déclaration CNDP
- [ ] Tarifs et départs réels, statut « Validé » ; démonstration supprimée (`npm run db:reset` puis saisie réelle)
- [ ] SMTP réel testé (réservation, devis, réinitialisation, newsletter)
- [ ] Cloudflare (WAF, limitation de débit) et HTTPS
- [ ] Supervision et alertes ; sauvegardes testées
- [ ] Test de charge sur l'infrastructure réelle (voir PERFORMANCE.md)
- [ ] Revue de sécurité indépendante
