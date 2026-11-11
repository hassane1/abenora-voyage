/**
 * Musique originale ENTRAÎNANTE pour le teaser (synthèse pure : aucun échantillon, aucun droit tiers).
 * 116 BPM : grosse caisse, darbouka synthétique, basse, plucks façon oud en mode hijaz, nappe lumineuse.
 * Usage : node scripts/make-music-teaser.mjs <durée_s> <sortie.wav>
 */
import { writeFileSync } from "node:fs";

const DUR = Number(process.argv[2] ?? 70);
const OUT = process.argv[3] ?? "video/musique-teaser.wav";
const SR = 44100;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const BPM = 116;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const FADE = 3;
const master = (t) => Math.min(1, t / 1.2) * Math.min(1, Math.max(0, (DUR - t) / FADE));
const add = (i, v, pan = 0) => {
  if (i < 0 || i >= N) return;
  L[i] += v * (1 - Math.max(0, pan));
  R[i] += v * (1 + Math.min(0, pan));
};

// grosse caisse (sinus descendant)
function kick(t0, g = 0.9) {
  const s = Math.floor(t0 * SR);
  for (let k = 0; k < SR * 0.35; k++) {
    const t = k / SR;
    const f = 45 + 110 * Math.exp(-t * 28);
    add(s + k, Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9) * g);
  }
}
// darbouka : « doum » grave et « tek » sec
function doum(t0, g = 0.5) {
  const s = Math.floor(t0 * SR);
  for (let k = 0; k < SR * 0.25; k++) {
    const t = k / SR;
    add(s + k, Math.sin(2 * Math.PI * (95 + 40 * Math.exp(-t * 30)) * t) * Math.exp(-t * 14) * g, -0.2);
  }
}
function tek(t0, g = 0.28, pan = 0.3) {
  const s = Math.floor(t0 * SR);
  let lp = 0;
  for (let k = 0; k < SR * 0.08; k++) {
    const t = k / SR;
    const n = rand() * 2 - 1;
    lp += 0.55 * (n - lp);
    add(s + k, (n - lp) * Math.exp(-t * 60) * g + Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 90) * g * 0.4, pan);
  }
}
function hat(t0, g = 0.07) {
  const s = Math.floor(t0 * SR);
  let prev = 0;
  for (let k = 0; k < SR * 0.04; k++) {
    const n = rand() * 2 - 1;
    add(s + k, (n - prev) * Math.exp(-(k / SR) * 120) * g, 0.5);
    prev = n;
  }
}
// basse (dent de scie filtrée)
function bass(t0, note, len, g = 0.32) {
  const s = Math.floor(t0 * SR);
  const f = midi(note);
  let lp = 0;
  for (let k = 0; k < SR * len; k++) {
    const t = k / SR;
    const saw = 2 * ((f * t) % 1) - 1;
    lp += 0.08 * (saw - lp);
    add(s + k, lp * Math.min(1, t / 0.01) * Math.exp(-t * 2.2) * g);
  }
}
// pluck façon oud (Karplus-Strong)
function pluck(t0, note, g = 0.22, pan = 0) {
  const f = midi(note);
  const period = Math.max(2, Math.round(SR / f));
  const buf = Float32Array.from({ length: period }, () => rand() * 2 - 1);
  const s = Math.floor(t0 * SR);
  let idx = 0;
  for (let k = 0; k < SR * 1.1; k++) {
    const a = buf[idx];
    const b = buf[(idx + 1) % period];
    buf[idx] = 0.497 * (a + b);
    add(s + k, a * g * Math.exp(-(k / SR) * 2.4), pan);
    idx = (idx + 1) % period;
  }
}
// nappe lumineuse (accords tenus)
function pad(t0, notes, len, g = 0.05) {
  const s = Math.floor(t0 * SR);
  for (let k = 0; k < SR * len; k++) {
    const t = k / SR;
    const e = Math.min(1, t / 0.6) * Math.min(1, (len - t) / 0.6);
    let v = 0;
    for (const n of notes) v += Math.sin(2 * Math.PI * midi(n) * t) + 0.3 * Math.sin(2 * Math.PI * midi(n) * 2.003 * t);
    add(s + k, v * e * g, Math.sin(t) * 0.3);
  }
}

// grille harmonique (ré hijaz → sol mineur → do → ré), une mesure par accord
const prog = [
  { root: 38, pad: [62, 66, 69] },
  { root: 43, pad: [62, 67, 70] },
  { root: 36, pad: [60, 64, 67] },
  { root: 38, pad: [62, 66, 69] },
];
// motif mélodique hijaz sur ré : ré mi♭ fa♯ sol la si♭ do ré
const scale = [62, 63, 66, 67, 69, 70, 72, 74];
const motif = [0, 2, 3, 4, 3, 2, 1, 0, 4, 5, 4, 3, 2, 3, 1, 0];

const bars = Math.ceil(DUR / BAR);
for (let b = 0; b < bars; b++) {
  const t = b * BAR;
  const ch = prog[b % prog.length];
  const intro = b < 2;
  pad(t, ch.pad, BAR + 0.1, intro ? 0.06 : 0.045);
  for (let q = 0; q < 4; q++) {
    const tq = t + q * BEAT;
    if (!intro) kick(tq, q === 0 ? 0.95 : 0.75);
    if (b >= 1) {
      hat(tq + BEAT / 2);
      hat(tq + BEAT * 0.75, 0.04);
    }
    if (!intro) {
      if (q === 0 || q === 2) doum(tq + BEAT * 0.5, 0.35);
      tek(tq + BEAT * 0.25, 0.18, -0.3);
      tek(tq + BEAT * 0.75, 0.22, 0.35);
    }
    if (b >= 1) bass(tq, ch.root + (q === 3 ? 7 : 0), BEAT * 0.9, intro ? 0.18 : 0.3);
  }
  if (b >= 2) for (let e = 0; e < 8; e++) pluck(t + e * (BEAT / 2), scale[motif[(b * 8 + e) % motif.length]] + (b % 8 >= 4 ? 12 : 0), 0.16, e % 2 ? 0.3 : -0.3);
}

// normalisation, saturation douce et enveloppe générale
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const m = master(i / SR) / (peak || 1);
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * m * 1.2) * 0.9 * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * m * 1.2) * 0.9 * 32767), 46 + i * 4);
}
writeFileSync(OUT, buf);
console.log("✔", OUT, DUR, "s");
