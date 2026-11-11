/**
 * Teaser publicitaire « Bientôt en ligne » (clients finaux) : scènes animées à partir de vraies photos
 * et de captures du site SANS prix (scripts/teaser-captures.mjs), voix off et musique originale.
 * Usage : TEASER_LOCALE=fr|ar TEASER_FORMAT=h|v [TEASER_VOICE=voix-v2] [TEASER_SUFFIX=-v2] node scripts/teaser-render.mjs
 * TEASER_VOICE : dossier de voix (voix-<langue> par défaut) ; un enregistrement humain se dépose de la même façon (voix.json { scène: { file, ms } }).
 * Résultat : video/benani-travel-teaser-bientot-en-ligne[-ar][-vertical]-20261111.mp4 (+ -leger)
 */
import { chromium } from "playwright";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const LOC = process.env.TEASER_LOCALE === "ar" ? "ar" : "fr";
const VERT = process.env.TEASER_FORMAT === "v";
const W = VERT ? 1080 : 1920;
const H = VERT ? 1920 : 1080;
const ROOT = path.resolve(".");
const DIR = path.join(ROOT, "video", "teaser-20261111");
const CAPS = path.join(ROOT, "video", "teaser-captures");
const PHOTOS = path.join(ROOT, "public", "uploads", "libres");
const scenes = JSON.parse(readFileSync(path.join(DIR, "scenes.json"), "utf8"));
const voix = JSON.parse(readFileSync(path.join(DIR, `${process.env.TEASER_VOICE ?? "voix"}-${LOC}`, "voix.json"), "utf8"));
const TAG = "20261111";
const NAME = `benani-travel-teaser-bientot-en-ligne${process.env.TEASER_SUFFIX ?? ""}${LOC === "ar" ? "-ar" : ""}${VERT ? "-vertical" : ""}-${TAG}`;

// images en data URI (JPEG compressé), dimensionnées pour le format
const dataUri = async (file, width) => `data:image/jpeg;base64,${(await sharp(file).resize({ width, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()).toString("base64")}`;
const logo = await dataUri(path.join(ROOT, "public", "uploads", "brand", "benani-travel-logo.jpg"), 600);
const bgPhoto = await dataUri(path.join(PHOTOS, "hero.webp"), 1600);
const rtlMirror = (l) => l === "ar"; // le site arabe est en miroir : le point focal aussi
const assets = [];
for (const s of scenes) {
  const a = { ...s, txt: s[LOC], voice: voix[s.id] };
  if (s.photos) a.imgs = await Promise.all(s.photos.map((p) => dataUri(path.join(PHOTOS, p), VERT ? 1400 : 2000)));
  if (s.shot) {
    const file = path.join(CAPS, `${LOC}-${VERT ? "mobile" : "desktop"}-${s.shot}.png`);
    a.img = await dataUri(file, VERT ? 975 : 2160);
    const m = await sharp(file).metadata();
    const [iw, ih] = VERT ? [688, 1048] : [972, 612];
    const F = { composer: [0.3, 0.62, 1.7], gammes: [0.29, 0.34, 1.75], pack: [0.29, 0.6, 1.9], programme: [0.72, 0.42, 1.6], "espace-client": [0.36, 0.3, 1.5], visas: [0.42, 0.45, 1.12], contact: [0.5, 0.48, 1.15], destinations: [0.5, 0.5, 1.05] };
    const FV = { composer: [0.5, 0.55, 1], gammes: [0.5, 0.3, 1], pack: [0.5, 0.62, 1], programme: [0.5, 0.45, 1], "espace-client": [0.5, 0.3, 1], visas: [0.5, 0.4, 1], contact: [0.5, 0.35, 1], destinations: [0.5, 0.35, 1] };
    const key = s.id === "pack" ? "pack" : s.shot;
    let [fx, fy, sc] = (VERT ? FV : F)[key] ?? [0.5, 0.5, 1];
    if (rtlMirror(LOC) && !VERT) fx = 1 - fx;
    const w = iw * sc, h = (w * m.height) / m.width;
    const clamp = (v, lo) => Math.min(0, Math.max(lo, v));
    a.pos = { w, left: clamp(iw / 2 - fx * w, iw - w), top: clamp(ih / 2 - fy * h, ih - h), ox: fx * 100, oy: fy * 100 };
  }
  a.dur = Math.max(3.2, (a.voice?.ms ?? 2500) / 1000 + 0.55);
  assets.push(a);
}

