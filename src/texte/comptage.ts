import { inscrire, ORDRE } from '../moteur/boucle';
import { expo } from '../moteur/maths';
import { jetons } from '../mouvement/jetons';
import { mouvementReduit } from '../mouvement/preferences';

/** La facon d'ecrire un nombre dans chaque langue : « 5 326 » ou « 5,326 ». */
export function formatNombre(langue: string): Intl.NumberFormat {
  return new Intl.NumberFormat(langue === 'fr' ? 'fr-FR' : 'en-GB');
}

/**
 * UN COMPTEUR qui monte de 0 a sa valeur, vite puis de plus en plus lentement
 * (exponentielle sortante), en un pas « tres long ».
 *
 * L'element passe porte `data-compteur` (la valeur) et `data-langue` ; le
 * nombre anime est ecrit dans son enfant `.compteur__vu`, cache aux lecteurs
 * d'ecran (voir `Compteur.tsx`, qui donne la valeur finale en clair). Sous
 * reduced-motion, rien ne bouge : la valeur finale est deja affichee.
 */
export function compter(element: HTMLElement): void {
  const vu = element.querySelector<HTMLElement>('.compteur__vu');
  if (!vu || mouvementReduit()) return;
  const fin = Number(element.dataset.compteur);
  const format = formatNombre(element.dataset.langue ?? 'fr');
  const duree = jetons().duree.tresLong;
  let ecoule = 0;
  vu.textContent = format.format(0);
  const retirer = inscrire({
    ordre: ORDRE.texte,
    image: ({ dt }) => {
      ecoule += dt;
      const t = Math.min(1, ecoule / duree);
      vu.textContent = format.format(Math.round(fin * expo(t)));
      if (t >= 1) retirer();
    },
  });
}
