/**
 * LES BOUTONS AIMANTES : un element marque `data-aimant` se laisse attirer
 * par le curseur quand il est proche, puis revient en rebondissant.
 *
 * Une seule ecoute pour toute la page (delegation) : les elements peuvent
 * changer sans qu'il faille rebrancher quoi que ce soit. Seulement avec une
 * souris, et pas sous reduced-motion (voir `sections/Curseur.tsx`).
 */
export const REGLAGES = {
  /** Part du decalage du curseur (par rapport au centre) que l'element suit : horizontale et verticale. */
  forceX: 0.28,
  forceY: 0.36,
  /** Pendant le suivi : reactif. A la sortie : un retour avec depassement (jeton `--courbe-ressort`). */
  transitionSuivi: 'transform var(--d-eclair) var(--courbe-entree)',
  transitionRetour: 'transform var(--d-long) var(--courbe-ressort)',
} as const;

/** Branche les aimants ; renvoie la fonction qui les retire (et relache ce qui est attire). */
export function demarrerAimants(): () => void {
  let courant: HTMLElement | null = null;

  const relacher = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.transition = REGLAGES.transitionRetour;
    el.style.transform = '';
  };

  const surMouvement = (e: PointerEvent) => {
    const cible = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-aimant]') : null;
    if (cible !== courant) {
      relacher(courant);
      courant = cible;
    }
    if (!cible) return;
    const r = cible.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    cible.style.transition = REGLAGES.transitionSuivi;
    cible.style.transform = `translate(${(dx * REGLAGES.forceX).toFixed(1)}px, ${(dy * REGLAGES.forceY).toFixed(1)}px)`;
  };
  // Le curseur quitte la fenetre : l'element attire est relache.
  const surSortie = (e: MouseEvent) => {
    if (!e.relatedTarget) {
      relacher(courant);
      courant = null;
    }
  };

  document.addEventListener('pointermove', surMouvement, { passive: true });
  document.addEventListener('mouseout', surSortie);
  return () => {
    document.removeEventListener('pointermove', surMouvement);
    document.removeEventListener('mouseout', surSortie);
    relacher(courant);
    courant = null;
  };
}
