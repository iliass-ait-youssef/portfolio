/**
 * Les preferences de l'utilisateur qui changent la facon dont le site bouge.
 * Module sans dependance : la scene 3D le lit sans tirer GSAP avec elle.
 */

/** La preference systeme « reduire les animations ». */
export const REQUETE_REDUIT = '(prefers-reduced-motion: reduce)';
/** Un ecran tactile : pas de curseur, donc pas d'effet qui le suit. */
export const REQUETE_TACTILE = '(pointer: coarse)';

/** Vrai si l'utilisateur a demande moins d'animation. */
export const mouvementReduit = () => window.matchMedia(REQUETE_REDUIT).matches;

/** Vrai sur un ecran tactile, ou il n'y a pas de curseur a suivre. */
export const ecranTactile = () => window.matchMedia(REQUETE_TACTILE).matches;

/** La requete « le pointeur est precis » : une souris ou un pave tactile. */
export const REQUETE_POINTEUR_FIN = '(pointer: fine)';

/** Vrai avec une souris : les effets qui suivent le curseur n'ont de sens que la. */
export const pointeurFin = () => window.matchMedia(REQUETE_POINTEUR_FIN).matches;
