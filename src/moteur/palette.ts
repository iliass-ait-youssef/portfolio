/**
 * LA PALETTE DES MOTEURS, lue dans `tokens.css`.
 *
 * Les canvas et le shader ont besoin de couleurs en nombres, pas en CSS. On
 * relit les jetons une fois et on les donne sous deux formes : composantes de
 * 0 a 255 (pour le canvas 2D) et de 0 a 1 (pour le shader).
 */
export type Rgb = [number, number, number];

/** `#rrggbb`, `rgb(r, g, b)` ou `rgba(r, g, b, a)` -> [r, g, b] de 0 a 255. */
export function lireRgb(valeur: string): Rgb {
  const v = valeur.trim();
  const fonction = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (fonction) return [Number(fonction[1]), Number(fonction[2]), Number(fonction[3])];
  const hexa = v.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hexa) return [parseInt(hexa[1], 16), parseInt(hexa[2], 16), parseInt(hexa[3], 16)];
  throw new Error(`Couleur illisible : « ${valeur} »`);
}

const cache = new Map<string, Rgb>();

/** La couleur d'un jeton, en composantes de 0 a 255. */
export function couleur(nom: string): Rgb {
  const deja = cache.get(nom);
  if (deja) return deja;
  const valeur = getComputedStyle(document.documentElement).getPropertyValue(nom);
  if (!valeur.trim()) throw new Error(`Jeton de couleur absent : ${nom}`);
  const rgb = lireRgb(valeur);
  cache.set(nom, rgb);
  return rgb;
}

/** La meme, de 0 a 1 : ce qu'attend un shader. */
export function couleurUnite(nom: string): Rgb {
  const [r, g, b] = couleur(nom);
  return [r / 255, g / 255, b / 255];
}

/** `rgba(r,g,b,a)` pret pour le canvas 2D, a partir d'un jeton. */
export function rgba(nom: string, alpha: number): string {
  const [r, g, b] = couleur(nom);
  return `rgba(${r},${g},${b},${alpha})`;
}
