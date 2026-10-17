import { inclinaison } from '../../moteur/inclinaison';
import type { MoteurDeSection } from '../../moteur/useSection';

/**
 * LE BANDEAU DEFILANT : deux rangees de technologies qui glissent en sens
 * opposes, accelerent avec le defilement, s'inclinent, et changent de sens
 * quand on remonte la page.
 *
 * Tous les reglages sont ici.
 */
export const REGLAGES = {
  /** Vitesse de base du glissement, en pixels par seconde. */
  vitesseBase: 40,
  /** Pixels par seconde ajoutes par unite de vitesse de defilement. */
  gainVitesse: 18,
  /** Au-dela de cette vitesse vers le haut, les rangees changent de sens. */
  seuilInversion: -0.5,
} as const;

interface Rang {
  element: HTMLElement;
  piste: HTMLElement;
  /** -1 : vers la gauche, 1 : vers la droite. */
  sens: number;
  /** Deplacement courant, en pixels, entre 0 et la demi-largeur de la piste. */
  x: number;
  /** La largeur d'un motif (la piste en contient deux : la boucle ne se voit pas). */
  demi: number;
}

/**
 * Cree le moteur du bandeau sur son element. Chaque rangee est une piste dont
 * le contenu est ecrit deux fois ; quand elle a glisse d'une demi-largeur, on
 * revient au debut sans que l'oeil le voie.
 *
 * La largeur d'une piste est mesuree une fois, puis a chaque changement de
 * taille : jamais a chaque image.
 */
export function creerBandeau(element: HTMLElement): MoteurDeSection {
  const rangs: Rang[] = Array.from(element.querySelectorAll<HTMLElement>('[data-sens]')).map((el) => ({
    element: el,
    piste: el.querySelector<HTMLElement>('.bandeau__piste') ?? el,
    sens: Number(el.getAttribute('data-sens')),
    x: 0,
    demi: 1,
  }));

  const mesurer = () => rangs.forEach((r) => (r.demi = r.piste.scrollWidth / 2 || 1));
  mesurer();
  const observateur = new ResizeObserver(mesurer);
  rangs.forEach((r) => observateur.observe(r.piste));

  return {
    image: ({ dt }) => {
      const { vitesse, degres } = inclinaison;
      // Une rangee avance, ou recule si on remonte franchement la page.
      const direction = vitesse < REGLAGES.seuilInversion ? -1 : 1;
      const pas = (REGLAGES.vitesseBase + Math.abs(vitesse) * REGLAGES.gainVitesse) * dt;
      for (const r of rangs) {
        r.x = (((r.x + pas * r.sens * direction) % r.demi) + r.demi) % r.demi;
        r.element.style.transform = `translateX(${(-r.x).toFixed(1)}px) skewX(${(-degres).toFixed(2)}deg)`;
      }
    },
    liberer: () => {
      observateur.disconnect();
      rangs.forEach((r) => (r.element.style.transform = ''));
    },
  };
}
