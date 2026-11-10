/**
 * Contenus éditoriaux (informations générales vérifiables, à relire avant publication).
 */
const l = (fr: string, en: string, ar?: string) => ({ fr, en, ...(ar ? { ar } : {}) });

export const merzougaSections = {
  erg: l(
    "L'Erg Chebbi s'étend sur environ 22 km du nord au sud et 5 à 10 km d'est en ouest. Ses dunes, parmi les plus hautes du Maroc, se teintent d'ocre, d'or et de rose selon l'heure. Aux abords du massif, on trouve des villages, des palmeraies et le lac saisonnier de Dayet Srji, qui attire des oiseaux migrateurs lorsqu'il est en eau.",
    "Erg Chebbi stretches about 22 km north to south and 5 to 10 km east to west. Its dunes, among the highest in Morocco, turn ochre, gold and pink depending on the time of day. Around it lie villages, palm groves and the seasonal lake of Dayet Srji, which attracts migratory birds when it holds water.",
    "يمتد عرق الشبي على نحو 22 كلم من الشمال إلى الجنوب وما بين 5 و10 كلم من الشرق إلى الغرب، وتُعد كثبانه من أعلى كثبان المغرب.",
  ),
  accommodation: l(
    "Trois façons de dormir au désert : l'auberge ou la maison d'hôtes en lisière des dunes, le bivouac traditionnel avec tentes nomades et sanitaires partagés ou privatifs selon le camp, et le campement de luxe avec tentes spacieuses et salle de bain. Les campements partenaires seront présentés ici après validation par l'agence.",
    "Three ways to sleep in the desert: an inn or guesthouse at the edge of the dunes, a traditional camp with nomad tents and shared or private bathrooms depending on the camp, and a luxury camp with spacious tents and en-suite bathrooms. Partner camps will be presented here once validated by the agency.",
    "ثلاث طرق للمبيت في الصحراء: دار ضيافة على أطراف الكثبان، أو مخيم تقليدي، أو مخيم فاخر.",
  ),
  excursions: l(
    "Depuis Merzouga, plusieurs excursions à la journée ou à la demi-journée permettent de découvrir le Tafilalet : Rissani et son marché, les palmeraies d'Erfoud, le village de Khamlia ou le tour complet de l'erg en 4x4.",
    "From Merzouga, several full or half-day excursions reveal the Tafilalet: Rissani and its market, the Erfoud palm groves, Khamlia village or a full 4x4 loop around the erg.",
    "من مرزوكة يمكن القيام برحلات لاكتشاف تافيلالت: الريصاني وسوقها، وأرفود، وخملية، أو جولة كاملة حول العرق.",
  ),
};

export const merzougaTips = {
  fr: [
    "Meilleure période : d'octobre à avril. En été, les températures dépassent fréquemment 40 °C en journée.",
    "Les nuits sont fraîches, voire froides, de novembre à mars : prévoyez une polaire et une veste chaude.",
    "Emportez lunettes de soleil, crème solaire, chapeau ou chèche, et une lampe frontale.",
    "Chaussures fermées légères pour marcher dans le sable ; sandales pour le camp.",
    "Prévoyez des espèces en dirhams : les distributeurs sont rares à Merzouga même (Rissani et Erfoud en disposent).",
    "Accès : aéroport d'Errachidia à environ 130 km, ou route depuis Fès ou Marrakech (longs trajets à anticiper).",
    "Respectez les habitants : demandez toujours l'accord avant de photographier quelqu'un.",
    "Les drones sont soumis à autorisation au Maroc : ne les emportez pas sans démarche préalable.",
  ],
  en: [
    "Best time: October to April. In summer, daytime temperatures often exceed 40 °C.",
    "Nights are cool or cold from November to March: bring a fleece and a warm jacket.",
    "Pack sunglasses, sunscreen, a hat or shesh, and a headlamp.",
    "Light closed shoes for walking in sand; sandals for the camp.",
    "Carry cash in dirhams: ATMs are scarce in Merzouga itself (Rissani and Erfoud have some).",
    "Access: Errachidia airport about 130 km away, or by road from Fez or Marrakesh (long drives).",
    "Respect local people: always ask before photographing someone.",
    "Drones require authorisation in Morocco: do not bring one without prior approval.",
  ],
  ar: [
    "أفضل فترة: من أكتوبر إلى أبريل. في الصيف تتجاوز الحرارة غالباً 40 درجة.",
    "الليالي باردة من نوفمبر إلى مارس: أحضر ملابس دافئة.",
    "أحضر نظارات شمسية وواقياً من الشمس وقبعة ومصباحاً أمامياً.",
    "احمل نقوداً بالدرهم: أجهزة الصرف الآلي نادرة في مرزوكة.",
    "اطلب الإذن دائماً قبل تصوير أي شخص.",
  ],
};

