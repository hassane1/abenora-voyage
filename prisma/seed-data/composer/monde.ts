/**
 * Configurateur — destinations internationales : Omra, Istanbul, Dubaï, Égypte, Malaisie, Andalousie.
 * Durées de vol approximatives au départ du Maroc (directs ou avec escale selon compagnie et saison). Tarifs DÉMO.
 * Formalités : toujours vérifier les conditions en vigueur auprès des autorités compétentes.
 */
import { airports, day, lodging, opt, t, tl } from "./common";

const ALL = t("Tous publics", "Everyone", "لجميع الفئات");
const FAM = t("Familles et enfants dès 6 ans", "Families, children from 6", "العائلات والأطفال من 6 سنوات");
const flight = (hours: number, baseMad: number, note = t("Vol direct ou avec escale selon l'aéroport de départ et la saison.", "Direct flight or with a stopover depending on departure airport and season.", "رحلة مباشرة أو بتوقف حسب مطار الانطلاق والموسم.")) => ({ hours, baseMad, extraNonCasaMad: 600, airports, note });
const freeAbroad = (city: string, cityEn: string, cityAr: string) =>
  day(t(`Journée libre à ${city}`, `Free day in ${cityEn}`, `يوم حر في ${cityAr}`), tl(["Petit-déjeuner", "Visites ou shopping à votre rythme", "Conseils de votre accompagnateur"], ["Breakfast", "Sightseeing or shopping at your own pace", "Tips from your tour leader"], ["الفطور", "زيارات أو تسوق حسب رغبتك", "نصائح مرافقك"]));

