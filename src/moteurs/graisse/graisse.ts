import type { MoteurDeSection } from '../../moteur/useSection';
import { souris } from '../../moteur/souris';

/**
 * LA GRAISSE SOUS LE CURSEUR : chaque lettre du titre du contact s'epaissit
 * quand le curseur s'en approche.
 *
 * La police du titre est une police variable : son epaisseur n'est pas figee
 * a « normal » ou « gras », elle se regle en continu, de 300 a 700. Chaque
 * lettre mesure sa distance au curseur ; l'epaisseur suit une courbe en
 * cloche (gaussienne) de cette distance : maximale sous le curseur, nulle
 * au-dela de la portee. Les lettres proches passent aussi en violet clair.
 *
 * Seulement avec une souris, et hors reduced-motion (voir `Contact.tsx`).
 */
export const REGLAGES = {
  /** La portee de l'effet, en pixels : ecart-type de la cloche. */
  portee: 130,
  /** L'epaisseur d'une lettre loin du curseur. */
  graisseBase: 400,
  /** L'epaisseur ajoutee sous le curseur (base + ajout = 700). */
  graisseAjout: 300,
  /** Au-dessus de ce poids de la cloche (0 a 1), la lettre passe en violet clair. */
  seuilCouleur: 0.35,
} as const;

/** Les lettres du titre : chacune porte sa propre epaisseur et sa couleur. */
const LETTRES = '.car-int';

/** Cree le moteur pour une section dont le titre porte `data-graisse`. */
export function creerGraisse(section: HTMLElement): MoteurDeSection | null {
  const titre = section.querySelector<HTMLElement>('[data-graisse]');
  const lettres = titre ? Array.from(titre.querySelectorAll<HTMLElement>(LETTRES)) : [];
  if (lettres.length === 0) return null;

  const { portee, graisseBase, graisseAjout, seuilCouleur } = REGLAGES;
  const deuxSigma2 = 2 * portee * portee;
  // Ce qu'on a ecrit en dernier : on ne retouche une lettre que si son epaisseur change.
  const poids: number[] = lettres.map(() => graisseBase);
  const accent = lettres.map(() => false);

  return {
    image: () => {
      if (!souris.presente) return;
      lettres.forEach((lettre, n) => {
        const b = lettre.getBoundingClientRect();
        const dx = b.left + b.width / 2 - souris.x;
        const dy = b.top + b.height / 2 - souris.y;
        const k = Math.exp(-(dx * dx + dy * dy) / deuxSigma2);
        const p = Math.round(graisseBase + graisseAjout * k);
        if (p !== poids[n]) {
          poids[n] = p;
          lettre.style.fontVariationSettings = `'wght' ${p}`;
        }
        const clair = k > seuilCouleur;
        if (clair !== accent[n]) {
          accent[n] = clair;
          lettre.style.color = clair ? 'var(--violet-clair)' : '';
        }
      });
    },
    // Les lettres reviennent a leur etat de repos.
    liberer: () => {
      lettres.forEach((lettre) => {
        lettre.style.fontVariationSettings = '';
        lettre.style.color = '';
      });
    },
  };
}
