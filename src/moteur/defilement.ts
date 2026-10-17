import Lenis from 'lenis';
import { jetons } from '../mouvement/jetons';

/**
 * LE DEFILEMENT FLUIDE, par Lenis (version figee : 1.1.13, celle du prototype).
 *
 * Lenis remplace le defilement saccade de la molette par un mouvement lisse :
 * a chaque image, la page rattrape 8,5 % de l'ecart vers sa cible
 * (`lerp: 0.085`). La molette est un peu adoucie (×0,9).
 *
 * Il n'a pas sa propre boucle : c'est la boucle unique du site qui l'avance
 * (`brancherLenis`). Sous reduced-motion, il n'est pas cree du tout : le
 * defilement natif, immediat, reste.
 */
let instance: Lenis | null = null;

declare global {
  interface Window {
    /** En developpement seulement : l'instance Lenis, pour placer la page aux mesures. */
    __lenis?: Lenis;
  }
}

export function creerDefilement(): Lenis {
  instance = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  if (import.meta.env.DEV) window.__lenis = instance;
  return instance;
}

export function detruireDefilement(): void {
  instance?.destroy();
  instance = null;
  if (import.meta.env.DEV) delete window.__lenis;
}

export function defilement(): Lenis | null {
  return instance;
}

/** Arrete le defilement (intro, page de detail ouverte). */
export function bloquer(): void {
  instance?.stop();
}

export function debloquer(): void {
  instance?.start();
}

/**
 * Defile jusqu'a un element. Avec Lenis : un mouvement d'un pas « tres long »
 * sur la courbe d'entree, et la barre du haut comptee (sauf pour le haut de
 * page). Sans Lenis : le saut natif.
 */
export function defilerVers(cible: HTMLElement, decalage = 0): void {
  if (instance) {
    const j = jetons();
    instance.scrollTo(cible, { offset: decalage, duration: j.duree.tresLong, easing: j.courbe.entree });
    return;
  }
  window.scrollTo({ top: cible.getBoundingClientRect().top + window.scrollY + decalage });
}
