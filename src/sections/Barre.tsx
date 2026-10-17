import { useEffect, useRef } from 'react';
import { useLang } from '../i18n/useLang';
import { inscrire, ORDRE } from '../moteur/boucle';
import { avancementOuverture, SEUIL_BARRE } from '../moteur/ouverture';
import { mouvementReduit } from '../mouvement/preferences';
import './barre.css';

/** Les quatre destinations de la barre, dans l'ordre de la page. */
const LIENS = ['projets', 'competences', 'parcours', 'contact'] as const;

/**
 * LA BARRE DU HAUT.
 *
 * Elle reste cachee au-dessus de l'ecran tant qu'on est sur l'ouverture, et
 * descend quand le trou noir a fini de se ranger dans le logo. A gauche, la
 * place du logo (le trou noir vient s'y poser) et le nom ; a droite, la
 * navigation et la langue ; en dessous, un trait qui suit l'avancement dans la
 * page.
 *
 * La boucle ecrit directement sa classe et l'echelle du trait : React ne
 * repasse pas par la a chaque image.
 */
export default function Barre() {
  const { t, lang, setLang } = useLang();
  const barreRef = useRef<HTMLElement>(null);
  const traitRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const barre = barreRef.current;
    const trait = traitRef.current;
    if (!barre || !trait) return;
    const fige = mouvementReduit();

    // La hauteur totale defilable, mesuree quand la page change de taille et
    // pas a chaque image : la lire a chaque image forcerait une mise en page.
    let total = 1;
    const mesurer = () => {
      total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(document.body);
    window.addEventListener('resize', mesurer);

    let visible: boolean | null = null;
    let echelle = -1;
    const retirer = inscrire({
      ordre: ORDRE.progression,
      image: ({ y, hauteur }) => {
        const descendue = avancementOuverture(y, hauteur, fige) > SEUIL_BARRE;
        if (descendue !== visible) {
          visible = descendue;
          barre.classList.toggle('visible', descendue);
        }
        const p = Math.round(Math.min(1, Math.max(0, y / total)) * 10000) / 10000;
        if (p !== echelle) {
          echelle = p;
          trait.style.transform = `scaleX(${p})`;
        }
      },
    });

    return () => {
      retirer();
      observateur.disconnect();
      window.removeEventListener('resize', mesurer);
    };
  }, []);

  return (
    <header ref={barreRef} className="barre">
      <a className="barre__logo" href="#haut" aria-label={t.barre.logo} />
      <a className="barre__nom" href="#haut">
        {t.barre.nom}
      </a>
      <div className="barre__droite">
        <nav className="barre__nav" aria-label={t.barre.navigation}>
          {LIENS.map((id) => (
            <a key={id} href={`#${id}`}>
              {t.barre[id]}
            </a>
          ))}
        </nav>
        <div className="barre__langues" role="group" aria-label={t.commun.langue}>
          {(['fr', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={lang === l}
              aria-label={l === 'fr' ? t.commun.frLong : t.commun.enLong}
              onClick={() => setLang(l)}
            >
              {t.commun[l]}
            </button>
          ))}
        </div>
      </div>
      <span ref={traitRef} className="barre__progression" aria-hidden="true" />
    </header>
  );
}
