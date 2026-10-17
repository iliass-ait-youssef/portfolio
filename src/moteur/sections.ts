import { borne } from './maths';

/**
 * LA GEOMETRIE D'UNE SECTION, gardee en memoire.
 *
 * Les moteurs ont besoin, a chaque image, de savoir ou en est le defilement
 * dans leur section. Lire `getBoundingClientRect()` a chaque image forcerait
 * le navigateur a recalculer la mise en page ; on mesure donc la section une
 * fois (et a chaque changement de taille de la page), puis tout le reste est
 * de l'arithmetique sur `window.scrollY`.
 */
export class Section {
  /** Distance entre le haut de la page et le haut de la section. */
  haut = 0;
  hauteur = 0;

  constructor(readonly element: HTMLElement) {
    toutes.add(this);
    this.mesurer();
    surveiller();
  }

  mesurer(): void {
    const r = this.element.getBoundingClientRect();
    this.haut = r.top + window.scrollY;
    this.hauteur = r.height;
  }

  /** Vrai si une partie de la section est a l'ecran. */
  visible(y: number, hauteurEcran: number): boolean {
    return y + hauteurEcran > this.haut && y < this.haut + this.hauteur;
  }

  /**
   * L'avancement dans une section COLLANTE (dont le contenu reste fixe a
   * l'ecran pendant qu'on la traverse) : 0 quand son haut touche le haut de
   * l'ecran, 1 quand son bas touche le bas de l'ecran.
   */
  progression(y: number, hauteurEcran: number): number {
    return borne((y - this.haut) / Math.max(1, this.hauteur - hauteurEcran), 0, 1);
  }

  /** Le defilement depuis le haut de la section, en hauteurs d'ecran. */
  ecrans(y: number, hauteurEcran: number): number {
    return (y - this.haut) / hauteurEcran;
  }

  /** La position du haut de la section a l'ecran, sans lire la mise en page. */
  hautAEcran(y: number): number {
    return this.haut - y;
  }

  liberer(): void {
    toutes.delete(this);
  }
}

const toutes = new Set<Section>();
let surveillee = false;

/**
 * Une seule surveillance pour toutes les sections : quand la page change de
 * taille (polices chargees, fenetre redimensionnee, contenu revele), toutes
 * sont remesurees.
 */
function surveiller(): void {
  if (surveillee) return;
  surveillee = true;
  const remesurer = () => toutes.forEach((s) => s.mesurer());
  new ResizeObserver(remesurer).observe(document.body);
  window.addEventListener('resize', remesurer);
}
