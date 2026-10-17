import { inclinaison } from '../../moteur/inclinaison';
import type { MoteurDeSection } from '../../moteur/useSection';
import { jetons } from '../../mouvement/jetons';

/**
 * LES CARTES DE PROJET : elles pivotent vers le curseur, un reflet clair les
 * suit, et la grille entiere penche un peu quand on defile vite.
 *
 * Deux effets independants, deux fonctions. Tous les reglages sont ici.
 */
export const REGLAGES = {
  /** Degres d'inclinaison pour un curseur au bord de la carte (autour de l'axe X, puis Y). */
  inclinaisonX: 7,
  inclinaisonY: 9,
  /** La grille penche de cette part de l'inclinaison du defilement. */
  penchee: 0.25,
  /** En dessous de cette penchee (degres), la grille est redressee d'un coup. */
  pencheeMin: 0.05,
} as const;

/**
 * Fait pivoter chaque carte vers le curseur, et pose sur elle le reflet :
 * `--mx` et `--my` donnent la position du curseur dans la carte, en
 * pourcentage, et le CSS dessine le degrade a cet endroit.
 *
 * Pendant le mouvement la carte suit sans delai (la courbe est lineaire, sur
 * la duree « eclair ») ; quand le curseur la quitte, c'est la transition
 * normale de la feuille de style qui la ramene. Renvoie la fonction qui retire
 * tout.
 */
export function inclinerCartes(cartes: HTMLElement[]): () => void {
  const retraits = cartes.map((carte) => {
    const surMouvement = (e: PointerEvent) => {
      const r = carte.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const { eclair, court } = jetons().duree;
      carte.style.transition = `transform ${eclair}s linear, border-color ${court}s`;
      carte.style.transform = `rotateX(${((0.5 - py) * REGLAGES.inclinaisonX).toFixed(2)}deg) rotateY(${((px - 0.5) * REGLAGES.inclinaisonY).toFixed(2)}deg) translateZ(0)`;
      carte.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      carte.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    };
    const surSortie = () => {
      carte.style.transition = '';
      carte.style.transform = '';
    };
    carte.addEventListener('pointermove', surMouvement);
    carte.addEventListener('pointerleave', surSortie);
    return () => {
      carte.removeEventListener('pointermove', surMouvement);
      carte.removeEventListener('pointerleave', surSortie);
      surSortie();
    };
  });
  return () => retraits.forEach((retirer) => retirer());
}

/**
 * La penchee de la grille : un moteur de section, appele seulement quand la
 * grille est a l'ecran. Elle suit l'inclinaison partagee du defilement (voir
 * moteur/inclinaison.ts), en plus discret que le bandeau.
 */
export function creerPencheeGrille(grille: HTMLElement): MoteurDeSection {
  return {
    image: () => {
      const degres = inclinaison.degres;
      grille.style.transform =
        Math.abs(degres) > REGLAGES.pencheeMin ? `skewY(${(degres * REGLAGES.penchee).toFixed(3)}deg)` : '';
    },
    liberer: () => {
      grille.style.transform = '';
    },
  };
}
