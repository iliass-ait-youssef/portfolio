import { inscrire, ORDRE, type Systeme } from './boucle';
import { borne, part } from './maths';

/**
 * L'INCLINAISON DU DEFILEMENT : la vitesse de la molette, lissee, et la
 * penchee qui en decoule.
 *
 * Quand on defile vite, le bandeau et les cartes de projet s'inclinent un
 * peu dans le sens du mouvement, puis se redressent. Deux modules s'en
 * servent (le bandeau et les projets) ; plutot que de la calculer deux fois,
 * ce petit systeme la tient a jour, tout le temps, pour tout le monde. Il
 * coute quatre multiplications par image.
 *
 * C'est le seul etat partage entre deux effets du site ; il est ici, nomme,
 * et pas cache dans l'un des deux.
 */
export const REGLAGES = {
  /** Vitesse du defilement lissee : part de l'ecart rattrapee par image a 60 Hz. */
  lissageVitesse: 0.12,
  /** Inclinaison : part de l'ecart rattrapee par image a 60 Hz. */
  lissageInclinaison: 0.15,
  /** Degres d'inclinaison par unite de vitesse lissee. */
  degresParVitesse: 0.22,
  /** Inclinaison maximale, en degres, dans un sens comme dans l'autre. */
  degresMax: 9,
} as const;

export const inclinaison = {
  /** La vitesse du defilement, lissee (positive vers le bas). */
  vitesse: 0,
  /** L'inclinaison courante, en degres. */
  degres: 0,
};

/** Le systeme, a inscrire une fois dans la boucle. Fige, il ne fait rien. */
export function systemeInclinaison(fige: boolean): Systeme {
  return {
    ordre: ORDRE.bandeau - 1,
    image: ({ dt, vitesse }) => {
      if (fige) return;
      inclinaison.vitesse += (vitesse - inclinaison.vitesse) * part(REGLAGES.lissageVitesse, dt);
      const cible = borne(inclinaison.vitesse * REGLAGES.degresParVitesse, -REGLAGES.degresMax, REGLAGES.degresMax);
      inclinaison.degres += (cible - inclinaison.degres) * part(REGLAGES.lissageInclinaison, dt);
    },
  };
}

/** Inscrit le systeme ; renvoie la fonction qui le retire. */
export function demarrerInclinaison(fige: boolean): () => void {
  return inscrire(systemeInclinaison(fige));
}
