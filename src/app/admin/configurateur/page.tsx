import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { tr } from "@/lib/i18n-content";
import { citiesConfigSchema, destConfigSchema } from "@/lib/composer-engine";
import { saveComposerJson, saveComposerPrices } from "../composer-actions";
import { Card, Flash, PageTitle } from "../ui";

/** Configurateur « Créez votre voyage sur mesure » : tarifs DÉMO, durées et programmes de chaque destination */
export default async function ComposerAdmin({ searchParams }: PageProps<"/admin/configurateur">) {
  await requireAdmin("catalog.write");
  const sp = await searchParams;
  const [destinations, rows] = await Promise.all([db.destination.findMany({ orderBy: { sortOrder: "asc" } }), db.setting.findMany({ where: { key: { startsWith: "composer:" } } })]);
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const citiesRaw = byKey.get("composer:cities");
  const cities = citiesRaw ? citiesConfigSchema.safeParse(JSON.parse(citiesRaw)) : null;
  const open = typeof sp.d === "string" ? sp.d : "";
  const pretty = (v: string) => JSON.stringify(JSON.parse(v), null, 2);
  return (
    <div>
      <PageTitle title="Configurateur de voyages sur mesure" />
      <Flash sp={sp} />
      {sp.error && (
        <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-900">
          Enregistrement refusé : données invalides. {typeof sp.msg === "string" ? sp.msg : ""}
        </p>
      )}
      <Card title="Comment ça marche">
        <ul className="list-disc space-y-1 ps-5 text-sm text-muted">
          <li>Chaque destination a un programme (étapes jour par jour, options, hébergements) et des tarifs <strong>de démonstration</strong>, affichés avec la mention « Tarifs démo ».</li>
          <li>Pour mettre vos vrais tarifs : modifiez les prix ci-dessous (par personne et par nuit pour l&apos;hébergement, par personne pour les options et le vol).</li>
          <li>Pour changer les textes ou les étapes : « Édition avancée » (format JSON, vérifié avant enregistrement), ou remplissez le modèle <code>docs/MODELE-PROGRAMMES.csv</code> et transmettez-le pour import.</li>
          <li>Le prix affiché au client est toujours recalculé par le serveur à partir de ces données ; la demande crée un dossier « SM-… » dans Demandes &amp; devis.</li>
        </ul>
      </Card>

      {cities?.success && (
        <details open={open === "cities"} className="mt-6 rounded-2xl bg-white ring-1 ring-night/5">
          <summary className="cursor-pointer p-4 font-semibold">Villes de départ et transport ({cities.data.cities.length} villes)</summary>
          <div className="space-y-3 p-4 pt-0 text-sm">
            <p className="text-muted">
              Temps de trajet estimé : distance à vol d&apos;oiseau × {cities.data.roadFactor} ÷ {cities.data.roadKmh} km/h ; journée de transfert au-delà de {cities.data.transferThresholdH} h. Transport DÉMO aller-retour par personne : {cities.data.transportBaseMad} MAD + {cities.data.transportPerKmMad} MAD/km.
            </p>
            <form action={saveComposerJson} className="space-y-2">
              <input type="hidden" name="slug" value="cities" />
              <textarea name="json" rows={14} defaultValue={pretty(citiesRaw!)} className="field font-mono text-xs" spellCheck={false} />
              <button className="btn btn-primary !py-2 text-sm">Enregistrer les villes</button>
            </form>
          </div>
        </details>
      )}

      <div className="mt-6 space-y-3">
        {destinations.map((d) => {
          const raw = byKey.get(`composer:${d.slug}`);
          const cfg = raw ? destConfigSchema.safeParse(JSON.parse(raw)) : null;
          return (
            <details key={d.id} open={open === d.slug} className="rounded-2xl bg-white ring-1 ring-night/5">
              <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                <span className="font-semibold">{tr(d.name, "fr")}</span>
                <span className="text-xs text-muted">{cfg?.success ? `${cfg.data.days.length} étapes · ${cfg.data.durations.min}–${cfg.data.durations.max} j · ${cfg.data.options.length} options` : "aucun programme"}</span>
              </summary>
              {cfg?.success && (
                <div className="space-y-5 p-4 pt-0 text-sm">
                  <form action={saveComposerPrices} className="space-y-3">
                    <input type="hidden" name="slug" value={d.slug} />
                    <p className="font-semibold">Tarifs (MAD) et durées</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {cfg.data.lodging.map((l) => (
                        <label key={l.key} className="block">
                          <span className="label text-xs">{l.label.fr} · par nuit et par pers.</span>
                          <input name={`lodging:${l.key}`} type="number" min={0} defaultValue={l.nightMad} className="field !py-1.5" />
                        </label>
                      ))}
                      {cfg.data.options.map((o) => (
                        <label key={o.code} className="block">
                          <span className="label text-xs">Option : {o.label.fr}</span>
                          <input name={`option:${o.code}`} type="number" min={0} defaultValue={o.priceMad} className="field !py-1.5" />
                        </label>
                      ))}
                      {cfg.data.flight && (
                        <>
                          <label className="block">
                            <span className="label text-xs">Vol A/R depuis Casablanca, par pers.</span>
                            <input name="flight:base" type="number" min={0} defaultValue={cfg.data.flight.baseMad} className="field !py-1.5" />
                          </label>
                          <label className="block">
                            <span className="label text-xs">Supplément autres aéroports</span>
                            <input name="flight:extra" type="number" min={0} defaultValue={cfg.data.flight.extraNonCasaMad} className="field !py-1.5" />
                          </label>
                        </>
                      )}
                      <label className="block">
                        <span className="label text-xs">Durée min / max / par défaut (jours)</span>
                        <span className="flex gap-2">
                          <input name="dur:min" type="number" min={1} max={15} defaultValue={cfg.data.durations.min} className="field !py-1.5" />
                          <input name="dur:max" type="number" min={1} max={15} defaultValue={cfg.data.durations.max} className="field !py-1.5" />
                          <input name="dur:default" type="number" min={1} max={15} defaultValue={cfg.data.durations.default} className="field !py-1.5" />
                        </span>
                      </label>
                    </div>
                    <button className="btn btn-primary !py-2 text-sm">Enregistrer les tarifs</button>
                  </form>
                  <details>
                    <summary className="cursor-pointer text-gold-deep">Édition avancée (textes, étapes, options, photos)</summary>
                    <form action={saveComposerJson} className="mt-2 space-y-2">
                      <input type="hidden" name="slug" value={d.slug} />
                      <textarea name="json" rows={18} defaultValue={pretty(raw!)} className="field font-mono text-xs" spellCheck={false} />
                      <p className="text-xs text-muted">Photos : clés d&apos;emplacement Médias (ex. « composer:{d.slug}:1 », « destination:{d.slug} »).</p>
                      <button className="btn btn-primary !py-2 text-sm">Enregistrer le programme</button>
                    </form>
                  </details>
                </div>
              )}
            </details>
          );
        })}
      </div>
    </div>
  );
}