export const merzougaFaq = [
  {
    q: l("Quelle est la meilleure saison pour aller à Merzouga ?", "When is the best time to visit Merzouga?", "ما هو أفضل موسم لزيارة مرزوكة؟"),
    a: l(
      "D'octobre à avril, lorsque les journées sont agréables. Le printemps peut connaître des vents de sable. L'été est très chaud et réservé aux voyageurs habitués à la chaleur.",
      "October to April, when days are pleasant. Spring can bring sand winds. Summer is very hot and suits travellers used to heat.",
      "من أكتوبر إلى أبريل حين تكون الأيام معتدلة.",
    ),
  },
  {
    q: l("Ma réservation est-elle confirmée dès l'envoi du formulaire ?", "Is my booking confirmed once I submit the form?", "هل يتم تأكيد حجزي فور إرسال الاستمارة؟"),
    a: l(
      "Non. Vous recevez un numéro de dossier avec le statut « En attente de confirmation ». Notre équipe vérifie la disponibilité auprès du prestataire puis vous confirme par e-mail. Aucun paiement n'est demandé avant cette confirmation.",
      "No. You receive a booking reference with the status \"Awaiting confirmation\". Our team checks availability with the provider and then confirms by email. No payment is requested before that.",
      "لا. تتلقى رقم ملف بحالة «في انتظار التأكيد»، ثم يؤكد فريقنا الحجز عبر البريد الإلكتروني.",
    ),
  },
  {
    q: l("Les enfants peuvent-ils participer ?", "Can children take part?", "هل يمكن للأطفال المشاركة؟"),
    a: l(
      "Oui, la plupart des circuits conviennent aux familles. Certaines activités ont un âge minimum (quad, buggy) indiqué sur chaque fiche.",
      "Yes, most tours suit families. Some activities have a minimum age (quad, buggy) shown on each page.",
      "نعم، معظم الجولات مناسبة للعائلات، وبعض الأنشطة لها حد أدنى للسن.",
    ),
  },
  {
    q: l("Y a-t-il de l'électricité et du réseau au bivouac ?", "Is there electricity and mobile signal at the camp?", "هل توجد كهرباء وتغطية بالمخيم؟"),
    a: l(
      "Cela dépend du campement : beaucoup disposent d'électricité solaire, et le réseau mobile est souvent disponible mais irrégulier. Les détails sont précisés lors de la confirmation.",
      "It depends on the camp: many have solar power, and mobile signal is often available but patchy. Details are given on confirmation.",
      "يعتمد ذلك على المخيم، وكثير منها يعمل بالطاقة الشمسية.",
    ),
  },
  {
    q: l("Comment rejoindre Merzouga ?", "How do I get to Merzouga?", "كيف أصل إلى مرزوكة؟"),
    a: l(
      "En avion jusqu'à Errachidia puis par la route (environ 130 km), en voiture ou en bus depuis Fès, Marrakech ou Ouarzazate, ou dans le cadre de notre circuit Grand Sud au départ de Marrakech. Un transfert peut être ajouté à votre réservation.",
      "Fly to Errachidia then drive (about 130 km), by car or bus from Fez, Marrakesh or Ouarzazate, or as part of our Great South tour from Marrakesh. A transfer can be added to your booking.",
      "بالطائرة إلى الرشيدية ثم براً (حوالي 130 كلم)، أو بالسيارة أو الحافلة من فاس أو مراكش.",
    ),
  },
];

