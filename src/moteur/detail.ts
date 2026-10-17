import { bloquer, debloquer } from './defilement';
import { phaseIntro } from './etatIntro';

/**
 * LES PAGES DE DETAIL : l'etat, et le routage.
 *
 * Une page de detail est une page en surimpression : celle d'une etape du
 * parcours (`#/parcours/3`) ou d'un projet (`#/projets/1`). Ce module sait
 * laquelle est ouverte et d'ou elle s'ouvre ; la page elle-meme, son contenu et
 * son focus sont dans `sections/Detail.tsx`.
 *
 * L'adresse porte la page : un lien direct l'ouvre, le bouton precedent du
 * navigateur la ferme, le bouton suivant la rouvre.
 *
 * Il n'y a qu'une page de detail a la fois, donc un seul etat.
 */
export type Mode = 'parcours' | 'projets';

export interface Point {
  x: number;
  y: number;
}

export interface EtatDetail {
  ouvert: boolean;
  mode: Mode;
  /** L'indice de la page, a partir de 0. */
  i: number;
  /** D'ou la page s'ouvre (et sur quoi elle se referme), en pixels de l'ecran. */
  origine: Point;
}

const ADRESSE = /^#\/(parcours|projets)\/(\d+)/;
const adresse = (mode: Mode, i: number) => `#/${mode}/${i + 1}`;

/** Vrai si l'adresse courante designe une page de detail (lien direct, rechargement). */
export const adresseDeDetail = () => ADRESSE.test(window.location.hash);

let etat: EtatDetail = { ouvert: false, mode: 'parcours', i: 0, origine: { x: 0, y: 0 } };
const ecouteurs = new Set<() => void>();
const publier = (nouveau: EtatDetail) => {
  etat = nouveau;
  ecouteurs.forEach((e) => e());
};

/** Pour `useSyncExternalStore` : l'etat courant, et l'abonnement a ses changements. */
export const lireDetail = () => etat;
export function surDetail(ecouteur: () => void): () => void {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}
export const detailEstOuvert = () => etat.ouvert;

/** Combien de pages chaque mode compte : donne par la page, qui a les textes. */
let totaux: Record<Mode, number> = { parcours: 0, projets: 0 };

/**
 * Les sections qui savent ou est une page sur l'ecran : le voyage donne la
 * place de chaque etoile, pour que la page se referme sur elle.
 */
const origines: Partial<Record<Mode, (i: number) => Point | null | undefined>> = {};
export function enregistrerOrigine(mode: Mode, fournisseur: (i: number) => Point | null | undefined): () => void {
  origines[mode] = fournisseur;
  return () => {
    if (origines[mode] === fournisseur) delete origines[mode];
  };
}

/** L'element qui avait le focus avant l'ouverture : il le retrouve a la fermeture. */
let retour: HTMLElement | null = null;
export const elementDeRetour = () => retour;

/** Vrai si la page a ete ouverte par l'adresse du chargement : il n'y a alors rien « avant » ou revenir. */
let ouverteAuChargement = false;

const centre = (): Point => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

/**
 * Ouvre une page. `origine` est le point de l'ecran d'ou le cercle s'ouvre (le
 * clic, ou la place de l'etoile) ; `depuis` est l'element a qui rendre le focus.
 */
export function ouvrirDetail(
  mode: Mode,
  i: number,
  origine: Point | null = null,
  depuis: HTMLElement | null = null,
  pousser = true,
): void {
  if (i < 0 || i >= totaux[mode]) return;
  retour = depuis ?? (document.activeElement as HTMLElement | null);
  publier({ ouvert: true, mode, i, origine: origine ?? centre() });
  bloquer();
  if (pousser && window.location.hash !== adresse(mode, i)) {
    history.pushState({ detail: true }, '', adresse(mode, i));
  }
}

/**
 * Ferme la page. Le cercle se referme sur l'etoile de l'etape si elle est a
 * l'ecran. Si c'est le bouton qui ferme, l'historique recule d'un pas (la page
 * etait une entree de l'historique) ; sauf si elle est ouverte par l'adresse
 * du chargement : reculer sortirait du site, on retire alors seulement
 * l'ancre.
 */
export function fermerDetail(depuisHistorique = false): void {
  if (!etat.ouvert) return;
  const place = etat.mode === 'parcours' ? origines.parcours?.(etat.i) : null;
  publier({ ...etat, ouvert: false, origine: place ?? etat.origine });
  if (phaseIntro() === 'fini') debloquer();
  if (!depuisHistorique && ADRESSE.test(window.location.hash)) {
    if (ouverteAuChargement) history.replaceState(null, '', window.location.pathname + window.location.search);
    else history.back();
  }
  ouverteAuChargement = false;
}

/** Passe a la page d'avant (-1) ou d'apres (+1), sans ajouter d'entree a l'historique. */
export function changerDetail(delta: number): void {
  if (!etat.ouvert) return;
  const i = etat.i + delta;
  if (i < 0 || i >= totaux[etat.mode]) return;
  publier({ ...etat, i });
  history.replaceState({ detail: true }, '', adresse(etat.mode, i));
}

/**
 * Branche l'adresse sur les pages. A appeler une fois, par la page de detail,
 * avec le nombre de pages de chaque mode. Ouvre tout de suite la page que
 * l'adresse designe, s'il y en a une.
 */
export function demarrerRoutage(nombres: Record<Mode, number>): () => void {
  totaux = nombres;
  const lire = (): { mode: Mode; i: number } | null => {
    const m = ADRESSE.exec(window.location.hash);
    return m ? { mode: m[1] as Mode, i: Number(m[2]) - 1 } : null;
  };
  const surHistorique = () => {
    const cible = lire();
    if (cible) ouvrirDetail(cible.mode, cible.i, null, null, false);
    else fermerDetail(true);
  };
  window.addEventListener('popstate', surHistorique);
  const initiale = lire();
  if (initiale) {
    ouverteAuChargement = true;
    ouvrirDetail(initiale.mode, initiale.i, null, null, false);
  }
  return () => {
    window.removeEventListener('popstate', surHistorique);
    if (etat.ouvert) publier({ ...etat, ouvert: false });
  };
}
