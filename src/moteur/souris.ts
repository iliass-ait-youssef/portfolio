/**
 * LA SOURIS, partagee : sa position, lue par tous les effets qui suivent le
 * curseur (la graisse des lettres du contact, le curseur personnalise).
 *
 * Un seul ecouteur pour tout le site, au lieu d'un par effet. Il ne fait que
 * ecrire deux nombres ; ce sont les effets qui lisent, a leur rythme, dans la
 * boucle. Sans souris (ecran tactile), rien n'est ecoute.
 */
export const souris = {
  /** Position dans la fenetre, en pixels. Loin hors de l'ecran tant que la souris n'a pas bouge. */
  x: -9999,
  y: -9999,
  /** Vrai des que la souris a bouge, faux quand elle quitte la fenetre. */
  presente: false,
};

/** Branche l'ecouteur ; renvoie la fonction qui le retire. */
export function demarrerSouris(): () => void {
  const surMouvement = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    souris.x = e.clientX;
    souris.y = e.clientY;
    souris.presente = true;
  };
  const surSortie = (e: MouseEvent) => {
    // `relatedTarget` nul : le curseur a quitte la fenetre, pas seulement un element.
    if (!e.relatedTarget) souris.presente = false;
  };
  window.addEventListener('pointermove', surMouvement, { passive: true });
  document.addEventListener('mouseout', surSortie);
  return () => {
    window.removeEventListener('pointermove', surMouvement);
    document.removeEventListener('mouseout', surSortie);
  };
}
