import { useEffect, type DependencyList, type RefObject } from 'react';
import { inscrire, type Image } from './boucle';
import { Section } from './sections';

/** Ce qu'un moteur de section recoit a chaque image ou sa section est visible. */
export interface ImageDeSection extends Image {
  /** L'avancement dans la section collante, de 0 a 1. */
  progression: number;
  /** Le defilement depuis le haut de la section, en hauteurs d'ecran. */
  ecrans: number;
  section: Section;
}

/** Un moteur branche sur une section : il dessine, et il libere. */
export interface MoteurDeSection {
  image: (image: ImageDeSection) => void;
  liberer?: () => void;
}

/**
 * LE PONT ENTRE UNE SECTION ET LA BOUCLE.
 *
 * Une section React donne son element ; ce crochet en garde la geometrie,
 * fabrique son moteur et l'inscrit dans la boucle unique. Le moteur n'est
 * appele QUE si sa section est a l'ecran : un canvas hors champ ne coute rien.
 * Au demontage, tout est retire et libere.
 *
 * `fabriquer` peut renvoyer `null` (pas de moteur dans ce mode, par exemple
 * sous reduced-motion) : rien n'est alors inscrit.
 */
export function useSection(
  ref: RefObject<HTMLElement>,
  ordre: number,
  fabriquer: (element: HTMLElement) => MoteurDeSection | null,
  dependances: DependencyList = [],
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const moteur = fabriquer(element);
    if (!moteur) return;
    const section = new Section(element);
    const retirer = inscrire({
      ordre,
      actif: () => section.visible(window.scrollY, window.innerHeight),
      image: (image) =>
        moteur.image({
          ...image,
          section,
          progression: section.progression(image.y, image.hauteur),
          ecrans: section.ecrans(image.y, image.hauteur),
        }),
    });
    return () => {
      retirer();
      section.liberer();
      moteur.liberer?.();
    };
    // Les dependances sont celles de l'appelant, comme pour `useEffect`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependances);
}
