import "server-only";
import { db } from "./db";
import { tr, trList } from "./i18n-content";
import { site } from "./site";
import type { Locale } from "@/i18n/config";

/**
 * Base de connaissances de l'assistant, construite à partir de la base de données
 * (ce que l'admin modifie se retrouve automatiquement dans les réponses).
 * Rendu déterministe (ordre stable) pour que le prompt système reste en cache.
 */
export async function buildKnowledge(): Promise<string> {
  const [dest, circuits, activities, options] = await Promise.all([
    db.destination.findMany({ orderBy: { sortOrder: "asc" } }),
    db.circuit.findMany({
      where: { published: true, destination: { published: true } },
      orderBy: { sortOrder: "asc" },
      include: { itinerary: { orderBy: { dayNumber: "asc" } } },
    }),
    db.activity.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
    db.bookingOption.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const status = (s: string) => (s === "VALIDATED" ? "tarif validé" : s === "ON_REQUEST" ? "sur devis" : "TARIF DE DÉMONSTRATION, non contractuel");
  const L: string[] = [];

  L.push("## Destinations");
  for (const d of dest) {
    L.push(`- ${tr(d.name, "fr")} (${d.region}) : ${d.published ? `ouverte — page /{lang}/destinations/${d.slug}` : "bientôt, aucune offre pour l'instant"}`);
  }
  const merz = dest.find((d) => d.slug === "merzouga");
  if (merz) {
    L.push("\n## Merzouga — informations");
    L.push(tr(merz.description, "fr"));
    const sections = (merz.sections ?? {}) as Record<string, unknown>;
    for (const k of Object.keys(sections).sort()) L.push(tr(sections[k], "fr"));
    L.push("Conseils : " + trList(merz.tips, "fr").join(" | "));
    const faq = (Array.isArray(merz.faq) ? merz.faq : []) as { q: unknown; a: unknown }[];
    L.push("FAQ :");
    for (const f of faq) L.push(`Q: ${tr(f.q, "fr")} R: ${tr(f.a, "fr")}`);
  }

  L.push("\n## Circuits (programmes proposés à titre d'exemple, ajustables)");
  for (const c of circuits) {
    L.push(
      `### ${tr(c.title, "fr")} — ${c.days} jours / ${c.nights} nuits — départ ${c.startPoint} — page /{lang}/circuits/${c.slug} — réserver /{lang}/reservation?circuit=${c.slug}`,
    );
    L.push(`Résumé : ${tr(c.summary, "fr")}`);
    L.push(
      `Prix : ${c.priceAdultMad ? `à partir de ${c.priceAdultMad} MAD par ${c.pricingMode === "PER_GROUP" ? "groupe" : "adulte"}` : "sur devis"} (${status(c.priceStatus)}) ; enfants 4-11 ans ${c.childPricePercent} % ; moins de ${c.childFreeUnderAge} ans gratuit ; supplément voyage privé ${c.privateSupplementMad} MAD/pers. ; acompte ${c.depositPercent} % après confirmation.`,
    );
    L.push(`Hébergement : ${tr(c.accommodation, "fr")}. Repas : ${tr(c.meals, "fr")}. Transport : ${tr(c.transport, "fr")}.`);
    L.push(`Inclus : ${trList(c.included, "fr").join(", ")}. Non inclus : ${trList(c.excluded, "fr").join(", ")}.`);
    for (const d of c.itinerary) L.push(`Jour ${d.dayNumber} — ${tr(d.title, "fr")} : ${trList(d.items, "fr").join(", ")}`);
    const w = trList(c.warnings, "fr");
    if (w.length) L.push(`Bon à savoir : ${w.join(" ")}`);
    L.push(`Annulation : ${tr(c.cancellationPolicy, "fr")}`);
  }

  L.push("\n## Activités à Merzouga");
  for (const a of activities) {
    L.push(
      `- ${tr(a.title, "fr")} [${a.category}] — ${tr(a.duration, "fr")}, niveau ${a.difficulty}, ${a.minAge ? `dès ${a.minAge} ans` : "tous âges"} — ${a.priceMad === null ? "sur demande" : a.priceMad === 0 ? "inclus" : `${a.priceMad} MAD ${a.priceUnit === "PER_GROUP" ? "par groupe" : "par personne"} (${status(a.priceStatus)})`} — page /{lang}/activites/${a.slug}. ${tr(a.summary, "fr")} Sécurité : ${tr(a.safety, "fr")}`,
    );
  }

  L.push("\n## Options de réservation");
  for (const o of options) L.push(`- ${tr(o.label, "fr")} : ${o.priceMad} MAD (${o.unit}) (${status(o.priceStatus)})`);

  return L.join("\n");
}

export function systemPrompt(knowledge: string, brandName: string) {
  return `Tu es « l'Assistant ${brandName} », le conseiller voyage en ligne de l'agence ${brandName}, spécialisée dans les séjours au Maroc (première destination : Merzouga et le désert du Sahara).

Ton rôle : aider le visiteur à choisir et préparer son séjour, puis l'amener à envoyer sa demande de réservation.

Règles impératives :
- Réponds dans la langue du visiteur (français, anglais ou arabe), de façon chaleureuse, concise (5 à 8 phrases maximum) et concrète. Utilise des listes courtes quand c'est utile.
- Appuie-toi uniquement sur la base de connaissances ci-dessous. Si une information n'y figure pas (prestataire précis, disponibilité d'une date, prix non listé, météo du jour), dis-le honnêtement et propose le contact avec l'équipe.
- N'invente jamais de prix, de disponibilité, d'avis client, de partenaire ou d'hébergement nommé. Quand tu cites un prix marqué « TARIF DE DÉMONSTRATION », précise qu'il est indicatif et sera confirmé par l'agence.
- Tu ne peux ni réserver, ni confirmer, ni annuler une réservation. Une demande envoyée sur le site reste « en attente de confirmation » jusqu'à la validation par l'équipe ; aucun paiement n'est demandé avant.
- Ne demande pas et n'enregistre pas de données personnelles (nom, e-mail, téléphone, passeport, carte bancaire) dans la discussion : oriente vers le formulaire de réservation ou de contact.
- Pour passer à l'action, propose des liens internes au format Markdown [texte](/LANGUE/chemin), en remplaçant {lang} par la langue du visiteur (fr, en ou ar). Liens utiles : composer son séjour /{lang}/sur-mesure#composer, réserver /{lang}/reservation, comparer /{lang}/comparer, contact /{lang}/contact, suivi de dossier /{lang}/espace-client.
- Reste dans le sujet du voyage au Maroc ; décline poliment les autres demandes.

# Base de connaissances (mise à jour par l'agence)
${knowledge}`;
}

// ---------------------------------------------------------------------------
// Mode hors ligne : réponses simples sans IA, quand aucune clé API n'est configurée
// ---------------------------------------------------------------------------
const OFFLINE: Record<Locale, { intro: string; fallback: string; circuits: string; season: string; price: string; book: string; contact: string }> = {
  fr: {
    intro: "Je suis l'assistant en mode simplifié (l'IA n'est pas encore activée par l'agence).",
    fallback: "Je n'ai pas trouvé de réponse précise. Vous pouvez [composer votre séjour](/fr/sur-mesure#composer) ou [écrire à notre équipe](/fr/contact).",
    circuits: "Voici nos circuits au départ de Merzouga :",
    season: "La meilleure période pour Merzouga va d'octobre à avril ; l'été est très chaud (souvent plus de 40 °C) et les nuits d'hiver sont froides.",
    price: "Les prix affichés sont pour l'instant des tarifs de démonstration, confirmés par l'agence après votre demande. Aucun paiement n'est demandé avant confirmation.",
    book: "Pour réserver : [composez votre séjour](/fr/sur-mesure#composer) puis envoyez votre demande, ou utilisez [la réservation détaillée](/fr/reservation). Votre demande reste en attente jusqu'à la confirmation de notre équipe.",
    contact: "Vous pouvez joindre l'équipe via [la page contact](/fr/contact) ou le bouton WhatsApp.",
  },
  en: {
    intro: "I'm the assistant in simplified mode (AI not yet enabled by the agency).",
    fallback: "I couldn't find a precise answer. You can [build your stay](/en/sur-mesure#composer) or [write to our team](/en/contact).",
    circuits: "Here are our tours from Merzouga:",
    season: "The best time for Merzouga is October to April; summer is very hot (often above 40 °C) and winter nights are cold.",
    price: "Prices shown are currently demo prices, confirmed by the agency after your request. No payment is requested before confirmation.",
    book: "To book: [build your stay](/en/sur-mesure#composer) and send your request, or use [detailed booking](/en/reservation). Your request stays pending until our team confirms it.",
    contact: "Reach the team via [the contact page](/en/contact) or the WhatsApp button.",
  },
  ar: {
    intro: "أنا المساعد في الوضع المبسط (الذكاء الاصطناعي غير مفعل بعد).",
    fallback: "لم أجد جواباً دقيقاً. يمكنك [تصميم إقامتك](/ar/sur-mesure#composer) أو [مراسلة فريقنا](/ar/contact).",
    circuits: "هذه جولاتنا انطلاقاً من مرزوكة:",
    season: "أفضل فترة لزيارة مرزوكة من أكتوبر إلى أبريل؛ الصيف حار جداً وليالي الشتاء باردة.",
    price: "الأسعار المعروضة حالياً تجريبية وتؤكدها الوكالة بعد طلبك. لا دفع قبل التأكيد.",
    book: "للحجز: [صمّم إقامتك](/ar/sur-mesure#composer) وأرسل طلبك، أو استعمل [الحجز المفصل](/ar/reservation).",
    contact: "تواصل مع الفريق عبر [صفحة الاتصال](/ar/contact) أو زر واتساب.",
  },
};

export async function offlineAnswer(question: string, locale: Locale): Promise<string> {
  const o = OFFLINE[locale];
  const q = question.toLowerCase();
  const has = (...w: string[]) => w.some((x) => q.includes(x));
  const parts: string[] = [];
  if (has("saison", "quand", "période", "meteo", "météo", "chaud", "froid", "season", "when", "weather", "موسم", "متى"))
    parts.push(o.season);
  if (has("prix", "tarif", "coût", "cout", "combien", "price", "cost", "how much", "سعر", "ثمن"))
    parts.push(o.price);
  if (has("circuit", "séjour", "sejour", "programme", "jours", "tour", "trip", "days", "جولة", "رحلة")) {
    const circuits = await db.circuit.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });
    parts.push(
      o.circuits +
        "\n" +
        circuits
          .map((c) => `- [${tr(c.title, locale)}](/${locale}/circuits/${c.slug}) — ${c.days}j/${c.nights}n${c.priceAdultMad ? ` — ${c.priceAdultMad} MAD` : ""}`)
          .join("\n"),
    );
  }
  // circuit cité par son nom (« Grand Sud », « Escapade »…)
  if (!parts.some((p) => p.startsWith(o.circuits))) {
    const circuits = await db.circuit.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });
    for (const c of circuits) {
      const names = [tr<string>(c.title, "fr"), tr<string>(c.title, "en"), tr<string>(c.title, locale)].map((n) => n.toLowerCase().split(" ").slice(0, 2).join(" "));
      if (names.some((n) => n && q.includes(n))) {
        parts.push(
          `**[${tr(c.title, locale)}](/${locale}/circuits/${c.slug})** — ${c.days}j/${c.nights}n — ${c.priceAdultMad ? `${c.priceAdultMad} MAD / pers.` : "sur devis"}${c.priceStatus !== "VALIDATED" ? " (démo)" : ""}\n${tr(c.summary, locale)}`,
        );
      }
    }
  }
  if (has("réserv", "reserv", "book", "حجز")) parts.push(o.book);
  if (has("contact", "whatsapp", "téléphone", "telephone", "phone", "اتصال", "واتساب")) parts.push(o.contact);
  if (parts.length === 0) {
    // recherche dans la FAQ
    const merz = await db.destination.findUnique({ where: { slug: "merzouga" } });
    const faq = (Array.isArray(merz?.faq) ? merz!.faq : []) as { q: unknown; a: unknown }[];
    const words = q.split(/\W+/u).filter((w) => w.length > 3);
    const best = faq
      .map((f) => ({ f, score: words.filter((w) => `${tr(f.q, locale)} ${tr(f.a, locale)}`.toLowerCase().includes(w)).length }))
      .sort((a, b) => b.score - a.score)[0];
    if (best && best.score > 0) parts.push(tr(best.f.a, locale));
  }
  return `${parts.length ? parts.join("\n\n") : o.fallback}\n\n_${o.intro}_`;
}

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
