import { useEffect } from 'react';
import { brancherLenis, demarrerBoucle, figer } from './boucle';
import { bloquer, creerDefilement, debloquer, defilerVers, detruireDefilement } from './defilement';
import { phaseIntro, surPhase } from './etatIntro';
import { detailEstOuvert } from './detail';
import { demarrerInclinaison } from './inclinaison';
import { demarrerSouris } from './souris';
import { mouvementReduit } from '../mouvement/preferences';

/**
 * LE DEMARRAGE DU SITE : le defilement, la boucle, les ancres.
 *
 * Appele une fois, par `App`. Il cree Lenis (sauf sous reduced-motion, ou le
 * defilement natif, immediat, reste), le bloque pendant l'intro, demarre la
 * boucle unique et intercepte les liens d'ancre (`#projets`, `#contact`...) :
 * au lieu de sauter, la page defile jusqu'a la section, la barre du haut
 * deduite. Le hash n'est pas
 * modifie : il porte les routes des pages de detail (`#/parcours/3`).
 */
export function useSite(): void {
  useEffect(() => {
    const fige = mouvementReduit();
    figer(fige);
    brancherLenis(fige ? null : creerDefilement());
    const arreter = demarrerBoucle();
    const arreterInclinaison = demarrerInclinaison(fige);
    const arreterSouris = demarrerSouris();

    // Pendant l'intro, la page est tenue en haut : le defilement est rendu
    // quand elle se termine. Le navigateur ne doit pas non plus restaurer une
    // ancienne position au rechargement, l'intro se jouerait au milieu de la page.
    let desabonner = () => {};
    if (phaseIntro() !== 'fini') {
      history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      bloquer();
      desabonner = surPhase((phase) => {
        // Une page de detail ouverte par l'adresse garde le defilement bloque.
        if (phase === 'fini' && !detailEstOuvert()) debloquer();
      });
    }

    const surClic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const lien = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const href = lien?.getAttribute('href');
      // `#/...` est une route : elle n'est pas pour nous.
      if (!lien || !href || href.length < 2 || href.startsWith('#/')) return;
      const cible = document.getElementById(href.slice(1));
      if (!cible) return;
      e.preventDefault();
      const barre = document.querySelector<HTMLElement>('.barre')?.offsetHeight ?? 0;
      defilerVers(cible, href === '#haut' ? 0 : -barre);
      // Le clavier suit la vue : la tabulation suivante repart de la section.
      cible.setAttribute('tabindex', '-1');
      cible.focus({ preventScroll: true });
    };
    document.addEventListener('click', surClic);

    return () => {
      desabonner();
      document.removeEventListener('click', surClic);
      arreterInclinaison();
      arreterSouris();
      arreter();
      brancherLenis(null);
      detruireDefilement();
    };
  }, []);
}
