import { getBrand } from "@/lib/brand";
import type { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { hasLocale, type Locale } from "@/i18n/config";
import { aiEnabled, buildKnowledge, offlineAnswer, systemPrompt } from "@/lib/assistant";
import { clientIp, rateLimit } from "@/lib/security";

const schema = z.object({
  locale: z.string(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) }))
    .min(1)
    .max(24),
});

// Limitation de débit persistée (40 messages / h et 10 / min par client) ; l'IP n'est pas lue dans un en-tête falsifiable
async function limited(ip: string) {
  const [h, m] = await Promise.all([rateLimit(`chat:h:${ip}`, 40, 3600), rateLimit(`chat:m:${ip}`, 10, 60)]);
  return !h.ok || !m.ok;
}

let client: Anthropic | null = null;

function textResponse(text: string, status = 200) {
  return new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const ip = await clientIp();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return textResponse("Requête invalide.", 400);
  const locale: Locale = hasLocale(parsed.data.locale) ? parsed.data.locale : "fr";
  if (await limited(ip)) return textResponse(locale === "en" ? "Too many messages, please try again later." : "Trop de messages, réessayez plus tard.", 429);

  // la conversation doit commencer et finir par un message du visiteur
  const msgs = parsed.data.messages.slice(-12);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== "user") return textResponse("Requête invalide.", 400);

  // Mode hors ligne : aucune clé API configurée
  if (!aiEnabled()) return textResponse(await offlineAnswer(last.content, locale));

  client ??= new Anthropic();
  const knowledge = await buildKnowledge();

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client!.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 2000,
          // conversation courte et simple : effort bas (rapide et économique)
          output_config: { effort: "low" },
          // repli automatique côté serveur si le modèle refuse une demande
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          // prompt système stable mis en cache (seule la base de connaissances change quand l'admin modifie le catalogue)
          system: [{ type: "text", text: systemPrompt(knowledge, (await getBrand()).name), cache_control: { type: "ephemeral" } }],
          messages: msgs.map((m) => ({ role: m.role, content: m.content })),
        });
        stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode(locale === "en" ? "Sorry, I can't help with that request." : "Désolé, je ne peux pas répondre à cette demande."));
        }
      } catch (e) {
        console.error("[chat] erreur API", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
        // repli sur le mode hors ligne en cas d'erreur (clé invalide, quota, réseau…)
        controller.enqueue(encoder.encode(await offlineAnswer(last.content, locale)));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
