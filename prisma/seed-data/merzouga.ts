/**
 * Jeu de données de démonstration — Merzouga
 *
 * Trois catégories d'information sont volontairement séparées :
 *  1. Informations touristiques vérifiables (géographie, coordonnées GPS, lieux) — à relire avant mise en ligne.
 *  2. Programmes proposés À TITRE D'EXEMPLE (circuits, horaires) — à ajuster avec le prestataire.
 *  3. Tarifs et disponibilités FICTIFS de démonstration — priceStatus = "DEMO", Departure.isDemo = true.
 *     Ils sont affichés comme tels sur le site et doivent être remplacés/validés dans l'administration.
 *
 * Aucun avis client, partenariat ou hébergement contracté n'est inventé ici.
 */

type L = { fr: string; en: string; ar?: string };
type LL = { fr: string[]; en: string[]; ar?: string[] };
const l = (fr: string, en: string, ar?: string): L => ({ fr, en, ...(ar ? { ar } : {}) });
const ll = (fr: string[], en: string[], ar?: string[]): LL => ({ fr, en, ...(ar ? { ar } : {}) });

// ---------------------------------------------------------------------------
// 1. Destination (informations vérifiables)
// ---------------------------------------------------------------------------
export const merzouga = {
  slug: "merzouga",
  region: "Drâa-Tafilalet",
  latitude: 31.099,
  longitude: -4.012,
  published: true,
  sortOrder: 1,
  name: l("Merzouga", "Merzouga", "مرزوكة"),
  tagline: l(
    "Merzouga : une aventure inoubliable au cœur du Sahara",
    "Merzouga: an unforgettable adventure in the heart of the Sahara",
    "مرزوكة: مغامرة لا تُنسى في قلب الصحراء",
  ),
  description: l(
    "Aux portes du Sahara, dans le sud-est du Maroc, le village de Merzouga s'adosse à l'Erg Chebbi, un massif de dunes dont les plus hautes dépassent 150 mètres. Ici, le sable change de couleur au fil des heures, du rose de l'aube à l'or du couchant, et les nuits révèlent un ciel d'une rare pureté.",
    "On the edge of the Sahara in south-eastern Morocco, the village of Merzouga sits beside Erg Chebbi, a dune field whose highest crests rise above 150 metres. The sand shifts colour through the day, from dawn pink to sunset gold, and the nights reveal an exceptionally clear sky.",
    "على أبواب الصحراء الكبرى في جنوب شرق المغرب، تقع قرية مرزوكة بجوار عرق الشبي، وهو بحر من الكثبان يتجاوز ارتفاع أعلاها 150 متراً. تتغير ألوان الرمال طوال اليوم من وردي الفجر إلى ذهبي الغروب، وتكشف الليالي عن سماء صافية نادراً ما تُرى.",
  ),
};

export const futureDestinations: { slug: string; name: L; region: string; lat: number; lng: number }[] = [
  { slug: "marrakech", name: l("Marrakech", "Marrakesh", "مراكش"), region: "Marrakech-Safi", lat: 31.6295, lng: -7.9811 },
  { slug: "chefchaouen", name: l("Chefchaouen", "Chefchaouen", "شفشاون"), region: "Tanger-Tétouan-Al Hoceïma", lat: 35.1688, lng: -5.2636 },
  { slug: "ifrane-azrou", name: l("Ifrane et Azrou", "Ifrane & Azrou", "إفران وأزرو"), region: "Fès-Meknès", lat: 33.5228, lng: -5.1106 },
  { slug: "akchour", name: l("Akchour", "Akchour", "أقشور"), region: "Tanger-Tétouan-Al Hoceïma", lat: 35.2386, lng: -5.1747 },
  { slug: "ouarzazate", name: l("Ouarzazate", "Ouarzazate", "ورزازات"), region: "Drâa-Tafilalet", lat: 30.9189, lng: -6.8934 },
  { slug: "zagora", name: l("Zagora", "Zagora", "زاكورة"), region: "Drâa-Tafilalet", lat: 30.3324, lng: -5.8384 },
  { slug: "dakhla", name: l("Dakhla", "Dakhla", "الداخلة"), region: "Dakhla-Oued Ed-Dahab", lat: 23.6848, lng: -15.958 },
  { slug: "essaouira", name: l("Essaouira", "Essaouira", "الصويرة"), region: "Marrakech-Safi", lat: 31.5085, lng: -9.7595 },
  { slug: "agadir", name: l("Agadir", "Agadir", "أكادير"), region: "Souss-Massa", lat: 30.4278, lng: -9.5981 },
  { slug: "tanger-tetouan", name: l("Tanger et Tétouan", "Tangier & Tetouan", "طنجة وتطوان"), region: "Tanger-Tétouan-Al Hoceïma", lat: 35.7595, lng: -5.834 },
  { slug: "fes", name: l("Fès", "Fez", "فاس"), region: "Fès-Meknès", lat: 34.0181, lng: -5.0078 },
  { slug: "ouzoud", name: l("Cascades d'Ouzoud", "Ouzoud Falls", "شلالات أوزود"), region: "Béni Mellal-Khénifra", lat: 32.0153, lng: -6.7189 },
  { slug: "vallee-dades", name: l("Vallée du Dadès", "Dadès Valley", "وادي دادس"), region: "Drâa-Tafilalet", lat: 31.4537, lng: -5.9667 },
  { slug: "atlas", name: l("Montagnes de l'Atlas", "Atlas Mountains", "جبال الأطلس"), region: "Marrakech-Safi", lat: 31.0599, lng: -7.9156 },
];

// ---------------------------------------------------------------------------
// 2. Activités (descriptions + tarifs DEMO)
// ---------------------------------------------------------------------------
export type ActivitySeed = {
  slug: string;
  category: "AVENTURE" | "CULTURE" | "EXCEPTION";
  icon: string;
  title: L;
  summary: L;
  description: L;
  duration: L;
  difficulty: "FACILE" | "MODERE" | "SPORTIF";
  minAge: number | null;
  restrictions: L;
  included: LL;
  excluded: LL;
  safety: L;
  availability: L;
  priceMad: number | null;
  priceUnit?: "PER_PERSON" | "PER_GROUP";
  bookingOptionCode?: string;
};

const everyDay = l("Tous les jours, selon la météo", "Daily, weather permitting", "يومياً حسب الأحوال الجوية");
const onRequest = l("Sur demande, à confirmer par l'agence", "On request, to be confirmed by the agency", "عند الطلب، رهن تأكيد الوكالة");

