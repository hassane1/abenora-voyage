"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { Icon } from "./Icon";

type Msg = { role: "user" | "assistant"; content: string };

const T = {
  fr: {
    open: "Une question ? Discutons",
    title: "Assistant voyage",
    subtitle: "Conseils voyage · Maroc et international",
    hello: "Bonjour ! Je peux vous aider à choisir votre circuit, préparer votre séjour à Merzouga ou répondre à vos questions. Que souhaitez-vous savoir ?",
    placeholder: "Écrivez votre question…",
    send: "Envoyer",
    close: "Fermer",
    reset: "Nouvelle conversation",
    disclaimer: "Assistant automatique : les informations sont indicatives, seule l'agence confirme une réservation.",
    suggestions: ["Quels voyages organisez-vous ?", "Organisez-vous l'Omra ?", "Quel circuit pour 3 jours ?", "Comment réserver ?"],
    error: "La connexion a échoué. Réessayez ou écrivez-nous via la page contact.",
  },
  en: {
    open: "Questions? Let's chat",
    title: "Travel assistant",
    subtitle: "Travel advice · Morocco and abroad",
    hello: "Hello! I can help you choose a tour, plan your stay in Merzouga or answer your questions. What would you like to know?",
    placeholder: "Type your question…",
    send: "Send",
    close: "Close",
    reset: "New conversation",
    disclaimer: "Automated assistant: information is indicative; only the agency confirms a booking.",
    suggestions: ["Which trips do you organise?", "Do you organise Umrah?", "Which tour for 3 days?", "How do I book?"],
    error: "Connection failed. Try again or write to us via the contact page.",
  },
  ar: {
    open: "سؤال؟ لنتحدث",
    title: "مساعد السفر",
    subtitle: "نصائح السفر · المغرب والخارج",
    hello: "مرحباً! يمكنني مساعدتك في اختيار جولتك وتحضير إقامتك في مرزوكة أو الإجابة عن أسئلتك. ماذا تريد أن تعرف؟",
    placeholder: "اكتب سؤالك…",
    send: "إرسال",
    close: "إغلاق",
    reset: "محادثة جديدة",
    disclaimer: "مساعد آلي: المعلومات إرشادية، والوكالة وحدها تؤكد الحجز.",
    suggestions: ["ما هي الرحلات التي تنظمونها؟", "هل تنظمون العمرة؟", "أي جولة لثلاثة أيام؟", "كيف أحجز؟"],
    error: "فشل الاتصال. حاول مجدداً أو راسلنا عبر صفحة الاتصال.",
  },
};

const STORE = "rimal-chat";

/** Rendu Markdown minimal et sûr : liens internes, gras, italique, listes */
function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|_([^_]+)_/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const href = m[2];
      out.push(
        href.startsWith("/") ? (
          <Link key={`${key}-${i++}`} href={href} className="font-semibold text-terracotta underline underline-offset-2">
            {m[1]}
          </Link>
        ) : (
          <a key={`${key}-${i++}`} href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-terracotta underline">
            {m[1]}
          </a>
        ),
      );
    } else if (m[3]) out.push(<strong key={`${key}-${i++}`}>{m[3]}</strong>);
    else if (m[4]) out.push(<em key={`${key}-${i++}`} className="text-muted">{m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Rich({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, bi) => {
        // regroupe les lignes consécutives : paragraphes et listes à puces
        const groups: { list: boolean; lines: string[] }[] = [];
        for (const l of b.split("\n")) {
          const isItem = /^\s*([-•*]|\d+[.)])\s+/.test(l);
          const g = groups[groups.length - 1];
          if (g && g.list === isItem) g.lines.push(l);
          else groups.push({ list: isItem, lines: [l] });
        }
        return (
          <Fragment key={bi}>
            {groups.map((g, gi) =>
              g.list ? (
                <ul key={gi} className="my-1 list-disc space-y-0.5 ps-5">
                  {g.lines.map((l, li) => (
                    <li key={li}>{renderInline(l.replace(/^\s*([-•*]|\d+[.)])\s+/, ""), `${bi}-${gi}-${li}`)}</li>
                  ))}
                </ul>
              ) : (
                <p key={gi} className="my-1">
                  {g.lines.map((l, li) => (
                    <Fragment key={li}>
                      {li > 0 && <br />}
                      {renderInline(l.replace(/^#+\s*/, ""), `${bi}-${gi}-${li}`)}
                    </Fragment>
                  ))}
                </p>
              ),
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export default function ChatWidget({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // conversation conservée le temps de la session (navigation entre pages)
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique depuis sessionStorage
      if (Array.isArray(saved)) setMsgs(saved.slice(-24));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-24)));
    } catch {}
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: q.slice(0, 1500) }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, messages: history.filter((m) => m.content) }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMsgs([...history, { role: "assistant", content: acc }]);
      }
      if (!acc) setMsgs([...history, { role: "assistant", content: t.error }]);
    } catch {
      setMsgs([...history, { role: "assistant", content: t.error }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-40 end-4 z-30 flex items-center gap-2 rounded-full bg-night py-3 pe-5 ps-3 text-sm font-semibold text-white shadow-2xl ring-4 ring-white/60 transition hover:scale-105 lg:bottom-24 lg:end-5"
          aria-label={t.open}
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-sand text-night">
            <Icon name="sparkle" className="h-5 w-5" />
            <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-night" />
          </span>
          <span className="hidden sm:inline">{t.open}</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={t.title}
          className="no-print fixed inset-x-2 bottom-20 z-50 flex max-h-[78svh] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(20,40,63,0.55)] ring-1 ring-night/10 sm:inset-x-auto sm:end-5 sm:w-[400px] lg:bottom-5"
        >
          <header className="flex items-center gap-3 bg-night px-4 py-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sand text-night">
              <Icon name="sparkle" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-semibold leading-tight">{t.title}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> {t.subtitle}
              </p>
            </div>
            {msgs.length > 0 && (
              <button type="button" onClick={() => setMsgs([])} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white" title={t.reset} aria-label={t.reset}>
                <Icon name="plus" className="h-5 w-5 rotate-45" />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label={t.close}>
              <Icon name="minus" className="h-5 w-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-ivory px-4 py-4 text-sm leading-relaxed" aria-live="polite">
            <div className="max-w-[88%] rounded-2xl rounded-ss-sm bg-white px-4 py-3 text-ink shadow-sm">{t.hello}</div>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {t.suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-night ring-1 ring-night/15 transition hover:bg-night hover:text-white">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ms-auto max-w-[85%] rounded-2xl rounded-se-sm bg-night px-4 py-2.5 text-white">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="max-w-[92%] rounded-2xl rounded-ss-sm bg-white px-4 py-3 text-ink shadow-sm">
                  {m.content ? (
                    <Rich text={m.content} />
                  ) : (
                    <span className="flex gap-1 py-1" aria-label="…">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-sand" style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </span>
                  )}
                </div>
              ),
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-night/10 bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-2xl bg-ivory p-1.5 ring-1 ring-night/10 focus-within:ring-2 focus-within:ring-sand">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={1500}
                placeholder={t.placeholder}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
                aria-label={t.placeholder}
              />
              <button type="submit" disabled={busy || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-terracotta text-white transition hover:bg-terracotta-dark disabled:opacity-40" aria-label={t.send}>
                <Icon name="arrow" className="h-5 w-5 rtl:rotate-180" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted">{t.disclaimer}</p>
          </form>
        </section>
      )}
    </>
  );
}
