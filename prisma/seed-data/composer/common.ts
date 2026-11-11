/**
 * Données communes du configurateur : villes de départ, modèles d'hébergement et de journée libre.
 * Tous les tarifs sont des tarifs DÉMO (à remplacer par les tarifs réels de l'agence : voir docs/MODELE-PROGRAMMES.md).
 * Temps de trajet : calculés approximativement à partir des coordonnées (affichés « environ »).
 */
export type T3 = { fr: string; en: string; ar: string };
export type L3 = { fr: string[]; en: string[]; ar: string[] };
export const t = (fr: string, en: string, ar: string): T3 => ({ fr, en, ar });
export const tl = (fr: string[], en: string[], ar: string[]): L3 => ({ fr, en, ar });
export const day = (title: T3, items: L3, photo?: string) => ({ title, items, ...(photo ? { photo } : {}) });
export const opt = (code: string, label: T3, priceMad: number, duration: T3, level: "FACILE" | "MODERE" | "SPORTIF", audience: T3) => ({ code, label, priceMad, duration, level, audience });

// ── trois gammes standard pour toutes les destinations (libellés modifiables dans l'admin : composer:cities → tiers)
export const tiers = {
  essentiel: t("Essentiel", "Essential", "أساسي"),
  confort: t("Confort", "Comfort", "مريح"),
  luxe: t("Luxe", "Luxury", "فاخر"),
};

// ── villes de départ (coordonnées approximatives du centre-ville ; airport = aéroport international principal)
const city = (key: string, fr: string, en: string, ar: string, lat: number, lon: number, airport = false) => ({ key, name: t(fr, en, ar), lat, lon, airport });
export const cities = {
  cities: [
    city("casablanca", "Casablanca", "Casablanca", "الدار البيضاء", 33.5731, -7.5898, true),
    city("rabat", "Rabat", "Rabat", "الرباط", 34.0209, -6.8416, true),
    city("marrakech", "Marrakech", "Marrakesh", "مراكش", 31.6295, -7.9811, true),
    city("fes", "Fès", "Fez", "فاس", 34.0181, -5.0078, true),
    city("tanger", "Tanger", "Tangier", "طنجة", 35.7595, -5.834, true),
    city("agadir", "Agadir", "Agadir", "أكادير", 30.4278, -9.5981, true),
    city("meknes", "Meknès", "Meknes", "مكناس", 33.8935, -5.5473),
    city("oujda", "Oujda", "Oujda", "وجدة", 34.6814, -1.9086, true),
    city("tetouan", "Tétouan", "Tetouan", "تطوان", 35.5889, -5.3626),
    city("nador", "Nador", "Nador", "الناظور", 35.1681, -2.9335, true),
    city("el-jadida", "El Jadida", "El Jadida", "الجديدة", 33.2316, -8.5007),
    city("kenitra", "Kénitra", "Kenitra", "القنيطرة", 34.261, -6.5802),
    city("laayoune", "Laâyoune", "Laayoune", "العيون", 27.1253, -13.1625),
    city("dakhla", "Dakhla", "Dakhla", "الداخلة", 23.6848, -15.958),
    city("ouarzazate", "Ouarzazate", "Ouarzazate", "ورزازات", 30.9189, -6.8934),
    city("errachidia", "Errachidia", "Errachidia", "الرشيدية", 31.9314, -4.4247),
    city("beni-mellal", "Béni Mellal", "Beni Mellal", "بني ملال", 32.3373, -6.3498),
    city("safi", "Safi", "Safi", "آسفي", 32.2994, -9.2372),
    city("essaouira", "Essaouira", "Essaouira", "الصويرة", 31.5085, -9.7595),
    city("al-hoceima", "Al Hoceïma", "Al Hoceima", "الحسيمة", 35.2517, -3.9372),
    city("taza", "Taza", "Taza", "تازة", 34.21, -4.01),
    city("khouribga", "Khouribga", "Khouribga", "خريبكة", 32.8811, -6.9063),
    city("settat", "Settat", "Settat", "سطات", 33.001, -7.6166),
    city("larache", "Larache", "Larache", "العرائش", 35.1932, -6.1557),
  ],
  roadKmh: 65,
  roadFactor: 1.3,
  longTripH: 7, // au-delà de ~7 h de route : 1 journée de trajet en plus (sans nuit d'hôtel)
  transportBaseMad: 150,
  transportPerKmMad: 0.6,
  tiers,
  packDiscountPercent: 15, // DÉMO : réduction du « pack complet » sur les activités
};

/** aéroports marocains proposés pour les destinations internationales */
export const airports = ["casablanca", "marrakech", "rabat", "tanger", "fes", "agadir", "nador", "oujda"];

