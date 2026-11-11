/**
 * Configurateur — destinations du Maroc (1/2) : Merzouga, Marrakech, Fès, Chefchaouen, Akchour, Tanger-Tétouan,
 * Ifrane-Azrou, Nord-Est méditerranéen. Textes rédigés par l'agence à partir de sources publiques
 * (Wikipédia, Wikivoyage, visitmorocco.com) ; durées et distances toujours approximatives. Tarifs DÉMO.
 */
import { day, free, lodging, opt, t, tl } from "./common";

const ALL = t("Tous publics", "Everyone", "لجميع الفئات");
const FAM = t("Familles et enfants dès 6 ans", "Families, children from 6", "العائلات والأطفال من 6 سنوات");
const ADULT = t("Adultes et ados dès 14 ans", "Adults and teens from 14", "البالغون والمراهقون من 14 سنة");

export const marocA = [
  {
    slug: "merzouga",
    description: null,
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 7, default: 2 } /* nuits d'hôtel */,
      lodging: lodging.desert,
      days: [
        day(t("Les dunes de l'Erg Chebbi", "The Erg Chebbi dunes", "كثبان عرق الشبي"), tl(["Balade à dos de dromadaire jusqu'au campement", "Coucher de soleil sur les grandes dunes", "Dîner berbère et nuit sous les étoiles"], ["Camel ride to the camp", "Sunset over the high dunes", "Berber dinner and night under the stars"], ["جولة على الجمل إلى المخيم", "غروب الشمس فوق الكثبان العالية", "عشاء أمازيغي ومبيت تحت النجوم"]), "camel"),
        day(t("Tour de l'erg en 4×4", "Around the erg by 4×4", "جولة حول العرق بسيارة رباعية"), tl(["Lever du soleil sur les dunes", "Khamlia et sa musique gnaoua", "Lac saisonnier de Merzouga et anciennes mines (selon saison)"], ["Sunrise over the dunes", "Khamlia and its Gnawa music", "Seasonal Merzouga lake and old mines (depending on season)"], ["شروق الشمس فوق الكثبان", "خملية وموسيقى كناوة", "بحيرة مرزوكة الموسمية والمناجم القديمة (حسب الموسم)"]), "activity:khamlia-gnawa"),
        day(t("Rissani et le Tafilalet", "Rissani and Tafilalet", "الريصاني وتافيلالت"), tl(["Souk de Rissani (jours de marché)", "Ksour en pisé et palmeraie", "Thé chez l'habitant"], ["Rissani souk (market days)", "Earthen ksour and palm grove", "Tea with a local family"], ["سوق الريصاني (أيام السوق)", "قصور طينية وواحة نخيل", "شاي عند السكان"]), "activity:oasis"),
        day(t("Nuit au cœur du désert", "Night in the heart of the desert", "ليلة في قلب الصحراء"), tl(["Marche libre dans les dunes", "Sandboard ou repos au campement", "Ciel étoilé loin des lumières"], ["Free walk in the dunes", "Sandboarding or rest at camp", "Starry sky far from city lights"], ["مشي حر في الكثبان", "التزلج على الرمال أو الراحة في المخيم", "سماء مرصعة بالنجوم بعيداً عن الأضواء"]), "activity:ciel-nocturne"),
      ],
      free: free.desert,
      options: [
        opt("quad", t("Quad dans les dunes", "Quad bike in the dunes", "دراجة رباعية في الكثبان"), 400, t("1 h", "1 h", "ساعة"), "MODERE", ADULT),
        opt("4x4", t("Excursion 4×4 autour de l'erg", "4×4 tour around the erg", "جولة بسيارة رباعية حول العرق"), 350, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
        opt("sandboard", t("Sandboard", "Sandboarding", "التزلج على الرمال"), 100, t("1 h", "1 h", "ساعة"), "MODERE", FAM),
        opt("diner-etoiles", t("Dîner sous les étoiles", "Dinner under the stars", "عشاء تحت النجوم"), 250, t("2 h", "2 h", "ساعتان"), "FACILE", ALL),
      ],
      seasons: t("D'octobre à avril (journées douces, nuits fraîches) ; l'été est très chaud.", "October to April (mild days, cool nights); summer is very hot.", "من أكتوبر إلى أبريل (أيام معتدلة وليالٍ باردة)؛ الصيف حار جداً."),
      tips: tl(["Prévoyez une veste chaude pour la nuit, même au printemps", "Chèche, lunettes de soleil et crème solaire", "Un petit sac suffit pour la nuit au campement"], ["Bring a warm jacket for the night, even in spring", "Headscarf, sunglasses and sunscreen", "A small bag is enough for the night at camp"], ["احملوا سترة دافئة لليل حتى في الربيع", "لثام ونظارات شمسية وواقي من الشمس", "حقيبة صغيرة تكفي لليلة في المخيم"]),
      photos: { main: "destination:merzouga", steps: ["camel", "camp", "activity:ciel-nocturne"] },
    },
  },
  {
    slug: "marrakech",
    description: t(
      "Ville impériale au pied de l'Atlas, Marrakech mêle la place Jemaa el-Fna, inscrite au patrimoine immatériel de l'UNESCO, ses souks animés, ses palais et ses jardins. C'est aussi un point de départ idéal vers les montagnes et le désert.",
      "An imperial city at the foot of the Atlas, Marrakesh combines Jemaa el-Fna square, listed by UNESCO as intangible heritage, lively souks, palaces and gardens. It is also an ideal starting point for the mountains and the desert.",
      "مراكش مدينة إمبراطورية عند سفح الأطلس، تجمع ساحة جامع الفنا المسجلة في التراث اللامادي لليونسكو، وأسواقاً نابضة بالحياة، وقصوراً وحدائق. وهي أيضاً نقطة انطلاق مثالية نحو الجبال والصحراء.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 6, default: 2 } /* nuits d'hôtel */,
      lodging: lodging.city,
      days: [
        day(t("Médina et place Jemaa el-Fna", "Medina and Jemaa el-Fna", "المدينة العتيقة وساحة جامع الفنا"), tl(["Minaret de la Koutoubia", "Souks des artisans", "Ambiance de la place en soirée"], ["Koutoubia minaret", "Craftsmen's souks", "The square's evening atmosphere"], ["صومعة الكتبية", "أسواق الصناع التقليديين", "أجواء الساحة في المساء"]), "composer:marrakech:1"),
        day(t("Palais et jardins", "Palaces and gardens", "القصور والحدائق"), tl(["Palais de la Bahia", "Tombeaux saadiens", "Jardin Majorelle"], ["Bahia Palace", "Saadian tombs", "Majorelle Garden"], ["قصر الباهية", "قبور السعديين", "حديقة ماجوريل"]), "composer:marrakech:2"),
        day(t("Escapade dans l'Atlas", "Atlas getaway", "جولة في الأطلس"), tl(["Vallée de l'Ourika ou plateau de l'Agafay", "Déjeuner dans un village berbère", "Retour en fin de journée"], ["Ourika valley or Agafay plateau", "Lunch in a Berber village", "Return late afternoon"], ["وادي أوريكا أو هضبة أكفاي", "غداء في قرية أمازيغية", "العودة في آخر النهار"]), "composer:marrakech:3"),
        day(t("Artisanat et hammam", "Crafts and hammam", "الصناعة التقليدية والحمام"), tl(["Atelier d'artisans (cuir, bois, métal)", "Pause dans un café sur les toits", "Hammam traditionnel"], ["Craft workshop (leather, wood, metal)", "Rooftop café break", "Traditional hammam"], ["ورشة صناع (جلد، خشب، معدن)", "استراحة في مقهى على السطح", "حمام تقليدي"])),
      ],
      free: free.city,
      options: [
        opt("guide", t("Guide officiel en médina", "Licensed medina guide", "مرشد رسمي في المدينة العتيقة"), 300, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
        opt("cuisine", t("Cours de cuisine marocaine", "Moroccan cooking class", "درس في الطبخ المغربي"), 450, t("3 h", "3 h", "3 ساعات"), "FACILE", ALL),
        opt("montgolfiere", t("Vol en montgolfière au lever du jour", "Sunrise hot-air balloon flight", "رحلة منطاد عند الشروق"), 2200, t("environ 1 h de vol", "about 1 h flight", "حوالي ساعة طيران"), "FACILE", FAM),
        opt("agafay", t("Dîner dans le désert d'Agafay", "Dinner in the Agafay desert", "عشاء في صحراء أكفاي"), 600, t("soirée", "evening", "سهرة"), "FACILE", ALL),
      ],
      seasons: t("Printemps et automne sont idéaux ; l'été est chaud et l'hiver doux le jour, frais la nuit.", "Spring and autumn are ideal; summer is hot, winter mild by day and cool at night.", "الربيع والخريف مثاليان؛ الصيف حار والشتاء معتدل نهاراً وبارد ليلاً."),
      tips: tl(["Chaussures confortables pour la médina", "Tenue couvrant épaules et genoux pour les lieux traditionnels", "Négociez les prix dans les souks avec le sourire"], ["Comfortable shoes for the medina", "Clothing covering shoulders and knees for traditional places", "Bargain with a smile in the souks"], ["أحذية مريحة للمدينة العتيقة", "لباس يغطي الكتفين والركبتين في الأماكن التقليدية", "فاوضوا على الأسعار في الأسواق بابتسامة"]),
      photos: { main: "destination:marrakech", steps: ["composer:marrakech:1", "composer:marrakech:2", "composer:marrakech:3"] },
    },
  },
  {
    slug: "fes",
    description: t(
      "Fès el-Bali, l'une des plus grandes médinas du monde inscrite au patrimoine mondial de l'UNESCO, abrite des médersas finement décorées, des tanneries séculaires et des milliers de ruelles. Capitale spirituelle et artisanale du Maroc, elle se découvre idéalement avec un guide.",
      "Fes el-Bali, one of the world's largest medinas and a UNESCO World Heritage site, is home to finely decorated madrasas, centuries-old tanneries and thousands of lanes. Morocco's spiritual and craft capital is best explored with a guide.",
      "فاس البالي، من أكبر المدن العتيقة في العالم والمسجلة في التراث العالمي لليونسكو، تضم مدارس مزخرفة بدقة ودباغات عريقة وآلاف الأزقة. هي العاصمة الروحية والحرفية للمغرب، ويُستحسن اكتشافها برفقة مرشد.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 5, default: 2 } /* nuits d'hôtel */,
      lodging: lodging.city,
      days: [
        day(t("Fès el-Bali, la médina millénaire", "Fes el-Bali, the ancient medina", "فاس البالي، المدينة الألفية"), tl(["Bab Bou Jeloud, la porte bleue", "Médersa Bou Inania", "Souks et fondouks"], ["Bab Bou Jeloud, the blue gate", "Bou Inania madrasa", "Souks and caravanserais"], ["باب بوجلود، الباب الأزرق", "المدرسة البوعنانية", "الأسواق والفنادق القديمة"]), "composer:fes:1"),
        day(t("Savoir-faire et tanneries", "Crafts and tanneries", "الحرف والدباغات"), tl(["Tannerie Chouara vue des terrasses", "Ateliers de dinandiers et de tisserands", "Quartier des Andalous"], ["Chouara tannery from the terraces", "Coppersmith and weaver workshops", "Andalusian quarter"], ["دباغة الشوارة من السطوح", "ورشات النحاسين والنساجين", "حي الأندلس"]), "composer:fes:2"),
        day(t("Médersas et Fès el-Jdid", "Madrasas and Fes el-Jdid", "المدارس وفاس الجديد"), tl(["Médersa Attarine", "Palais royal (portes extérieures) et Mellah", "Panorama depuis les tombeaux mérinides"], ["Attarine madrasa", "Royal palace (outer gates) and Mellah", "View from the Marinid tombs"], ["مدرسة العطارين", "القصر الملكي (الأبواب الخارجية) والملاح", "بانوراما من قبور المرينيين"]), "destination:fes"),
        day(t("Meknès et Volubilis", "Meknes and Volubilis", "مكناس ووليلي"), tl(["Site romain de Volubilis", "Moulay Idriss Zerhoun (vue d'ensemble)", "Bab Mansour à Meknès"], ["Roman site of Volubilis", "Moulay Idriss Zerhoun (viewpoint)", "Bab Mansour in Meknes"], ["الموقع الروماني وليلي", "مولاي إدريس زرهون (إطلالة)", "باب منصور بمكناس"])),
      ],
      free: free.city,
      options: [
        opt("guide", t("Guide officiel en médina", "Licensed medina guide", "مرشد رسمي في المدينة العتيقة"), 300, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
        opt("cuisine", t("Cours de cuisine fassie", "Fassi cooking class", "درس في الطبخ الفاسي"), 450, t("3 h", "3 h", "3 ساعات"), "FACILE", ALL),
        opt("zellige", t("Initiation au zellige ou à la poterie", "Zellige or pottery workshop", "ورشة زليج أو فخار"), 350, t("2 h", "2 h", "ساعتان"), "FACILE", FAM),
      ],
      seasons: t("Printemps et automne ; l'été peut être chaud, l'hiver frais et parfois pluvieux.", "Spring and autumn; summer can be hot, winter cool and sometimes rainy.", "الربيع والخريف؛ قد يكون الصيف حاراً والشتاء بارداً وممطراً أحياناً."),
      tips: tl(["La médina est piétonne et vallonnée : chaussures confortables", "Un guide officiel évite de se perdre et les faux guides", "Tenue correcte pour les lieux religieux et traditionnels"], ["The medina is pedestrian and hilly: comfortable shoes", "A licensed guide avoids getting lost and fake guides", "Modest clothing for religious and traditional places"], ["المدينة العتيقة للمشاة ومنحدرة: أحذية مريحة", "المرشد الرسمي يجنبكم الضياع والمرشدين المزيفين", "لباس محتشم في الأماكن الدينية والتقليدية"]),
      photos: { main: "destination:fes", steps: ["composer:fes:1", "composer:fes:2", "destination:fes"] },
    },
  },
  {
    slug: "chefchaouen",
    description: t(
      "Nichée dans les montagnes du Rif, Chefchaouen est célèbre pour sa médina aux murs bleutés, ses placettes paisibles et ses sentiers de randonnée. Une étape douce, propice à la flânerie et à la photographie.",
      "Nestled in the Rif mountains, Chefchaouen is famous for its blue-washed medina, peaceful little squares and hiking trails. A gentle stop, perfect for strolling and photography.",
      "تقع شفشاون بين جبال الريف، وتشتهر بمدينتها العتيقة ذات الجدران الزرقاء وساحاتها الهادئة ومسالك المشي. محطة هادئة مثالية للتجول والتصوير.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 4, default: 1 } /* nuits d'hôtel */,
      lodging: lodging.city,
      days: [
        day(t("La perle bleue", "The blue pearl", "الجوهرة الزرقاء"), tl(["Place Outa el-Hammam et kasbah", "Ruelles bleues de la médina", "Thé sur une terrasse"], ["Outa el-Hammam square and kasbah", "Blue lanes of the medina", "Tea on a terrace"], ["ساحة وطاء الحمام والقصبة", "أزقة المدينة الزرقاء", "شاي على سطح"]), "composer:chefchaouen:3"),
        day(t("Ras El Maa et la mosquée espagnole", "Ras El Maa and the Spanish mosque", "رأس الماء والمسجد الإسباني"), tl(["Source et lavoirs de Ras El Maa", "Montée à la mosquée espagnole", "Coucher de soleil sur la ville"], ["Ras El Maa spring and wash-houses", "Walk up to the Spanish mosque", "Sunset over the town"], ["منبع رأس الماء والمغاسل", "الصعود إلى المسجد الإسباني", "غروب الشمس على المدينة"]), "composer:chefchaouen:1"),
        day(t("Akchour et le Rif", "Akchour and the Rif", "أقشور والريف"), tl(["Route vers Akchour (environ 1 h)", "Randonnée vers les cascades", "Pique-nique au bord de l'oued"], ["Drive to Akchour (about 1 h)", "Hike to the waterfalls", "Picnic by the river"], ["الطريق إلى أقشور (حوالي ساعة)", "مشي نحو الشلالات", "نزهة بجانب الوادي"]), "composer:chefchaouen:2"),
      ],
      free: free.city,
      options: [
        opt("guide", t("Guide local en médina", "Local medina guide", "مرشد محلي في المدينة العتيقة"), 250, t("2 h", "2 h", "ساعتان"), "FACILE", ALL),
        opt("randonnee", t("Randonnée accompagnée dans le Rif", "Guided Rif hike", "مشي مرفق في الريف"), 400, t("journée", "full day", "يوم كامل"), "MODERE", FAM),
        opt("photo", t("Balade photo au lever du jour", "Sunrise photo walk", "جولة تصوير عند الشروق"), 300, t("2 h", "2 h", "ساعتان"), "FACILE", ALL),
      ],
      seasons: t("Du printemps à l'automne ; l'hiver est frais et humide en montagne.", "Spring to autumn; winter is cool and damp in the mountains.", "من الربيع إلى الخريف؛ الشتاء بارد ورطب في الجبل."),
      tips: tl(["Ruelles en pente et escaliers : chaussures confortables", "Une petite laine pour les soirées en montagne", "Demandez la permission avant de photographier les habitants"], ["Sloping lanes and steps: comfortable shoes", "A light sweater for mountain evenings", "Ask permission before photographing residents"], ["أزقة منحدرة وأدراج: أحذية مريحة", "سترة خفيفة لأمسيات الجبل", "استأذنوا قبل تصوير السكان"]),
      photos: { main: "destination:chefchaouen", steps: ["composer:chefchaouen:1", "composer:chefchaouen:2", "composer:chefchaouen:3"] },
    },
  },
  {
    slug: "akchour",
    description: t(
      "À environ une heure de Chefchaouen, Akchour s'ouvre sur les gorges de l'oued Farda, dans le parc national de Talassemtane. Sentiers ombragés, bassins d'eau claire, cascades et arche naturelle dite « Pont de Dieu » : un paradis pour les marcheurs.",
      "About an hour from Chefchaouen, Akchour opens onto the Farda river gorges in Talassemtane National Park. Shady trails, clear pools, waterfalls and a natural arch known as “God's Bridge”: a paradise for walkers.",
      "على بعد ساعة تقريباً من شفشاون، تنفتح أقشور على مضايق وادي فردة داخل المنتزه الوطني لتلاسمطان. مسالك ظليلة وأحواض صافية وشلالات وقوس طبيعي يُعرف بـ«قنطرة الله»: جنة لعشاق المشي.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 3, default: 1 } /* nuits d'hôtel */,
      lodging: lodging.nature,
      days: [
        day(t("Les cascades d'Akchour", "The Akchour waterfalls", "شلالات أقشور"), tl(["Marche le long de l'oued (2 à 3 h aller-retour selon le rythme)", "Petite et grande cascade", "Baignade possible en été dans les bassins"], ["Walk along the river (2 to 3 h return depending on pace)", "Small and large waterfall", "Summer swimming in the pools"], ["المشي على طول الوادي (2 إلى 3 ساعات ذهاباً وإياباً حسب الوتيرة)", "الشلال الصغير والكبير", "إمكانية السباحة صيفاً في الأحواض"]), "composer:akchour:1"),
        day(t("Le Pont de Dieu", "God's Bridge", "قنطرة الله"), tl(["Sentier vers l'arche naturelle", "Vue sur les gorges de Talassemtane", "Déjeuner au bord de l'eau"], ["Trail to the natural arch", "View over the Talassemtane gorges", "Lunch by the water"], ["مسلك نحو القوس الطبيعي", "إطلالة على مضايق تلاسمطان", "غداء بجانب الماء"])),
        day(t("Villages du Rif", "Rif villages", "قرى الريف"), tl(["Balade dans les villages et terrasses cultivées", "Forêt de cèdres et sapins (parc de Talassemtane)", "Retour par Chefchaouen"], ["Walk through villages and terraced fields", "Cedar and fir forest (Talassemtane park)", "Return via Chefchaouen"], ["جولة في القرى والمدرجات الزراعية", "غابة الأرز والشوح (منتزه تلاسمطان)", "العودة عبر شفشاون"]), "composer:akchour:3"),
      ],
      free: free.nature,
      options: [
        opt("guide", t("Guide de randonnée local", "Local hiking guide", "مرشد مشي محلي"), 350, t("journée", "full day", "يوم كامل"), "MODERE", FAM),
        opt("pique-nique", t("Pique-nique préparé", "Packed picnic", "وجبة نزهة جاهزة"), 120, t("déjeuner", "lunch", "غداء"), "FACILE", ALL),
      ],
      seasons: t("De mai à octobre pour les bassins ; à éviter après de fortes pluies (crues).", "May to October for the pools; avoid after heavy rain (floods).", "من ماي إلى أكتوبر للأحواض؛ يُتجنب بعد الأمطار الغزيرة (الفيضانات)."),
      tips: tl(["Chaussures de marche qui accrochent sur les rochers", "Maillot de bain et serviette en été", "Emportez de l'eau et ne laissez aucun déchet"], ["Walking shoes with grip on rocks", "Swimsuit and towel in summer", "Carry water and leave no litter"], ["أحذية مشي ثابتة على الصخور", "لباس السباحة ومنشفة صيفاً", "احملوا الماء ولا تتركوا أي نفايات"]),
      photos: { main: "destination:akchour", steps: ["composer:akchour:1", "composer:akchour:3", "destination:chefchaouen"] },
    },
  },
  {
    slug: "tanger-tetouan",
    description: t(
      "Entre Atlantique et Méditerranée, Tanger regarde l'Europe depuis sa kasbah et le cap Spartel, tandis que Tétouan, dont la médina est inscrite au patrimoine mondial de l'UNESCO, garde un charme andalou. Une région de caractère, facile d'accès.",
      "Between the Atlantic and the Mediterranean, Tangier looks across to Europe from its kasbah and Cape Spartel, while Tetouan, whose medina is a UNESCO World Heritage site, keeps an Andalusian charm. A characterful, easy-to-reach region.",
      "بين الأطلسي والمتوسط، تطل طنجة على أوروبا من قصبتها ورأس سبارطيل، بينما تحتفظ تطوان، ذات المدينة العتيقة المسجلة في التراث العالمي لليونسكو، بسحر أندلسي. جهة ذات طابع خاص وسهلة الوصول.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 5, default: 2 } /* nuits d'hôtel */,
      lodging: lodging.city,
      days: [
        day(t("Tanger, porte de l'Afrique", "Tangier, gateway to Africa", "طنجة، بوابة إفريقيا"), tl(["Kasbah et musée de la Kasbah", "Petit Socco et médina", "Café face au détroit"], ["Kasbah and Kasbah museum", "Petit Socco and medina", "Café overlooking the strait"], ["القصبة ومتحف القصبة", "السوق الداخل والمدينة العتيقة", "مقهى مطل على المضيق"]), "composer:tanger-tetouan:2"),
        day(t("Cap Spartel et grottes d'Hercule", "Cape Spartel and Hercules caves", "رأس سبارطيل ومغارات هرقل"), tl(["Phare du cap Spartel", "Grottes d'Hercule", "Plage d'Achakar"], ["Cape Spartel lighthouse", "Hercules caves", "Achakar beach"], ["منارة رأس سبارطيل", "مغارات هرقل", "شاطئ أشقار"]), "composer:tanger-tetouan:1"),
        day(t("Tétouan, la colombe blanche", "Tetouan, the white dove", "تطوان، الحمامة البيضاء"), tl(["Médina classée par l'UNESCO", "Place Hassan II et quartier de l'Ensanche", "Artisanat tétouanais"], ["UNESCO-listed medina", "Hassan II square and Ensanche district", "Tetouan crafts"], ["المدينة العتيقة المصنفة لدى اليونسكو", "ساحة الحسن الثاني وحي الإنسانتشي", "الصناعة التقليدية التطوانية"]), "composer:tanger-tetouan:3"),
        day(t("Asilah ou la côte méditerranéenne", "Asilah or the Mediterranean coast", "أصيلة أو الساحل المتوسطي"), tl(["Remparts et fresques d'Asilah", "Ou plages de M'diq et Cabo Negro (en saison)", "Poisson grillé au port"], ["Asilah ramparts and murals", "Or M'diq and Cabo Negro beaches (in season)", "Grilled fish at the harbour"], ["أسوار أصيلة وجدارياتها", "أو شواطئ المضيق وكابو نيغرو (في الموسم)", "سمك مشوي في الميناء"])),
      ],
      free: free.city,
      options: [
        opt("guide", t("Guide officiel", "Licensed guide", "مرشد رسمي"), 300, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
        opt("chefchaouen", t("Excursion à Chefchaouen", "Day trip to Chefchaouen", "رحلة إلى شفشاون"), 450, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
        opt("bateau", t("Sortie en mer (selon météo)", "Boat trip (weather permitting)", "جولة بحرية (حسب الطقس)"), 400, t("2 h", "2 h", "ساعتان"), "FACILE", FAM),
      ],
      seasons: t("Toute l'année ; été agréable en bord de mer, hiver doux mais venté et pluvieux.", "All year; pleasant summers by the sea, mild but windy and rainy winters.", "طوال السنة؛ صيف لطيف على البحر وشتاء معتدل لكنه ممطر وعاصف."),
      tips: tl(["Coupe-vent : le vent du détroit souffle souvent", "Le train à grande vitesse relie Tanger à Rabat et Casablanca", "Tenue correcte dans les médinas"], ["Windbreaker: the strait is often windy", "The high-speed train links Tangier with Rabat and Casablanca", "Modest clothing in the medinas"], ["سترة واقية من الريح: رياح المضيق متكررة", "القطار فائق السرعة يربط طنجة بالرباط والدار البيضاء", "لباس محتشم في المدن العتيقة"]),
      photos: { main: "destination:tanger-tetouan", steps: ["composer:tanger-tetouan:1", "composer:tanger-tetouan:2", "composer:tanger-tetouan:3"] },
    },
  },
  {
    slug: "ifrane-azrou",
    description: t(
      "Au cœur du Moyen Atlas, Ifrane surprend par ses toits pentus et son air de station de montagne, tandis qu'Azrou est entourée de forêts de cèdres où vivent des macaques de Barbarie. Lacs, sentiers et fraîcheur : une parenthèse nature.",
      "In the heart of the Middle Atlas, Ifrane surprises with its pitched roofs and mountain-resort feel, while Azrou is surrounded by cedar forests home to Barbary macaques. Lakes, trails and fresh air: a nature break.",
      "في قلب الأطلس المتوسط، تفاجئ إفران بسقوفها المائلة وطابعها كمحطة جبلية، بينما تحيط بآزرو غابات الأرز حيث تعيش قردة الماغو. بحيرات ومسالك وانتعاش: استراحة في الطبيعة.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 3, default: 1 } /* nuits d'hôtel */,
      lodging: lodging.nature,
      days: [
        day(t("Ifrane, la « petite Suisse »", "Ifrane, the “little Switzerland”", "إفران، «سويسرا الصغيرة»"), tl(["Balade dans la ville et le parc", "Statue du lion de pierre", "Pause gourmande"], ["Stroll through town and park", "Stone lion statue", "Snack break"], ["جولة في المدينة والمنتزه", "تمثال الأسد الحجري", "استراحة لتذوق الحلويات"]), "composer:ifrane-azrou:1"),
        day(t("Cèdres et macaques", "Cedars and macaques", "الأرز وقردة الماغو"), tl(["Forêt de cèdres près d'Azrou", "Observation des macaques (sans les nourrir)", "Médina et artisanat d'Azrou"], ["Cedar forest near Azrou", "Watching macaques (without feeding them)", "Azrou medina and crafts"], ["غابة الأرز قرب آزرو", "مشاهدة قردة الماغو (دون إطعامها)", "المدينة العتيقة وحرف آزرو"])),
        day(t("Lacs du Moyen Atlas", "Middle Atlas lakes", "بحيرات الأطلس المتوسط"), tl(["Circuit des lacs (Dayet Aoua et alentours)", "Observation des oiseaux", "Pique-nique en forêt"], ["Lakes circuit (Dayet Aoua and around)", "Birdwatching", "Picnic in the forest"], ["جولة البحيرات (ضاية عوا ونواحيها)", "مراقبة الطيور", "نزهة في الغابة"]), "composer:ifrane-azrou:3"),
      ],
      free: free.nature,
      options: [
        opt("randonnee", t("Randonnée accompagnée en forêt", "Guided forest hike", "مشي مرفق في الغابة"), 300, t("demi-journée", "half day", "نصف يوم"), "MODERE", FAM),
        opt("cheval", t("Balade à cheval", "Horse ride", "جولة على الخيل"), 350, t("1 h 30", "1 h 30", "ساعة ونصف"), "FACILE", FAM),
        opt("ski", t("Neige à Michlifen (en hiver, selon enneigement)", "Snow at Michlifen (winter, snow permitting)", "الثلج في ميشليفن (شتاءً حسب التساقطات)"), 300, t("demi-journée", "half day", "نصف يوم"), "MODERE", ALL),
      ],
      seasons: t("Printemps et été pour la nature ; l'hiver est froid avec parfois de la neige.", "Spring and summer for nature; winter is cold, sometimes snowy.", "الربيع والصيف للطبيعة؛ الشتاء بارد ومثلج أحياناً."),
      tips: tl(["Vêtements chauds : il fait frais même en été le soir", "Ne nourrissez pas les macaques", "Routes de montagne : prudence en hiver"], ["Warm clothes: evenings are cool even in summer", "Do not feed the macaques", "Mountain roads: take care in winter"], ["ملابس دافئة: المساء بارد حتى في الصيف", "لا تطعموا قردة الماغو", "طرق جبلية: الحذر في الشتاء"]),
      photos: { main: "destination:ifrane-azrou", steps: ["composer:ifrane-azrou:1", "composer:ifrane-azrou:3", "destination:ifrane-azrou"] },
    },
  },
  {
    slug: "nord-est-mediterranee",
    description: null,
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 6, default: 3 } /* nuits d'hôtel */,
      lodging: lodging.beach,
      days: [
        day(t("Al Hoceïma et ses criques", "Al Hoceima and its coves", "الحسيمة وخلجانها"), tl(["Plage Quemado et front de mer", "Point de vue sur la baie", "Dîner de poisson au port"], ["Quemado beach and seafront", "Bay viewpoint", "Fish dinner at the harbour"], ["شاطئ كيمادو والكورنيش", "إطلالة على الخليج", "عشاء سمك في الميناء"]), "composer:nord-est-mediterranee:2"),
        day(t("Parc national d'Al Hoceïma", "Al Hoceima National Park", "المنتزه الوطني للحسيمة"), tl(["Falaises et criques sauvages", "Sortie en bateau (selon météo)", "Baignade"], ["Cliffs and wild coves", "Boat trip (weather permitting)", "Swimming"], ["جروف وخلجان برية", "جولة بحرية (حسب الطقس)", "السباحة"])),
        day(t("Nador et la lagune de Marchica", "Nador and Marchica lagoon", "الناظور وبحيرة مارتشيكا"), tl(["Promenade le long de la lagune", "Observation des oiseaux", "Corniche de Nador"], ["Walk along the lagoon", "Birdwatching", "Nador corniche"], ["نزهة على طول البحيرة", "مراقبة الطيور", "كورنيش الناظور"]), "composer:nord-est-mediterranee:3"),
        day(t("Saïdia, la perle bleue", "Saïdia, the blue pearl", "السعيدية، الجوهرة الزرقاء"), tl(["Longue plage de sable fin", "Embouchure de la Moulouya (site naturel)", "Soirée sur la promenade"], ["Long fine-sand beach", "Moulouya river mouth (nature site)", "Evening on the promenade"], ["شاطئ طويل برمال ناعمة", "مصب ملوية (موقع طبيعي)", "سهرة على الكورنيش"]), "composer:nord-est-mediterranee:1"),
      ],
      free: free.beach,
      options: [
        opt("bateau", t("Sortie en bateau le long des falaises", "Boat trip along the cliffs", "جولة بحرية على طول الجروف"), 400, t("2 h", "2 h", "ساعتان"), "FACILE", FAM),
        opt("plongee", t("Baptême de plongée ou snorkeling", "Try-dive or snorkelling", "تجربة غوص أو غطس سطحي"), 600, t("demi-journée", "half day", "نصف يوم"), "MODERE", ADULT),
        opt("guide", t("Guide local", "Local guide", "مرشد محلي"), 300, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
      ],
      seasons: t("De juin à septembre pour la plage ; printemps et automne plus calmes.", "June to September for the beach; spring and autumn are quieter.", "من يونيو إلى شتنبر للشاطئ؛ الربيع والخريف أهدأ."),
      tips: tl(["Réservez tôt pour juillet-août", "Les distances entre Al Hoceïma, Nador et Saïdia se comptent en heures de route", "Crème solaire et chapeau"], ["Book early for July-August", "Distances between Al Hoceima, Nador and Saïdia take hours by road", "Sunscreen and hat"], ["احجزوا مبكراً لشهري يوليوز وغشت", "المسافات بين الحسيمة والناظور والسعيدية تُقطع في ساعات", "واقي الشمس وقبعة"]),
      photos: { main: "destination:nord-est-mediterranee", steps: ["composer:nord-est-mediterranee:1", "composer:nord-est-mediterranee:2", "composer:nord-est-mediterranee:3"] },
    },
  },
];
