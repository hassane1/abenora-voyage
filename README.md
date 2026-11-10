# Morocco Évasion Travel — site officiel d'une agence de voyages au Maroc

Site vitrine et outil de gestion **mono-agence** (pas de marketplace) : circuits, excursions, séjours et voyages
sur mesure, réservation **sur demande** avec validation par l'agence, espace voyageur, back-office complet.
Première destination développée entièrement : **Merzouga — désert du Sahara**. Langues : FR, EN, AR (RTL).

> Nom provisoire. **Le nom, le logo, les coordonnées, les réseaux sociaux et les informations légales se modifient
> dans Administration → Identité & coordonnées**, sans toucher au code.

> ⚠️ **Données de démonstration.** Tarifs et départs fournis sont **fictifs** (statut `DEMO`), signalés partout
> (site, e-mails, admin). Aucun avis, statistique ou partenaire n'est inventé. Les pages légales sont des **modèles**
> affichés avec un avertissement tant qu'elles ne sont pas marquées « validées » par un juriste.

Ce projet est l'évolution de la plateforme « Rimal » (même dépôt, historique Git conservé).

---

## 1. Démarrage rapide

Prérequis : Node.js 20+ (testé avec Node 26), npm.

```bash
npm install
cp .env.example .env       # renseigner AUTH_SECRET (32+ caractères) et ADMIN_EMAIL / ADMIN_PASSWORD
npm run db:deploy          # applique les migrations (SQLite local : dev.db)
npm run db:seed            # catalogue Merzouga, 14 destinations « bientôt », pages légales, FAQ, compte admin
npm run dev                # http://localhost:3000
```

Base existante (version précédente) : `npm run db:deploy && npm run db:upgrade` — ajoute pages légales, FAQ et
identité par défaut **sans rien écraser**.

- Site : http://localhost:3000 (redirection `/fr`, `/en` ou `/ar`)
- Espace voyageur : `/fr/compte` (avec compte) ou `/fr/espace-client` (sans compte : n° de dossier + e-mail)
- Administration : http://localhost:3000/admin — **à la première connexion, configuration obligatoire de la
  vérification en deux étapes** (Google Authenticator, Microsoft Authenticator, 1Password…). En développement
  seulement, `ADMIN_MFA_REQUIRED=false` la rend facultative.
- Remise à zéro de la démonstration : `npm run db:reset`

---

## 2. Fonctionnalités

