// LES IMAGES D'UNE TRACE DE PERFORMANCE CHROME.
//
// Usage : node scripts/images-de-trace.mjs trace.json.gz dossier [pas_ms] [phase]
//
// Une trace enregistree par Chrome contient des captures d'ecran, environ une
// par image affichee. Ce script les extrait, une tous les `pas_ms`
// millisecondes (150 par defaut), a partir du debut de la trace ou de la marque
// `phase:<nom>` si elle est donnee. Utile pour voir un mouvement trop rapide
// pour une capture ordinaire (une intro, une transition).

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const [, , fichier, dossier, pasArg = '150', phase] = process.argv;
if (!fichier || !dossier) {
  console.error('Usage : node scripts/images-de-trace.mjs trace.json.gz dossier [pas_ms] [phase]');
  process.exit(1);
}
const brut = fs.readFileSync(fichier);
const evenements = JSON.parse((fichier.endsWith('.gz') ? zlib.gunzipSync(brut) : brut).toString());
const liste = Array.isArray(evenements) ? evenements : evenements.traceEvents;
const captures = liste.filter((e) => e.name === 'Screenshot').sort((a, b) => a.ts - b.ts);
if (captures.length === 0) {
  console.error('Aucune capture dans cette trace.');
  process.exit(1);
}
const repere = phase ? liste.find((e) => e.name === `phase:${phase}`) : null;
const depart = repere ? repere.ts : captures[0].ts;
fs.mkdirSync(dossier, { recursive: true });
const pas = Number(pasArg);
let derniere = -Infinity;
const ecrites = [];
for (const c of captures) {
  const t = (c.ts - depart) / 1000;
  if (t < 0 || t - derniere < pas) continue;
  derniere = t;
  const nom = path.join(dossier, `${String(Math.round(t)).padStart(5, '0')}.jpg`);
  fs.writeFileSync(nom, Buffer.from(c.args.snapshot, 'base64'));
  ecrites.push(path.basename(nom));
}
console.log(`${ecrites.length} images : ${ecrites.join(' ')}`);
