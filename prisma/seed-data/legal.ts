/**
 * MODÈLES de pages légales — à adapter et faire valider par un juriste avant toute publication commerciale.
 * Les variables {{…}} sont remplacées par les informations de Administration → Identité & coordonnées.
 * Références à vérifier : loi 31-08 (protection du consommateur), loi 09-08 et CNDP (données personnelles),
 * loi 31-96 et textes d'application relatifs aux agences de voyages.
 */
type L = { fr: string; en: string; ar: string };

export const legalPages: { slug: string; title: L; body: L }[] = [
  {
    slug: "mentions-legales",
    title: { fr: "Mentions légales", en: "Legal notice", ar: "الإشعار القانوني" },
    body: {
      fr: `## Éditeur du site
- Nom commercial : {{nom}}
- Raison sociale : {{raison_sociale}} ({{forme}}, capital {{capital}})
- Siège : {{adresse}}
- RC : {{rc}} · ICE : {{ice}} · IF : {{if}}
- Licence d'agence de voyages : {{licence}}
- Contact : {{email}} · {{telephone}}

## Directeur de la publication
[Nom et fonction à compléter]

## Hébergement
[Nom, adresse et contact de l'hébergeur à compléter]

## Propriété intellectuelle
Les textes, photographies, vidéos et éléments graphiques du site sont protégés. Les photographies sont publiées avec l'accord de leurs auteurs ou titulaires de droits, mentionnés en légende. Toute reproduction sans autorisation est interdite.

## Cartographie
Fonds de carte © contributeurs OpenStreetMap. Temps de trajet indicatifs calculés à l'aide d'un service de routage.`,
      en: `## Website publisher
- Trade name: {{nom}}
- Company: {{raison_sociale}} ({{forme}}, share capital {{capital}})
- Registered office: {{adresse}}
- Trade register: {{rc}} · ICE: {{ice}}
- Travel agency licence: {{licence}}
- Contact: {{email}} · {{telephone}}

## Hosting
[Host name and address to be completed]

## Intellectual property
Texts, photographs, videos and graphics are protected. Photographs are published with the consent of their authors or rights holders. Any reproduction without permission is prohibited.`,
      ar: `## ناشر الموقع
- الاسم التجاري: {{nom}}
- الشركة: {{raison_sociale}}
- المقر: {{adresse}}
- السجل التجاري: {{rc}} · التعريف الموحد للمقاولة: {{ice}}
- رخصة وكالة الأسفار: {{licence}}
- الاتصال: {{email}} · {{telephone}}`,
    },
  },
  {
    slug: "cgv",
    title: { fr: "Conditions générales de vente", en: "Terms and conditions of sale", ar: "الشروط العامة للبيع" },
    body: {
      fr: `## 1. Objet
Les présentes conditions régissent la vente des circuits, excursions, séjours et prestations proposés par {{nom}} ({{raison_sociale}}, licence {{licence}}).

## 2. Demande de réservation et confirmation
- La réservation en ligne constitue une demande. Elle n'est ferme qu'après confirmation écrite de l'agence, après vérification des disponibilités.
- Un numéro de dossier est attribué à chaque demande. Le client reçoit un récapitulatif par e-mail.
- Les programmes publiés sont des exemples : les horaires et l'ordre des étapes peuvent être adaptés pour des raisons de sécurité, de météo ou d'organisation.

## 3. Prix
- Les prix sont exprimés en dirhams marocains (MAD), toutes taxes applicables comprises sauf mention contraire.
- Le prix définitif est celui confirmé par l'agence. Toute conversion en euros ou en dollars est donnée à titre indicatif.
- Le détail des prestations incluses et non incluses figure sur chaque fiche circuit et dans la confirmation.

## 4. Paiement
- Un acompte de [x] % est demandé après la confirmation de l'agence ; le solde est payable [à préciser].
- Moyens de paiement acceptés : [à préciser].

## 5. Modification et annulation par le client
Voir la page « Conditions d'annulation et de remboursement » et les conditions particulières de chaque circuit.

## 6. Modification ou annulation par l'agence
[Conditions à préciser : événement imprévisible, nombre minimum de participants, alternative proposée, remboursement.]

## 7. Responsabilité et assurances
[Responsabilité de l'agence, assurance responsabilité civile professionnelle, assurance voyage recommandée au client.]

## 8. Réclamations et litiges
Toute réclamation peut être adressée à {{email}}. [Médiation et juridiction compétente à préciser.]`,
      en: `## 1. Purpose
These terms govern the sale of tours, excursions and stays offered by {{nom}}.

## 2. Booking request and confirmation
- An online booking is a request. It becomes binding only after the agency's written confirmation, once availability has been checked.
- Each request receives a file number and an e-mail summary.

## 3. Prices
- Prices are in Moroccan dirhams (MAD). Any conversion into euros or dollars is indicative only.

## 4. Payment
- A deposit of [x]% is requested after the agency's confirmation; the balance is payable [to be specified].

## 5. Cancellation
See the "Cancellation and refund policy" page and each tour's specific conditions.`,
      ar: `## الحجز والتأكيد
- الحجز عبر الإنترنت طلب، ولا يصبح نهائياً إلا بعد تأكيد كتابي من الوكالة.
## الأسعار
- الأسعار بالدرهم المغربي. أي تحويل إلى الأورو أو الدولار إرشادي فقط.
## الإلغاء
- راجع صفحة شروط الإلغاء والاسترجاع.`,
    },
  },
  {
    slug: "confidentialite",
    title: { fr: "Politique de confidentialité", en: "Privacy policy", ar: "سياسة الخصوصية" },
    body: {
      fr: `## Responsable du traitement
{{raison_sociale}} ({{nom}}), {{adresse}} — {{email}}.
[Numéro de déclaration ou d'autorisation CNDP à compléter.]

## Données collectées
- Demandes de réservation et de devis : identité, coordonnées, pays, ville de départ, composition du groupe (âges des enfants), besoins particuliers communiqués volontairement.
- Compte voyageur : identité, coordonnées, préférences, historique des dossiers, messages échangés.
- Newsletter : adresse e-mail, langue, date et texte du consentement.
- Sécurité : adresse IP et journaux techniques (limitation des abus, journal d'audit).

## Finalités et bases
- Traitement des demandes, exécution des voyages, relation client (exécution du contrat).
- Envoi de la newsletter (consentement, retirable à tout moment via le lien de désinscription).
- Sécurité du site et prévention de la fraude (intérêt légitime).

## Destinataires
Équipe de l'agence et prestataires strictement nécessaires à l'exécution du voyage (hébergements, transport, guides), hébergeur et service d'envoi d'e-mails. Aucune revente de données.

## Durées de conservation
[À préciser : par ex. dossiers clients X ans, demandes sans suite X mois, newsletter jusqu'au retrait du consentement.]

## Vos droits (loi 09-08)
Droits d'accès, de rectification et d'opposition : écrivez à {{email}}. Vous pouvez également saisir la CNDP.

## Cookies
Voir la page « Gestion des cookies ».`,
      en: `## Data controller
{{raison_sociale}} ({{nom}}), {{adresse}} — {{email}}.

## Data collected
Booking and quote requests, traveller accounts, newsletter (with proof of consent), technical security logs.

## Purposes
Processing requests and trips; newsletter (consent, withdrawable at any time); site security.

## Your rights
Access, rectification and objection: write to {{email}}.`,
      ar: `## المسؤول عن المعالجة
{{raison_sociale}} ({{nom}}) — {{email}}.
## حقوقك (القانون 09-08)
حق الولوج والتصحيح والتعرض: راسلنا على {{email}}.`,
    },
  },
  {
    slug: "cookies",
    title: { fr: "Gestion des cookies", en: "Cookie policy", ar: "سياسة ملفات تعريف الارتباط" },
    body: {
      fr: `## Ce que nous utilisons
Le site n'utilise que des cookies et un stockage local strictement nécessaires :
- langue choisie (cookie « locale », 1 an) ;
- session de l'espace voyageur (cookie sécurisé, 30 jours) ;
- favoris et préparation de séjour (stockage local du navigateur, non transmis) ;
- mémorisation de la fermeture de ce bandeau d'information.

## Ce que nous n'utilisons pas
Aucun cookie publicitaire, aucun outil de mesure d'audience, aucun pixel de réseau social.

## Contenus tiers
Les cartes sont affichées à partir des serveurs OpenStreetMap ; les liens WhatsApp ouvrent le service WhatsApp.`,
      en: `The site only uses strictly necessary cookies and local storage (language, traveller session, favourites). No advertising or analytics cookies.`,
      ar: `لا يستخدم الموقع إلا ملفات تعريف الارتباط الضرورية (اللغة، الجلسة، المفضلة). لا إعلانات ولا قياس للجمهور.`,
    },
  },
  {
    slug: "annulation",
    title: { fr: "Conditions d'annulation et de remboursement", en: "Cancellation and refund policy", ar: "شروط الإلغاء والاسترجاع" },
    body: {
      fr: `## Demande d'annulation
Le client peut demander l'annulation depuis son dossier (espace voyageur ou lien reçu par e-mail) ou par écrit à {{email}}. La demande est horodatée ; elle est traitée par l'agence.

## Barème (à adapter)
- Plus de [30] jours avant le départ : [remboursement intégral de l'acompte, hors frais de dossier éventuels].
- Entre [29] et [8] jours : [retenue de x %].
- Moins de [7] jours ou non-présentation : [retenue de x %].
Les conditions particulières figurant sur la fiche circuit ou sur le devis prévalent.

## Remboursement
Les remboursements sont effectués par le moyen de paiement initial, dans un délai de [x] jours après acceptation de l'annulation. Ils apparaissent dans le dossier du client.

## Annulation par l'agence
[Conditions : sécurité, météo, nombre minimum de participants ; proposition d'alternative ou remboursement intégral.]`,
      en: `Cancellation can be requested from the traveller file or by writing to {{email}}. The applicable scale is [to be completed]; the specific conditions of each tour or quote prevail.`,
      ar: `يمكن طلب الإلغاء من ملف المسافر أو بمراسلة {{email}}. يطبق جدول الإلغاء [يُستكمل]، وتسري الشروط الخاصة بكل جولة.`,
    },
  },
];