const rtl = LOC === "ar";
const CSS = `
*{box-sizing:border-box;margin:0}html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0e1420}
body{font-family:${rtl ? "'Segoe UI',Tahoma,sans-serif" : "'Segoe UI',system-ui,sans-serif"};direction:${rtl ? "rtl" : "ltr"};color:#fff}
.sc{position:absolute;inset:0;opacity:0;transition:opacity .55s ease}
.sc.on{opacity:1}
.kb{position:absolute;inset:-4%;background-size:cover;background-position:center;animation:kb 7s ease-out forwards}
@keyframes kb{from{transform:scale(1.02)}to{transform:scale(1.14)}}
.shade{position:absolute;inset:0;background:linear-gradient(${VERT ? "180deg" : rtl ? "270deg" : "90deg"},rgba(14,20,32,.88) 0%,rgba(14,20,32,.55) 45%,rgba(14,20,32,.1) 100%)}
.txt{position:absolute;${VERT ? "left:70px;right:70px;top:150px" : `${rtl ? "right" : "left"}:120px;top:50%;transform:translateY(-50%);width:700px`}}
.k{display:inline-block;padding:10px 22px;border-radius:999px;background:#c9a24b;color:#0e1420;font-weight:800;font-size:${VERT ? 30 : 26}px;letter-spacing:${rtl ? 0 : ".14em"};text-transform:uppercase}
.t{font-family:${rtl ? "'Segoe UI',Tahoma,sans-serif" : "Georgia,'Times New Roman',serif"};font-weight:700;font-size:${VERT ? 96 : 80}px;line-height:1.05;margin-top:26px;text-shadow:0 6px 30px rgba(0,0,0,.45)}
.s{font-size:${VERT ? 44 : 38}px;line-height:1.3;margin-top:22px;color:#e8d3a0}
.anim .t{animation:up .8s cubic-bezier(.2,1,.3,1) both .15s}.anim .s{animation:up .8s cubic-bezier(.2,1,.3,1) both .35s}.anim .k{animation:up .7s both}
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
.fade{position:absolute;inset:0;opacity:0;transition:opacity .9s}.fade.on{opacity:1}
.dev{position:absolute;overflow:hidden;background:#fff;box-shadow:0 40px 120px rgba(0,0,0,.55);border:${VERT ? 16 : 14}px solid #111;
  ${VERT ? "left:50%;bottom:110px;width:720px;height:1080px;margin-left:-360px;border-radius:70px" : `${rtl ? "left" : "right"}:70px;top:50%;width:1000px;height:640px;margin-top:-320px;border-radius:28px`}}
.dev img{position:absolute;max-width:none;animation:zoom 7.5s ease-out forwards}
@keyframes zoom{from{transform:scale(1)}to{transform:scale(1.07)}}
.blur{position:absolute;inset:-40px;background-size:cover;background-position:center;filter:blur(28px) brightness(.45) saturate(1.2)}
.logo{width:${VERT ? 420 : 340}px;height:${VERT ? 420 : 340}px;border-radius:999px;box-shadow:0 0 0 6px #c9a24b,0 30px 90px rgba(201,162,75,.45);animation:pop 1.2s cubic-bezier(.2,1.3,.4,1) both}
@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;
  background:radial-gradient(circle at 50% 35%,rgba(201,162,75,.35),transparent 55%),radial-gradient(circle at 80% 90%,rgba(15,92,77,.55),transparent 50%),#0e1420}
.center .t{font-size:${VERT ? 120 : 120}px;color:#e8d3a0;margin-top:50px}
.center .brand{margin-top:18px;font-size:${VERT ? 54 : 46}px;letter-spacing:${rtl ? 0 : ".22em"};font-weight:700}
.contacts{margin-top:46px;display:flex;flex-direction:column;gap:16px;font-size:${VERT ? 42 : 36}px;direction:ltr}
.contacts span{display:inline-flex;align-items:center;justify-content:center;gap:16px}
.ico{display:inline-grid;place-items:center;width:${VERT ? 60 : 52}px;height:${VERT ? 60 : 52}px;border-radius:999px;background:#c9a24b;color:#0e1420;font-weight:900;font-size:${VERT ? 30 : 26}px}
.bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#0f5c4d,#c9a24b,#0f5c4d)}
`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const html = assets
  .map((a, i) => {
    const t = a.txt;
    if (a.kind === "logo")
      return `<div class="sc" id="s${i}"><div class="center anim"><img class="logo" src="${logo}"/><div class="t">${esc(t.t)}</div><div class="s">${esc(t.s)}</div></div><div class="bar"></div></div>`;
    if (a.kind === "outro")
      return `<div class="sc" id="s${i}"><div class="center anim"><img class="logo" src="${logo}"/><div class="brand">BENANI TRAVEL</div><div class="t" style="margin-top:20px">${esc(t.t)}</div><div class="s">${esc(t.s)}</div>
        <div class="contacts"><span><b class="ico">✆</b>06 66 89 32 62 · 06 56 03 69 66</span><span><b class="ico">W</b>WhatsApp +212 6 66 89 32 62</span><span><b class="ico">◎</b>Instagram @benani_travel</span></div></div><div class="bar"></div></div>`;
    if (a.kind === "photos")
      return `<div class="sc" id="s${i}">${a.imgs.map((im, j) => `<div class="fade${j === 0 ? " on" : ""}" data-f="${j}"><div class="kb" style="background-image:url(${im})"></div></div>`).join("")}<div class="shade"></div>
        <div class="txt anim"><span class="k">${esc(scenes[0][LOC].t)}</span><div class="t">${esc(t.t)}</div><div class="s">${esc(t.s)}</div></div><div class="bar"></div></div>`;
    const p = a.pos;
    const style = `width:${p.w}px;left:${p.left}px;top:${p.top}px;transform-origin:${p.ox}% ${p.oy}%`;
    return `<div class="sc" id="s${i}"><div class="blur" style="background-image:url(${bgPhoto})"></div>
      <div class="dev"><img src="${a.img}" style="${style}"/></div>
      <div class="txt anim" ${VERT ? "" : ""}><span class="k">${esc(scenes[0][LOC].t)}</span><div class="t">${esc(t.t)}</div><div class="s">${esc(t.s)}</div></div><div class="bar"></div></div>`;
  })
  .join("");

