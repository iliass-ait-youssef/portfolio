// Genere public/og.png (1200x630) et public/apple-touch-icon.png (180x180)
// en PNG brut : aucune dependance, seulement zlib de Node.
// La scene reprend le hero : fond noir, etoiles, nebuleuse, sommet de planete.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crc32 = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encoderPng(largeur, hauteur, pixels) {
  const brut = Buffer.alloc((largeur * 3 + 1) * hauteur);
  for (let y = 0; y < hauteur; y++) {
    brut[y * (largeur * 3 + 1)] = 0;
    pixels.copy(brut, y * (largeur * 3 + 1) + 1, y * largeur * 3, (y + 1) * largeur * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0);
  ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(brut, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Couleurs du design system ------------------------------------------
const VIDE = [0, 0, 0];
const ABYSSE = [12, 10, 28];
const SURFACE = [30, 22, 64];
const VIOLET_400 = [169, 139, 255];
const VIOLET_300 = [196, 181, 255];
const BLEU_300 = [159, 195, 240];
const BLANC = [255, 255, 255];

const melanger = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function dessiner(largeur, hauteur, { rayonPlanete, centreY, bordure, nombreEtoiles, graine }) {
  const px = Buffer.alloc(largeur * hauteur * 3);
  const poser = (x, y, c, alpha = 1) => {
    if (x < 0 || y < 0 || x >= largeur || y >= hauteur) return;
    const i = (y * largeur + x) * 3;
    px[i] = Math.round(px[i] + (c[0] - px[i]) * alpha);
    px[i + 1] = Math.round(px[i + 1] + (c[1] - px[i + 1]) * alpha);
    px[i + 2] = Math.round(px[i + 2] + (c[2] - px[i + 2]) * alpha);
  };

  // Fond : noir, puis nebuleuse radiale centree bas.
  const cx = largeur / 2;
  const ny = hauteur * 0.78;
  const rayonNebuleuse = Math.max(largeur, hauteur) * 0.72;
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const d = Math.hypot(x - cx, y - ny) / rayonNebuleuse;
      const t = Math.max(0, 1 - d);
      const teinte = melanger([124, 92, 224], [59, 42, 110], 1 - t);
      const c = melanger(VIDE, teinte, 0.3 * t * t);
      const i = (y * largeur + x) * 3;
      px[i] = Math.round(c[0]); px[i + 1] = Math.round(c[1]); px[i + 2] = Math.round(c[2]);
    }
  }

  // Etoiles : generateur deterministe, plus dense en haut, comme ChampEtoiles.
  let g = graine;
  const alea = () => { g = (g * 1103515245 + 12345) & 0x7fffffff; return g / 0x7fffffff; };
  for (let n = 0; n < nombreEtoiles; n++) {
    const x = Math.floor(alea() * largeur);
    const y = Math.floor(Math.pow(alea(), 1.35) * hauteur);
    const d = alea();
    const r = d < 0.68 ? 0.7 + alea() * 0.5 : d < 0.92 ? 1.2 + alea() * 0.8 : 2 + alea() * 1.2;
    const o = d < 0.68 ? 0.2 + alea() * 0.25 : d < 0.92 ? 0.45 + alea() * 0.3 : 0.75 + alea() * 0.25;
    const teinte = alea();
    const c = teinte < 0.72 ? BLANC : teinte < 0.88 ? VIOLET_300 : BLEU_300;
    const rr = Math.ceil(r) + 1;
    for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
      const dist = Math.hypot(dx, dy);
      const a = Math.max(0, Math.min(1, r - dist + 0.5)) * o;
      if (a > 0) poser(x + dx, y + dy, c, a);
    }
  }

  // Planete : un disque dont on ne voit que le sommet, degrade surface -> abysse,
  // liseret violet anti-aliase.
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const d = Math.hypot(x - cx, y - centreY);
      if (d > rayonPlanete + 1) continue;
      const profondeur = Math.min(1, Math.max(0, (y - (centreY - rayonPlanete)) / (hauteur * 0.6)));
      const c = melanger(SURFACE, ABYSSE, profondeur);
      const couverture = Math.min(1, rayonPlanete + 0.5 - d);
      if (couverture > 0) poser(x, y, c, couverture);
      const liseret = Math.max(0, Math.min(1, bordure - Math.abs(d - rayonPlanete) + 0.5));
      if (liseret > 0) poser(x, y, VIOLET_400, liseret);
    }
  }

  // Halo au-dessus de l'horizon : il suit la courbe de la planete, comme
  // --bord-planete dans le hero (plus fort au centre, fondu vers les cotes).
  const epaisseurHalo = hauteur * 0.3;
  const hautHorizon = centreY - rayonPlanete;
  for (let y = Math.max(0, Math.floor(hautHorizon - epaisseurHalo)); y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const d = Math.hypot(x - cx, y - centreY);
      const ecart = d - rayonPlanete;
      if (ecart < 0 || ecart > epaisseurHalo) continue;
      const t = 1 - ecart / epaisseurHalo;
      const dx = Math.abs(x - cx) / (largeur * 0.6);
      const a = 0.35 * t * t * Math.max(0, 1 - dx * dx);
      if (a > 0.003) poser(x, y, VIOLET_400, a);
    }
  }
  return px;
}

const og = dessiner(1200, 630, { rayonPlanete: 1150, centreY: 630 + 1150 - 190, bordure: 2, nombreEtoiles: 260, graine: 7 });
writeFileSync('public/og.png', encoderPng(1200, 630, og));

const icone = dessiner(180, 180, { rayonPlanete: 150, centreY: 180 + 150 - 62, bordure: 3.5, nombreEtoiles: 14, graine: 11 });
writeFileSync('public/apple-touch-icon.png', encoderPng(180, 180, icone));
console.log('images generees');