export const generalFaq = [
  {
    q: { fr: "Organisez-vous des voyages à l'étranger et l'Omra ?", en: "Do you organise trips abroad and Umrah?", ar: "هل تنظمون رحلات إلى الخارج والعمرة؟" },
    a: {
      fr: "Oui. Les voyages internationaux et l'Omra se préparent sur demande : indiquez vos dates, le nombre de voyageurs et vos souhaits via le formulaire « Sur mesure » ou WhatsApp, l'agence vous envoie une proposition et un devis.",
      en: "Yes. International trips and Umrah are prepared on request: send your dates, number of travellers and wishes via the tailor-made form or WhatsApp, and the agency sends you a proposal and a quote.",
      ar: "نعم. تُعدّ الرحلات الدولية والعمرة حسب الطلب عبر استمارة « حسب الطلب » أو واتساب، وسترسل لك الوكالة اقتراحاً وعرض سعر.",
    },
  },
  {
    q: { fr: "Ma réservation est-elle confirmée immédiatement ?", en: "Is my booking confirmed immediately?", ar: "هل يتم تأكيد حجزي فوراً؟" },
    a: {
      fr: "Non. Votre demande est enregistrée avec un numéro de dossier, puis l'agence vérifie les disponibilités et vous confirme par e-mail. Vous ne payez rien avant cette confirmation.",
      en: "No. Your request is recorded with a file number, then the agency checks availability and confirms by e-mail. You pay nothing before that.",
      ar: "لا. يُسجَّل طلبك برقم ملف، ثم تتحقق الوكالة من التوفر وتؤكد لك عبر البريد الإلكتروني. لا تدفع شيئاً قبل ذلك.",
    },
  },
  {
    q: { fr: "Dans quelle devise sont les prix ?", en: "In which currency are prices shown?", ar: "بأي عملة تُعرض الأسعار؟" },
    a: {
      fr: "En dirhams marocains (MAD). Une conversion en euros ou dollars peut être affichée à titre indicatif ; le paiement se fait en MAD.",
      en: "In Moroccan dirhams (MAD). A conversion into euros or dollars may be shown for information; payment is made in MAD.",
      ar: "بالدرهم المغربي. قد يُعرض تحويل إرشادي إلى الأورو أو الدولار، ويتم الدفع بالدرهم.",
    },
  },
  {
    q: { fr: "Puis-je personnaliser un circuit ?", en: "Can I customise a tour?", ar: "هل يمكنني تخصيص جولة؟" },
    a: {
      fr: "Oui : options à la réservation (hébergement, activités, transport privé, guide) ou demande de voyage sur mesure avec devis personnalisé.",
      en: "Yes: options when booking (accommodation, activities, private transport, guide) or a tailor-made request with a personalised quote.",
      ar: "نعم: خيارات عند الحجز أو طلب رحلة حسب الطلب مع عرض سعر مخصص.",
    },
  },
  {
    q: { fr: "Comment suivre mon dossier ?", en: "How do I follow my booking?", ar: "كيف أتابع ملفي؟" },
    a: {
      fr: "Depuis votre espace voyageur, ou sans compte avec votre numéro de dossier et votre e-mail. Vous y trouvez le statut, les documents, les paiements et la messagerie avec l'agence.",
      en: "From your traveller area, or without an account using your file number and e-mail: status, documents, payments and messages.",
      ar: "من فضاء المسافر، أو دون حساب برقم الملف وبريدك الإلكتروني.",
    },
  },
  {
    q: { fr: "Comment annuler ?", en: "How do I cancel?", ar: "كيف ألغي حجزي؟" },
    a: {
      fr: "Envoyez une demande d'annulation depuis votre dossier. L'agence la traite selon les conditions d'annulation du circuit.",
      en: "Send a cancellation request from your file. The agency handles it according to the tour's cancellation policy.",
      ar: "أرسل طلب إلغاء من ملفك، وتعالجه الوكالة وفق شروط الإلغاء.",
    },
  },
];
