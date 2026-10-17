/**
 * LES PETITES FONCTIONS DE LA CHOREGRAPHIE.
 *
 * Les moteurs ne jouent pas d'animations dans le temps : ils traduisent une
 * PROGRESSION (de 0 a 1, tiree du defilement) en positions et en eclats. Ces
 * fonctions sont les « formes » de ces traductions, reprises du prototype.
 */

/** Ramene x dans [a, b]. */
export function borne(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

/** Le « smoothstep » : depart et arrivee en douceur, de 0 a 1. */
export function lisse(t: number): number {
  const u = borne(t, 0, 1);
  return u * u * (3 - 2 * u);
}

/** Cubique sortante : part vite, se pose lentement. */
export function sortie(t: number): number {
  const u = borne(t, 0, 1);
  return 1 - (1 - u) ** 3;
}

/** Exponentielle sortante : un elan franc, une arrivee tres longue. */
export function expo(t: number): number {
  const u = borne(t, 0, 1);
  return u === 1 ? 1 : 1 - 2 ** (-10 * u);
}

/** Melange lineaire de deux points de l'espace. */
export function melange(a: Vec3, b: Vec3, k: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** Ramene un vecteur a une longueur de 1. */
export function normer(v: Vec3): Vec3 {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

export type Vec3 = [number, number, number];

/**
 * Le lissage « un pourcentage par image » du prototype, rendu independant du
 * nombre d'images par seconde : `parImage` est la part de l'ecart rattrapee a
 * chaque image a 60 Hz ; le resultat est la part a rattraper pour `dt`
 * secondes. A 60, 120 ou 30 images par seconde, le mouvement est le meme.
 */
export function part(parImage: number, dt: number): number {
  return 1 - (1 - parImage) ** (dt * 60);
}
