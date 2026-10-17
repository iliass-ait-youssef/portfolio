/**
 * LA DETECTION DES CAPACITES : ce que la machine et l'utilisateur permettent.
 *
 * Trois questions, posees une fois et re-posees si elles changent :
 *   1. WebGL est-il disponible, et accelere ? Sinon, pas de trou noir calcule :
 *      une version dessinee en CSS prend sa place.
 *   2. L'utilisateur demande-t-il moins d'animation ? Alors le site est
 *      immobile, complet, et sans intro.
 *   3. L'ecran est-il etroit (un telephone) ? Alors les effets de curseur sont
 *      coupes, les cartes du voyage passent en bas d'ecran, et le trou noir
 *      demarre a une resolution plus basse.
 */

/** En dessous de cette largeur : un telephone. */
export const LARGEUR_MOBILE = 860;

export interface Capacites {
  webgl: boolean;
  reduit: boolean;
  mobile: boolean;
}

/** Le test WebGL cree un contexte : on ne le fait qu'une fois par page. */
let webgl: boolean | null = null;

/**
 * Vrai si WebGL est disponible SANS « inconvenient majeur de performance » :
 * un WebGL logiciel, sans carte graphique, ferait ramper le trou noir. Le
 * contexte de test est rendu tout de suite au navigateur.
 */
export function webglDisponible(): boolean {
  if (webgl !== null) return webgl;
  try {
    const canvas = document.createElement('canvas');
    const contexte = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true });
    webgl = contexte !== null;
    contexte?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}

export function verifierCapacites(): Capacites {
  return {
    webgl: webglDisponible(),
    reduit: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    mobile: window.innerWidth < LARGEUR_MOBILE,
  };
}
