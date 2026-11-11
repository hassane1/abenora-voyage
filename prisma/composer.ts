/**
 * Chargement des données du configurateur — relançable : `npm run db:composer` (appelé aussi par le seed).
 * - enregistre villes de départ et programmes (table Setting : « composer:cities », « composer:<slug> ») ;
 *   un programme déjà modifié dans l'administration n'est PAS écrasé, sauf avec --force ;
 * - complète les pages destination encore vides (description, conseils, FAQ) sans toucher aux textes existants ;
 * - publie toutes les destinations (chacune a désormais son contenu et son programme).
 */
import type { PrismaClient } from "../src/generated/prisma/client";
import { citiesConfigSchema, destConfigSchema, startCities, travelFrom } from "../src/lib/composer-engine";
import { cities, t } from "./seed-data/composer/common";
import { marocA } from "./seed-data/composer/maroc-1";
import { marocB } from "./seed-data/composer/maroc-2";
import { monde } from "./seed-data/composer/monde";

type T3 = { fr: string; en: string; ar: string };
const empty = (v: unknown) => !v || (typeof v === "object" && !Array.isArray(v) && Object.values(v as Record<string, unknown>).every((x) => !x || (Array.isArray(x) && x.length === 0))) || (Array.isArray(v) && v.length === 0);

export async function applyComposer(db: PrismaClient, { force = false } = {}) {
  const citiesCfg = citiesConfigSchema.parse(cities);
  const existingCities = await db.setting.findUnique({ where: { key: "composer:cities" } });
  if (!existingCities || force) await db.setting.upsert({ where: { key: "composer:cities" }, update: { value: JSON.stringify(citiesCfg) }, create: { key: "composer:cities", value: JSON.stringify(citiesCfg) } });

  let n = 0;
  for (const entry of [...marocA, ...marocB, ...monde]) {
    const cfg = destConfigSchema.parse(entry.config);
    const dest = await db.destination.findUnique({ where: { slug: entry.slug } });
    if (!dest) {
      console.warn(`✘ destination absente : ${entry.slug}`);
      continue;
    }
    const key = `composer:${entry.slug}`;
    const existing = await db.setting.findUnique({ where: { key } });
    if (!existing || force) await db.setting.upsert({ where: { key }, update: { value: JSON.stringify(cfg) }, create: { key, value: JSON.stringify(cfg) } });

    // FAQ générée à partir des données du programme (aucune information inventée en dehors de celles-ci)
    const pos = { lat: dest.latitude, lon: dest.longitude };
    const name = dest.name as T3;
    const ex = startCities(citiesCfg, cfg).slice(0, 3).map((c) => ({ c, tr: travelFrom(citiesCfg, cfg, pos, c.key) }));
    const travelTxt = (l: "fr" | "en" | "ar") =>
      ex
        .filter((x) => x.tr && x.tr.kind !== "NONE")
        .map((x) => `${x.c.name[l]} : ${l === "ar" ? `حوالي ${x.tr!.hours} ساعة` : l === "en" ? `about ${x.tr!.hours} h` : `environ ${String(x.tr!.hours).replace(".", ",")} h`}`)
        .join(l === "ar" ? "، " : ", ");
    const faq = [
      { q: t(`Quelle est la meilleure période pour ${name.fr} ?`, `When is the best time to visit ${name.en}?`, `ما هي أفضل فترة لزيارة ${name.ar}؟`), a: cfg.seasons },
      {
        q: t("Combien de jours prévoir ?", "How many days should I plan?", "كم يوماً يجب التخطيط له؟"),
        a: t(
          `Nos programmes vont de ${cfg.durations.min} à ${cfg.durations.max} jours ; ${cfg.durations.default} jours permettent de voir l'essentiel. Composez votre séjour dans le configurateur.`,
          `Our programmes range from ${cfg.durations.min} to ${cfg.durations.max} days; ${cfg.durations.default} days cover the highlights. Build your stay in the trip builder.`,
          `تتراوح برامجنا بين ${cfg.durations.min} و${cfg.durations.max} أيام؛ و${cfg.durations.default} أيام تكفي لرؤية الأهم. صمّموا إقامتكم في أداة التصميم.`,
        ),
      },
      {
        q: t("D'où peut-on partir ?", "Where can I depart from?", "من أين يمكن الانطلاق؟"),
        a: t(
          `${cfg.mode === "FLIGHT" ? "Depuis les principaux aéroports du Maroc" : "Depuis les principales villes du Maroc"}${cfg.onSite ? " ou sur place" : ""}. Temps de trajet indicatifs : ${travelTxt("fr")}.`,
          `${cfg.mode === "FLIGHT" ? "From Morocco's main airports" : "From Morocco's main cities"}${cfg.onSite ? " or on site" : ""}. Indicative travel times: ${travelTxt("en")}.`,
          `${cfg.mode === "FLIGHT" ? "من المطارات الرئيسية في المغرب" : "من المدن الرئيسية في المغرب"}${cfg.onSite ? " أو في عين المكان" : ""}. أوقات تنقل تقريبية: ${travelTxt("ar")}.`,
        ),
      },
    ];
    await db.destination.update({
      where: { id: dest.id },
      data: {
        ...(entry.description && empty(dest.description) ? { description: entry.description } : {}),
        ...(empty(dest.tips) ? { tips: cfg.tips } : {}),
        ...(empty(dest.faq) ? { faq } : {}),
        published: true,
      },
    });
    n++;
  }
  console.log(`✔ Configurateur : ${n} destinations chargées et publiées.`);
}
