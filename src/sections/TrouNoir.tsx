import { useEffect } from 'react';
import type { Capacites } from '../capacites/capacites';
import { inscrire, ORDRE } from '../moteur/boucle';
import { avancementOuverture } from '../moteur/ouverture';
import { Section } from '../moteur/sections';
import { planifier, type Contexte } from '../moteurs/trou-noir/choregraphie';
import { TrouNoir as Moteur } from '../moteurs/trou-noir/trouNoir';
import './trou-noir.css';

declare global {
  interface Window {
    /** Pour les mesures : la qualite courante du trou noir (part de la resolution calculee). */
    __qualiteTrou?: () => number;
  }
}

/**
 * LE TROU NOIR, branche sur la page.
 *
 * Ce composant ne dessine rien lui-meme : il cree le canvas fixe et le moteur
 * WebGL, et a chaque image donne au moteur son `Plan` (voir choregraphie.ts),
 * calcule a partir du defilement.
 *
 * Le canvas est cree ici, pas rendu par React : quand le moteur est libere, son
 * contexte WebGL est rendu au navigateur et ne peut plus servir. Un nouveau
 * montage (React en mode strict monte deux fois en developpement) doit donc
 * repartir d'un canvas neuf.
 *
 * Les reperes du logo (sa place, sa taille, la hauteur de la barre) sont lus
 * dans la mise en page, pas recopies : le CSS de la barre reste la seule
 * source. Ils sont relus quand la fenetre change de taille, jamais a chaque
 * image.
 *
 * Sans WebGL, il n'y a pas de canvas : un repli en CSS (un disque noir et un
 * anneau lumineux, voir trou-noir.css) tient sa place, avec la meme
 * choregraphie : il s'efface avec l'ouverture et revient derriere le contact.
 * La choregraphie tourne dans les deux cas (elle pose `logo-plonge` du logo).
 */
export default function TrouNoir({ capacites }: { capacites: Capacites }) {
  useEffect(() => {
    const contact = document.getElementById('contact');
    const logo = document.querySelector<HTMLElement>('.barre__logo');
    const barre = document.querySelector<HTMLElement>('.barre');
    if (!contact || !logo || !barre) return;

    let canvas: HTMLCanvasElement | null = null;
    if (capacites.webgl) {
      canvas = document.createElement('canvas');
      canvas.className = 'trou';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
    }
    let repli: HTMLDivElement | null = null;
    if (!capacites.webgl) {
      repli = document.createElement('div');
      repli.className = 'trou-repli';
      repli.setAttribute('aria-hidden', 'true');
      document.body.appendChild(repli);
    }
    const moteur = canvas ? Moteur.creer(canvas, { fige: capacites.reduit, mobile: capacites.mobile }) : null;
    if (moteur) window.__qualiteTrou = () => moteur.qualiteCourante;
    const fin = new Section(contact);

    // Les reperes du logo, en pixels CSS. `offsetLeft`/`offsetTop` ignorent
    // les transformations : la barre peut etre cachee au-dessus de l'ecran,
    // la place du logo reste juste.
    const reperes = { marge: 0, hautLogo: 0, logo: 0, hautBarre: 0 };
    const mesurer = () => {
      reperes.marge = logo.offsetLeft;
      reperes.hautLogo = logo.offsetTop;
      reperes.logo = logo.offsetWidth;
      reperes.hautBarre = barre.offsetHeight;
    };
    mesurer();
    window.addEventListener('resize', mesurer);

    let plonge: boolean | null = null;
    const retirer = inscrire({
      ordre: ORDRE.trouNoir,
      image: ({ dt, y, largeur, hauteur }) => {
        const contexte: Contexte = {
          e: avancementOuverture(y, hauteur, capacites.reduit),
          largeurEcran: largeur,
          hauteurEcran: hauteur,
          hautContact: fin.hautAEcran(y),
          ...reperes,
        };
        const plan = planifier(contexte);
        if (plan.finale !== plonge) {
          plonge = plan.finale;
          document.body.classList.toggle('logo-plonge', plan.finale);
        }
        moteur?.dessiner(plan, dt, largeur, hauteur);
        // Le repli : plein tant que l'ouverture n'a pas commence, efface quand le logo est range, revenu derriere le contact.
        repli?.style.setProperty('--repli-opacite', String(plan.finale ? 1 : 1 - contexte.e));
      },
    });

    return () => {
      retirer();
      window.removeEventListener('resize', mesurer);
      fin.liberer();
      moteur?.liberer();
      canvas?.remove();
      repli?.remove();
      delete window.__qualiteTrou;
      document.body.classList.remove('logo-plonge');
    };
  }, [capacites.webgl, capacites.reduit, capacites.mobile]);

  return null;
}
