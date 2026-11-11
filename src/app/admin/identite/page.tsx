import { requireAdmin } from "@/lib/auth";
import { getBrand } from "@/lib/brand";
import { saveBrand } from "../config-actions";
import { Card, Input, PageTitle } from "../ui";

export default async function BrandPage({ searchParams }: PageProps<"/admin/identite">) {
  await requireAdmin("settings.write");
  const sp = await searchParams;
  const b = await getBrand();
  return (
    <div className="max-w-5xl">
      <PageTitle title="Identité & coordonnées" />
      {sp.ok && <p className="mb-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Enregistré. Le site public est mis à jour immédiatement.</p>}
      {sp.error && <p role="alert" className="mb-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Logo refusé : formats PNG, JPEG ou WebP uniquement, 1 Mo maximum (le SVG est refusé pour des raisons de sécurité).</p>}
      <form action={saveBrand} className="space-y-6">
        <Card title="Marque">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nom de l'agence" name="name" defaultValue={b.name} required maxLength={80} />
              <Input label="Préfixe des numéros de dossier (2 à 5 lettres)" name="bookingPrefix" defaultValue={b.bookingPrefix} maxLength={5} pattern="[A-Za-z]{2,5}" />
              <Input label="Slogan (FR)" name="tagline.fr" defaultValue={b.tagline.fr} />
              <Input label="Slogan (EN)" name="tagline.en" defaultValue={b.tagline.en} />
              <label className="block sm:col-span-2" dir="rtl">
                <span className="label">الشعار (AR)</span>
                <input name="tagline.ar" defaultValue={b.tagline.ar} className="field !py-2 text-sm" />
              </label>
            </div>
            <div className="w-48">
              <span className="label">Logo</span>
              <div className="grid h-28 place-items-center rounded-xl bg-night p-3">
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logoUrl} alt="Logo actuel" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-white/60">Monogramme par défaut</span>
                )}
              </div>
              <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" className="mt-2 w-full text-xs" />
              {b.logoUrl && (
                <label className="mt-1 flex items-center gap-1 text-xs">
                  <input type="checkbox" name="removeLogo" /> Retirer le logo
                </label>
              )}
            </div>
          </div>
        </Card>
        <Card title="Coordonnées (affichées dans le pied de page, la page Contact et les e-mails)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Téléphone" name="phone" defaultValue={b.phone} placeholder="+212 …" />
            <Input label="WhatsApp (format international, chiffres)" name="whatsapp" defaultValue={b.whatsapp} placeholder="2126XXXXXXXX" />
            <Input label="E-mail de contact" name="email" type="email" defaultValue={b.email} />
            <Input label="Adresse" name="address" defaultValue={b.address} />
            <Input label="Ville" name="city" defaultValue={b.city} />
            <Input label="Horaires" name="hours" defaultValue={b.hours} placeholder="Lun–sam, 9 h–19 h" />
          </div>
        </Card>
        <Card title="Réseaux sociaux (liens https)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Instagram" name="social.instagram" defaultValue={b.socials.instagram} placeholder="https://instagram.com/…" />
            <Input label="Facebook" name="social.facebook" defaultValue={b.socials.facebook} />
            <Input label="TikTok" name="social.tiktok" defaultValue={b.socials.tiktok} />
            <Input label="YouTube" name="social.youtube" defaultValue={b.socials.youtube} />
          </div>
        </Card>
        <Card title="Informations légales (mentions légales et pied de page)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Raison sociale" name="legal.companyName" defaultValue={b.legal.companyName} />
            <Input label="Forme juridique" name="legal.legalForm" defaultValue={b.legal.legalForm} placeholder="SARL…" />
            <Input label="Capital" name="legal.capital" defaultValue={b.legal.capital} />
            <Input label="Registre de commerce (RC)" name="legal.rc" defaultValue={b.legal.rc} />
            <Input label="ICE" name="legal.ice" defaultValue={b.legal.ice} />
            <Input label="Identifiant fiscal (IF)" name="legal.if" defaultValue={b.legal.ifNumber} />
            <Input label="Patente" name="legal.patente" defaultValue={b.legal.patente} />
            <Input label="N° de licence d'agence de voyages" name="legal.license" defaultValue={b.legal.license} />
            <Input label="N° de déclaration ou d'autorisation CNDP" name="legal.cndp" defaultValue={b.legal.cndp} placeholder="D-W-xxx/2026" />
            <Input label="Hébergeur du site (nom et adresse)" name="legal.host" defaultValue={b.legal.host} />
          </div>
          <p className="mt-3 text-xs text-muted">Ces informations ne sont affichées que si elles sont renseignées. Elles doivent correspondre aux documents officiels de l&apos;agence.</p>
        </Card>
        <Card title="Conversion informative des prix (EUR / USD)">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="1 EUR = … MAD" name="rate.eur" type="number" step="0.0001" min={0} defaultValue={b.rates.eur ?? ""} />
            <Input label="1 USD = … MAD" name="rate.usd" type="number" step="0.0001" min={0} defaultValue={b.rates.usd ?? ""} />
            <Input label="Date du taux" name="rate.date" type="date" defaultValue={b.rates.date} />
          </div>
          <p className="mt-3 text-xs text-muted">Laissez vide pour ne rien afficher. La conversion est présentée comme indicative ; le paiement reste en MAD. Mettez le taux à jour régulièrement (source : Bank Al-Maghrib).</p>
        </Card>
        <button className="btn btn-primary">Enregistrer</button>
      </form>
    </div>
  );
}
