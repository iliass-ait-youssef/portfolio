import { useEffect, useRef } from 'react';
import { useLang } from '../i18n/useLang';
import { inscrire, ORDRE } from '../moteur/boucle';
import { adresseDeDetail } from '../moteur/detail';
import { changerPhase } from '../moteur/etatIntro';
import { expo } from '../moteur/maths';
import { jetons } from '../mouvement/jetons';
import { mouvementReduit } from '../mouvement/preferences';
import './intro.css';

/** Les gestes qui permettent de passer l'intro. */
const GESTES = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * L'INTRO : un compteur de 0 a 100, puis un rideau noir qui se leve sur le
 * trou noir.
 *
 * Le temps, en pas du systeme de mouvement :
 *   0            le compteur part, vite puis de plus en plus lentement
 *   tres-long    il atteint 100
 *   + eclair     le rideau commence a se lever, le trou noir apparait
 *   + court      l'intro est finie : le titre se revele, le defilement est rendu
 *   + tres-long  le rideau est leve : l'intro sort de la page
 *
 * Un clic, une touche, la molette ou un toucher la font passer, apres un
 * court instant (pour qu'un geste de chargement ne la saute pas par megarde).
 *
 * Elle est purement decorative : cachee aux lecteurs d'ecran, qui arrivent
 * directement sur la page. Sous reduced-motion, elle n'existe pas.
 */
export default function Intro() {
  const { t } = useLang();
  const racineRef = useRef<HTMLDivElement>(null);
  const nombreRef = useRef<HTMLSpanElement>(null);
  const ligneRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const racine = racineRef.current;
    const nombre = nombreRef.current;
    const ligne = ligneRef.current;
    if (!racine || !nombre || !ligne) return;

    // Un lien direct vers une page de detail n'attend pas le rideau : on y va tout de suite.
    if (mouvementReduit() || adresseDeDetail()) {
      racine.classList.add('partie');
      changerPhase('fini');
      return;
    }

    const j = jetons();
    const debutSortie = j.duree.tresLong + j.duree.eclair;
    const fin = debutSortie + j.duree.court;
    const partie = fin + j.duree.tresLong;

    let temps = 0;
    let affiche = -1;
    const passer = () => {
      if (temps > j.duree.court && temps < fin) temps = fin;
    };
    GESTES.forEach((g) => window.addEventListener(g, passer, { passive: true }));

    const retirer = inscrire({
      ordre: ORDRE.intro,
      image: ({ dt }) => {
        temps += dt;
        const p = expo(temps / j.duree.tresLong);
        const n = Math.round(p * 100);
        if (n !== affiche) {
          affiche = n;
          nombre.textContent = String(n);
          ligne.style.transform = `scaleX(${p.toFixed(3)})`;
        }
        if (temps > debutSortie) {
          racine.classList.add('sortie');
          changerPhase('sortie');
        }
        if (temps > fin) changerPhase('fini');
        // Le rideau est leve : l'intro quitte la page et la boucle.
        if (temps > partie) {
          racine.classList.add('partie');
          retirer();
        }
      },
    });

    return () => {
      retirer();
      GESTES.forEach((g) => window.removeEventListener(g, passer));
    };
  }, []);

  return (
    <div ref={racineRef} className="intro" aria-hidden="true">
      <div className="intro__dedans">
        <div className="intro__ligne">
          <span>{t.intro.nom}</span>
          <span>{t.intro.devise}</span>
        </div>
        <div>
          <div className="intro__compteur">
            <span ref={nombreRef}>0</span>
            <small>%</small>
          </div>
          <div className="intro__charge">
            <span ref={ligneRef} />
          </div>
          <div className="intro__ligne intro__ligne--bas">
            <span>{t.intro.calcul}</span>
            <span>{t.intro.passer}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
