// ANALYSE D'UNE TRACE DE PERFORMANCE CHROME.
//
// Usage : node scripts/analyser-trace.mjs trace.json.gz
//
// La boucle du site laisse, quand `window.__mesurer = true`, une mesure
// « image-site » autour de chaque image (voir src/moteur/boucle.ts). Ce script
// les retrouve dans la trace et en tire :
//   - la cadence reelle (images par seconde), globale et par phase ;
//   - la pire cadence sur une fenetre glissante de 500 ms ;
//   - les intervalles entre images (mediane, 95e et 99e centiles, maximum) ;
//   - le cout CPU d'une image (le temps passe dans la boucle).
// Les phases sont des marques `performance.mark('phase:nom')` posees pendant
// la trace.
//
// Un piege connu : quand une image coute moins de 0,1 ms (la precision de
// l'horloge), Chrome enregistre la mesure comme un simple instant (`ph: 'n'`)
// au lieu d'un debut et d'une fin. Ces instants sont comptes comme des images.

import fs from 'node:fs';
import zlib from 'node:zlib';

const fichier = process.argv[2];
if (!fichier) {
  console.error('Usage : node scripts/analyser-trace.mjs trace.json.gz');
  process.exit(1);
}
const brut = fs.readFileSync(fichier);
const texte = fichier.endsWith('.gz') ? zlib.gunzipSync(brut).toString() : brut.toString();
const donnees = JSON.parse(texte);
const evenements = Array.isArray(donnees) ? donnees : donnees.traceEvents;

const NOMS = new Set(['image-site', 'image-ciel']);
const mesures = evenements
  .filter((e) => NOMS.has(e.name) && (e.ph === 'b' || e.ph === 'e' || e.ph === 'n'))
  .sort((a, b) => a.ts - b.ts);
const images = [];
let ouverte = null;
for (const e of mesures) {
  if (e.ph === 'n') images.push({ ts: e.ts, cout: 0.05 });
  else if (e.ph === 'b') ouverte = e;
  else if (ouverte) {
    images.push({ ts: ouverte.ts, cout: (e.ts - ouverte.ts) / 1000 });
    ouverte = null;
  }
}

const phases = evenements
  .filter((e) => typeof e.name === 'string' && e.name.startsWith('phase:'))
  .map((e) => ({ nom: e.name.slice(6), ts: e.ts }))
  .sort((a, b) => a.ts - b.ts);

const centile = (tri, p) => tri[Math.min(tri.length - 1, Math.floor(tri.length * p))];
const arrondi = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

function pireFenetre(liste) {
  let pire = Infinity;
  let j = 0;
  for (let i = 0; i < liste.length; i += 1) {
    while (liste[i].ts - liste[j].ts > 500000) j += 1;
    if (liste[i].ts - liste[0].ts >= 500000) pire = Math.min(pire, (i - j) / 0.5);
  }
  return Number.isFinite(pire) ? pire : null;
}

function bilan(nom, liste) {
  if (liste.length < 3) return { nom, images: liste.length };
  const intervalles = [];
  for (let i = 1; i < liste.length; i += 1) intervalles.push((liste[i].ts - liste[i - 1].ts) / 1000);
  const tri = [...intervalles].sort((a, b) => a - b);
  const couts = liste.map((i) => i.cout).sort((a, b) => a - b);
  const duree = (liste.at(-1).ts - liste[0].ts) / 1e6;
  return {
    nom,
    images: liste.length,
    duree: arrondi(duree),
    fps: arrondi((liste.length - 1) / duree, 1),
    pireFenetre500ms: pireFenetre(liste),
    intervalle: { p50: arrondi(centile(tri, 0.5)), p95: arrondi(centile(tri, 0.95)), p99: arrondi(centile(tri, 0.99)), max: arrondi(tri.at(-1)) },
    auDela20ms: tri.filter((v) => v > 20).length,
    coutCpu: { p50: arrondi(centile(couts, 0.5), 3), p95: arrondi(centile(couts, 0.95), 3), p99: arrondi(centile(couts, 0.99), 3), max: arrondi(couts.at(-1), 3) },
  };
}

const resultats = [bilan('tout', images)];
phases.forEach((phase, k) => {
  const fin = k + 1 < phases.length ? phases[k + 1].ts : Infinity;
  resultats.push(bilan(phase.nom, images.filter((i) => i.ts >= phase.ts && i.ts < fin)));
});

for (const r of resultats) {
  if (!r.fps) {
    console.log(`${r.nom.padEnd(14)} ${r.images} image(s)`);
    continue;
  }
  console.log(
    `${r.nom.padEnd(14)} ${String(r.images).padStart(5)} img  ${String(r.fps).padStart(5)} img/s  pire 500 ms ${r.pireFenetre500ms}  ` +
      `intervalle p95 ${r.intervalle.p95} max ${r.intervalle.max} ms  >20 ms ${r.auDela20ms}  ` +
      `CPU p50 ${r.coutCpu.p50} p99 ${r.coutCpu.p99} max ${r.coutCpu.max} ms`,
  );
}
