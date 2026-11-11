/**
 * Configurateur — destinations du Maroc (2/2) : Ouarzazate, Zagora, vallée du Dadès, Atlas, Ouzoud, Essaouira,
 * Agadir, Dakhla. Textes rédigés par l'agence à partir de sources publiques ; durées approximatives ; tarifs DÉMO.
 */
import { day, free, lodging, opt, t, tl } from "./common";

const ALL = t("Tous publics", "Everyone", "لجميع الفئات");
const FAM = t("Familles et enfants dès 6 ans", "Families, children from 6", "العائلات والأطفال من 6 سنوات");
const ADULT = t("Adultes et ados dès 14 ans", "Adults and teens from 14", "البالغون والمراهقون من 14 سنة");
const FIT = t("Bons marcheurs", "Good walkers", "للمشاة المتمرسين");

export const marocB = [
  {
    slug: "ouarzazate",
    description: t(
      "Porte du désert au sud du Haut Atlas, Ouarzazate est entourée de kasbahs en terre comme Taourirt et du ksar d'Aït-Ben-Haddou, inscrit au patrimoine mondial de l'UNESCO. Ses paysages ont servi de décor à de nombreux films.",
      "Gateway to the desert south of the High Atlas, Ouarzazate is surrounded by earthen kasbahs such as Taourirt and the ksar of Aït Benhaddou, a UNESCO World Heritage site. Its landscapes have served as the backdrop for many films.",
      "ورزازات بوابة الصحراء جنوب الأطلس الكبير، تحيط بها قصبات طينية مثل تاوريرت وقصر آيت بن حدو المسجل في التراث العالمي لليونسكو. شكلت مناظرها الطبيعية خلفية للعديد من الأفلام.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 6, default: 3 },
      lodging: lodging.city,
      days: [
        day(t("Aït-Ben-Haddou", "Aït Benhaddou", "آيت بن حدو"), tl(["Traversée de l'oued et montée au grenier du ksar", "Ruelles en pisé classées par l'UNESCO", "Vue sur la vallée de l'Ounila"], ["Cross the river and climb to the ksar granary", "UNESCO-listed earthen lanes", "View over the Ounila valley"], ["عبور الوادي والصعود إلى مخزن القصر", "أزقة طينية مصنفة لدى اليونسكو", "إطلالة على وادي أونيلة"]), "aitbenhaddou"),
        day(t("Kasbahs et oasis", "Kasbahs and oases", "القصبات والواحات"), tl(["Kasbah de Taourirt", "Oasis de Fint", "Coucher de soleil sur le lac du barrage (selon niveau)"], ["Taourirt kasbah", "Fint oasis", "Sunset over the reservoir (depending on water level)"], ["قصبة تاوريرت", "واحة فينت", "غروب الشمس على بحيرة السد (حسب المنسوب)"]), "composer:ouarzazate:1"),
        day(t("Skoura et sa palmeraie", "Skoura and its palm grove", "سكورة وواحتها"), tl(["Palmeraie de Skoura", "Kasbah Amridil", "Déjeuner chez l'habitant"], ["Skoura palm grove", "Amridil kasbah", "Lunch with a local family"], ["واحة سكورة", "قصبة أمريديل", "غداء عند السكان"]), "palm"),
        day(t("Vers la vallée du Drâa", "Towards the Draa valley", "نحو وادي درعة"), tl(["Col de Tizi n'Tinifift", "Agdz et sa palmeraie", "Ksour le long du Drâa"], ["Tizi n'Tinifift pass", "Agdz and its palm grove", "Ksour along the Draa"], ["ممر تيزي نتينيفيفت", "أكدز وواحتها", "القصور على طول درعة"]), "valley"),
      ],
      free: free.city,
      options: [
        opt("guide", t("Guide local", "Local guide", "مرشد محلي"), 300, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
        opt("studios", t("Visite d'un studio de cinéma", "Film studio visit", "زيارة استوديو سينمائي"), 150, t("1 h 30", "1 h 30", "ساعة ونصف"), "FACILE", ALL),
        opt("quad", t("Quad dans les environs", "Quad bike outing", "جولة بالدراجة الرباعية"), 450, t("2 h", "2 h", "ساعتان"), "MODERE", ADULT),
      ],
      seasons: t("D'octobre à mai ; l'été est très chaud, l'hiver froid la nuit.", "October to May; summer is very hot, winter nights are cold.", "من أكتوبر إلى ماي؛ الصيف حار جداً وليالي الشتاء باردة."),
      tips: tl(["Le col du Tichka (environ 2 260 m) peut être enneigé en hiver", "Protection solaire indispensable", "Tenue chaude pour les soirées"], ["The Tichka pass (about 2,260 m) can be snowy in winter", "Sun protection is essential", "Warm clothes for the evenings"], ["قد يكون ممر تيشكا (حوالي 2260 م) مكسواً بالثلج شتاءً", "الوقاية من الشمس ضرورية", "ملابس دافئة للأمسيات"]),
      photos: { main: "destination:ouarzazate", steps: ["composer:ouarzazate:1", "composer:ouarzazate:3", "aitbenhaddou"] },
    },
  },
  {
    slug: "zagora",
    description: t(
      "Au bout de la vallée du Drâa, l'une des plus longues palmeraies du Maroc, Zagora est le point de départ vers les dunes de Tinfou et de M'Hamid. Ksour en terre, bibliothèque de Tamegroute et poterie verte jalonnent la route.",
      "At the end of the Draa valley, one of Morocco's longest palm groves, Zagora is the gateway to the Tinfou and M'Hamid dunes. Earthen ksour, the Tamegroute library and green pottery line the road.",
      "في نهاية وادي درعة، أحد أطول الواحات في المغرب، تُعد زاكورة نقطة الانطلاق نحو كثبان تنفو وامحاميد. وتصطف على الطريق القصور الطينية ومكتبة تامكروت والفخار الأخضر.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 2, max: 7, default: 3 },
      lodging: lodging.desert,
      days: [
        day(t("La vallée du Drâa", "The Draa valley", "وادي درعة"), tl(["Route des palmeraies et des ksour", "Arrêt à Agdz", "Installation à Zagora"], ["Road of palm groves and ksour", "Stop in Agdz", "Check-in in Zagora"], ["طريق الواحات والقصور", "توقف في أكدز", "الاستقرار في زاكورة"]), "composer:zagora:1"),
        day(t("Tamegroute et les dunes de Tinfou", "Tamegroute and the Tinfou dunes", "تامكروت وكثبان تنفو"), tl(["Bibliothèque coranique et ateliers de poterie de Tamegroute", "Dunes de Tinfou", "Nuit en bivouac"], ["Tamegroute Koranic library and pottery workshops", "Tinfou dunes", "Night in a desert camp"], ["المكتبة القرآنية وورشات الفخار بتامكروت", "كثبان تنفو", "مبيت في مخيم"]), "composer:zagora:3"),
        day(t("Vers M'Hamid el-Ghizlane", "Towards M'Hamid el-Ghizlane", "نحو امحاميد الغزلان"), tl(["Fin de la route goudronnée", "Grandes étendues sahariennes", "Coucher de soleil sur les dunes"], ["End of the paved road", "Vast Saharan landscapes", "Sunset over the dunes"], ["نهاية الطريق المعبدة", "امتدادات صحراوية شاسعة", "غروب الشمس على الكثبان"]), "composer:zagora:2"),
      ],
      free: free.desert,
      options: [
        opt("dromadaire", t("Balade à dos de dromadaire", "Camel ride", "جولة على الجمل"), 250, t("1 à 2 h", "1 to 2 h", "ساعة إلى ساعتين"), "FACILE", ALL),
        opt("4x4", t("Excursion 4×4 vers l'erg Chigaga", "4×4 trip towards Erg Chigaga", "رحلة بسيارة رباعية نحو عرق شكاكة"), 900, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
        opt("musique", t("Soirée musique autour du feu", "Music evening around the fire", "سهرة موسيقية حول النار"), 200, t("soirée", "evening", "سهرة"), "FACILE", ALL),
      ],
      seasons: t("D'octobre à avril ; été très chaud.", "October to April; very hot summers.", "من أكتوبر إلى أبريل؛ الصيف حار جداً."),
      tips: tl(["Longues distances : prévoyez de l'eau et des pauses", "Veste chaude pour les nuits au désert", "Chèche contre le sable et le soleil"], ["Long distances: carry water and plan breaks", "Warm jacket for desert nights", "Headscarf against sand and sun"], ["مسافات طويلة: احملوا الماء وخططوا للاستراحات", "سترة دافئة لليالي الصحراء", "لثام للوقاية من الرمل والشمس"]),
      photos: { main: "destination:zagora", steps: ["composer:zagora:1", "composer:zagora:2", "composer:zagora:3"] },
    },
  },
  {
    slug: "vallee-dades",
    description: t(
      "Entre Haut Atlas et Jbel Saghro, la vallée du Dadès déroule ses kasbahs, ses vergers et ses gorges spectaculaires. Au printemps, la vallée des roses autour de Kelaat M'Gouna fête la récolte des fleurs.",
      "Between the High Atlas and Jbel Saghro, the Dades valley unfolds its kasbahs, orchards and spectacular gorges. In spring, the Valley of Roses around Kelaat M'Gouna celebrates the flower harvest.",
      "بين الأطلس الكبير وجبل صاغرو، يمتد وادي دادس بقصباته وبساتينه ومضايقه المذهلة. وفي الربيع، تحتفل وادي الورود حول قلعة مكونة بموسم قطف الورود.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 5, default: 3 },
      lodging: lodging.nature,
      days: [
        day(t("La vallée des roses", "The Valley of Roses", "وادي الورود"), tl(["Kelaat M'Gouna et ses coopératives d'eau de rose", "Balade dans les vergers", "Kasbahs en terre"], ["Kelaat M'Gouna and its rose-water cooperatives", "Walk through the orchards", "Earthen kasbahs"], ["قلعة مكونة وتعاونيات ماء الورد", "نزهة في البساتين", "قصبات طينية"]), "composer:vallee-dades:2"),
        day(t("Les gorges du Dadès", "The Dades gorges", "مضايق دادس"), tl(["Route en lacets et points de vue", "Formations rocheuses de la vallée", "Marche au fond des gorges"], ["Winding road and viewpoints", "Rock formations of the valley", "Walk at the bottom of the gorges"], ["طريق ملتوية ونقاط مشاهدة", "تكوينات صخرية في الوادي", "مشي في قاع المضايق"]), "composer:vallee-dades:1"),
        day(t("Les gorges du Todgha", "The Todgha gorges", "مضايق تودغى"), tl(["Falaises de près de 300 m (environ)", "Palmeraie de Tinghir", "Thé dans un village"], ["Cliffs of about 300 m", "Tinghir palm grove", "Tea in a village"], ["جروف بعلو 300 م تقريباً", "واحة تنغير", "شاي في قرية"]), "circuit:grand-sud-marocain-4j"),
      ],
      free: free.nature,
      options: [
        opt("randonnee", t("Randonnée accompagnée dans les gorges", "Guided gorge hike", "مشي مرفق في المضايق"), 350, t("demi-journée", "half day", "نصف يوم"), "MODERE", FIT),
        opt("nomades", t("Rencontre avec des familles nomades", "Meeting nomad families", "لقاء مع عائلات رحل"), 300, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
      ],
      seasons: t("Printemps (roses en avril-mai) et automne ; hiver froid.", "Spring (roses in April-May) and autumn; cold winters.", "الربيع (الورود في أبريل وماي) والخريف؛ الشتاء بارد."),
      tips: tl(["Routes de montagne sinueuses : prévoyez le temps de trajet", "Chaussures de marche pour les gorges", "Couches chaudes le soir"], ["Winding mountain roads: allow travel time", "Walking shoes for the gorges", "Warm layers in the evening"], ["طرق جبلية ملتوية: احتسبوا وقت التنقل", "أحذية مشي للمضايق", "ملابس دافئة في المساء"]),
      photos: { main: "destination:vallee-dades", steps: ["composer:vallee-dades:1", "composer:vallee-dades:2", "composer:vallee-dades:3"] },
    },
  },
  {
    slug: "atlas",
    description: t(
      "À une heure et demie environ de Marrakech, le Haut Atlas offre villages berbères, vallées en terrasses et le Jbel Toubkal, plus haut sommet d'Afrique du Nord (environ 4 167 m). Marche, nuits en gîte et hospitalité montagnarde au programme.",
      "About an hour and a half from Marrakesh, the High Atlas offers Berber villages, terraced valleys and Jbel Toubkal, North Africa's highest peak (about 4,167 m). Walking, guesthouse nights and mountain hospitality await.",
      "على بعد ساعة ونصف تقريباً من مراكش، يمنحكم الأطلس الكبير قرى أمازيغية ووديان بمدرجات وجبل توبقال، أعلى قمة في شمال إفريقيا (حوالي 4167 م). مشي وليالٍ في النزل وكرم الضيافة الجبلية.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 6, default: 3 },
      lodging: lodging.nature,
      days: [
        day(t("Imlil et la vallée", "Imlil and the valley", "إمليل والوادي"), tl(["Arrivée à Imlil (environ 1 600 m)", "Balade vers les villages voisins", "Thé chez l'habitant"], ["Arrival in Imlil (about 1,600 m)", "Walk to neighbouring villages", "Tea with a local family"], ["الوصول إلى إمليل (حوالي 1600 م)", "نزهة نحو القرى المجاورة", "شاي عند السكان"]), "destination:atlas"),
        day(t("Randonnée vers le col", "Hike to the pass", "المشي نحو الممر"), tl(["Randonnée accompagnée (4 à 6 h selon niveau)", "Vue sur le massif du Toubkal", "Déjeuner pique-nique"], ["Guided hike (4 to 6 h depending on level)", "View of the Toubkal massif", "Picnic lunch"], ["مشي مرفق (4 إلى 6 ساعات حسب المستوى)", "إطلالة على كتلة توبقال", "غداء في الطبيعة"]), "composer:atlas:1"),
        day(t("Vallée de l'Ourika", "Ourika valley", "وادي أوريكا"), tl(["Villages en terrasses", "Cascades de Setti Fatma (marche facile à modérée)", "Retour par la vallée"], ["Terraced villages", "Setti Fatma waterfalls (easy to moderate walk)", "Return through the valley"], ["قرى بمدرجات", "شلالات ستي فاطمة (مشي سهل إلى متوسط)", "العودة عبر الوادي"])),
        day(t("Plateau de l'Agafay", "Agafay plateau", "هضبة أكفاي"), tl(["Paysages de désert de pierre", "Coucher de soleil face à l'Atlas", "Dîner sous tente"], ["Stony desert landscapes", "Sunset facing the Atlas", "Dinner in a tent"], ["مناظر صحراء حجرية", "غروب الشمس مقابل الأطلس", "عشاء تحت الخيمة"]), "composer:atlas:2"),
      ],
      free: free.nature,
      options: [
        opt("guide", t("Guide de montagne agréé", "Licensed mountain guide", "مرشد جبلي معتمد"), 450, t("journée", "full day", "يوم كامل"), "MODERE", FIT),
        opt("mule", t("Mule pour les bagages", "Mule for luggage", "بغل لحمل الأمتعة"), 200, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
        opt("toubkal", t("Ascension du Toubkal (2 jours, très bonne condition)", "Toubkal ascent (2 days, very fit)", "صعود توبقال (يومان، لياقة عالية)"), 1600, t("2 jours", "2 days", "يومان"), "SPORTIF", t("Adultes en très bonne forme", "Very fit adults", "بالغون بلياقة عالية")),
      ],
      seasons: t("Avril à juin et septembre à novembre ; neige en altitude en hiver.", "April to June and September to November; snow at altitude in winter.", "من أبريل إلى يونيو ومن شتنبر إلى نونبر؛ ثلوج في المرتفعات شتاءً."),
      tips: tl(["Chaussures de randonnée et vêtements en couches", "L'ascension du Toubkal se fait avec un guide agréé", "Le temps change vite en montagne"], ["Hiking boots and layered clothing", "The Toubkal ascent is done with a licensed guide", "Mountain weather changes quickly"], ["أحذية مشي وملابس متعددة الطبقات", "يتم صعود توبقال برفقة مرشد معتمد", "الطقس في الجبل يتغير بسرعة"]),
      photos: { main: "destination:atlas", steps: ["composer:atlas:1", "composer:atlas:2", "destination:atlas"] },
    },
  },
  {
    slug: "ouzoud",
    description: t(
      "Dans la province d'Azilal, les cascades d'Ouzoud plongent d'environ 110 mètres dans des gorges verdoyantes. Sentiers, barques au pied des chutes, oliviers et macaques font de ce site l'une des excursions nature les plus appréciées du Maroc.",
      "In Azilal province, the Ouzoud waterfalls drop about 110 metres into green gorges. Trails, boats at the foot of the falls, olive trees and macaques make it one of Morocco's favourite nature trips.",
      "في إقليم أزيلال، تنحدر شلالات أوزود بحوالي 110 أمتار في مضايق خضراء. المسالك والقوارب عند أسفل الشلالات وأشجار الزيتون وقردة الماغو تجعل منها من أحب الرحلات الطبيعية في المغرب.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 3, default: 1 },
      lodging: lodging.nature,
      days: [
        day(t("Les cascades d'Ouzoud", "The Ouzoud waterfalls", "شلالات أوزود"), tl(["Descente par le sentier des oliviers", "Barque au pied des chutes", "Déjeuner face aux cascades"], ["Walk down the olive-tree path", "Boat at the foot of the falls", "Lunch facing the waterfalls"], ["النزول عبر مسلك الزيتون", "قارب عند أسفل الشلالات", "غداء قبالة الشلالات"]), "composer:ouzoud:1"),
        day(t("Gorges de l'oued el-Abid", "Oued el-Abid gorges", "مضايق واد العبيد"), tl(["Randonnée vers les gorges", "Moulins traditionnels", "Observation des macaques"], ["Hike to the gorges", "Traditional mills", "Watching macaques"], ["مشي نحو المضايق", "مطاحن تقليدية", "مشاهدة قردة الماغو"]), "composer:ouzoud:2"),
        day(t("Lac de Bin el-Ouidane", "Bin el-Ouidane lake", "بحيرة بين الويدان"), tl(["Lac de barrage entouré de montagnes", "Balade ou activités nautiques (en saison)", "Retour en fin de journée"], ["Reservoir surrounded by mountains", "Walk or water activities (in season)", "Return late afternoon"], ["بحيرة سد تحيط بها الجبال", "نزهة أو أنشطة مائية (في الموسم)", "العودة في آخر النهار"]), "composer:ouzoud:3"),
      ],
      free: free.nature,
      options: [
        opt("guide", t("Guide local", "Local guide", "مرشد محلي"), 200, t("3 h", "3 h", "3 ساعات"), "FACILE", ALL),
        opt("barque", t("Tour en barque au pied des chutes", "Boat ride at the foot of the falls", "جولة بالقارب أسفل الشلالات"), 50, t("15 min", "15 min", "15 دقيقة"), "FACILE", ALL),
      ],
      seasons: t("Printemps pour le débit maximal ; l'été est animé, l'automne plus calme.", "Spring for the strongest flow; summer is lively, autumn quieter.", "الربيع لأقوى تدفق؛ الصيف مزدحم والخريف أهدأ."),
      tips: tl(["Chemins glissants près des chutes : bonnes chaussures", "Ne nourrissez pas les macaques", "Excursion souvent faite à la journée depuis Marrakech (environ 3 h de route)"], ["Slippery paths near the falls: good shoes", "Do not feed the macaques", "Often done as a day trip from Marrakesh (about 3 h by road)"], ["مسالك زلقة قرب الشلالات: أحذية جيدة", "لا تطعموا قردة الماغو", "غالباً ما تُزار في يوم واحد من مراكش (حوالي 3 ساعات بالطريق)"]),
      photos: { main: "destination:ouzoud", steps: ["composer:ouzoud:1", "composer:ouzoud:2", "composer:ouzoud:3"] },
    },
  },
  {
    slug: "essaouira",
    description: t(
      "Ancienne Mogador fortifiée face à l'Atlantique, Essaouira charme par sa médina inscrite au patrimoine mondial de l'UNESCO, son port de pêche aux barques bleues et ses alizés appréciés des véliplanchistes. Une ville d'artistes, détendue et lumineuse.",
      "The former fortified Mogador facing the Atlantic, Essaouira charms with its UNESCO-listed medina, a fishing harbour of blue boats and trade winds loved by windsurfers. A relaxed, luminous artists' town.",
      "الصويرة، موكادور القديمة المحصنة على الأطلسي، تسحر بمدينتها العتيقة المسجلة في التراث العالمي لليونسكو، وميناء صيدها بقواربه الزرقاء، ورياحها التي يحبها هواة ركوب الأمواج. مدينة فنانين هادئة ومشرقة.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 1, max: 6, default: 3 },
      lodging: lodging.city,
      days: [
        day(t("Médina et remparts", "Medina and ramparts", "المدينة العتيقة والأسوار"), tl(["Skala de la ville et ses canons", "Ruelles blanches et galeries d'art", "Coucher de soleil sur les remparts"], ["The town's Skala and its cannons", "White lanes and art galleries", "Sunset on the ramparts"], ["سقالة المدينة ومدافعها", "أزقة بيضاء وأروقة فنية", "غروب الشمس على الأسوار"]), "composer:essaouira:1"),
        day(t("Port et saveurs de la mer", "Harbour and sea flavours", "الميناء ونكهات البحر"), tl(["Port de pêche et chantier naval", "Poisson grillé sur le port", "Atelier de marqueterie de thuya"], ["Fishing harbour and boatyard", "Grilled fish at the harbour", "Thuya-wood marquetry workshop"], ["ميناء الصيد وورشة السفن", "سمك مشوي في الميناء", "ورشة التطعيم بخشب العرعار"]), "destination:essaouira"),
        day(t("Plage et alizés", "Beach and trade winds", "الشاطئ والرياح"), tl(["Grande plage de la baie", "Initiation au kitesurf ou balade à cheval", "Village de Diabat"], ["Large bay beach", "Kitesurf lesson or horse ride", "Diabat village"], ["الشاطئ الكبير للخليج", "تجربة ركوب الأمواج بالطائرة الورقية أو جولة على الخيل", "قرية الديابات"]), "composer:essaouira:2"),
        day(t("Coopératives d'argan", "Argan cooperatives", "تعاونيات الأركان"), tl(["Route de l'arganeraie", "Coopérative féminine d'huile d'argan", "Dégustation d'amlou"], ["Argan forest road", "Women's argan oil cooperative", "Amlou tasting"], ["طريق غابة الأركان", "تعاونية نسائية لزيت الأركان", "تذوق أملو"])),
      ],
      free: free.beach,
      options: [
        opt("kitesurf", t("Cours de kitesurf ou de surf", "Kitesurf or surf lesson", "درس في ركوب الأمواج"), 600, t("2 h", "2 h", "ساعتان"), "SPORTIF", ADULT),
        opt("cheval", t("Balade à cheval sur la plage", "Horse ride on the beach", "جولة على الخيل في الشاطئ"), 350, t("1 h 30", "1 h 30", "ساعة ونصف"), "FACILE", FAM),
        opt("cuisine", t("Cours de cuisine souirie", "Essaouira cooking class", "درس في الطبخ الصويري"), 450, t("3 h", "3 h", "3 ساعات"), "FACILE", ALL),
      ],
      seasons: t("Toute l'année : été tempéré par les alizés, hiver doux.", "All year round: summers cooled by trade winds, mild winters.", "طوال السنة: صيف ملطف بالرياح وشتاء معتدل."),
      tips: tl(["Coupe-vent indispensable, même en été", "Crème solaire : le vent masque la chaleur du soleil", "La médina se visite à pied"], ["A windbreaker is essential, even in summer", "Sunscreen: the wind hides the sun's strength", "The medina is explored on foot"], ["سترة واقية من الريح ضرورية حتى صيفاً", "واقي الشمس: الريح تخفي قوة الشمس", "تُزار المدينة العتيقة مشياً"]),
      photos: { main: "destination:essaouira", steps: ["composer:essaouira:1", "composer:essaouira:2", "composer:essaouira:3"] },
    },
  },
  {
    slug: "agadir",
    description: t(
      "Grande station balnéaire du sud, Agadir déploie une longue baie de sable et un ensoleillement généreux. Kasbah d'Agadir Oufella, vallée du Paradis et villages de surf comme Taghazout complètent le séjour.",
      "A large southern seaside resort, Agadir offers a long sandy bay and generous sunshine. The Agadir Oufella kasbah, Paradise Valley and surf villages such as Taghazout round off the stay.",
      "أكادير محطة شاطئية كبرى في الجنوب، تمتد على خليج رملي طويل وتنعم بشمس سخية. وتكمل قصبة أكادير أوفلا ووادي الجنة وقرى ركوب الأمواج مثل تغازوت الإقامة.",
    ),
    config: {
      mode: "ROAD",
      onSite: true,
      durations: { min: 2, max: 8, default: 4 },
      lodging: lodging.beach,
      days: [
        day(t("La baie d'Agadir", "Agadir bay", "خليج أكادير"), tl(["Corniche et plage", "Marina", "Coucher de soleil depuis la kasbah d'Agadir Oufella"], ["Corniche and beach", "Marina", "Sunset from the Agadir Oufella kasbah"], ["الكورنيش والشاطئ", "المارينا", "غروب الشمس من قصبة أكادير أوفلا"]), "composer:agadir:1"),
        day(t("La vallée du Paradis", "Paradise Valley", "وادي الجنة"), tl(["Route d'Imouzzer des Ida Outanane", "Bassins naturels et palmiers", "Déjeuner dans la vallée"], ["Road to Imouzzer des Ida Outanane", "Natural pools and palm trees", "Lunch in the valley"], ["طريق إيموزار إداوتنان", "أحواض طبيعية ونخيل", "غداء في الوادي"]), "composer:agadir:2"),
        day(t("Taghazout et la côte des surfeurs", "Taghazout and the surf coast", "تغازوت وساحل ركوب الأمواج"), tl(["Village de Taghazout", "Spots de surf de la côte", "Poisson frais"], ["Taghazout village", "Coastal surf spots", "Fresh fish"], ["قرية تغازوت", "أماكن ركوب الأمواج على الساحل", "سمك طازج"]), "composer:agadir:3"),
        day(t("Souk el-Had et médina d'Agadir", "Souk el-Had and Agadir medina", "سوق الأحد ومدينة أكادير"), tl(["Grand souk el-Had", "Médina reconstituée de Coco Polizzi", "Produits de l'arganier"], ["The large Souk el-Had", "Coco Polizzi's rebuilt medina", "Argan products"], ["سوق الأحد الكبير", "المدينة العتيقة المعاد بناؤها لكوكو بوليزي", "منتجات الأركان"])),
      ],
      free: free.beach,
      options: [
        opt("surf", t("Cours de surf", "Surf lesson", "درس في ركوب الأمواج"), 450, t("2 h", "2 h", "ساعتان"), "SPORTIF", ADULT),
        opt("souss-massa", t("Parc national de Souss-Massa (oiseaux)", "Souss-Massa National Park (birds)", "المنتزه الوطني سوس ماسة (الطيور)"), 550, t("demi-journée", "half day", "نصف يوم"), "FACILE", ALL),
        opt("quad", t("Quad dans les dunes côtières", "Quad bike in coastal dunes", "دراجة رباعية في الكثبان الساحلية"), 450, t("2 h", "2 h", "ساعتان"), "MODERE", ADULT),
      ],
      seasons: t("Toute l'année : climat doux et très ensoleillé ; l'hiver reste agréable.", "All year round: a mild, very sunny climate; winter stays pleasant.", "طوال السنة: مناخ معتدل ومشمس جداً؛ ويبقى الشتاء لطيفاً."),
      tips: tl(["Courants marins : baignez-vous dans les zones surveillées", "Matinées parfois brumeuses en été", "Pensez à la crème solaire"], ["Sea currents: swim in supervised areas", "Summer mornings can be misty", "Remember sunscreen"], ["التيارات البحرية: اسبحوا في المناطق المحروسة", "صباحات الصيف ضبابية أحياناً", "لا تنسوا واقي الشمس"]),
      photos: { main: "destination:agadir", steps: ["composer:agadir:1", "composer:agadir:2", "composer:agadir:3"] },
    },
  },
  {
    slug: "dakhla",
    description: t(
      "Sur une presqu'île entre désert et océan, Dakhla est réputée pour sa lagune aux eaux calmes, idéale pour le kitesurf, ses huîtres et ses grands espaces. On y vient pour le vent, la lumière et le calme.",
      "On a peninsula between desert and ocean, Dakhla is known for its calm lagoon, ideal for kitesurfing, its oysters and wide-open spaces. People come for the wind, the light and the peace.",
      "على شبه جزيرة بين الصحراء والمحيط، تشتهر الداخلة ببحيرتها الهادئة المثالية لركوب الأمواج بالطائرة الورقية، ومحارها وفضاءاتها الواسعة. يقصدها الناس من أجل الريح والضوء والهدوء.",
    ),
    config: {
      mode: "FLIGHT",
      onSite: true,
      durations: { min: 3, max: 8, default: 5 },
      flight: { hours: 2, baseMad: 1800, extraNonCasaMad: 400, airports: ["casablanca", "marrakech", "agadir", "rabat"], note: t("Vols intérieurs, directs ou avec escale selon la saison.", "Domestic flights, direct or with a stopover depending on season.", "رحلات داخلية مباشرة أو بتوقف حسب الموسم.") },
      lodging: lodging.beach,
      days: [
        day(t("La lagune de Dakhla", "The Dakhla lagoon", "بحيرة الداخلة"), tl(["Découverte de la lagune", "Spots de kitesurf", "Coucher de soleil sur l'eau"], ["Discover the lagoon", "Kitesurf spots", "Sunset over the water"], ["اكتشاف البحيرة", "أماكن ركوب الأمواج بالطائرة الورقية", "غروب الشمس على الماء"]), "destination:dakhla"),
        day(t("Dune blanche et île du Dragon", "White dune and Dragon island", "الكثيب الأبيض وجزيرة التنين"), tl(["Excursion vers la dune blanche (marée basse)", "Vue sur l'île du Dragon", "Pique-nique"], ["Trip to the white dune (low tide)", "View of Dragon island", "Picnic"], ["رحلة نحو الكثيب الأبيض (عند الجزر)", "إطلالة على جزيرة التنين", "نزهة"]), "composer:dakhla:1"),
        day(t("Ostréiculture et saveurs", "Oyster farms and flavours", "تربية المحار والنكهات"), tl(["Visite d'une ferme ostréicole", "Dégustation d'huîtres", "Marché aux poissons"], ["Oyster farm visit", "Oyster tasting", "Fish market"], ["زيارة مزرعة محار", "تذوق المحار", "سوق السمك"]), "composer:dakhla:2"),
        day(t("Désert et océan", "Desert and ocean", "الصحراء والمحيط"), tl(["Piste côtière en 4×4", "Falaises et plages sauvages", "Sources chaudes d'Asma (selon accès)"], ["Coastal track by 4×4", "Cliffs and wild beaches", "Asma hot springs (access permitting)"], ["مسلك ساحلي بسيارة رباعية", "جروف وشواطئ برية", "عيون أسما الساخنة (حسب الولوج)"]), "composer:dakhla:3"),
      ],
      free: free.beach,
      options: [
        opt("kitesurf", t("Cours de kitesurf", "Kitesurf lesson", "درس في ركوب الأمواج بالطائرة الورقية"), 800, t("2 h", "2 h", "ساعتان"), "SPORTIF", ADULT),
        opt("4x4", t("Excursion 4×4 dans le désert côtier", "4×4 coastal desert trip", "رحلة بسيارة رباعية في الصحراء الساحلية"), 700, t("journée", "full day", "يوم كامل"), "FACILE", ALL),
        opt("bateau", t("Sortie en bateau dans la lagune", "Boat trip on the lagoon", "جولة بالقارب في البحيرة"), 500, t("2 h", "2 h", "ساعتان"), "FACILE", FAM),
      ],
      seasons: t("Toute l'année ; vent régulier surtout de mars à octobre.", "All year; steady wind especially from March to October.", "طوال السنة؛ رياح منتظمة خاصة من مارس إلى أكتوبر."),
      tips: tl(["Coupe-vent et lunettes de soleil", "Combinaison néoprène pour les sports nautiques", "Les distances sont grandes : excursions organisées recommandées"], ["Windbreaker and sunglasses", "Wetsuit for water sports", "Distances are long: organised trips recommended"], ["سترة واقية ونظارات شمسية", "بدلة غوص للرياضات المائية", "المسافات طويلة: يُنصح بالرحلات المنظمة"]),
      photos: { main: "destination:dakhla", steps: ["composer:dakhla:1", "composer:dakhla:2", "composer:dakhla:3"] },
    },
  },
];