export const monde = [
  {
    slug: "omra-la-mecque-medine",
    description: null,
    config: {
      mode: "FLIGHT",
      onSite: false,
      durations: { min: 6, max: 14, default: 11 } /* nuits d'hôtel */,
      flight: flight(6, 7000, t("Vols vers Djeddah ou Médine, directs ou avec escale selon le programme.", "Flights to Jeddah or Medina, direct or with a stopover depending on the programme.", "رحلات نحو جدة أو المدينة المنورة، مباشرة أو بتوقف حسب البرنامج.")),
      lodging: [
        { key: "essentiel", label: t("Hôtel avec navette", "Hotel with shuttle", "فندق مع حافلة نقل"), hint: t("Quelques minutes du Haram en navette", "A few minutes from the Haram by shuttle", "على بعد دقائق من الحرم بالحافلة"), nightMad: 900 },
        { key: "confort", label: t("Hôtel proche du Haram", "Hotel near the Haram", "فندق قريب من الحرم"), hint: t("Accès à pied au Haram", "Walking distance to the Haram", "على مسافة مشي من الحرم"), nightMad: 1500 },
        { key: "prestige", label: t("Hôtel face au Haram", "Hotel facing the Haram", "فندق مقابل الحرم"), hint: t("Au plus près des mosquées", "As close as possible to the mosques", "أقرب ما يكون إلى المسجدين"), nightMad: 2800 },
      ],
      days: [
        day(t("Médine, la ville du Prophète ﷺ", "Medina, the Prophet's ﷺ city", "المدينة المنورة، مدينة النبي ﷺ"), tl(["Prières à la mosquée du Prophète", "Visite de la mosquée de Quba", "Temps de recueillement"], ["Prayers at the Prophet's Mosque", "Visit to Quba Mosque", "Time for reflection"], ["الصلاة في المسجد النبوي", "زيارة مسجد قباء", "وقت للتأمل"]), "omra"),
        day(t("Lieux historiques de Médine", "Historic sites of Medina", "المعالم التاريخية للمدينة"), tl(["Mont Uhud", "Mosquée des deux qiblas", "Accompagnement religieux"], ["Mount Uhud", "Mosque of the Two Qiblas", "Religious guidance"], ["جبل أحد", "مسجد القبلتين", "تأطير ديني"]), "composer:omra-la-mecque-medine:2"),
        day(t("Ihram et Omra", "Ihram and Umrah", "الإحرام والعمرة"), tl(["Entrée en ihram au miqat", "Accomplissement de la Omra (tawaf et sa'y)", "Encadrement tout au long des rites"], ["Entering ihram at the miqat", "Performing Umrah (tawaf and sa'y)", "Guidance throughout the rites"], ["الإحرام من الميقات", "أداء العمرة (الطواف والسعي)", "تأطير طوال المناسك"]), "destination:omra-la-mecque-medine"),
        day(t("La Mecque", "Mecca", "مكة المكرمة"), tl(["Prières au Masjid al-Haram", "Ziyarat : Jabal al-Nour, Arafat, Mina (selon programme)", "Temps libre pour l'adoration"], ["Prayers at Masjid al-Haram", "Ziyarat: Jabal al-Nour, Arafat, Mina (depending on programme)", "Free time for worship"], ["الصلاة في المسجد الحرام", "زيارات: جبل النور وعرفات ومنى (حسب البرنامج)", "وقت حر للعبادة"]), "composer:omra-la-mecque-medine:1"),
      ],
      free: day(t("Prières et temps libre à La Mecque", "Prayers and free time in Mecca", "صلوات ووقت حر في مكة"), tl(["Prières au Haram", "Tawaf surérogatoire", "Repos"], ["Prayers at the Haram", "Voluntary tawaf", "Rest"], ["الصلاة في الحرم", "طواف التطوع", "راحة"])),
      options: [
        opt("ziyarat", t("Ziyarat guidées supplémentaires", "Extra guided ziyarat", "زيارات إضافية مؤطرة"), 400, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
        opt("train", t("Train à grande vitesse Médine – La Mecque", "High-speed train Medina – Mecca", "القطار فائق السرعة المدينة – مكة"), 600, t("environ 2 h 30", "about 2 h 30", "حوالي ساعتين ونصف"), "FACILE", ALL),
        opt("demi-pension", t("Demi-pension", "Half board", "نصف إقامة"), 1200, t("tout le séjour", "whole stay", "طوال الإقامة"), "FACILE", ALL),
      ],
      seasons: t("Toute l'année hors période du Hajj ; affluence très forte pendant Ramadan.", "All year except the Hajj period; very crowded during Ramadan.", "طوال السنة باستثناء فترة الحج؛ إقبال كبير جداً خلال رمضان."),
      tips: tl(["Passeport valide et visa Omra obtenu par l'agence selon la réglementation en vigueur", "Vaccinations exigées : vérifiez les conditions à jour", "Chaussures confortables : beaucoup de marche"], ["Valid passport; Umrah visa obtained by the agency under current rules", "Required vaccinations: check the latest conditions", "Comfortable shoes: lots of walking"], ["جواز سفر ساري المفعول وتأشيرة العمرة عبر الوكالة حسب القوانين الجاري بها العمل", "التلقيحات المطلوبة: تحققوا من الشروط المحدثة", "أحذية مريحة: الكثير من المشي"]),
      photos: { main: "destination:omra-la-mecque-medine", steps: ["omra", "composer:omra-la-mecque-medine:1", "composer:omra-la-mecque-medine:2"] },
    },
  },
  {
    slug: "turquie-istanbul",
    description: null,
    config: {
      mode: "FLIGHT",
      onSite: false,
      durations: { min: 2, max: 9, default: 5 } /* nuits d'hôtel */,
      flight: flight(4.5, 3500),
      lodging: lodging.abroad,
      days: [
        day(t("Sultanahmet", "Sultanahmet", "السلطان أحمد"), tl(["Mosquée Bleue", "Sainte-Sophie", "Citerne Basilique"], ["Blue Mosque", "Hagia Sophia", "Basilica Cistern"], ["المسجد الأزرق", "آيا صوفيا", "صهريج البازيليك"]), "composer:turquie-istanbul:1"),
        day(t("Topkapı et Grand Bazar", "Topkapı and Grand Bazaar", "توبكابي والبازار الكبير"), tl(["Palais de Topkapı", "Grand Bazar", "Bazar égyptien aux épices"], ["Topkapı Palace", "Grand Bazaar", "Spice (Egyptian) Bazaar"], ["قصر توبكابي", "البازار الكبير", "بازار التوابل المصري"]), "composer:turquie-istanbul:2"),
        day(t("Croisière sur le Bosphore", "Bosphorus cruise", "رحلة في البوسفور"), tl(["Bateau entre Europe et Asie", "Ortaköy et sa mosquée", "Palais de Dolmabahçe (extérieur)"], ["Boat between Europe and Asia", "Ortaköy and its mosque", "Dolmabahçe Palace (exterior)"], ["قارب بين أوروبا وآسيا", "أورتاكوي ومسجدها", "قصر دولما بهتشه (من الخارج)"]), "destination:turquie-istanbul"),
        day(t("Galata, Eyüp et la Corne d'Or", "Galata, Eyüp and the Golden Horn", "غلطة وأيوب والقرن الذهبي"), tl(["Tour de Galata", "Mosquée d'Eyüp Sultan", "Colline de Pierre Loti"], ["Galata Tower", "Eyüp Sultan Mosque", "Pierre Loti hill"], ["برج غلطة", "مسجد أيوب سلطان", "تلة بيير لوتي"]), "composer:turquie-istanbul:3"),
        day(t("Îles des Princes", "Princes' Islands", "جزر الأميرات"), tl(["Ferry vers Büyükada", "Balade sans voitures", "Déjeuner de poisson"], ["Ferry to Büyükada", "Car-free stroll", "Fish lunch"], ["عبّارة نحو بويوك أضا", "نزهة بلا سيارات", "غداء سمك"])),
      ],
      free: freeAbroad("Istanbul", "Istanbul", "إسطنبول"),
      options: [
        opt("guide", t("Guide francophone ou arabophone", "French- or Arabic-speaking guide", "مرشد بالفرنسية أو العربية"), 700, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
        opt("diner-bosphore", t("Dîner-croisière sur le Bosphore", "Bosphorus dinner cruise", "عشاء على متن رحلة في البوسفور"), 900, t("soirée", "evening", "سهرة"), "FACILE", ALL),
        opt("bursa", t("Excursion à Bursa", "Day trip to Bursa", "رحلة إلى بورصة"), 1100, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
      ],
      seasons: t("Printemps et automne ; été chaud et animé, hiver frais et pluvieux.", "Spring and autumn; hot, busy summers, cool rainy winters.", "الربيع والخريف؛ صيف حار ومزدحم وشتاء بارد وممطر."),
      tips: tl(["Passeport valide ; vérifiez les conditions d'entrée en vigueur pour les ressortissants marocains", "Tenue couvrante et foulard pour les mosquées", "Carte de transport rechargeable pratique (tram, ferry)"], ["Valid passport; check current entry rules for Moroccan citizens", "Covering clothes and scarf for mosques", "A rechargeable transport card is handy (tram, ferry)"], ["جواز سفر ساري المفعول؛ تحققوا من شروط الدخول الحالية للمواطنين المغاربة", "لباس ساتر ووشاح للمساجد", "بطاقة نقل قابلة للتعبئة مفيدة (ترام، عبّارة)"]),
      photos: { main: "destination:turquie-istanbul", steps: ["composer:turquie-istanbul:1", "composer:turquie-istanbul:2", "composer:turquie-istanbul:3"] },
    },
  },
  {
    slug: "emirats-dubai",
    description: null,
    config: {
      mode: "FLIGHT",
      onSite: false,
      durations: { min: 3, max: 9, default: 5 } /* nuits d'hôtel */,
      flight: flight(7.5, 5000),
      lodging: lodging.abroad,
      days: [
        day(t("Le vieux Dubaï", "Old Dubai", "دبي القديمة"), tl(["Traversée de la Creek en abra", "Souks de l'or et des épices", "Quartier historique d'Al Fahidi"], ["Crossing the Creek by abra", "Gold and spice souks", "Al Fahidi historic district"], ["عبور الخور بالعبرة", "سوق الذهب والتوابل", "حي الفهيدي التاريخي"]), "composer:emirats-dubai:1"),
        day(t("Dubaï moderne", "Modern Dubai", "دبي الحديثة"), tl(["Burj Khalifa (observatoire en option)", "Fontaines de Dubaï", "Grands centres commerciaux"], ["Burj Khalifa (observation deck optional)", "Dubai Fountain", "Large shopping malls"], ["برج خليفة (منصة المشاهدة اختيارية)", "نافورة دبي", "مراكز تسوق كبرى"]), "destination:emirats-dubai"),
        day(t("Safari dans le désert", "Desert safari", "رحلة سفاري في الصحراء"), tl(["Dunes en 4×4", "Coucher de soleil dans le désert", "Dîner au camp"], ["Dunes by 4×4", "Desert sunset", "Dinner at camp"], ["الكثبان بسيارة رباعية", "غروب الشمس في الصحراء", "عشاء في المخيم"]), "composer:emirats-dubai:2"),
        day(t("Abou Dhabi", "Abu Dhabi", "أبوظبي"), tl(["Grande mosquée Cheikh Zayed", "Corniche d'Abou Dhabi", "Retour à Dubaï"], ["Sheikh Zayed Grand Mosque", "Abu Dhabi corniche", "Return to Dubai"], ["جامع الشيخ زايد الكبير", "كورنيش أبوظبي", "العودة إلى دبي"])),
        day(t("Marina et plages", "Marina and beaches", "المارينا والشواطئ"), tl(["Promenade de Dubai Marina", "Plage publique", "Soirée sur la promenade"], ["Dubai Marina walk", "Public beach", "Evening on the boardwalk"], ["نزهة في دبي مارينا", "شاطئ عام", "سهرة على الممشى"]), "composer:emirats-dubai:3"),
      ],
      free: freeAbroad("Dubaï", "Dubai", "دبي"),
      options: [
        opt("burj", t("Observatoire du Burj Khalifa", "Burj Khalifa observation deck", "منصة مشاهدة برج خليفة"), 800, t("1 h 30", "1 h 30", "ساعة ونصف"), "FACILE", ALL),
        opt("croisiere", t("Dîner-croisière en dhow", "Dhow dinner cruise", "عشاء على متن مركب تقليدي"), 700, t("soirée", "evening", "سهرة"), "FACILE", ALL),
        opt("parc", t("Parc à thème (au choix)", "Theme park (your choice)", "حديقة ترفيهية (حسب الاختيار)"), 1200, t("journée", "full day", "يوم كامل"), "FACILE", FAM),
      ],
      seasons: t("De novembre à mars ; l'été est extrêmement chaud.", "November to March; summer is extremely hot.", "من نونبر إلى مارس؛ الصيف شديد الحرارة."),
      tips: tl(["Passeport valide ; visa selon la réglementation en vigueur (l'agence vous informe)", "Tenue couvrante pour les mosquées et lieux publics traditionnels", "Climatisation forte à l'intérieur : prévoyez une petite laine"], ["Valid passport; visa under current rules (the agency will advise)", "Covering clothes for mosques and traditional places", "Strong air-conditioning indoors: bring a light sweater"], ["جواز سفر ساري المفعول؛ التأشيرة حسب القوانين الجاري بها العمل (تخبركم الوكالة)", "لباس ساتر للمساجد والأماكن التقليدية", "تكييف قوي في الداخل: احملوا سترة خفيفة"]),
      photos: { main: "destination:emirats-dubai", steps: ["composer:emirats-dubai:1", "composer:emirats-dubai:2", "composer:emirats-dubai:3"] },
    },
  },
  {
    slug: "egypte",
    description: null,
    config: {
      mode: "FLIGHT",
      onSite: false,
      durations: { min: 3, max: 9, default: 7 } /* nuits d'hôtel */,
      flight: flight(5, 4500),
      lodging: lodging.abroad,
      days: [
        day(t("Les pyramides de Gizeh", "The Giza pyramids", "أهرامات الجيزة"), tl(["Pyramides et Sphinx", "Panorama sur le plateau", "Grand musée égyptien (selon ouverture)"], ["Pyramids and Sphinx", "Plateau viewpoint", "Grand Egyptian Museum (if open)"], ["الأهرامات وأبو الهول", "إطلالة على الهضبة", "المتحف المصري الكبير (حسب الافتتاح)"]), "destination:egypte"),
        day(t("Le Caire islamique", "Islamic Cairo", "القاهرة الإسلامية"), tl(["Citadelle de Saladin", "Mosquée Al-Azhar", "Souk Khan el-Khalili"], ["Saladin Citadel", "Al-Azhar Mosque", "Khan el-Khalili souk"], ["قلعة صلاح الدين", "الجامع الأزهر", "سوق خان الخليلي"]), "composer:egypte:3"),
        day(t("Louxor, rive est", "Luxor, east bank", "الأقصر، الضفة الشرقية"), tl(["Temple de Karnak", "Temple de Louxor", "Promenade sur le Nil"], ["Karnak Temple", "Luxor Temple", "Walk along the Nile"], ["معبد الكرنك", "معبد الأقصر", "نزهة على النيل"]), "composer:egypte:1"),
        day(t("Louxor, rive ouest", "Luxor, west bank", "الأقصر، الضفة الغربية"), tl(["Vallée des Rois", "Temple d'Hatchepsout", "Colosses de Memnon"], ["Valley of the Kings", "Temple of Hatshepsut", "Colossi of Memnon"], ["وادي الملوك", "معبد حتشبسوت", "تمثالا ممنون"])),
        day(t("Le Nil en felouque", "The Nile by felucca", "النيل على متن فلوكة"), tl(["Navigation en felouque", "Villages au bord du fleuve", "Coucher de soleil sur le Nil"], ["Felucca sailing", "Riverside villages", "Sunset over the Nile"], ["إبحار على متن فلوكة", "قرى على ضفاف النهر", "غروب الشمس على النيل"]), "composer:egypte:2"),
      ],
      free: freeAbroad("Hurghada ou au Caire", "Hurghada or Cairo", "الغردقة أو القاهرة"),
      options: [
        opt("croisiere", t("Croisière sur le Nil (Louxor – Assouan)", "Nile cruise (Luxor – Aswan)", "رحلة نيلية (الأقصر – أسوان)"), 3500, t("3 à 4 nuits", "3 to 4 nights", "3 إلى 4 ليالٍ"), "FACILE", ALL),
        opt("abou-simbel", t("Excursion à Abou Simbel", "Abu Simbel trip", "رحلة إلى أبو سمبل"), 1500, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
        opt("guide", t("Égyptologue francophone ou arabophone", "French- or Arabic-speaking Egyptologist", "عالم مصريات بالفرنسية أو العربية"), 800, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
      ],
      seasons: t("D'octobre à avril ; l'été est très chaud, surtout en Haute-Égypte.", "October to April; summer is very hot, especially in Upper Egypt.", "من أكتوبر إلى أبريل؛ الصيف حار جداً خاصة في صعيد مصر."),
      tips: tl(["Passeport valide ; visa selon la réglementation en vigueur", "Chapeau, eau et crème solaire sur les sites", "Tenue correcte pour les mosquées"], ["Valid passport; visa under current rules", "Hat, water and sunscreen at the sites", "Modest clothing for mosques"], ["جواز سفر ساري المفعول؛ التأشيرة حسب القوانين الجاري بها العمل", "قبعة وماء وواقي شمس في المواقع", "لباس محتشم للمساجد"]),
      photos: { main: "destination:egypte", steps: ["composer:egypte:1", "composer:egypte:2", "composer:egypte:3"] },
    },
  },
  {
    slug: "malaisie",
    description: null,
    config: {
      mode: "FLIGHT",
      onSite: false,
      durations: { min: 5, max: 11, default: 8 } /* nuits d'hôtel */,
      flight: flight(16, 8500, t("Vols avec escale (pas de vol direct depuis le Maroc à ce jour).", "Flights with a stopover (no direct flight from Morocco at present).", "رحلات بتوقف (لا توجد رحلة مباشرة من المغرب حالياً).")),
      lodging: lodging.abroad,
      days: [
        day(t("Kuala Lumpur", "Kuala Lumpur", "كوالالمبور"), tl(["Tours Petronas", "Mosquée nationale et quartier colonial", "Marché central"], ["Petronas Towers", "National Mosque and colonial district", "Central Market"], ["برجا بتروناس", "المسجد الوطني والحي الاستعماري", "السوق المركزي"]), "destination:malaisie"),
        day(t("Batu Caves et Putrajaya", "Batu Caves and Putrajaya", "كهوف باتو وبوتراجايا"), tl(["Grottes de Batu", "Mosquée Putra (mosquée rose)", "Lac de Putrajaya"], ["Batu Caves", "Putra Mosque (pink mosque)", "Putrajaya lake"], ["كهوف باتو", "مسجد بوترا (المسجد الوردي)", "بحيرة بوتراجايا"])),
        day(t("Cameron Highlands", "Cameron Highlands", "مرتفعات كاميرون"), tl(["Plantations de thé", "Fraîcheur des hauts plateaux", "Marché local"], ["Tea plantations", "Cool highland air", "Local market"], ["مزارع الشاي", "انتعاش الهضاب العالية", "سوق محلي"]), "composer:malaisie:3"),
        day(t("Langkawi", "Langkawi", "لنكاوي"), tl(["Vol intérieur ou ferry vers l'île", "Plages et mangroves", "Téléphérique (selon météo)"], ["Domestic flight or ferry to the island", "Beaches and mangroves", "Cable car (weather permitting)"], ["رحلة داخلية أو عبّارة نحو الجزيرة", "شواطئ وغابات المانغروف", "التلفريك (حسب الطقس)"]), "composer:malaisie:2"),
        day(t("Détente sur l'île", "Island relaxation", "استرخاء في الجزيرة"), tl(["Plage et baignade", "Tour des îles en bateau", "Marché de nuit"], ["Beach and swimming", "Island-hopping boat trip", "Night market"], ["الشاطئ والسباحة", "جولة بالقارب بين الجزر", "سوق ليلي"])),
      ],
      free: freeAbroad("Kuala Lumpur ou Langkawi", "Kuala Lumpur or Langkawi", "كوالالمبور أو لنكاوي"),
      options: [
        opt("genting", t("Excursion à Genting Highlands", "Genting Highlands trip", "رحلة إلى مرتفعات جنتنغ"), 900, t("journée", "full day", "يوم كامل"), "FACILE", FAM),
        opt("mangrove", t("Croisière dans les mangroves de Langkawi", "Langkawi mangrove cruise", "رحلة في غابات المانغروف بلنكاوي"), 700, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
        opt("guide", t("Guide francophone ou arabophone", "French- or Arabic-speaking guide", "مرشد بالفرنسية أو العربية"), 800, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
      ],
      seasons: t("Climat tropical toute l'année ; côte ouest (Langkawi) plus sèche de décembre à mars.", "Tropical all year; west coast (Langkawi) drier from December to March.", "مناخ استوائي طوال السنة؛ الساحل الغربي (لنكاوي) أكثر جفافاً من دجنبر إلى مارس."),
      tips: tl(["Passeport valide au moins 6 mois ; conditions d'entrée à vérifier", "Vêtements légers et parapluie compact", "Tenue couvrante pour les mosquées"], ["Passport valid at least 6 months; check entry conditions", "Light clothing and a compact umbrella", "Covering clothes for mosques"], ["جواز سفر صالح 6 أشهر على الأقل؛ تحققوا من شروط الدخول", "ملابس خفيفة ومظلة صغيرة", "لباس ساتر للمساجد"]),
      photos: { main: "destination:malaisie", steps: ["composer:malaisie:2", "composer:malaisie:3", "destination:malaisie"] },
    },
  },
  {
    slug: "espagne-andalousie",
    description: null,
    config: {
      mode: "FLIGHT",
      onSite: false,
      durations: { min: 2, max: 9, default: 6 } /* nuits d'hôtel */,
      flight: flight(1.5, 2200, t("Vols vers Malaga ou Séville selon l'aéroport de départ ; traversée en ferry possible depuis Tanger.", "Flights to Málaga or Seville depending on departure airport; ferry crossing possible from Tangier.", "رحلات نحو مالقة أو إشبيلية حسب مطار الانطلاق؛ يمكن العبور بالعبّارة من طنجة.")),
      lodging: lodging.abroad,
      days: [
        day(t("Séville", "Seville", "إشبيلية"), tl(["Plaza de España", "Giralda et cathédrale", "Quartier de Santa Cruz"], ["Plaza de España", "Giralda and cathedral", "Santa Cruz district"], ["ساحة إسبانيا", "الخيرالدا والكاتدرائية", "حي سانتا كروث"]), "composer:espagne-andalousie:1"),
        day(t("L'Alcazar de Séville", "The Alcázar of Seville", "قصر إشبيلية"), tl(["Real Alcázar", "Rives du Guadalquivir", "Soirée flamenco (en option)"], ["Real Alcázar", "Guadalquivir riverbanks", "Flamenco evening (optional)"], ["القصر الملكي", "ضفاف الوادي الكبير", "سهرة فلامنكو (اختيارية)"])),
        day(t("Cordoue", "Córdoba", "قرطبة"), tl(["Mosquée-cathédrale", "Pont romain", "Patios fleuris de la Judería"], ["Mosque-Cathedral", "Roman bridge", "Flowered patios of the Judería"], ["المسجد الكاتدرائية", "القنطرة الرومانية", "الأفنية المزهرة في حي اليهود"]), "composer:espagne-andalousie:2"),
        day(t("Grenade et l'Alhambra", "Granada and the Alhambra", "غرناطة وقصر الحمراء"), tl(["Palais nasrides (billets nominatifs à réserver tôt)", "Jardins du Generalife", "Quartier de l'Albaicín"], ["Nasrid palaces (named tickets, book early)", "Generalife gardens", "Albaicín district"], ["القصور النصرية (تذاكر اسمية تُحجز مبكراً)", "حدائق جنة العريف", "حي البيازين"]), "destination:espagne-andalousie"),
        day(t("Malaga et la Costa del Sol", "Málaga and the Costa del Sol", "مالقة وكوستا ديل سول"), tl(["Alcazaba de Malaga", "Centre historique", "Plage de la Malagueta"], ["Málaga Alcazaba", "Historic centre", "Malagueta beach"], ["قصبة مالقة", "المركز التاريخي", "شاطئ لا مالاغيتا"]), "composer:espagne-andalousie:3"),
      ],
      free: freeAbroad("Séville ou Malaga", "Seville or Málaga", "إشبيلية أو مالقة"),
      options: [
        opt("flamenco", t("Spectacle de flamenco", "Flamenco show", "عرض فلامنكو"), 450, t("1 h 30", "1 h 30", "ساعة ونصف"), "FACILE", ALL),
        opt("guide", t("Guide francophone ou arabophone", "French- or Arabic-speaking guide", "مرشد بالفرنسية أو العربية"), 800, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
        opt("ronda", t("Excursion à Ronda", "Day trip to Ronda", "رحلة إلى رندة"), 900, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
      ],
      seasons: t("Printemps et automne ; été très chaud à l'intérieur des terres.", "Spring and autumn; summer is very hot inland.", "الربيع والخريف؛ الصيف حار جداً في الداخل."),
      tips: tl(["Passeport et visa Schengen (l'agence peut vous accompagner pour le dossier)", "Réservez l'Alhambra plusieurs semaines à l'avance", "Chaussures confortables : centres historiques pavés"], ["Passport and Schengen visa (the agency can help with the file)", "Book the Alhambra several weeks ahead", "Comfortable shoes: cobbled historic centres"], ["جواز السفر وتأشيرة شنغن (يمكن للوكالة مرافقتكم في الملف)", "احجزوا قصر الحمراء قبل عدة أسابيع", "أحذية مريحة: مراكز تاريخية مرصوفة"]),
      photos: { main: "destination:espagne-andalousie", steps: ["composer:espagne-andalousie:1", "composer:espagne-andalousie:2", "composer:espagne-andalousie:3"] },
    },
  },
];
