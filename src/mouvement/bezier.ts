/**
 * UNE COURBE DE BEZIER CUBIQUE, comme `cubic-bezier()` en CSS.
 *
 * Le CSS decrit une courbe par deux points de controle (x1, y1) et (x2, y2) ;
 * les extremites sont toujours (0, 0) et (1, 1). La courbe est parametree
 * par s, de 0 a 1 :
 *
 *     x(s) = 3 x1 s (1-s)^2 + 3 x2 s^2 (1-s) + s^3
 *     y(s) = meme formule avec y1 et y2
 *
 * x est le TEMPS ecoule (de 0 a 1), y est l'AVANCEMENT de l'animation.
 * Pour un temps t donne, il faut donc d'abord trouver le parametre s tel que
 * x(s) = t, puis rendre y(s). C'est la seule difficulte : x(s) est un
 * polynome de degre 3, on le resout numeriquement.
 *
 * Methode : quelques pas de Newton (tres rapide quand la pente est franche),
 * puis une dichotomie si Newton n'a pas converge (pente presque nulle). C'est
 * ce que font les navigateurs pour leurs propres transitions CSS.
 *
 * Pourquoi ecrire ca plutot qu'utiliser GSAP ? La scene 3D anime la camera
 * dans sa propre boucle, sans GSAP. Elle doit pourtant suivre EXACTEMENT les
 * memes courbes que le CSS et que GSAP : ce petit solveur est le pont.
 */

/** Une fonction d'adoucissement : temps de 0 a 1 -> avancement de 0 a 1. */
export type Courbe = (t: number) => number;

/** Precision visee sur x : bien en dessous d'un millieme de pixel a l'ecran. */
const PRECISION = 1e-6;
const PAS_NEWTON = 8;
const PAS_DICHOTOMIE = 30;

export function creerCourbe(x1: number, y1: number, x2: number, y2: number): Courbe {
  // Les coefficients du polynome, ecrit sous la forme a s^3 + b s^2 + c s.
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const x = (s: number) => ((ax * s + bx) * s + cx) * s;
  const y = (s: number) => ((ay * s + by) * s + cy) * s;
  /** La derivee de x par rapport a s : la pente, pour Newton. */
  const pente = (s: number) => (3 * ax * s + 2 * bx) * s + cx;

  /** Trouve s tel que x(s) = t. */
  const resoudre = (t: number): number => {
    // Newton : on part de s = t, qui est deja proche pour une courbe douce.
    let s = t;
    for (let i = 0; i < PAS_NEWTON; i += 1) {
      const ecart = x(s) - t;
      if (Math.abs(ecart) < PRECISION) return s;
      const p = pente(s);
      if (Math.abs(p) < PRECISION) break; // pente nulle : Newton diverge
      s -= ecart / p;
    }
    // Dichotomie : lente mais sure, x(s) est croissante sur [0, 1].
    let bas = 0;
    let haut = 1;
    s = t;
    for (let i = 0; i < PAS_DICHOTOMIE; i += 1) {
      const valeur = x(s);
      if (Math.abs(valeur - t) < PRECISION) return s;
      if (valeur < t) bas = s;
      else haut = s;
      s = (bas + haut) / 2;
    }
    return s;
  };

  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return y(resoudre(t));
  };
}

/** Lit `cubic-bezier(a, b, c, d)` et rend la courbe correspondante. */
export function lireCourbe(valeur: string): Courbe {
  const nombres = valeur.match(/cubic-bezier\(([^)]+)\)/)?.[1].split(',').map(Number);
  if (!nombres || nombres.length !== 4 || nombres.some(Number.isNaN)) {
    throw new Error(`Courbe illisible : « ${valeur} »`);
  }
  const [x1, y1, x2, y2] = nombres;
  return creerCourbe(x1, y1, x2, y2);
}