export const posts = [
  {
    slug: "meilleure-saison-desert-maroc",
    category: "SAISONS",
    title: l("Quand partir dans le désert marocain ?", "When to visit the Moroccan desert?", "متى تزور الصحراء المغربية؟"),
    excerpt: l(
      "Températures, vents, fêtes locales : nos repères pour choisir la bonne période.",
      "Temperatures, winds, local festivals: our guide to choosing the right time.",
      "درجات الحرارة والرياح والمواسم: دليلنا لاختيار الوقت المناسب.",
    ),
    body: l(
      `## Automne (octobre – novembre)
Les journées sont chaudes sans excès et les nuits agréables. C'est l'une des meilleures périodes pour les bivouacs et les activités sportives.

## Hiver (décembre – février)
Ciel souvent limpide et lumière superbe, mais nuits froides, parfois proches de 0 °C. Les campements fournissent des couvertures épaisses ; prévoyez une couche chaude.

## Printemps (mars – mai)
Températures idéales, palmeraies en fleurs. Des épisodes de vent de sable peuvent survenir : gardez un chèche à portée de main.

## Été (juin – septembre)
Chaleur extrême l'après-midi, souvent au-delà de 40 °C. Les activités se font tôt le matin et en soirée. À réserver aux voyageurs habitués à la chaleur.`,
      `## Autumn (October – November)
Warm but not excessive days and pleasant nights. One of the best times for camps and active outings.

## Winter (December – February)
Often crystal-clear skies and superb light, but cold nights, sometimes close to 0 °C. Camps provide thick blankets; bring a warm layer.

## Spring (March – May)
Ideal temperatures and palm groves in bloom. Sand-wind episodes can occur: keep a shesh handy.

## Summer (June – September)
Extreme afternoon heat, often above 40 °C. Activities take place early morning and evening. Best for travellers used to heat.`,
    ),
  },
  {
    slug: "que-mettre-dans-sa-valise-desert",
    category: "PREPARATION",
    title: l("Que mettre dans sa valise pour le désert ?", "What to pack for the desert", "ماذا تحمل في حقيبتك للصحراء؟"),
    excerpt: l("La liste essentielle pour être à l'aise du coucher du soleil au petit matin.", "The essential list to be comfortable from sunset to early morning.", "القائمة الأساسية لراحتك من الغروب حتى الصباح."),
    body: l(
      `## Vêtements
- Vêtements légers et couvrants pour la journée (coton, lin)
- Une polaire et une veste chaude pour la nuit, surtout de novembre à mars
- Un chèche ou foulard contre le soleil et le sable

## Accessoires
- Lunettes de soleil, crème solaire, baume à lèvres
- Lampe frontale
- Gourde réutilisable
- Petit sac à dos pour la nuit au bivouac (les grosses valises restent souvent à l'auberge)

## Pratique
- Espèces en dirhams
- Batterie externe
- Lingettes et gel hydroalcoolique`,
      `## Clothing
- Light, covering clothes for the day (cotton, linen)
- A fleece and warm jacket for the night, especially November to March
- A shesh or scarf against sun and sand

## Accessories
- Sunglasses, sunscreen, lip balm
- Headlamp
- Reusable water bottle
- Small backpack for the camp night (large suitcases often stay at the inn)

## Practical
- Cash in dirhams
- Power bank
- Wipes and hand sanitiser`,
    ),
  },
  {
    slug: "voyager-responsable-sahara",
    category: "CULTURE",
    title: l("Voyager de façon responsable au Sahara", "Travelling responsibly in the Sahara", "السفر المسؤول في الصحراء"),
    excerpt: l("Respect des habitants, de l'eau et du désert : quelques gestes simples.", "Respecting people, water and the desert: a few simple habits.", "احترام السكان والماء والصحراء: عادات بسيطة."),
    body: l(
      `## Respecter les habitants
Demandez toujours avant de photographier quelqu'un, adoptez une tenue couvrante dans les villages et privilégiez les achats directement auprès des artisans.

## Économiser l'eau
Dans les oasis et les campements, l'eau est une ressource rare. Douches courtes et réutilisation des serviettes font la différence.

## Ne rien laisser derrière soi
Rapportez vos déchets, en particulier les plastiques, jusqu'à un lieu de collecte.

## Préserver les dunes
Les engins motorisés doivent rester sur les tracés définis par les guides afin de limiter l'impact sur l'erg et la tranquillité des campements.`,
      `## Respect local people
Always ask before photographing someone, dress modestly in villages and buy directly from artisans where possible.

## Save water
In oases and camps, water is scarce. Short showers and reusing towels make a difference.

## Leave no trace
Take your waste, especially plastics, back to a collection point.

## Protect the dunes
Motorised vehicles should stay on the routes set by guides to limit their impact on the erg and the peace of the camps.`,
    ),
  },
];
