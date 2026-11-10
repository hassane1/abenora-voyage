/**
 * Musique originale générée par synthèse (aucun échantillon, aucun droit d'auteur tiers).
 * Ambiance « désert » : bourdon en ré, mélodie de type oud (synthèse Karplus-Strong) en mode hijaz,
 * percussions de bendir synthétisées. Usage : node scripts/make-music.mjs <durée_en_secondes> <sortie.wav>
 */
import { writeFileSync } from "node:fs";

const DUR = Number(process.argv[2] ?? 156);
const OUT = process.argv[3] ?? "video/musique-originale.wav";
const SR = 44100;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

const BPM = 84;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// enveloppe globale de la structure : intro, entrée des percussions, mélodie, pont, final
const DRUM_IN = BAR * 3;
const MELO_IN = BAR * 6;
const BREAK_A = DUR * 0.55;
const BREAK_B = BREAK_A + BAR * 4;
const FADE = 7;
const master = (t) => Math.min(1, t / 4) * Math.min(1, Math.max(0, (DUR - t) / FADE));

// 1. Bourdon (ré + la) avec léger battement et filtre doux
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.05 * t);
  const d = Math.sin(2 * Math.PI * midi(38) * t) * 0.5 + Math.sin(2 * Math.PI * midi(38) * 1.003 * t) * 0.35 + Math.sin(2 * Math.PI * midi(45) * t) * 0.25 + Math.sin(2 * Math.PI * midi(50) * t) * 0.08;
  const v = d * 0.11 * lfo * master(t);
  L[i] += v;
  R[i] += v * 0.92;
}

// 2. Percussions de bendir : rythme maqsoum simplifié (dum tek . tek dum . tek .)
function addDrum(start, low, gain) {
  const len = Math.floor(SR * (low ? 0.6 : 0.18));
  const s0 = Math.floor(start * SR);
  for (let k = 0; k < len && s0 + k < N; k++) {
    const t = k / SR;
    let v;
    if (low) {
      const f = 55 + 45 * Math.exp(-t * 25);
      v = Math.sin(2 * Math.PI * f * t) * env(t, 0.003, 0.18) + (rand() * 2 - 1) * 0.15 * env(t, 0.001, 0.01);
    } else {
      v = (rand() * 2 - 1) * env(t, 0.001, 0.035) * 0.7 + Math.sin(2 * Math.PI * 340 * t) * env(t, 0.001, 0.05) * 0.4;
    }
    const m = master(start) * gain;
    L[s0 + k] += v * m * (low ? 0.42 : 0.2);
    R[s0 + k] += v * m * (low ? 0.42 : 0.24);
  }
}
const pattern = [
  [0, true], [1, false], [3, false], [4, true], [6, false], // en croches sur une mesure (8 croches)
];
for (let bar = 0; bar * BAR < DUR; bar++) {
  const t0 = bar * BAR;
  if (t0 < DRUM_IN || (t0 >= BREAK_A && t0 < BREAK_B) || t0 > DUR - FADE) continue;
  for (const [step, low] of pattern) addDrum(t0 + step * (BEAT / 2) + (rand() - 0.5) * 0.008, low, 0.85 + rand() * 0.15);
  if (bar % 4 === 3) addDrum(t0 + 7 * (BEAT / 2), false, 0.7); // petite relance
}

// 3. Mélodie « oud » (Karplus-Strong) en ré hijaz : ré mi♭ fa♯ sol la si♭ do
function pluck(start, note, dur, gain, pan) {
  const f = midi(note);
  const period = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(period);
  for (let k = 0; k < period; k++) buf[k] = rand() * 2 - 1;
  const len = Math.floor(SR * Math.min(dur + 0.8, 2.5));
  const s0 = Math.floor(start * SR);
  let idx = 0;
  let prev = 0;
  for (let k = 0; k < len && s0 + k < N; k++) {
    const cur = buf[idx];
    const nxt = buf[(idx + 1) % period];
    const v = 0.4985 * (cur + nxt);
    buf[idx] = v;
    idx = (idx + 1) % period;
    const out = (v + prev) * 0.5; // adoucit le timbre
    prev = v;
    const g = gain * master(start) * Math.exp(-k / SR / 1.6);
    L[s0 + k] += out * g * (1 - pan);
    R[s0 + k] += out * g * pan;
  }
}
// phrases (degré relatif à ré4 = 62) : [demi-temps, note, durée en demi-temps]
const H = { D: 62, Eb: 63, Fs: 66, G: 67, A: 69, Bb: 70, C: 72, D5: 74, Eb5: 75 };
const phrases = [
  [[0, H.A, 2], [2, H.Bb, 1], [3, H.A, 1], [4, H.G, 2], [6, H.Fs, 2], [8, H.Eb, 1], [9, H.Fs, 1], [10, H.D, 6]],
  [[0, H.D, 1], [1, H.Eb, 1], [2, H.Fs, 2], [4, H.G, 1], [5, H.A, 1], [6, H.Bb, 2], [8, H.A, 2], [10, H.G, 1], [11, H.Fs, 1], [12, H.G, 4]],
  [[0, H.C, 2], [2, H.Bb, 1], [3, H.A, 1], [4, H.Bb, 2], [6, H.A, 1], [7, H.G, 1], [8, H.Fs, 2], [10, H.Eb, 2], [12, H.D, 4]],
  [[0, H.A, 1], [1, H.D5, 3], [4, H.C, 1], [5, H.Bb, 1], [6, H.A, 2], [8, H.G, 1], [9, H.Fs, 1], [10, H.Eb, 1], [11, H.Fs, 1], [12, H.D, 4]],
];
let t = MELO_IN;
let p = 0;
while (t < DUR - FADE - BAR) {
  if (t >= BREAK_A && t < BREAK_B) {
    // pont : notes longues espacées, sans percussions
    pluck(t, H.A, 4, 0.35, 0.4);
    pluck(t + BAR, H.Fs, 4, 0.3, 0.6);
    t += BAR * 2;
    continue;
  }
  const ph = phrases[p % phrases.length];
  for (const [step, note, len] of ph) {
    pluck(t + step * (BEAT / 2), note, len * (BEAT / 2), 0.42, 0.35 + rand() * 0.3);
    if (p % 2 === 1 && rand() < 0.35) pluck(t + step * (BEAT / 2) + 0.012, note - 12, len * (BEAT / 2), 0.18, 0.5); // doublure grave
  }
  t += BAR * 2;
  p++;
}

// 4. Réverbération simple (retards multiples) puis normalisation
function reverb(ch, mix) {
  const taps = [0.031, 0.047, 0.071, 0.113, 0.161].map((s) => Math.floor(s * SR));
  const out = new Float32Array(ch.length);
  for (let i = 0; i < ch.length; i++) {
    let v = ch[i];
    // somme des gains < 1 : réverbération stable sur toute la durée
    for (let k = 0; k < taps.length; k++) if (i >= taps[k]) v += out[i - taps[k]] * (0.17 - k * 0.025) * mix;
    out[i] = v;
  }
  return out;
}
const RL = reverb(L, 0.9);
const RR = reverb(R, 0.9);
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(RL[i]), Math.abs(RR[i]));
const norm = 0.89 / peak;

// 5. Écriture WAV 16 bits stéréo
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
  const l = Math.tanh(RL[i] * norm * 1.1);
  const r = Math.tanh(RR[i] * norm * 1.1);
  buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
writeFileSync(OUT, buf);
console.log(`✔ Musique : ${OUT} (${DUR.toFixed(1)} s)`);