export const activities: ActivitySeed[] = [
  // ---------------- AVENTURE ----------------
  {
    slug: "dromadaire-coucher-soleil",
    category: "AVENTURE",
    icon: "camel",
    title: l("Balade à dos de dromadaire au coucher du soleil", "Sunset camel ride", "جولة على ظهر الجمل عند الغروب"),
    summary: l(
      "Le rituel incontournable : cheminer en caravane vers les crêtes de l'Erg Chebbi pendant que le sable s'embrase.",
      "The essential ritual: ride in a caravan towards the crests of Erg Chebbi as the sand catches fire.",
      "الطقس الذي لا غنى عنه: السير في قافلة نحو قمم عرق الشبي بينما تتوهج الرمال.",
    ),
    description: l(
      "Accompagné d'un chamelier, vous quittez la lisière du village pour vous enfoncer lentement dans les dunes. Arrêt sur une crête pour contempler le soleil disparaître derrière l'horizon, puis retour à la lumière bleutée du crépuscule.",
      "Guided by a cameleer, you leave the edge of the village and slowly head into the dunes. Stop on a crest to watch the sun sink below the horizon, then return in the blue light of dusk.",
    ),
    duration: l("Environ 2 heures", "About 2 hours", "حوالي ساعتين"),
    difficulty: "FACILE",
    minAge: 4,
    restrictions: l(
      "Déconseillé aux femmes enceintes et aux personnes souffrant de problèmes de dos. Poids maximal à confirmer avec le prestataire.",
      "Not recommended for pregnant women or people with back problems. Maximum weight to be confirmed with the provider.",
    ),
    included: ll(["Chamelier accompagnateur", "Dromadaire par personne", "Chèche (foulard) prêté"], ["Cameleer guide", "One camel per person", "Loaned shesh (headscarf)"]),
    excluded: ll(["Pourboires", "Transfert depuis un autre hôtel que ceux de Merzouga"], ["Tips", "Transfer from hotels outside Merzouga"]),
    safety: l(
      "Tenez-vous à la poignée lors de la montée et de la descente du dromadaire. Chaussures fermées et protection solaire recommandées.",
      "Hold the handle firmly when the camel stands up and kneels. Closed shoes and sun protection recommended.",
    ),
    availability: everyDay,
    priceMad: 250,
    bookingOptionCode: "camel",
  },
  {
    slug: "quad-desert",
    category: "AVENTURE",
    icon: "quad",
    title: l("Excursion en quad dans le désert", "Desert quad bike tour", "جولة بالدراجة الرباعية في الصحراء"),
    summary: l("Sensations garanties sur les pistes et les dunes encadrées par un guide.", "Thrills on desert tracks and dunes with a guide.", "إثارة مضمونة على المسالك والكثبان برفقة مرشد."),
    description: l(
      "Après un briefing de prise en main, partez en file indienne derrière votre guide sur les pistes qui longent l'erg, avec quelques passages dans les petites dunes adaptés à votre niveau.",
      "After a handling briefing, follow your guide in single file along the tracks bordering the erg, with some passages through smaller dunes adapted to your level.",
    ),
    duration: l("1 heure (2 heures en option)", "1 hour (2 hours optional)", "ساعة واحدة (ساعتان اختيارياً)"),
    difficulty: "MODERE",
    minAge: 16,
    restrictions: l("Pilote : 16 ans minimum. Passager enfant selon l'accord du prestataire.", "Rider: minimum age 16. Child passengers subject to provider approval."),
    included: ll(["Quad et carburant", "Casque", "Guide sur sa propre machine"], ["Quad and fuel", "Helmet", "Guide on own vehicle"]),
    excluded: ll(["Lunettes de protection personnelles", "Assurance individuelle accident"], ["Personal goggles", "Personal accident insurance"]),
    safety: l(
      "Casque obligatoire, vitesse adaptée, respect strict des consignes du guide. Interdit après consommation d'alcool.",
      "Helmet mandatory, adapted speed, strictly follow the guide's instructions. Forbidden after drinking alcohol.",
    ),
    availability: everyDay,
    priceMad: 500,
    bookingOptionCode: "quad",
  },
  {
    slug: "buggy-desert",
    category: "AVENTURE",
    icon: "buggy",
    title: l("Circuit en buggy", "Dune buggy circuit", "جولة بسيارة الباجي"),
    summary: l("Un buggy biplace pour explorer l'erg à deux, volant en main.", "A two-seater buggy to explore the erg together.", "سيارة باجي بمقعدين لاستكشاف العرق معاً."),
    description: l(
      "Plus stable que le quad, le buggy permet de partager l'expérience à deux. Le guide ouvre la route et choisit un parcours adapté à votre aisance.",
      "More stable than a quad, the buggy lets two people share the experience. The guide leads and picks a route suited to your confidence.",
    ),
    duration: l("1 heure", "1 hour", "ساعة واحدة"),
    difficulty: "MODERE",
    minAge: 18,
    restrictions: l("Conducteur : permis de conduire exigé. Passager : 8 ans minimum (à confirmer).", "Driver: driving licence required. Passenger: minimum age 8 (to be confirmed)."),
    included: ll(["Buggy biplace et carburant", "Casques", "Guide"], ["Two-seater buggy and fuel", "Helmets", "Guide"]),
    excluded: ll(["Franchise en cas de dommages (à confirmer)"], ["Damage excess (to be confirmed)"]),
    safety: l("Ceinture et casque obligatoires. Pas de conduite hors du tracé choisi par le guide.", "Seatbelt and helmet mandatory. No driving off the guide's route."),
    availability: everyDay,
    priceMad: 1200,
    priceUnit: "PER_GROUP",
    bookingOptionCode: "buggy",
  },
  {
    slug: "4x4-chauffeur",
    category: "AVENTURE",
    icon: "jeep",
    title: l("Exploration en 4x4 avec chauffeur", "4x4 exploration with driver", "استكشاف بسيارة رباعية الدفع مع سائق"),
    summary: l("Le tour de l'Erg Chebbi : villages, mines, lac saisonnier et nomades.", "Around Erg Chebbi: villages, old mines, seasonal lake and nomad areas.", "جولة حول عرق الشبي: قرى ومناجم قديمة وبحيرة موسمية."),
    description: l(
      "Une demi-journée en 4x4 avec un chauffeur expérimenté pour faire le tour du massif : Khamlia, anciennes mines, lac Dayet Srji lorsqu'il est en eau, et rencontre avec des familles nomades lorsqu'elles l'acceptent.",
      "A half-day by 4x4 with an experienced driver around the dune field: Khamlia, old mines, Dayet Srji lake when it holds water, and meeting nomad families when they agree.",
    ),
    duration: l("Demi-journée (4 heures environ)", "Half day (about 4 hours)", "نصف يوم (حوالي 4 ساعات)"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Sièges enfants à demander à la réservation.", "Child seats to be requested when booking."),
    included: ll(["Véhicule 4x4 avec chauffeur", "Carburant", "Eau minérale"], ["4x4 vehicle with driver", "Fuel", "Bottled water"]),
    excluded: ll(["Déjeuner", "Entrées éventuelles"], ["Lunch", "Any entrance fees"]),
    safety: l("Ceintures obligatoires. Les itinéraires sont adaptés aux conditions de piste du jour.", "Seatbelts mandatory. Routes adapted to the day's track conditions."),
    availability: everyDay,
    priceMad: 900,
    priceUnit: "PER_GROUP",
    bookingOptionCode: "4x4",
  },
  {
    slug: "sandboard",
    category: "AVENTURE",
    icon: "board",
    title: l("Sandboarding dans les dunes", "Sandboarding on the dunes", "التزلج على الرمال"),
    summary: l("Glisser sur le sable fin des grandes dunes, en planche ou en luge.", "Slide down the fine sand of the big dunes on a board or sledge.", "انزلق على الرمال الناعمة للكثبان الكبيرة."),
    description: l(
      "Une activité ludique pour petits et grands : montée à pied sur une dune choisie pour sa pente régulière, puis descente en planche debout ou assise.",
      "A fun activity for all ages: walk up a dune chosen for its even slope, then slide down standing or sitting.",
    ),
    duration: l("1 h 30", "1.5 hours", "ساعة ونصف"),
    difficulty: "MODERE",
    minAge: 6,
    restrictions: l("La remontée des dunes à pied demande un effort physique.", "Walking back up the dunes requires physical effort."),
    included: ll(["Planche ou luge", "Encadrement"], ["Board or sledge", "Supervision"]),
    excluded: ll(["Transfert vers les dunes si hors circuit"], ["Transfer to the dunes if outside a tour"]),
    safety: l("Éviter les heures chaudes en été. Pas de descente sur les pentes signalées par l'encadrant.", "Avoid the hottest hours in summer. No descents on slopes flagged by the supervisor."),
    availability: everyDay,
    priceMad: 150,
    bookingOptionCode: "sandboard",
  },
  {
    slug: "randonnee-guidee",
    category: "AVENTURE",
    icon: "hike",
    title: l("Randonnée guidée dans l'erg", "Guided hike in the erg", "رحلة مشي مع مرشد في العرق"),
    summary: l("Marcher en silence au cœur des dunes, à l'aube ou en fin de journée.", "Walk in silence through the dunes at dawn or late afternoon.", "المشي في صمت بين الكثبان عند الفجر أو آخر النهار."),
    description: l(
      "Avec un guide local, découvrez la faune discrète du désert, les traces laissées dans le sable et les techniques d'orientation traditionnelles.",
      "With a local guide, discover the desert's discreet wildlife, tracks in the sand and traditional navigation skills.",
    ),
    duration: l("3 heures", "3 hours", "3 ساعات"),
    difficulty: "SPORTIF",
    minAge: 10,
    restrictions: l("Bonne condition physique nécessaire : la marche dans le sable est exigeante.", "Good fitness required: walking in sand is demanding."),
    included: ll(["Guide local", "Eau"], ["Local guide", "Water"]),
    excluded: ll(["Collation"], ["Snack"]),
    safety: l("Départ tôt le matin ou en fin d'après-midi uniquement en période chaude. 1,5 litre d'eau par personne minimum.", "Early morning or late afternoon only in hot periods. Minimum 1.5 L of water per person."),
    availability: everyDay,
    priceMad: 300,
    bookingOptionCode: "hike",
  },
  // ---------------- CULTURE ----------------
  {
    slug: "khamlia-gnawa",
    category: "CULTURE",
    icon: "drum",
    title: l("Village de Khamlia et musique gnawa", "Khamlia village & Gnawa music", "قرية خملية وموسيقى كناوة"),
    summary: l("Rencontre avec les musiciens gnawa d'un village connu pour cette tradition.", "Meet the Gnawa musicians of a village known for this tradition.", "لقاء مع موسيقيي كناوة في قرية معروفة بهذا التراث."),
    description: l(
      "À quelques kilomètres au sud de Merzouga, Khamlia est réputé pour ses groupes de musique gnawa. Autour d'un thé, découvrez les rythmes des qraqeb (castagnettes métalliques) et du guembri, et l'histoire de cette tradition.",
      "A few kilometres south of Merzouga, Khamlia is known for its Gnawa music groups. Over tea, discover the rhythms of the qraqeb (metal castanets) and the guembri, and the story behind this tradition.",
    ),
    duration: l("1 h 30 environ", "About 1.5 hours", "حوالي ساعة ونصف"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Aucune.", "None."),
    included: ll(["Transfert aller-retour depuis Merzouga", "Concert et thé"], ["Return transfer from Merzouga", "Performance and tea"]),
    excluded: ll(["Contribution libre aux musiciens", "Achats d'instruments"], ["Voluntary contribution to musicians", "Instrument purchases"]),
    safety: l("Demandez l'accord avant de photographier les personnes.", "Ask before photographing people."),
    availability: everyDay,
    priceMad: 150,
    bookingOptionCode: "gnawa",
  },
  {
    slug: "rissani-souk",
    category: "CULTURE",
    icon: "market",
    title: l("Rissani et son marché", "Rissani and its market", "الريصاني وسوقها"),
    summary: l("Cité historique du Tafilalet, ksour et souk traditionnel.", "Historic town of Tafilalet, ksour and traditional souk.", "مدينة تافيلالت التاريخية وقصورها وسوقها التقليدي."),
    description: l(
      "Berceau historique de la dynastie alaouite et héritière de l'ancienne Sijilmassa, Rissani accueille un grand souk, particulièrement animé les jours de marché. Visite du souk aux épices, aux dattes et au bétail, puis d'un ksar.",
      "Historic cradle of the Alaouite dynasty and heir to ancient Sijilmasa, Rissani hosts a large souk, especially lively on market days. Visit the spice, date and livestock areas, then a ksar.",
    ),
    duration: l("Demi-journée", "Half day", "نصف يوم"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Les jours de grand marché sont à vérifier localement.", "Main market days to be checked locally."),
    included: ll(["Transport aller-retour", "Guide local"], ["Return transport", "Local guide"]),
    excluded: ll(["Déjeuner", "Achats"], ["Lunch", "Purchases"]),
    safety: l("Gardez vos effets personnels près de vous dans la foule.", "Keep your belongings close in crowds."),
    availability: everyDay,
    priceMad: 400,
    priceUnit: "PER_GROUP",
    bookingOptionCode: "rissani",
  },
  {
    slug: "rencontre-locale",
    category: "CULTURE",
    icon: "tea",
    title: l("Rencontre avec des habitants et guides locaux", "Meeting local people and guides", "لقاء مع السكان والمرشدين المحليين"),
    summary: l("Un moment d'échange respectueux autour du thé, sans mise en scène.", "A respectful exchange over tea, with no staging.", "لحظة تبادل محترمة حول الشاي، دون تصنّع."),
    description: l(
      "Organisée uniquement avec des familles et guides volontaires, cette rencontre permet d'échanger sur la vie dans le désert. Nous refusons toute mise en scène et respectons l'intimité des communautés.",
      "Arranged only with willing families and guides, this meeting is a chance to talk about life in the desert. We refuse any staging and respect the communities' privacy.",
    ),
    duration: l("1 heure", "1 hour", "ساعة واحدة"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Sous réserve de l'accord des familles.", "Subject to the families' agreement."),
    included: ll(["Accompagnement par un guide local", "Thé"], ["Local guide", "Tea"]),
    excluded: ll(["Transport si hors circuit"], ["Transport if outside a tour"]),
    safety: l("Tenue correcte appréciée ; photos uniquement avec accord.", "Modest dress appreciated; photos only with consent."),
    availability: onRequest,
    priceMad: null,
  },
  {
    slug: "oasis",
    category: "CULTURE",
    icon: "palm",
    title: l("Découverte des oasis", "Discovering the oases", "اكتشاف الواحات"),
    summary: l("Palmeraies, jardins irrigués et système ancestral des khettaras.", "Palm groves, irrigated gardens and ancestral khettara systems.", "بساتين النخيل والحدائق المروية ونظام الخطارات العريق."),
    description: l(
      "Promenade dans les jardins de la palmeraie, où l'on cultive dattiers, légumes et luzerne grâce aux canaux d'irrigation. Explication du fonctionnement des khettaras, galeries souterraines qui acheminent l'eau.",
      "Walk through the palm grove gardens, where date palms, vegetables and alfalfa grow thanks to irrigation channels. Learn how the khettaras, underground water galleries, work.",
    ),
    duration: l("2 heures", "2 hours", "ساعتان"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Aucune.", "None."),
    included: ll(["Guide", "Transport depuis Merzouga"], ["Guide", "Transport from Merzouga"]),
    excluded: ll(["Repas"], ["Meals"]),
    safety: l("Chapeau et eau conseillés.", "Hat and water recommended."),
    availability: everyDay,
    priceMad: 200,
  },
  {
    slug: "degustation",
    category: "CULTURE",
    icon: "food",
    title: l("Dégustation de spécialités locales", "Local specialities tasting", "تذوق الأطباق المحلية"),
    summary: l("Medfouna (« pizza berbère »), dattes du Tafilalet et thé à la menthe.", "Medfouna (\"Berber pizza\"), Tafilalet dates and mint tea.", "المدفونة والتمور التافيلالتية والشاي بالنعناع."),
    description: l(
      "Découvrez la medfouna, pain farci cuit dans le sable chaud ou au four traditionnel, les dattes de la région et le cérémonial du thé.",
      "Taste medfouna, a stuffed bread baked in hot sand or a traditional oven, the region's dates and the tea ceremony.",
    ),
    duration: l("1 heure", "1 hour", "ساعة واحدة"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Signalez vos allergies et régimes alimentaires.", "Let us know about allergies and dietary needs."),
    included: ll(["Dégustation", "Thé"], ["Tasting", "Tea"]),
    excluded: ll(["Boissons supplémentaires"], ["Extra drinks"]),
    safety: l("Préparation conforme aux règles d'hygiène du prestataire.", "Prepared according to the provider's hygiene rules."),
    availability: everyDay,
    priceMad: 120,
  },
  // ---------------- EXPÉRIENCES EXCEPTIONNELLES ----------------
  {
    slug: "bivouac-traditionnel",
    category: "EXCEPTION",
    icon: "tent",
    title: l("Nuit en bivouac traditionnel", "Night in a traditional camp", "ليلة في مخيم تقليدي"),
    summary: l("Tentes nomades, feu de camp et silence absolu au milieu des dunes.", "Nomad tents, campfire and absolute silence among the dunes.", "خيام بدوية ونار المخيم وصمت مطلق بين الكثبان."),
    description: l(
      "Un campement simple et authentique : tentes en poil de chèvre ou en toile, dîner partagé, musique autour du feu selon le camp et nuit sous un ciel étoilé.",
      "A simple, authentic camp: goat-hair or canvas tents, shared dinner, music around the fire depending on the camp, and a night under a starry sky.",
    ),
    duration: l("1 nuit", "1 night", "ليلة واحدة"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Sanitaires partagés selon le camp.", "Shared bathrooms depending on the camp."),
    included: ll(["Nuit en tente", "Dîner et petit-déjeuner"], ["Night in a tent", "Dinner and breakfast"]),
    excluded: ll(["Boissons", "Transfert si hors circuit"], ["Drinks", "Transfer if outside a tour"]),
    safety: l("Nuits fraîches de novembre à mars : prévoir des vêtements chauds.", "Cold nights from November to March: bring warm clothes."),
    availability: everyDay,
    priceMad: null,
    bookingOptionCode: "camp-standard",
  },
  {
    slug: "campement-luxe",
    category: "EXCEPTION",
    icon: "star",
    title: l("Nuit en campement de luxe", "Night in a luxury camp", "ليلة في مخيم فاخر"),
    summary: l("Tentes spacieuses avec vrai lit et salle de bain privative.", "Spacious tents with real beds and private bathrooms.", "خيام واسعة بأسرّة حقيقية وحمام خاص."),
    description: l(
      "Le confort d'une chambre d'hôtel au cœur de l'erg : literie de qualité, salle d'eau privative, dîner servi à table et ambiance feutrée.",
      "Hotel-room comfort in the heart of the erg: quality bedding, private bathroom, plated dinner and a calm atmosphere.",
    ),
    duration: l("1 nuit", "1 night", "ليلة واحدة"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Capacité limitée : réservation à l'avance conseillée.", "Limited capacity: book ahead."),
    included: ll(["Tente privative avec salle de bain", "Dîner et petit-déjeuner"], ["Private tent with bathroom", "Dinner and breakfast"]),
    excluded: ll(["Boissons"], ["Drinks"]),
    safety: l("Camp accessible en 4x4 ou à dos de dromadaire.", "Camp reached by 4x4 or camel."),
    availability: onRequest,
    priceMad: 800,
    bookingOptionCode: "camp-luxe",
  },
  {
    slug: "diner-etoiles",
    category: "EXCEPTION",
    icon: "moon",
    title: l("Dîner sous les étoiles", "Dinner under the stars", "عشاء تحت النجوم"),
    summary: l("Une table dressée sur le sable, éclairée aux lanternes.", "A table set on the sand, lit by lanterns.", "مائدة على الرمال تضيئها الفوانيس."),
    description: l(
      "Tajine, couscous ou méchoui selon la saison, servis à la lueur des lanternes au pied des dunes. Idéal pour une occasion particulière.",
      "Tagine, couscous or mechoui depending on the season, served by lantern light at the foot of the dunes. Ideal for a special occasion.",
    ),
    duration: l("2 heures", "2 hours", "ساعتان"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Selon conditions de vent.", "Depending on wind conditions."),
    included: ll(["Dîner complet", "Mise en place privative"], ["Full dinner", "Private set-up"]),
    excluded: ll(["Boissons alcoolisées"], ["Alcoholic drinks"]),
    safety: l("Annulé ou déplacé sous tente en cas de vent de sable.", "Cancelled or moved into a tent in case of sandstorm."),
    availability: onRequest,
    priceMad: 450,
    bookingOptionCode: "dinner",
  },
  {
    slug: "ciel-nocturne",
    category: "EXCEPTION",
    icon: "telescope",
    title: l("Observation du ciel nocturne", "Stargazing", "رصد السماء ليلاً"),
    summary: l("Loin de toute pollution lumineuse, la Voie lactée à l'œil nu.", "Far from light pollution, the Milky Way with the naked eye.", "بعيداً عن التلوث الضوئي، درب التبانة بالعين المجردة."),
    description: l(
      "Initiation à la lecture du ciel : constellations, planètes visibles et, selon la saison, la Voie lactée. Observation au télescope lorsque le prestataire en dispose.",
      "An introduction to reading the sky: constellations, visible planets and, depending on the season, the Milky Way. Telescope viewing when the provider has one.",
    ),
    duration: l("1 h 30", "1.5 hours", "ساعة ونصف"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Dépend de la phase de la lune et de la météo.", "Depends on the moon phase and weather."),
    included: ll(["Animation", "Couvertures"], ["Guided session", "Blankets"]),
    excluded: ll(["Matériel photo"], ["Camera equipment"]),
    safety: l("Lampe frontale à lumière rouge conseillée.", "Red-light headlamp recommended."),
    availability: onRequest,
    priceMad: 200,
    bookingOptionCode: "stars",
  },
  {
    slug: "lever-soleil",
    category: "EXCEPTION",
    icon: "sunrise",
    title: l("Lever du soleil dans les dunes", "Sunrise in the dunes", "شروق الشمس في الكثبان"),
    summary: l("Grimper une crête avant l'aube et voir l'erg s'illuminer.", "Climb a crest before dawn and watch the erg light up.", "تسلق قمة قبل الفجر ومشاهدة العرق يضيء."),
    description: l(
      "Réveil avant l'aube, ascension à pied d'une dune proche du campement et contemplation du soleil qui se lève sur l'horizon algérien.",
      "Wake before dawn, walk up a dune near the camp and watch the sun rise over the horizon.",
    ),
    duration: l("1 heure", "1 hour", "ساعة واحدة"),
    difficulty: "MODERE",
    minAge: null,
    restrictions: l("Montée à pied dans le sable.", "Walk up through the sand."),
    included: ll(["Inclus dans les nuits en bivouac"], ["Included with camp nights"]),
    excluded: ll([], []),
    safety: l("Prévoir une lampe et une couche chaude.", "Bring a torch and a warm layer."),
    availability: everyDay,
    priceMad: 0,
  },
  {
    slug: "seance-photo",
    category: "EXCEPTION",
    icon: "camera",
    title: l("Séance photo dans le désert", "Desert photo session", "جلسة تصوير في الصحراء"),
    summary: l("Des souvenirs professionnels aux heures dorées.", "Professional memories in the golden hours.", "ذكريات احترافية في الساعات الذهبية."),
    description: l(
      "Avec un photographe local, profitez de la lumière rasante du matin ou du soir pour des portraits et paysages. Fichiers numériques livrés après sélection.",
      "With a local photographer, make the most of the low morning or evening light for portraits and landscapes. Digital files delivered after selection.",
    ),
    duration: l("1 heure", "1 hour", "ساعة واحدة"),
    difficulty: "FACILE",
    minAge: null,
    restrictions: l("Droit à l'image : accord écrit des personnes photographiées.", "Image rights: written consent of the people photographed."),
    included: ll(["Photographe", "Sélection de photos retouchées"], ["Photographer", "Selection of edited photos"]),
    excluded: ll(["Tirages papier"], ["Prints"]),
    safety: l("Pas de drone sans autorisation : la réglementation marocaine est stricte en la matière.", "No drones without authorisation: Moroccan regulations are strict."),
    availability: onRequest,
    priceMad: 900,
    priceUnit: "PER_GROUP",
    bookingOptionCode: "photo",
  },
];

// ---------------------------------------------------------------------------
// 3. Options de réservation (tarifs DEMO)
// ---------------------------------------------------------------------------
export const bookingOptions = [
  { code: "camp-standard", group: "HEBERGEMENT", exclusiveGroup: "camp", isDefault: true, priceMad: 0, unit: "PER_PERSON_NIGHT",
    label: l("Bivouac standard", "Standard camp", "مخيم عادي"), description: l("Tente traditionnelle, sanitaires selon le camp", "Traditional tent, bathrooms depending on camp") },
  { code: "camp-luxe", group: "HEBERGEMENT", exclusiveGroup: "camp", priceMad: 800, unit: "PER_PERSON_NIGHT",
    label: l("Campement de luxe", "Luxury camp", "مخيم فاخر"), description: l("Tente privative avec salle de bain", "Private tent with bathroom") },
  { code: "single", group: "HEBERGEMENT", priceMad: 300, unit: "PER_PERSON_NIGHT",
    label: l("Tente ou chambre individuelle", "Single tent or room", "خيمة أو غرفة فردية"), description: l("Supplément par personne et par nuit", "Supplement per person per night") },
  { code: "camel", group: "ACTIVITE", priceMad: 250, unit: "PER_PERSON",
    label: l("Balade en dromadaire supplémentaire", "Extra camel ride", "جولة إضافية على الجمل"), description: l("Environ 2 h au coucher du soleil", "About 2 h at sunset") },
  { code: "quad", group: "ACTIVITE", priceMad: 500, unit: "PER_PERSON",
    label: l("Quad (1 h)", "Quad bike (1 h)", "دراجة رباعية (ساعة)"), description: l("16 ans minimum pour piloter", "Minimum age 16 to ride") },
  { code: "buggy", group: "ACTIVITE", priceMad: 1200, unit: "PER_BOOKING",
    label: l("Buggy biplace (1 h)", "Two-seater buggy (1 h)", "باجي بمقعدين (ساعة)"), description: l("Prix par buggy", "Price per buggy") },
  { code: "4x4", group: "ACTIVITE", priceMad: 900, unit: "PER_BOOKING",
    label: l("Excursion 4x4 demi-journée", "Half-day 4x4 tour", "جولة نصف يوم رباعية الدفع"), description: l("Véhicule privatisé avec chauffeur", "Private vehicle with driver") },
  { code: "sandboard", group: "ACTIVITE", priceMad: 150, unit: "PER_PERSON",
    label: l("Sandboarding", "Sandboarding", "التزلج على الرمال"), description: l("1 h 30 encadrée", "1.5 h supervised") },
  { code: "gnawa", group: "ACTIVITE", priceMad: 150, unit: "PER_PERSON",
    label: l("Khamlia et musique gnawa", "Khamlia & Gnawa music", "خملية وموسيقى كناوة"), description: l("Transfert inclus", "Transfer included") },
  { code: "dinner", group: "REPAS", priceMad: 450, unit: "PER_PERSON",
    label: l("Dîner privé sous les étoiles", "Private dinner under the stars", "عشاء خاص تحت النجوم"), description: l("Mise en place privative", "Private set-up") },
  { code: "lunch", group: "REPAS", priceMad: 120, unit: "PER_PERSON_NIGHT",
    label: l("Déjeuners supplémentaires", "Extra lunches", "وجبات غداء إضافية"), description: l("Un déjeuner par jour de circuit", "One lunch per tour day") },
  { code: "transfer-errachidia", group: "TRANSFERT", priceMad: 1100, unit: "PER_BOOKING",
    label: l("Transfert aéroport Errachidia ↔ Merzouga", "Errachidia airport ↔ Merzouga transfer", "نقل مطار الرشيدية ↔ مرزوكة"), description: l("Aller-retour, véhicule privé", "Return, private vehicle") },
  { code: "private-guide", group: "SERVICE", priceMad: 600, unit: "PER_PERSON_NIGHT",
    label: l("Guide privé francophone/anglophone", "Private French/English-speaking guide", "مرشد خاص"), description: l("Par jour de circuit (prix par groupe calculé par nuit)", "Per tour day") },
  { code: "stars", group: "SERVICE", priceMad: 200, unit: "PER_PERSON",
    label: l("Observation du ciel nocturne", "Stargazing session", "رصد السماء"), description: l("Selon la lune et la météo", "Depending on moon and weather") },
  { code: "photo", group: "SERVICE", priceMad: 900, unit: "PER_BOOKING",
    label: l("Séance photo (1 h)", "Photo session (1 h)", "جلسة تصوير (ساعة)"), description: l("Photographe local", "Local photographer") },
] as const;

// ---------------------------------------------------------------------------
// 4. Circuits (programmes EXEMPLES + tarifs DEMO)
// ---------------------------------------------------------------------------
type Stop = { day: number; name: string; lat: number; lng: number; kind: "STAGE" | "POI" | "NIGHT"; mode: "DRIVE" | "WALK" | "CAMEL" | null; desc: L };
type Day = { day: number; title: L; description: L; items: LL };

export type CircuitSeed = {
  slug: string;
  sortOrder: number;
  title: L;
  summary: L;
  days: number;
  nights: number;
  startPoint: string;
  endPoint: string;
  transport: L;
  accommodation: L;
  meals: L;
  included: LL;
  excluded: LL;
  optionalActivities: LL;
  cancellationPolicy: L;
  warnings: LL;
  priceAdultMad: number;
  privateSupplementMad: number;
  defaultCapacity: number;
  departureWeekdays: number[] | null; // null = tous les jours ; 0 = dimanche
  itinerary: Day[];
  stops: Stop[];
};

const cancellation = l(
  "Exemple de conditions (à valider par l'agence) : annulation gratuite jusqu'à 15 jours avant le départ ; 50 % de l'acompte retenu entre 14 et 7 jours ; acompte non remboursable à moins de 7 jours. Modification de date gratuite une fois, sous réserve de disponibilité.",
  "Example terms (to be validated by the agency): free cancellation up to 15 days before departure; 50% of the deposit kept between 14 and 7 days; deposit non-refundable within 7 days. One free date change, subject to availability.",
);

const MERZOUGA = { name: "Merzouga", lat: 31.099, lng: -4.012 };
const CAMP = { name: "Campement de l'Erg Chebbi", lat: 31.135, lng: -3.975 };
const KHAMLIA = { name: "Khamlia", lat: 31.037, lng: -3.993 };

export const circuits: CircuitSeed[] = [
  {
    slug: "escapade-saharienne-2j",
    sortOrder: 1,
    title: l("Escapade saharienne", "Saharan escape", "هروب صحراوي"),
    summary: l(
      "L'essentiel du désert en 24 heures : dromadaire au couchant, nuit au bivouac et lever du soleil sur l'Erg Chebbi.",
      "The desert essentials in 24 hours: sunset camel ride, night in camp and sunrise over Erg Chebbi.",
      "جوهر الصحراء في 24 ساعة: جولة على الجمل عند الغروب وليلة في المخيم وشروق الشمس على عرق الشبي.",
    ),
    days: 2,
    nights: 1,
    startPoint: "Merzouga",
    endPoint: "Merzouga",
    transport: l("Dromadaire (ou 4x4 sur demande) entre Merzouga et le campement", "Camel (or 4x4 on request) between Merzouga and the camp", "الجمل (أو سيارة رباعية الدفع عند الطلب)"),
    accommodation: l("1 nuit en bivouac (standard ou luxe selon option)", "1 night in camp (standard or luxury option)", "ليلة في المخيم"),
    meals: l("Dîner du jour 1 et petit-déjeuner du jour 2", "Day 1 dinner and day 2 breakfast", "عشاء اليوم الأول وفطور اليوم الثاني"),
    included: ll(
      ["Accueil à Merzouga", "Balade à dos de dromadaire aller-retour", "Nuit en bivouac", "Dîner et petit-déjeuner", "Animation musicale selon le camp"],
      ["Welcome in Merzouga", "Return camel ride", "Night in camp", "Dinner and breakfast", "Music depending on the camp"],
    ),
    excluded: ll(["Transport jusqu'à Merzouga", "Boissons", "Pourboires", "Assurance voyage"], ["Transport to Merzouga", "Drinks", "Tips", "Travel insurance"]),
    optionalActivities: ll(["Quad ou buggy", "Sandboarding", "Campement de luxe", "Dîner privé sous les étoiles"], ["Quad or buggy", "Sandboarding", "Luxury camp", "Private dinner under the stars"]),
    cancellationPolicy: cancellation,
    warnings: ll([], []),
    priceAdultMad: 1200,
    privateSupplementMad: 400,
    defaultCapacity: 12,
    departureWeekdays: null,
    itinerary: [
      {
        day: 1,
        title: l("Merzouga – coucher de soleil – bivouac", "Merzouga – sunset – camp", "مرزوكة – الغروب – المخيم"),
        description: l(
          "Accueil en milieu d'après-midi, installation ou préparation de l'excursion, puis départ en caravane vers les dunes.",
          "Mid-afternoon welcome, check-in or preparation, then departure by caravan into the dunes.",
        ),
        items: ll(
          ["Accueil à Merzouga", "Installation ou préparation de l'excursion", "Départ vers les dunes", "Balade à dos de dromadaire", "Coucher du soleil sur l'Erg Chebbi", "Arrivée au bivouac", "Dîner traditionnel", "Ambiance musicale selon la formule", "Nuit au campement"],
          ["Welcome in Merzouga", "Check-in or preparation", "Departure towards the dunes", "Camel ride", "Sunset over Erg Chebbi", "Arrival at camp", "Traditional dinner", "Music depending on package", "Night at camp"],
        ),
      },
      {
        day: 2,
        title: l("Lever du soleil – retour", "Sunrise – return", "الشروق – العودة"),
        description: l("Réveil avant l'aube pour admirer le lever du soleil, petit-déjeuner puis retour à Merzouga.", "Wake before dawn to watch the sunrise, breakfast, then return to Merzouga."),
        items: ll(["Lever du soleil", "Petit-déjeuner", "Retour à Merzouga", "Fin du séjour"], ["Sunrise", "Breakfast", "Return to Merzouga", "End of the stay"]),
      },
    ],
    stops: [
      { day: 1, ...MERZOUGA, kind: "STAGE", mode: "CAMEL", desc: l("Point de rendez-vous et départ de la caravane.", "Meeting point and caravan departure.") },
      { day: 1, ...CAMP, kind: "NIGHT", mode: "CAMEL", desc: l("Bivouac au cœur de l'erg (emplacement exact selon le camp retenu).", "Camp in the heart of the erg (exact location depends on the camp).") },
      { day: 2, ...MERZOUGA, kind: "STAGE", mode: null, desc: l("Retour et fin du séjour.", "Return and end of the stay.") },
    ],
  },
  {
    slug: "immersion-desert-3j",
    sortOrder: 2,
    title: l("Immersion dans le désert", "Desert immersion", "الانغماس في الصحراء"),
    summary: l(
      "Deux nuits au bivouac, le tour de l'erg en 4x4, Khamlia et sa musique gnawa : le temps de vraiment ressentir le désert.",
      "Two nights in camp, a 4x4 loop around the erg, Khamlia and its Gnawa music: time to truly feel the desert.",
      "ليلتان في المخيم وجولة حول العرق بسيارة رباعية الدفع وخملية وموسيقى كناوة.",
    ),
    days: 3,
    nights: 2,
    startPoint: "Merzouga",
    endPoint: "Merzouga",
    transport: l("Dromadaire et 4x4 avec chauffeur", "Camel and 4x4 with driver", "الجمل وسيارة رباعية الدفع مع سائق"),
    accommodation: l("2 nuits en bivouac (standard ou luxe)", "2 nights in camp (standard or luxury)", "ليلتان في المخيم"),
    meals: l("2 dîners, 2 petits-déjeuners, déjeuner du jour 2 selon formule", "2 dinners, 2 breakfasts, day 2 lunch depending on package", "عشاءان وفطوران"),
    included: ll(
      ["Balade à dos de dromadaire", "Excursion 4x4 avec chauffeur (jour 2)", "Visite de Khamlia", "2 nuits en bivouac", "Demi-pension"],
      ["Camel ride", "4x4 tour with driver (day 2)", "Khamlia visit", "2 nights in camp", "Half board"],
    ),
    excluded: ll(["Transport jusqu'à Merzouga", "Boissons", "Activités au choix du jour 2", "Pourboires"], ["Transport to Merzouga", "Drinks", "Day 2 optional activities", "Tips"]),
    optionalActivities: ll(["Quad", "Buggy", "Sandboarding", "Observation du ciel", "Séance photo"], ["Quad", "Buggy", "Sandboarding", "Stargazing", "Photo session"]),
    cancellationPolicy: cancellation,
    warnings: ll([], []),
    priceAdultMad: 2400,
    privateSupplementMad: 700,
    defaultCapacity: 12,
    departureWeekdays: null,
    itinerary: [
      {
        day: 1,
        title: l("Arrivée – dunes – premier bivouac", "Arrival – dunes – first camp", "الوصول – الكثبان – المخيم الأول"),
        description: l("Accueil, découverte des abords de l'erg puis balade jusqu'au campement pour le coucher du soleil.", "Welcome, first look at the erg, then ride to the camp for sunset."),
        items: ll(
          ["Arrivée à Merzouga", "Accueil et découverte", "Balade dans les dunes", "Coucher du soleil", "Dîner et nuit au bivouac"],
          ["Arrival in Merzouga", "Welcome and discovery", "Walk in the dunes", "Sunset", "Dinner and night in camp"],
        ),
      },
      {
        day: 2,
        title: l("Tour de l'erg en 4x4 – Khamlia", "4x4 loop – Khamlia", "جولة رباعية الدفع – خملية"),
        description: l("Journée de découverte des environs en 4x4, rencontre avec les musiciens de Khamlia et activités au choix.", "A day exploring the surroundings by 4x4, meeting Khamlia's musicians and optional activities."),
        items: ll(
          ["Petit-déjeuner", "Excursion en 4x4", "Découverte de Khamlia", "Visite des environs", "Déjeuner selon la formule", "Activités au choix", "Dîner et deuxième nuit"],
          ["Breakfast", "4x4 excursion", "Discover Khamlia", "Explore the surroundings", "Lunch depending on package", "Optional activities", "Dinner and second night"],
        ),
      },
      {
        day: 3,
        title: l("Lever du soleil – retour", "Sunrise – return", "الشروق – العودة"),
        description: l("Dernier lever de soleil sur l'erg, petit-déjeuner et dernière promenade avant le retour.", "Last sunrise over the erg, breakfast and a final walk before returning."),
        items: ll(["Lever du soleil", "Petit-déjeuner", "Dernière promenade", "Retour"], ["Sunrise", "Breakfast", "Final walk", "Return"]),
      },
    ],
    stops: [
      { day: 1, ...MERZOUGA, kind: "STAGE", mode: "CAMEL", desc: l("Accueil et départ vers les dunes.", "Welcome and departure to the dunes.") },
      { day: 1, ...CAMP, kind: "NIGHT", mode: "DRIVE", desc: l("Premier bivouac.", "First camp.") },
      { day: 2, ...KHAMLIA, kind: "POI", mode: "DRIVE", desc: l("Village réputé pour sa musique gnawa.", "Village known for its Gnawa music.") },
      { day: 2, ...CAMP, kind: "NIGHT", mode: "CAMEL", desc: l("Deuxième nuit au campement.", "Second night at camp.") },
      { day: 3, ...MERZOUGA, kind: "STAGE", mode: null, desc: l("Retour et fin du séjour.", "Return and end of the stay.") },
    ],
  },
  {
    slug: "grand-sud-marocain-4j",
    sortOrder: 3,
    title: l("Grand Sud marocain", "Great Moroccan South", "الجنوب المغربي الكبير"),
    summary: l(
      "De Marrakech au Sahara par le col du Tizi n'Tichka, Aït Ben Haddou, les vallées du Dadès et du Todgha. Une nuit au désert avant le long retour.",
      "From Marrakesh to the Sahara via the Tizi n'Tichka pass, Aït Ben Haddou, the Dadès and Todgha valleys. A night in the desert before the long drive back.",
      "من مراكش إلى الصحراء عبر ممر تيزي نتيشكا وآيت بن حدو ووادي دادس وتودغى.",
    ),
    days: 4,
    nights: 3,
    startPoint: "Marrakech",
    endPoint: "Marrakech",
    transport: l("Minibus ou 4x4 climatisé avec chauffeur, dromadaire pour rejoindre le camp", "Air-conditioned minibus or 4x4 with driver, camel to reach the camp", "حافلة صغيرة أو سيارة رباعية الدفع مكيفة مع سائق"),
    accommodation: l("Nuit 1 : Ouarzazate (hôtel/riad) · Nuit 2 : gorges du Todgha (hôtel/maison d'hôtes) · Nuit 3 : bivouac à Merzouga", "Night 1: Ouarzazate (hotel/riad) · Night 2: Todgha gorges (hotel/guesthouse) · Night 3: camp in Merzouga", "الليلة 1: ورزازات · الليلة 2: مضايق تودغى · الليلة 3: مخيم مرزوكة"),
    meals: l("3 dîners et 3 petits-déjeuners", "3 dinners and 3 breakfasts", "3 وجبات عشاء و3 وجبات فطور"),
    included: ll(
      ["Transport avec chauffeur pendant 4 jours", "3 nuits (dont 1 en bivouac)", "Demi-pension", "Balade à dos de dromadaire"],
      ["Transport with driver for 4 days", "3 nights (incl. 1 in camp)", "Half board", "Camel ride"],
    ),
    excluded: ll(["Déjeuners", "Entrées des sites (kasbahs, guides locaux)", "Boissons", "Pourboires"], ["Lunches", "Site entrance fees (kasbahs, local guides)", "Drinks", "Tips"]),
    optionalActivities: ll(["Guide local à Aït Ben Haddou", "Randonnée dans les gorges du Todgha", "Quad ou sandboarding à Merzouga"], ["Local guide in Aït Ben Haddou", "Hike in the Todgha gorges", "Quad or sandboarding in Merzouga"]),
    cancellationPolicy: cancellation,
    warnings: ll(
      [
        "Le jour 4 est une très longue journée de route (environ 550 km entre Merzouga et Marrakech, souvent plus de 9 heures de trajet avec les pauses). Les durées affichées sur la carte sont calculées par un service de routage et n'incluent pas les arrêts.",
        "Alternative possible : terminer le circuit à Fès plutôt qu'à Marrakech, ou ajouter une nuit étape (Ouarzazate ou vallée du Dadès) au retour.",
        "Le col du Tizi n'Tichka (2 260 m) peut être enneigé ou fermé ponctuellement en hiver.",
      ],
      [
        "Day 4 is a very long driving day (about 550 km between Merzouga and Marrakesh, often more than 9 hours including breaks). Durations shown on the map are calculated by a routing service and exclude stops.",
        "Alternative: end the tour in Fez rather than Marrakesh, or add an overnight stop (Ouarzazate or Dadès valley) on the way back.",
        "The Tizi n'Tichka pass (2,260 m) can occasionally be snowy or closed in winter.",
      ],
    ),
    priceAdultMad: 3900,
    privateSupplementMad: 1500,
    defaultCapacity: 14,
    departureWeekdays: [1, 4], // lundi et jeudi
    itinerary: [
      {
        day: 1,
        title: l("Marrakech – Aït Ben Haddou – Ouarzazate", "Marrakesh – Aït Ben Haddou – Ouarzazate", "مراكش – آيت بن حدو – ورزازات"),
        description: l("Traversée du Haut Atlas par le col du Tizi n'Tichka, puis visite du ksar d'Aït Ben Haddou, inscrit au patrimoine mondial de l'UNESCO.", "Cross the High Atlas via the Tizi n'Tichka pass, then visit the ksar of Aït Ben Haddou, a UNESCO World Heritage site."),
        items: ll(
          ["Départ matinal de Marrakech", "Col du Tizi n'Tichka", "Visite du ksar d'Aït Ben Haddou", "Arrivée à Ouarzazate", "Dîner et nuit"],
          ["Early departure from Marrakesh", "Tizi n'Tichka pass", "Visit the ksar of Aït Ben Haddou", "Arrival in Ouarzazate", "Dinner and overnight"],
        ),
      },
      {
        day: 2,
        title: l("Ouarzazate – Vallée du Dadès – Gorges du Todgha", "Ouarzazate – Dadès Valley – Todgha Gorges", "ورزازات – وادي دادس – مضايق تودغى"),
        description: l("La route des mille kasbahs : vallée des roses, gorges du Dadès puis les falaises spectaculaires du Todgha.", "The road of a thousand kasbahs: Valley of Roses, Dadès gorges, then the spectacular Todgha cliffs."),
        items: ll(
          ["Route des kasbahs", "Vallée du Dadès et ses gorges", "Arrivée à Tinghir", "Promenade dans les gorges du Todgha", "Dîner et nuit"],
          ["Road of the kasbahs", "Dadès valley and gorges", "Arrival in Tinghir", "Walk in the Todgha gorges", "Dinner and overnight"],
        ),
      },
      {
        day: 3,
        title: l("Tinghir – Erfoud – Merzouga – Nuit au désert", "Tinghir – Erfoud – Merzouga – Night in the desert", "تنغير – أرفود – مرزوكة – ليلة في الصحراء"),
        description: l("Route vers le Tafilalet par Erfoud, arrivée à Merzouga en fin d'après-midi et départ à dos de dromadaire vers le bivouac.", "Drive to Tafilalet via Erfoud, reach Merzouga in late afternoon and ride a camel to the camp."),
        items: ll(
          ["Départ de Tinghir", "Passage par Erfoud", "Arrivée à Merzouga", "Balade à dos de dromadaire au coucher du soleil", "Dîner et nuit au bivouac"],
          ["Leave Tinghir", "Via Erfoud", "Arrival in Merzouga", "Sunset camel ride", "Dinner and night in camp"],
        ),
      },
      {
        day: 4,
        title: l("Retour vers Marrakech", "Return to Marrakesh", "العودة إلى مراكش"),
        description: l("Lever du soleil sur les dunes puis longue route de retour, avec des pauses régulières adaptées à la distance.", "Sunrise over the dunes, then the long drive back with regular breaks suited to the distance."),
        items: ll(
          ["Lever du soleil", "Petit-déjeuner", "Route de retour avec pauses", "Arrivée à Marrakech en soirée"],
          ["Sunrise", "Breakfast", "Return drive with breaks", "Arrival in Marrakesh in the evening"],
        ),
      },
    ],
    stops: [
      { day: 1, name: "Marrakech", lat: 31.6295, lng: -7.9811, kind: "STAGE", mode: "DRIVE", desc: l("Départ du circuit.", "Tour departure.") },
      { day: 1, name: "Col du Tizi n'Tichka", lat: 31.2867, lng: -7.3825, kind: "POI", mode: "DRIVE", desc: l("Plus haut col routier du Haut Atlas (2 260 m).", "Highest road pass in the High Atlas (2,260 m).") },
      { day: 1, name: "Aït Ben Haddou", lat: 31.0472, lng: -7.1297, kind: "POI", mode: "DRIVE", desc: l("Ksar classé au patrimoine mondial de l'UNESCO.", "UNESCO World Heritage ksar.") },
      { day: 1, name: "Ouarzazate", lat: 30.9189, lng: -6.8934, kind: "NIGHT", mode: "DRIVE", desc: l("Nuit 1.", "Night 1.") },
      { day: 2, name: "Boumalne Dadès", lat: 31.3703, lng: -5.9933, kind: "POI", mode: "DRIVE", desc: l("Porte d'entrée de la vallée du Dadès.", "Gateway to the Dadès valley.") },
      { day: 2, name: "Gorges du Todgha", lat: 31.5897, lng: -5.5911, kind: "NIGHT", mode: "DRIVE", desc: l("Falaises hautes de plusieurs centaines de mètres. Nuit 2 à proximité.", "Cliffs several hundred metres high. Night 2 nearby.") },
      { day: 3, name: "Erfoud", lat: 31.4314, lng: -4.2289, kind: "POI", mode: "DRIVE", desc: l("Ville du Tafilalet connue pour ses fossiles et ses dattes.", "Tafilalet town known for fossils and dates.") },
      { day: 3, ...MERZOUGA, kind: "STAGE", mode: "CAMEL", desc: l("Arrivée et départ à dos de dromadaire.", "Arrival and camel departure.") },
      { day: 3, ...CAMP, kind: "NIGHT", mode: "CAMEL", desc: l("Nuit 3 au bivouac.", "Night 3 in camp.") },
      { day: 4, ...MERZOUGA, kind: "STAGE", mode: "DRIVE", desc: l("Départ de la route du retour.", "Start of the return drive.") },
      { day: 4, name: "Marrakech", lat: 31.6295, lng: -7.9811, kind: "STAGE", mode: null, desc: l("Fin du circuit.", "End of the tour.") },
    ],
  },
];
