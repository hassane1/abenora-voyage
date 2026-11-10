# Rimal — plateforme touristique Maroc (phase 1 : Merzouga)

Site de découverte et de réservation de voyages au Maroc : interface client multilingue (FR / EN / AR avec RTL),
moteur de réservation **sur demande** de bout en bout, base de données persistante, notifications e-mail et
espace d'administration. Première destination complète : **Merzouga – désert du Sahara**.

> ⚠️ **Données de démonstration.** Les tarifs et disponibilités fournis sont **fictifs** (statut `DEMO`) et sont
> signalés comme tels sur le site, dans les e-mails et dans l'admin. Ils doivent être remplacés et passés en
> « Validé » dans l'administration avant toute mise en ligne. Aucun avis client, partenaire ou hébergement n'est inventé.

---

## 1. Démarrage rapide (Windows / macOS / Linux)

Prérequis : Node.js 20+ (testé avec Node 26 LTS), npm.

```bash
npm install                # installe et génère le client Prisma
cp .env.example .env       # puis renseigner AUTH_SECRET et ADMIN_PASSWORD (voir §4)
npm run db:migrate         # crée la base SQLite locale (dev.db)
npm run db:seed            # charge Merzouga, les options, le blog et le compte admin
npm run dev                # http://localhost:3000
```

- Site public : http://localhost:3000 (redirige vers `/fr`, `/en` ou `/ar` selon le navigateur)
- Administration : http://localhost:3000/admin — identifiants = `ADMIN_EMAIL` / `ADMIN_PASSWORD` du fichier `.env`
- Remettre la démonstration à zéro (supprime réservations, demandes et e-mails journalisés, recrée circuits et départs) : `npm run db:reset`

### Vérifications

```bash
npm run typecheck          # TypeScript
npm run lint               # ESLint
npm run build              # build de production
npm run test:booking       # test du moteur de réservation (serveur lancé)
```

`test:booking` vérifie : calcul du prix, création d'un dossier « En attente », numéro unique, notifications
enregistrées, **6 demandes simultanées sur le même départ sans dépassement de capacité**, validation serveur.
Il crée de vraies réservations de test : lancer `npm run db:reset` ensuite.

---

## 2. Fonctionnalités livrées