| Domaine | Contenu |
|---|---|
| Identité | Nom, slogan FR/EN/AR, logo (PNG/JPEG/WebP vérifiés), téléphone, WhatsApp, e-mail, adresse, horaires, réseaux sociaux, raison sociale, RC, ICE, IF, patente, licence, préfixe des n° de dossier, taux EUR/USD informatifs |
| Accueil | Hero photo (ou vidéo réelle téléversée), titre éditable, 3 boutons, recherche destination/date/voyageurs/durée/budget, puis : destinations incontournables, circuits populaires, prochains départs, expériences, « heure par heure », voyages sur mesure, pourquoi nous, témoignages vérifiés (vrais avis modérés uniquement, état vide honnête), galerie, conseils, FAQ, newsletter + contact, pied de page professionnel |
| Destinations | 15 destinations administrables (création, textes FR/EN/AR, région, coordonnées carte, conseils, FAQ, ordre, publication, photo de bannière via l'étiquette `slot:destination:<id>`). Page Merzouga : Erg Chebbi, expériences, circuits, hébergements & bivouacs, carte, excursions, avis, galerie, conseils, FAQ, **calendrier des séjours**, réservation |
| Circuits & activités | 3 circuits types (2 j / 3 j / 4 j depuis Marrakech) avec programme jour par jour, carte et temps de route calculés (OSRM), inclus/exclus, annulation, départs et places ; 17 activités avec durée, niveau, âge, prix MAD configurés par l'admin ; conversion EUR/USD informative |
| Réservation | 8 étapes ; prix **recalculé côté serveur** ; places bloquées par requête SQL conditionnelle (anti-survente testée à 300 requêtes simultanées) ; dossier `MET-AAMMJJ-XXXX` « en attente de confirmation » ; e-mails client + agence ; jamais confirmée automatiquement |
| Espace voyageur | Compte (mot de passe ≥ 10, vérification d'e-mail, réinitialisation, sessions révocables, « déconnecter tous mes appareils »), tableau de bord, voyages à venir, historique, favoris synchronisés, documents de voyage privés, reçus de paiement imprimables, messagerie avec l'agence, demande d'annulation, avis après séjour, devis. **Sans compte** : accès sécurisé par n° de dossier + e-mail (lien à jeton), mêmes fonctions |
| Sur mesure | Formulaire complet (destination, ville de départ, date, durée, voyageurs, budget, confort, activités, transport, besoins, consentement) → dossier `SM-AAMM-XXXX` → devis (programme, lignes de prix, acompte, validité, conditions ; total calculé par le serveur) → envoi par e-mail → acceptation/refus en ligne → **transformation en réservation** → PDF (impression navigateur) |
| Administration | Barre latérale repliable, recherche globale, notifications ; tableau de bord (réservations du jour/mois, CA confirmé, paiements reçus, clients, circuits actifs, voyages à venir, demandes à traiter, graphique 12 mois) ; réservations (filtres, confirmation/refus/annulation, paiements, remboursements, messagerie, documents, demandes d'annulation, export CSV et PDF) ; calendrier des départs ; demandes & devis ; clients ; finances (ventes, encaissements, acomptes et soldes dus, remboursements, par mode et par circuit) ; circuits (création, **duplication**, tarifs, capacités, programme, départs) ; activités, options, destinations ; contenus (titre d'accueil, FAQ, bannières saisonnières) ; pages légales ; médias ; avis ; codes promo ; newsletter ; équipe & rôles ; journal d'audit |
| Marketing | WhatsApp flottant et contextuel, contact, newsletter **double opt-in** (preuve du consentement, désinscription en un clic, export CSV), codes promo, bannières/offres saisonnières datées, SEO (hreflang, sitemap, JSON-LD), blog |
| Légal | Mentions légales, CGV, confidentialité, cookies, annulation/remboursement : modèles éditables FR/EN/AR avec variables (`{{raison_sociale}}`, `{{licence}}`…) et bandeau « à valider » ; information cookies (uniquement des cookies nécessaires) |

Ce qui est **signalé comme non configuré** (et non présenté comme opérationnel) : envoi réel des e-mails (SMTP),
paiement en ligne, IA du chatbot (clé Anthropic), tarifs réels, informations légales.

---

## 3. Architecture

```
prisma/schema.prisma         29 tables (SQLite en dev, PostgreSQL en prod)
prisma/defaults.ts           contenus par défaut non destructifs (pages légales, FAQ, identité)
prisma/seed-data/legal.ts    modèles juridiques et FAQ
src/proxy.ts                 langues + en-têtes de sécurité (CSP à nonce, HSTS…)
src/lib/brand.ts             identité de l'agence (Setting « brand.* »)
src/lib/auth.ts, rbac.ts     admin : bcrypt, MFA TOTP, rôles et permissions
src/lib/customer.ts          comptes voyageurs, sessions révocables, accès aux dossiers
src/lib/security.ts          TOTP, chiffrement AES-GCM, limitation de débit, journal d'audit, IP
src/lib/quotes.ts            devis et transformation en réservation
src/lib/cache.ts             cache court du catalogue public (invalidé par l'admin)
src/lib/files.ts             contrôle du contenu réel des fichiers téléversés
src/app/[locale]/…           site public, /compte, /espace-client, /devis, /recu, /legal
src/app/admin/…              back-office
storage/documents/           documents de voyage PRIVÉS (hors dossier public, non versionné)
```

Détails sécurité : [docs/SECURITE.md](docs/SECURITE.md) · performance et tests de charge : [docs/PERFORMANCE.md](docs/PERFORMANCE.md) ·
mise en production : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

---

## 4. Tests

```bash
npm run typecheck && npm run lint && npm run build
npm run test:booking       # moteur de réservation, prix, anti-survente (serveur lancé)
npm run test:agence        # 28 vérifications : MFA, audit, 23 pages admin, compte voyageur, documents privés,
                           # reçu, devis → réservation, newsletter, anti-énumération, en-têtes HTTP
npm run test:load          # charge + survente (contre `npm start`, voir docs/PERFORMANCE.md)
node scripts/shots.mjs     # captures bureau/mobile + erreurs console + débordements
```

Les tests créent des données : `npm run db:reset` ensuite. `test:agence` crée un administrateur temporaire
qu'il supprime à la fin.

Résultats au 2026-11-10 (machine de développement Windows) : typecheck, lint et build OK ; `test:booking` 9/9 ;
`test:agence` 28/28 ; 12 captures bureau/mobile sans erreur ni débordement ; 300 réservations simultanées sur un
départ de 12 places → 6 acceptées, 12/12 places, **aucune survente**.

---

## 5. Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | `file:./dev.db` (SQLite) ou URL PostgreSQL |
| `AUTH_SECRET` | Signature des sessions admin, chiffrement des secrets MFA (32+ caractères aléatoires, à ne jamais changer sans réinitialiser les MFA) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Compte administrateur créé par le seed |
| `ADMIN_MFA_REQUIRED` | `true` (défaut). `false` uniquement en développement |
| `NEXT_PUBLIC_SITE_URL` | URL publique (liens e-mails, sitemap) |
| `SMTP_*`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | Envoi réel des e-mails. Vide → e-mails **journalisés** (Admin → E-mails envoyés) |
| `TRUST_PROXY` | `1` derrière Cloudflare/Nginx pour l'IP réelle |
| `RATE_LIMIT_MULTIPLIER` | Tests de charge uniquement |
| `CATALOG_CACHE` | `off` pour désactiver le cache du catalogue |
| `ANTHROPIC_API_KEY` | Chatbot IA (sinon mode simplifié) |
| `NEXT_PUBLIC_OSRM_URL` | Service de routage (serveur public de démonstration par défaut) |

`NEXT_PUBLIC_BRAND_NAME` et `NEXT_PUBLIC_WHATSAPP_NUMBER` ne servent plus que de valeurs initiales : la source
de vérité est l'écran Identité.

---

## 6. Reste à configurer par l'agence

1. Identité : raison sociale, RC, ICE, IF, licence, adresse, e-mail, téléphone, réseaux sociaux, logo.
2. Tarifs réels des circuits, activités et options, puis passage du statut « Démonstration » à « Validé » ; départs réels.
3. SMTP (Brevo, Mailjet, OVH…) puis test d'envoi réel.
4. Pages légales : adaptation et validation par un juriste (loi 31-08, loi 09-08 / déclaration CNDP, réglementation
   des agences de voyages), puis case « Validé ».
5. Fiscalité (taux de taxe) après avis comptable.
6. Paiement en ligne : choix d'un prestataire compatible au Maroc (ex. passerelle CMI via la banque de l'agence) —
   architecture préparée (§7).
7. Hébergement, PostgreSQL, stockage des médias et sauvegardes : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

---

## 7. Paiement en ligne (préparé, non activé)

En place : statut de paiement par dossier, table `Payment` (paiements/remboursements, auteur, référence), acompte
calculé, finances, reçus. À faire après choix du prestataire :

1. `POST /api/payments/checkout` : session de paiement de l'acompte **uniquement pour un dossier confirmé**, montant lu en base.
2. `POST /api/payments/webhook` : vérification de signature, `Payment` (`PRESTATAIRE_EN_LIGNE`), `paymentStatus`, audit.
3. Facture conforme ; remboursements via l'API du prestataire.

---

## 8. Ouvrir une nouvelle destination

Admin → Destinations (textes, conseils, FAQ, coordonnées) → Médias (photo avec l'étiquette `slot:destination:<id>`)
→ Circuits (« Créer » ou « Dupliquer » un circuit, tarifs, programme, départs) → publier le circuit puis la destination.
Les sections propres au désert (Erg Chebbi, bivouacs, excursions du Tafilalet) n'apparaissent que si elles sont renseignées.
