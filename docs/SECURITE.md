# Sécurité — mesures en place et reste à faire

Référentiels suivis : OWASP ASVS 4 (niveau 2 visé) et OWASP API Security Top 10. Ce document décrit ce qui est
**implémenté et testé**, et ce qui relève de l'infrastructure de production (à mettre en place à l'hébergement).

## Implémenté dans l'application

| Menace | Mesure | Où |
|---|---|---|
| Injection SQL | Prisma (requêtes paramétrées) ; les rares requêtes brutes utilisent des gabarits paramétrés (`$executeRaw\`…${x}\``) | `src/lib/bookings.ts`, `src/lib/quotes.ts` |
| XSS | Échappement React ; aucun HTML brut issu des utilisateurs (Markdown minimal sans HTML) ; **CSP à nonce** + `strict-dynamic` ; e-mails échappés (`escapeHtml`) ; SVG refusé au téléversement | `src/proxy.ts`, `src/components/Markdown.tsx`, `src/lib/files.ts` |
| CSRF | Server Actions Next.js (contrôle de l'origine), cookies `SameSite=Strict` (admin) / `Lax` (voyageur), `form-action 'self'` | — |
| Clickjacking | `frame-ancestors 'none'`, `X-Frame-Options: DENY` | `src/proxy.ts` |
| SSRF | Aucune URL fournie par l'utilisateur n'est appelée côté serveur ; liens de bannière limités aux chemins internes ; réseaux sociaux `https://` uniquement (affichage) | `src/app/admin/config-actions.ts` |
| Brute force / credential stuffing | Limitation persistée en base : admin 5 échecs/15 min par compte et 20/15 min par IP, MFA 10/15 min ; voyageurs 8/15 min par compte et 30 par IP ; comparaison bcrypt systématique (pas d'énumération par le temps de réponse) | `src/lib/security.ts`, actions de connexion |
| Accès non autorisé | **MFA TOTP obligatoire** pour toute l'équipe ; **RBAC** (ADMIN, MANAGER, AGENT, ACCOUNTANT) vérifié dans chaque page et chaque action ; compte relu en base à chaque requête (désactivation immédiate) ; au moins un administrateur actif garanti | `src/lib/auth.ts`, `src/lib/rbac.ts` |
| Vol de session | Cookies `httpOnly`, `Secure` en production ; admin 8 h, chemin `/admin` ; sessions voyageurs stockées par empreinte SHA-256, révocables (« déconnecter tous mes appareils », réinitialisation du mot de passe) | `src/lib/customer.ts` |
| Accès aux dossiers (IDOR) | Dossier accessible uniquement par jeton secret de 192 bits ou compte titulaire ; rattachement d'un dossier sans compte seulement si l'e-mail du compte est **vérifié** et identique ; recherche par n° + e-mail limitée (10/15 min) | `findAccessibleBooking` |
| Téléversement malveillant | Type déterminé par le **contenu réel** (signature binaire) : images JPEG/PNG/WebP, vidéo MP4, documents PDF ; tailles maximales ; noms de fichiers aléatoires ; documents de voyage **hors du dossier public**, servis après contrôle d'accès avec `nosniff` | `src/lib/files.ts`, `src/app/api/documents/[id]` |
| Manipulation des prix | Prix toujours recalculé par le serveur à partir de la base (circuit, options, promo, réglages) ; le total d'un devis est calculé par le serveur à partir des lignes | `src/lib/pricing.ts`, `src/lib/quotes.ts` |
| Doubles réservations / survente | `UPDATE … SET seatsHeld = seatsHeld + n WHERE seatsHeld + n <= capacity` dans une transaction ; testé à 300 requêtes simultanées | `src/lib/bookings.ts` |
| Robots / abus de formulaires | Champs pièges, limites par IP (réservation 10/10 min, demandes 8/h, newsletter 10/h, inscription 5/h) | — |
| Injection de formules (CSV) | Préfixe `'` sur les cellules commençant par `= + - @` | exports CSV |
| Secrets | Aucun secret côté client (`NEXT_PUBLIC_*` limités à des valeurs publiques) ; secrets MFA chiffrés AES-256-GCM ; `.env` non versionné | — |
| Journalisation | Journal d'audit (connexions, échecs, MFA, statuts, paiements, tarifs, identité, équipe, documents, devis) avec auteur, IP et détails ; consultable, non modifiable depuis l'interface | `AuditLog`, Admin → Journal d'audit |
| Données personnelles | Consentements horodatés (réservation, demande, newsletter avec texte conservé) ; droit à l'effacement newsletter ; notes internes de l'agence jamais montrées au client | — |
| En-têtes | CSP, HSTS (production), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `Cache-Control: no-store` sur l'admin | `src/proxy.ts` |

Vérifications automatisées : `npm run test:agence` (MFA, audit, 403 sur document, faux PDF refusé, anti-énumération,
en-têtes), `npm run test:booking` (survente, validation serveur).

## À mettre en place à l'hébergement (non faisable dans le code seul)

- **HTTPS** obligatoire (certificat géré par l'hébergeur ou Caddy/Cloudflare).
- **WAF et protection DDoS** : Cloudflare (offre gratuite ou Pro) devant le site ; règles de limitation sur
  `/admin/login`, `/api/bookings`, `/fr/compte`.
- `TRUST_PROXY=1` derrière ce proxy (IP réelle pour les limites et l'audit).
- **Sauvegardes chiffrées** quotidiennes de la base et de `storage/documents`, test de restauration mensuel.
- **Surveillance et alertes** : supervision de disponibilité (UptimeRobot, Better Stack), remontée d'erreurs (Sentry),
  alerte sur les pics `LOGIN_FAIL` / `LOGIN_THROTTLED` du journal d'audit.
- Chiffrement au repos de la base (PostgreSQL managé) ; rotation des mots de passe d'accès.
- Revue de sécurité / test d'intrusion par un tiers avant l'ouverture commerciale.

## Limites connues

- Limitation de débit et cache sont en base / en mémoire par instance : en multi-instances, utiliser Redis.
- Le chatbot (si la clé IA est configurée) n'a accès qu'au catalogue public, jamais aux dossiers clients.
- Les e-mails sont journalisés en clair dans la table `Notification` (utile tant que le SMTP n'est pas configuré) :
  purger périodiquement en production.
