import { lireCourbe, type Courbe } from './bezier';

/**
 * LES JETONS DE MOUVEMENT, lus dans `tokens.css`.
 *
 * Les durees et les courbes sont ecrites UNE fois, dans le CSS. Ce module les
 * relit au premier usage pour ceux qui ne sont pas du CSS : la boucle
 * d'animation et les moteurs. Aucune valeur n'est recopiee ici.
 *
 * Les durees sont rendues en SECONDES, l'unite de la boucle.
 */
export interface Jetons {
  duree: {
    eclair: number;
    court: number;
    moyen: number;
    long: number;
    tresLong: number;
  };
  /** L'ecart entre deux lettres d'une cascade, en secondes. */
  cascade: number;
  courbe: {
    entree: Courbe;
    sortie: Courbe;
    transition: Courbe;
  };
}

/** `150ms` -> 0,15 ; `0.3s` -> 0,3. Tout autre format est une erreur. */
export function lireDuree(valeur: string): number {
  const v = valeur.trim();
  const ms = v.match(/^(-?[\d.]+)ms$/);
  if (ms) return Number(ms[1]) / 1000;
  const s = v.match(/^(-?[\d.]+)s$/);
  if (s) return Number(s[1]);
  throw new Error(`Duree illisible : « ${valeur} »`);
}

let memoire: Jetons | null = null;

/**
 * Les jetons, lus une fois puis gardes en memoire. La lecture est paresseuse :
 * au premier usage, la feuille de style est toujours appliquee.
 */
export function jetons(): Jetons {
  if (memoire) return memoire;
  const style = getComputedStyle(document.documentElement);
  const lire = (nom: string) => {
    const valeur = style.getPropertyValue(nom);
    if (!valeur.trim()) throw new Error(`Jeton de mouvement absent : ${nom}`);
    return valeur;
  };
  const duree = (nom: string) => lireDuree(lire(nom));
  memoire = {
    duree: {
      eclair: duree('--d-eclair'),
      court: duree('--d-court'),
      moyen: duree('--d-moyen'),
      long: duree('--d-long'),
      tresLong: duree('--d-tres-long'),
    },
    cascade: duree('--cascade'),
    courbe: {
      entree: lireCourbe(lire('--courbe-entree')),
      sortie: lireCourbe(lire('--courbe-sortie')),
      transition: lireCourbe(lire('--courbe-trans')),
    },
  };
  return memoire;
}

/**
 * La vitesse d'un amortissement exponentiel qui arrive a 95 % en `duree`.
 *
 * Certaines valeurs ne sont pas des animations avec un debut et une fin, mais
 * des poursuites : l'anneau du curseur suit la souris, l'inclinaison suit la
 * vitesse du defilement. On les lisse par
 * `valeur += (cible - valeur) * (1 - e^(-k dt))`. Au bout d'un temps T, il
 * reste e^(-kT) de l'ecart ; pour n'en garder que 5 %, k = ln(20) / T.
 */
export function vitesseAmortissement(duree: number): number {
  return Math.log(20) / duree;
}

/** Le facteur de poursuite d'une image de duree `dt`, pour une vitesse `k`. */
export function poursuite(k: number, dt: number): number {
  return 1 - Math.exp(-k * dt);
}
