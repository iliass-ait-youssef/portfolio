import { lisse } from './maths';

/**
 * L'AVANCEMENT DE L'OUVERTURE, de 0 a 1.
 *
 * Tout ce qui se passe en haut de page suit ce meme nombre : le trou noir qui
 * retrecit jusqu'au logo, les lettres du titre qui s'envolent, la barre qui
 * descend. Il vaut 0 tout en haut et 1 apres 70 % d'une hauteur d'ecran de
 * defilement, avec un depart et une arrivee doux.
 *
 * Sous reduced-motion, il saute d'un coup de 0 a 1 a mi-chemin : pas de
 * mouvement intermediaire.
 */
export function avancementOuverture(y: number, hauteurEcran: number, fige: boolean): number {
  const brut = y / (hauteurEcran * 0.7);
  return fige ? (brut > 0.5 ? 1 : 0) : lisse(brut);
}

/** Au-dela de ce seuil, la barre de navigation est descendue. */
export const SEUIL_BARRE = 0.85;
