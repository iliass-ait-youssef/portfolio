import type Lenis from 'lenis';

/** Plafond : jamais plus de 60 images par seconde, meme sur un ecran a 120 Hz. */
const PAS_MINIMAL = 1 / 60;
/** Les evenements d'image arrivent avec quelques dixiemes de ms de jeu. */
const TOLERANCE = 0.002;
/** Un onglet qui se reveille ne doit pas « rattraper » : le pas est borne. */
const PAS_MAXIMAL = 0.1;

/** Ce que chaque systeme recoit, a chaque image. */
export interface Image {
  /** Secondes ecoulees depuis l'image precedente, bornees a 0,1. */
  dt: number;
  /** Temps d'animation cumule, en secondes. Fige sous reduced-motion. */
  t: number;
  /** La position du defilement, en pixels. */
  y: number;
  /** La vitesse du defilement, en pixels par image (positive vers le bas). */
  vitesse: number;
  /** La taille de la fenetre, lue une fois par image pour tout le monde. */
  largeur: number;
  hauteur: number;
}

/** Un systeme anime : un moteur graphique, le curseur, la barre... */
export interface Systeme {
  /** Plus petit = appele plus tot. L'ordre suit celui du prototype. */
  ordre: number;
  /** Faux quand le systeme n'a rien a faire (sa section est hors de l'ecran). */
  actif?: () => boolean;
  image: (image: Image) => void;
}

declare global {
  interface Window {
    /**
     * Pour les mesures : a vrai, chaque image de la boucle laisse une mesure
     * « image-site » dans la chronologie de performance du navigateur, que
     * les traces savent lire. Faux par defaut : aucun cout. L'adresse
     * `?mesurer` l'allume des le chargement (pour tracer l'intro).
     */
    __mesurer?: boolean;
  }
}

const systemes: Systeme[] = [];
let lenis: Lenis | null = null;
let fige = false;

/**
 * Inscrit un systeme dans la boucle. Renvoie la fonction qui le retire : les
 * composants React l'appellent au demontage.
 */
export function inscrire(systeme: Systeme): () => void {
  systemes.push(systeme);
  systemes.sort((a, b) => a.ordre - b.ordre);
  return () => {
    const i = systemes.indexOf(systeme);
    if (i >= 0) systemes.splice(i, 1);
  };
}

/** Lenis est avance par la boucle, pas par une seconde boucle a lui. */
export function brancherLenis(instance: Lenis | null): void {
  lenis = instance;
}

/** Sous reduced-motion, le temps ne s'ecoule plus : tout est immobile. */
export function figer(valeur: boolean): void {
  fige = valeur;
}

/** Ordres d'appel, dans l'ordre du prototype. */
export const ORDRE = {
  intro: 0,
  texte: 5,
  trouNoir: 10,
  curseur: 20,
  bandeau: 30,
  graisse: 40,
  saut: 50,
  constellation: 60,
  voyage: 70,
  progression: 80,
} as const;

/**
 * LA BOUCLE — une seule pour tout le site.
 *
 * Une image : Lenis avance le defilement, puis chaque systeme actif est
 * appele, dans l'ordre. Un systeme dont la section est hors de l'ecran n'est
 * pas appele du tout. L'onglet cache arrete `requestAnimationFrame` de
 * lui-meme ; on verifie quand meme `document.hidden`, par prudence.
 *
 * Renvoie la fonction qui l'arrete.
 */
export function demarrerBoucle(): () => void {
  let demande = 0;
  let precedent = performance.now();
  let t = 0;
  let yPrecedent = window.scrollY;
  if (new URLSearchParams(window.location.search).has('mesurer')) window.__mesurer = true;

  const boucle = (instant: number) => {
    demande = requestAnimationFrame(boucle);
    const ecoule = (instant - precedent) / 1000;
    // Trop tot (ecran a 120 Hz ou plus) : on saute cette image.
    if (ecoule < PAS_MINIMAL - TOLERANCE) return;
    precedent = instant;
    const dt = Math.min(ecoule, PAS_MAXIMAL);

    lenis?.raf(instant);
    if (document.hidden) return;
    if (!fige) t += dt;

    const y = window.scrollY;
    const image: Image = {
      dt,
      t,
      y,
      vitesse: lenis ? lenis.velocity : (y - yPrecedent) * 0.6,
      largeur: window.innerWidth,
      hauteur: window.innerHeight,
    };
    yPrecedent = y;
    const debut = window.__mesurer ? performance.now() : 0;
    // Une copie : un systeme peut se retirer pendant l'image (une animation finie).
    for (const systeme of systemes.slice()) {
      try {
        if (!systeme.actif || systeme.actif()) systeme.image(image);
      } catch (erreur) {
        // Un systeme qui plante est retire, une seule fois signale : les
        // autres continuent, et la console n'est pas inondee a 60 images/s.
        console.error('Un systeme de la boucle est tombe, il est retire :', erreur);
        const i = systemes.indexOf(systeme);
        if (i >= 0) systemes.splice(i, 1);
      }
    }
    if (window.__mesurer) performance.measure('image-site', { start: debut, end: performance.now() });
  };

  demande = requestAnimationFrame(boucle);
  return () => cancelAnimationFrame(demande);
}
