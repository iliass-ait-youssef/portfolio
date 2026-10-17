import { useEffect, type DependencyList, type RefObject } from 'react';
import { brouiller } from './brouillage';
import { compter } from './comptage';

/**
 * LES REVELATIONS AU DEFILEMENT.
 *
 * Un element marque `data-apparait` (un bloc qui monte en fondu) ou
 * `data-apparait-lettres` (un titre decoupe en lettres) attend d'entrer a
 * l'ecran. Quand un cinquieme de sa surface est visible, un peu au-dessus du
 * bas de l'ecran, il recoit la classe `visible` : le CSS fait le reste. Ses
 * compteurs se mettent a compter, et s'il est marque `data-brouille`, son
 * texte se decode. Une fois revele, il n'est plus surveille.
 *
 * Un seul `IntersectionObserver` pour tout le site : le navigateur calcule
 * les intersections lui-meme, hors de la boucle, sans lecture de mise en page.
 */
const actions = new WeakMap<Element, () => void>();
let observateur: IntersectionObserver | null = null;

function surveillant(): IntersectionObserver {
  if (observateur) return observateur;
  observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue;
        const action = actions.get(entree.target);
        observateur?.unobserve(entree.target);
        actions.delete(entree.target);
        action?.();
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -6% 0px' },
  );
  return observateur;
}

/** Revele un element : classe `visible`, compteurs, decodage. */
export function reveler(element: HTMLElement): void {
  element.classList.add('visible');
  element.querySelectorAll<HTMLElement>('[data-compteur]').forEach(compter);
  if (element.hasAttribute('data-brouille')) element.querySelectorAll<HTMLElement>('.brouille').forEach(brouiller);
}

/**
 * Surveille les elements a reveler d'une section. A appeler depuis la section,
 * avec ses dependances (la langue : un texte qui change peut recreer des
 * elements). Les elements deja reveles ne sont plus surveilles.
 */
export function useRevelations(racine: RefObject<HTMLElement>, dependances: DependencyList = []): void {
  useEffect(() => {
    const element = racine.current;
    if (!element) return;
    const cibles = Array.from(element.querySelectorAll<HTMLElement>('[data-apparait], [data-apparait-lettres]')).filter(
      (cible) => !cible.classList.contains('visible'),
    );
    const s = surveillant();
    cibles.forEach((cible) => {
      actions.set(cible, () => reveler(cible));
      s.observe(cible);
    });
    return () =>
      cibles.forEach((cible) => {
        s.unobserve(cible);
        actions.delete(cible);
      });
    // Les dependances sont celles de l'appelant, comme pour `useEffect`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependances);
}