const RAW = path.join(ROOT, "video", `raw-${NAME}`);
rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, recordVideo: { dir: RAW, size: { width: W, height: H } } });
const page = await ctx.newPage();
const T0 = Date.now();
await page.setContent(`<!doctype html><html lang="${LOC}"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html}</body></html>`);
await page.waitForTimeout(600);
const CUES = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [i, a] of assets.entries()) {
  await page.evaluate((k) => {
    document.querySelectorAll(".sc.on").forEach((e) => e.classList.remove("on"));
    document.getElementById("s" + k).classList.add("on");
  }, i);
  if (a.voice) CUES.push({ file: a.voice.file, at: Date.now() - T0 + 250 });
  // photos : fondu enchaîné réparti sur la durée de la scène
  if (a.imgs?.length > 1) {
    const step = (a.dur * 1000) / a.imgs.length;
    for (let j = 1; j < a.imgs.length; j++) {
      await wait(step);
      await page.evaluate(([k, f]) => document.querySelectorAll(`#s${k} .fade`).forEach((e) => e.classList.toggle("on", Number(e.dataset.f) === f)), [i, j]);
    }
    await wait(step);
  } else await wait(a.dur * 1000);
}
await wait(800);
const TOTAL = (Date.now() - T0) / 1000 - 0.6;
await ctx.close();
await browser.close();

// encodage : musique entraînante + voix posées sur leur scène
const webm = path.join(RAW, readdirSync(RAW).find((f) => f.endsWith(".webm")));
const OUT = path.join(ROOT, "video", `${NAME}.mp4`);
const music = path.join(ROOT, "video", "musique-teaser.wav");
const inputs = ["-y", "-ss", "0.6", "-i", webm, "-i", music];
const parts = [`[1:a]volume=0.32,atrim=0:${TOTAL.toFixed(2)},afade=t=out:st=${Math.max(0, TOTAL - 2.5).toFixed(2)}:d=2.5[m]`];
CUES.forEach((c, i) => {
  inputs.push("-i", c.file);
  const d = Math.max(0, c.at - 600);
  parts.push(`[${i + 2}:a]aresample=48000,aformat=channel_layouts=stereo,volume=1.15,adelay=${d}|${d}[v${i}]`);
});
parts.push(`${CUES.map((_, i) => `[v${i}]`).join("")}amix=inputs=${CUES.length}:normalize=0[voix]`);
parts.push(`[m][voix]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]`);
execFileSync(ffmpeg, [...inputs, "-filter_complex", parts.join(";"), "-map", "0:v", "-map", "[a]", "-t", TOTAL.toFixed(2), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", OUT], { stdio: "ignore" });
const LIGHT = path.join(ROOT, "video", `${NAME}-leger.mp4`);
execFileSync(ffmpeg, ["-y", "-i", OUT, "-vf", VERT ? "scale=720:-2" : "scale=1280:-2", "-c:v", "libx264", "-crf", "27", "-preset", "medium", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", LIGHT], { stdio: "ignore" });
rmSync(RAW, { recursive: true, force: true });
console.log("✔", OUT, "·", LIGHT, "·", TOTAL.toFixed(1), "s");
