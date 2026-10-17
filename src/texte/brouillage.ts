import { inscrire, ORDRE } from '../moteur/boucle';
import { jetons } from '../mouvement/jetons';
import { mouvementReduit } from '../mouvement/preferences';

/** Les glyphes qui defilent avant de se fixer : de quoi ressembler a un terminal. */
const GLYPHES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*<>/=+';

/**
 * LE BROUILLAGE : un texte qui se decode comme une sortie de terminal.
 *
 * Pendant un pas « long », chaque caractere affiche d'abord un glyphe tire au
 * hasard, puis se fixe sur sa vraie valeur. Les caracteres se fixent de gauche
 * a droite : le premier au quart du temps, le dernier a la fin. Les espaces ne
 * sont jamais brouilles : la forme des mots reste lisible.
 *
 * L'element passe ne doit contenir que du texte, et ne doit pas etre lu par un
 * lecteur d'ecran pendant le brouillage (voir `TexteBrouille`, qui en donne une
 * copie invisible). L'animation tourne dans la boucle unique du site, puis
 * s'en retire.
 */
export function brouiller(element: HTMLElement): void {
  if (mouvementReduit() || element.dataset.brouille) return;
  element.dataset.brouille = 'oui';
  const final = element.textContent ?? '';
  const duree = jetons().duree.long;
  let ecoule = 0;
  const retirer = inscrire({
    ordre: ORDRE.texte,
    image: ({ dt }) => {
      ecoule += dt;
      const t = ecoule / duree;
      let s = '';
      for (let i = 0; i < final.length; i += 1) {
        const seuil = (i / final.length) * 0.75;
        s += t > seuil + 0.25 || final[i] === ' ' ? final[i] : GLYPHES[Math.floor(Math.random() * GLYPHES.length)];
      }
      element.textContent = s;
      if (t >= 1) {
        element.textContent = final;
        retirer();
      }
    },
  });
}