| Domaine | Contenu |
|---|---|
| Accueil | Hero immersif, recherche (destination / date / voyageurs / budget), circuits, expériences, destinations à venir |
| Merzouga | 12 sections : présentation, Erg Chebbi, expériences (17 fiches), circuits, hébergements, carte, excursions, avis vérifiés, galerie, conseils, FAQ (+ données structurées), réservation |
| Circuits | 3 fiches complètes : programme jour par jour (chronologie), carte, infos clés, inclus/exclus, options, annulation, avertissements, PDF (impression), WhatsApp contextuel, barre de réservation mobile |
| Activités | 17 fiches : durée, niveau, âge, restrictions, inclus/exclus, sécurité, disponibilité, prix MAD, « Ajouter à mon séjour » |
| Carte | Leaflet + tuiles OpenStreetMap ; tracés routiers et durées **calculés par OSRM** ; promenades/dromadaire en pointillés sans durée inventée |
| Réservation (mode A) | 8 étapes, calendrier des départs (disponible / presque complet / complet / fermé), voyageurs + âges, privé/partagé, options, prix recalculé **côté serveur**, code promo, coordonnées, consentement, n° de dossier `RML-AAMMJJ-XXXX`, statut « En attente de confirmation » |
| Espace client | Consultation par n° de dossier + e-mail, suivi, dépôt d'avis (uniquement séjour confirmé et terminé) |
| Premium | Comparateur de circuits, créateur de voyage sur mesure (suggestion instantanée + demande enregistrée), favoris, PDF de programme, galerie avec droits, blog (3 articles), FAQ |
| Admin | Tableau de bord (KPI, CA basé sur les paiements enregistrés, évolution mensuelle, top circuits, répartition), réservations (filtres, confirmation/refus/annulation, modification date/coordonnées, paiements/remboursements, historique, e-mails, export CSV Excel et PDF), circuits (tarifs, statut du tarif, capacité, textes FR/EN/AR, programme, génération/fermeture des départs), options, activités, destinations (publication), codes promo, réductions famille/groupe, demandes sur mesure/contact, modération des avis, médias avec droits, journal des notifications, paramètres fiscaux |
| SEO | URL descriptives, title/meta, hreflang, sitemap.xml, robots.txt, JSON-LD (TouristDestination, TouristTrip, FAQPage, Article) |
| Sécurité | Validation zod côté serveur, réservation atomique des places (anti double réservation), session admin JWT httpOnly, mots de passe bcrypt, blocage après 5 échecs de connexion, limitation de débit des réservations, champ anti-robot, aucune donnée personnelle dans les URL (jeton opaque pour l'espace client) |

---

## 3. Architecture

```
prisma/
  schema.prisma            Schéma (17 tables) — SQLite en dev, PostgreSQL en prod
  migrations/              Migrations SQL
  seed.ts                  Chargement des données (--reset : efface les réservations de test)
  seed-data/merzouga.ts    Destination, 17 activités, 15 options, 3 circuits (+ étapes GPS) — démo signalée
  seed-data/editorial.ts   Sections éditoriales, conseils, FAQ, 3 articles de blog
scripts/test-booking-flow.mjs  Test de bout en bout du moteur de réservation
src/
  proxy.ts                 Redirection de langue (/fr, /en, /ar)
  i18n/                    Configuration des langues + dictionnaires FR/EN/AR
  lib/
    db.ts                  Client Prisma (adaptateur SQLite ; voir §5 pour PostgreSQL)
    pricing.ts             Moteur de prix (fonction pure : adultes, enfants, privé, options, réductions, promo, taxes, acompte)
    bookings.ts            Création de réservation, contrôle de capacité atomique, changements de statut, e-mails
    mail.ts                Envoi SMTP ou journalisation
    auth.ts                Session administrateur
    queries.ts             Lectures du catalogue public
  components/              Header, Footer, cartes, DuneArt (illustrations), RouteMap, BookingWizard, Calendar…
  app/[locale]/            Pages publiques (13 + fiches)
  app/admin/               Administration
  app/api/                 departures, quote, bookings
```

### Schéma de données (résumé)

- **Destination** (textes `Json` traduisibles `{fr,en,ar}`, sections, conseils, FAQ, `published`)
- **Circuit** → `CircuitDay` (programme), `CircuitStop` (étapes GPS + mode de déplacement), `Departure` (date, capacité, `seatsHeld`, `isDemo`), `BookingOption`
- **Activity** (prix, `priceStatus` = `DEMO | VALIDATED | ON_REQUEST`, option liée)
- **Booking** (instantané des options et du calcul, `pricesAreDemo`, statut, statut de paiement, jeton d'accès) → `BookingEvent` (historique), `Payment`, `Review`
- **Notification** (journal des e-mails), **QuoteRequest**, **PromoCode**, **Post**, **Media** (crédit, licence, `rightsConfirmed`), **AdminUser**, **Setting**

Le schéma complet et commenté est dans `prisma/schema.prisma` ; le SQL généré dans `prisma/migrations/`.

### Règles métier importantes

- Une réservation est créée **En attente** ; elle n'est jamais présentée comme confirmée avant l'action de l'administrateur.
- Les places sont bloquées dès la demande (`seatsHeld`) par une requête SQL conditionnelle : la capacité ne peut pas être dépassée, même en cas de requêtes simultanées. Elles sont libérées au refus/annulation.
- Le prix affiché au client est toujours recalculé par le serveur (`/api/quote`) avec les mêmes règles que l'enregistrement.
- Tout tarif ou départ non validé marque la réservation `pricesAreDemo` et affiche un avertissement au client et à l'admin.
- Une destination non publiée n'apparaît que dans « Bientôt », sans offre ni tarif.

---

## 4. Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | `file:./dev.db` (SQLite) ou URL PostgreSQL |
| `AUTH_SECRET` | oui | Clé de signature des sessions admin (32+ caractères aléatoires) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | au seed | Compte administrateur créé/mis à jour par `npm run db:seed` |
| `NEXT_PUBLIC_SITE_URL` | oui | URL publique (liens e-mail, sitemap, données structurées) |
| `NEXT_PUBLIC_BRAND_NAME` | non | Nom de marque (défaut « Rimal ») |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | **à configurer** | Numéro international sans `+` (ex. `2126XXXXXXXX`). Vide → le bouton renvoie vers Contact |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | **à configurer** | Envoi réel des e-mails. Vide → e-mails **journalisés seulement** (Admin → Notifications) |
| `ADMIN_NOTIFY_EMAIL` | non | Destinataire des alertes de nouvelles demandes |
| `ANTHROPIC_API_KEY` | **à configurer** | Active l'IA (Claude Opus 5.5) du chatbot « Assistant Rimal ». Vide → mode simplifié (réponses FAQ/catalogue) |
| `NEXT_PUBLIC_OSRM_URL` | non | Service de routage. Défaut : serveur de démonstration public OSRM (usage limité, à remplacer en production) |

---

## 5. Ce qui reste à configurer / état réel des intégrations

| Intégration | État |
|---|---|
| Base de données | ✅ Fonctionnelle (SQLite local). PostgreSQL : voir ci-dessous |
| Réservation sur demande (mode A) | ✅ Testée de bout en bout (API + interface) |
| E-mails | ⚙️ Code prêt et testé en mode journalisation. **Envoi réel non testé** : nécessite un SMTP (Brevo, Mailjet, OVH…) |
| WhatsApp | ⚙️ Liens `wa.me` contextuels prêts ; numéro à renseigner |
| Carte / routage | ✅ OpenStreetMap + OSRM public (testé). Pour la production : instance OSRM propre ou service commercial |
| Chatbot | ⚙️ Mode simplifié testé (sans IA). Mode IA (`src/app/api/chat/route.ts`, Claude via le SDK Anthropic, base de connaissances construite depuis la base de données dans `src/lib/assistant.ts`) **non testé faute de clé** : renseigner `ANTHROPIC_API_KEY` |
| Paiement en ligne (mode B) | ❌ Non activé (voir §6) |
| Photos / vidéos | ❌ Aucune photo réelle : le site affiche des illustrations vectorielles originales. Ajouter les médias via Admin → Médias avec crédit, licence et confirmation des droits |
| Traductions | FR complet ; EN complet pour l'interface et presque tous les contenus ; AR complet pour l'interface et les titres/résumés — les descriptions longues sans traduction arabe s'affichent en français avec une mention. À compléter dans l'admin |
| Fiscalité | Taux de taxe à 0 % par défaut, à paramétrer après avis comptable |
| Page « À propos » | Mentions légales, équipe, licences d'agence à compléter |

### Passer à PostgreSQL (Supabase, Neon, Railway…)

1. `npm install @prisma/adapter-pg pg`
2. Dans `prisma/schema.prisma` : `provider = "postgresql"`
3. Dans `src/lib/db.ts` et `prisma/seed.ts` : remplacer `PrismaBetterSqlite3` par `new PrismaPg({ connectionString: process.env.DATABASE_URL })`
4. Supprimer `prisma/migrations`, puis `npx prisma migrate dev --name init` contre la base PostgreSQL, et `npm run db:seed`

Les requêtes SQL brutes de contrôle de capacité utilisent une syntaxe compatible SQLite et PostgreSQL.

### Déploiement

- **Vercel / Netlify** : base PostgreSQL obligatoire (système de fichiers éphémère) + stockage objet pour les médias
  (Supabase Storage, S3, Cloudflare R2) à brancher dans `uploadMedia` (`src/app/admin/actions.ts`).
  Build : `npm run build`, puis `npm run db:deploy` pour appliquer les migrations.
- **VPS (Node)** : SQLite possible pour démarrer ; `npm run build && npm start` derrière un proxy HTTPS (Caddy/Nginx),
  sauvegarde régulière de `dev.db` et `public/uploads`.

---

## 6. Mode B — paiement en ligne (architecture préparée)

Déjà en place : statut de paiement par dossier (`NONE`, `DEPOSIT_PAID`, `PAID`, `REFUNDED`), table `Payment`
(paiements et remboursements, auteur, référence), calcul de l'acompte, réglage `paymentMode`, chiffre d'affaires
basé uniquement sur les paiements enregistrés.

À faire après choix du prestataire (à vérifier avec la banque de l'agence et selon son statut — par exemple la
passerelle CMI proposée par les banques marocaines) :

1. Route `POST /api/payments/checkout` : crée la session de paiement de l'acompte **uniquement pour un dossier confirmé**.
2. Webhook `POST /api/payments/webhook` : vérifie la signature, enregistre un `Payment` (`method = PRESTATAIRE_EN_LIGNE`),
   met à jour `paymentStatus`, journalise un `BookingEvent`.
3. Reçu / facture conforme aux obligations applicables.
4. Remboursements : appel API du prestataire + `Payment` de type `REFUND`.

---

## 7. Ajouter une destination (Marrakech, Chefchaouen…)

Les 14 destinations futures existent déjà en base (non publiées, sans offre). Pour en ouvrir une :
Admin → Destinations (textes) → Circuits → « Créer un circuit » → compléter tarifs, programme et départs →
Activités/Options si besoin → publier le circuit puis la destination. Les étapes GPS de la carte se gèrent
aujourd'hui dans le seed (`CircuitStop`) ; un éditeur visuel d'étapes est une évolution prévue.
