import { borne, sortie } from '../../moteur/maths';

/** Ou et comment dessiner le trou noir a cette image. */
export interface Plan {
  /** Le rectangle ou il se dessine, en pixels CSS depuis le haut a gauche. */
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  /** Le rayon de ses coins : 0 en plein ecran, la moitie du cote en logo. */
  rayon: number;
  /** Ce qui est coupe en haut, en pixels CSS (le contact passe devant). */
  coupeHaut: number;
  /** La camera : distance au trou noir et inclinaison au-dessus du disque, en degres. */
  distance: number;
  inclinaison: number;
  /** L'opacite du liseré violet autour du logo. */
  anneau: number;
  /** Vrai quand le trou noir est revenu en plein ecran derriere le contact. */
  finale: boolean;
}

export interface Contexte {
  /** L'avancement de l'ouverture, de 0 (plein ecran) a 1 (logo). */
  e: number;
  largeurEcran: number;
  hauteurEcran: number;
  /** La position du haut du contact a l'ecran, en pixels CSS. */
  hautContact: number;
  /** La hauteur de la barre, encoche comprise. */
  hautBarre: number;
  /** La marge laterale de la page (le logo s'y aligne). */
  marge: number;
  /** Le cote du logo. */
  logo: number;
  /** L'ecart entre le haut de l'ecran et le haut du logo. */
  hautLogo: number;
}

/**
 * LA CHOREGRAPHIE DU TROU NOIR, reprise du prototype.
 *
 * Deux temps :
 *   - pendant l'ouverture, il quitte le plein ecran et se range dans le rond
 *     du logo, en haut a gauche. Le rectangle retrecit lineairement, ses coins
 *     s'arrondissent (jusqu'au cercle), la camera recule et monte au-dessus du
 *     disque, et un liseré violet apparait autour du logo ;
 *   - quand le contact entre a l'ecran, il revient en plein ecran derriere lui.
 *     Seule la partie sous le haut du contact est dessinee, et la camera se
 *     rapproche a mesure qu'on descend.
 *
 * C'est une fonction pure : memes entrees, meme plan. Elle se teste sans carte
 * graphique.
 */
export function planifier(c: Contexte): Plan {
  const finale = c.hautContact < c.hauteurEcran;
  if (finale) {
    // La montee du contact, de 0 (il entre par le bas) a 1 (il touche le haut).
    const montee = borne((c.hauteurEcran - c.hautContact) / c.hauteurEcran, 0, 1);
    return {
      x: 0,
      y: 0,
      largeur: c.largeurEcran,
      hauteur: c.hauteurEcran,
      rayon: 0,
      coupeHaut: Math.max(c.hautContact, c.hautBarre),
      distance: 30 - 8 * sortie(montee),
      inclinaison: 10 - 4 * sortie(montee),
      anneau: 0,
      finale,
    };
  }
  const e = c.e;
  const largeur = c.largeurEcran + (c.logo - c.largeurEcran) * e;
  const hauteur = c.hauteurEcran + (c.logo - c.hauteurEcran) * e;
  return {
    x: c.marge * e,
    y: c.hautLogo * e,
    largeur,
    hauteur,
    // Les coins s'arrondissent un peu apres le depart, jusqu'au cercle.
    rayon: e < 0.02 ? 0 : (Math.min(largeur, hauteur) / 2) * sortie((e - 0.02) / 0.9),
    coupeHaut: 0,
    distance: 22 + 12 * e,
    inclinaison: 8 + 6 * e,
    anneau: e > 0.6 ? (0.35 * (e - 0.6)) / 0.4 : 0,
    finale,
  };
}
