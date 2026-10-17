/**
 * L'ETAT DE L'INTRO, partage par les sections qui en dependent.
 *
 *   'compte'  le compteur tourne, le rideau est baisse
 *   'sortie'  le rideau se leve, le trou noir apparait
 *   'fini'    tout est joue : le titre se revele, le defilement est rendu
 *
 * Le corps de page porte deux classes qui suivent ces phases, comme dans le
 * prototype : `intro-sortie` puis `intro-finie`. Le CSS s'en sert pour faire
 * apparaitre le trou noir et les elements de l'ouverture.
 */
export type Phase = 'compte' | 'sortie' | 'fini';

let phase: Phase = 'compte';
const ecouteurs = new Set<(phase: Phase) => void>();

export function phaseIntro(): Phase {
  return phase;
}

export function changerPhase(nouvelle: Phase): void {
  if (nouvelle === phase) return;
  phase = nouvelle;
  if (nouvelle === 'sortie' || nouvelle === 'fini') document.body.classList.add('intro-sortie');
  if (nouvelle === 'fini') document.body.classList.add('intro-finie');
  ecouteurs.forEach((ecouteur) => ecouteur(nouvelle));
}

/** S'abonne aux changements de phase. Renvoie la fonction de desabonnement. */
export function surPhase(ecouteur: (phase: Phase) => void): () => void {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}