// ── hébergements types par gamme : label = type d'hébergement, hint = description (aucun nom d'établissement réel) — prix DÉMO par nuit et par personne
const lod = (key: string, label: T3, hint: T3, nightMad: number) => ({ key, label, hint, nightMad });
export const lodging = {
  city: [
    lod("essentiel", t("Riad ou hôtel 3★", "Riad or 3★ hotel", "رياض أو فندق 3 نجوم"), t("Bien situé, petit-déjeuner", "Well located, breakfast", "موقع جيد مع الفطور"), 450),
    lod("confort", t("Riad de charme ou hôtel 4★", "Boutique riad or 4★ hotel", "رياض أنيق أو فندق 4 نجوم"), t("Cadre soigné, petit-déjeuner", "Stylish setting, breakfast", "إطار أنيق مع الفطور"), 750),
    lod("luxe", t("Hôtel ou riad 5★", "5★ hotel or riad", "فندق أو رياض 5 نجوم"), t("Haut de gamme, services et spa selon l'établissement", "Upscale, services and spa depending on the property", "راقٍ، خدمات وسبا حسب المؤسسة"), 1400),
  ],
  desert: [
    lod("essentiel", t("Bivouac traditionnel", "Traditional camp", "مخيم تقليدي"), t("Tentes nomades, dîner et petit-déjeuner", "Nomad tents, dinner and breakfast", "خيام بدوية مع العشاء والفطور"), 450),
    lod("confort", t("Campement confort", "Comfort camp", "مخيم مريح"), t("Tente privée avec lit et sanitaires", "Private tent with bed and bathroom", "خيمة خاصة بسرير ومرافق"), 800),
    lod("luxe", t("Campement de luxe", "Luxury camp", "مخيم فاخر"), t("Grande tente décorée, salle de bain privée", "Large decorated tent, private bathroom", "خيمة كبيرة مزينة بحمام خاص"), 1300),
  ],
  nature: [
    lod("essentiel", t("Gîte ou auberge", "Guesthouse or inn", "نزل أو مأوى"), t("Chambre simple et petit-déjeuner", "Simple room and breakfast", "غرفة بسيطة مع الفطور"), 350),
    lod("confort", t("Maison d'hôtes", "Guest house", "دار ضيافة"), t("Chambre confortable, demi-pension", "Comfortable room, half board", "غرفة مريحة بنصف إقامة"), 600),
    lod("luxe", t("Lodge de charme", "Boutique lodge", "نزل فاخر"), t("Vue sur la nature, demi-pension", "Nature views, half board", "إطلالة على الطبيعة بنصف إقامة"), 1100),
  ],
  beach: [
    lod("essentiel", t("Hôtel 3★", "3★ hotel", "فندق 3 نجوم"), t("Proche de la plage, petit-déjeuner", "Near the beach, breakfast", "قرب الشاطئ مع الفطور"), 500),
    lod("confort", t("Hôtel 4★", "4★ hotel", "فندق 4 نجوم"), t("Piscine, demi-pension", "Pool, half board", "مسبح ونصف إقامة"), 850),
    lod("luxe", t("Hôtel ou resort 5★", "5★ hotel or resort", "فندق أو منتجع 5 نجوم"), t("Front de mer, demi-pension", "Seafront, half board", "على الواجهة البحرية بنصف إقامة"), 1500),
  ],
  abroad: [
    lod("essentiel", t("Hôtel 3★", "3★ hotel", "فندق 3 نجوم"), t("Bien situé, petit-déjeuner", "Well located, breakfast", "موقع جيد مع الفطور"), 700),
    lod("confort", t("Hôtel 4★", "4★ hotel", "فندق 4 نجوم"), t("Central, petit-déjeuner", "Central, breakfast", "في المركز مع الفطور"), 1100),
    lod("luxe", t("Hôtel 5★", "5★ hotel", "فندق 5 نجوم"), t("Haut de gamme, petit-déjeuner", "Upscale, breakfast", "فاخر مع الفطور"), 2000),
  ],
};

// ── journées libres (au-delà des étapes proposées)
export const free = {
  city: day(t("Journée libre", "Free day", "يوم حر"), tl(["Petit-déjeuner", "Flânerie, shopping ou détente à votre rythme", "Conseils de votre conseiller pour la journée"], ["Breakfast", "Stroll, shopping or relax at your own pace", "Tips from your advisor for the day"], ["الفطور", "تجول أو تسوق أو استرخاء حسب رغبتك", "نصائح مستشارك لهذا اليوم"])),
  desert: day(t("Journée libre dans le désert", "Free day in the desert", "يوم حر في الصحراء"), tl(["Petit-déjeuner au campement", "Repos, marche dans les dunes ou activités en option", "Dîner et nuit au campement"], ["Breakfast at camp", "Rest, dune walk or optional activities", "Dinner and night at camp"], ["الفطور في المخيم", "راحة أو مشي في الكثبان أو أنشطة اختيارية", "العشاء والمبيت في المخيم"])),
  nature: day(t("Journée libre en pleine nature", "Free day in nature", "يوم حر في الطبيعة"), tl(["Petit-déjeuner", "Balade libre ou repos", "Dîner sur place"], ["Breakfast", "Free walk or rest", "Dinner on site"], ["الفطور", "نزهة حرة أو راحة", "العشاء في عين المكان"])),
  beach: day(t("Journée détente", "Relaxing day", "يوم استرخاء"), tl(["Petit-déjeuner", "Plage, piscine ou balade sur le front de mer", "Dîner libre"], ["Breakfast", "Beach, pool or seafront walk", "Dinner at leisure"], ["الفطور", "الشاطئ أو المسبح أو نزهة على الكورنيش", "عشاء حر"])),
};
