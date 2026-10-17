import { inscrire, ORDRE } from '../../moteur/boucle';
import { part } from '../../moteur/maths';
import { souris } from '../../moteur/souris';

/**
 * LE CURSEUR PERSONNALISE : un point qui colle au pointeur, et un anneau qui
 * le suit avec un peu de retard. L'anneau grossit sur ce qui se clique, et
 * devient une pastille portant un mot (« Lire », « Details ») sur ce qui
 * ouvre une page.
 *
 * Le curseur est purement decoratif : le vrai curseur de la souris reste
 * visible, rien n'est cache ni capte (`pointer-events: none`). Il n'existe
 * qu'avec une souris, et pas sous reduced-motion (voir `sections/Curseur.tsx`).
 */
export const REGLAGES = {
  /** Retard de l'anneau : part de l'ecart rattrapee par image a 60 Hz. */
  suivi: 0.18,
  /** Ce qui affiche un mot dans l'anneau (attribut `data-curseur`), et ce qui le fait seulement grossir. */
  cibleAvecMot: '[data-curseur]',
  cibleCliquable: 'a, button',
} as const;

/**
 * Le mot que la pastille doit porter, impose de l'exterieur : le voyage dessine
 * ses etoiles sur un canvas, le curseur ne peut pas les « voir » dans la page.
 * `null` : pas de mot impose.
 */
let motImpose: string | null = null;
export function imposerMot(mot: string | null): void {
  motImpose = mot;
}

type Forme = 'repos' | 'survol' | 'etiquette';

/** Branche le curseur sur ses trois elements ; renvoie la fonction qui le retire. */
export function demarrerCurseur(point: HTMLElement, anneau: HTMLElement, texte: HTMLElement): () => void {
  const anneauPos = { x: souris.x, y: souris.y };
  /** Le mot de l'element survole (vide : un element cliquable sans mot). */
  let motSurvol: string | null = null;
  let survole = false;
  let forme: Forme = 'repos';
  let mot = '';
  let actif = false;
  let initialise = false;

  // Ce que le pointeur survole : une seule ecoute pour toute la page.
  const surSurvol = (e: PointerEvent) => {
    const cible = e.target instanceof Element ? e.target : null;
    // Le mot l'emporte : le lien d'une carte la couvre tout entiere, mais c'est « Lire » qu'on veut voir.
    const avecMot = cible?.closest(REGLAGES.cibleAvecMot) ?? null;
    motSurvol = avecMot ? avecMot.getAttribute('data-curseur') : null;
    survole = avecMot !== null || cible?.closest(REGLAGES.cibleCliquable) != null;
  };
  document.addEventListener('pointerover', surSurvol);

  const retirer = inscrire({
    ordre: ORDRE.curseur,
    image: ({ dt }) => {
      // Visible seulement tant que la souris est dans la fenetre.
      if (souris.presente !== actif) {
        actif = souris.presente;
        document.body.classList.toggle('curseur-actif', actif);
      }
      if (!actif) return;
      // A la premiere apparition, l'anneau est deja sous le pointeur : il ne vient pas du coin.
      if (!initialise) {
        anneauPos.x = souris.x;
        anneauPos.y = souris.y;
        initialise = true;
      }
      const k = part(REGLAGES.suivi, dt);
      anneauPos.x += (souris.x - anneauPos.x) * k;
      anneauPos.y += (souris.y - anneauPos.y) * k;
      point.style.transform = `translate(${souris.x}px, ${souris.y}px)`;
      anneau.style.transform = `translate(${anneauPos.x.toFixed(1)}px, ${anneauPos.y.toFixed(1)}px)`;

      // La forme : un mot impose l'emporte, puis le mot de la cible, puis une simple cible.
      const motVoulu = motImpose ?? (motSurvol ? motSurvol : null);
      const voulue: Forme = motVoulu ? 'etiquette' : survole ? 'survol' : 'repos';
      if (voulue !== forme) {
        anneau.classList.toggle('survol', voulue === 'survol');
        anneau.classList.toggle('etiquette', voulue === 'etiquette');
        forme = voulue;
      }
      if (motVoulu && motVoulu !== mot) {
        mot = motVoulu;
        texte.textContent = mot;
      }
    },
  });

  return () => {
    retirer();
    document.removeEventListener('pointerover', surSurvol);
    document.body.classList.remove('curseur-actif');
    motImpose = null;
  };
}
