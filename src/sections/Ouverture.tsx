import { useEffect, useRef, type CSSProperties } from 'react';
import { useLang } from '../i18n/useLang';
import { inscrire, ORDRE } from '../moteur/boucle';
import { phaseIntro, surPhase } from '../moteur/etatIntro';
import { avancementOuverture } from '../moteur/ouverture';
import { borne, sortie } from '../moteur/maths';
import { mouvementReduit } from '../mouvement/preferences';
import { brouiller } from '../texte/brouillage';
import TexteBrouille from '../texte/TexteBrouille';
import TexteDecoupe from '../texte/TexteDecoupe';
import './ouverture.css';

/**
 * L'OUVERTURE : le haut de la page, pose sur le trou noir.
 *
 * Quand l'intro se termine, les lettres du titre montent en cascade et le
 * sur-titre se decode ; le chapo, les boutons et l'indice apparaissent l'un
 * apres l'autre (`data-intro`, avec un retard chacun).
 *
 * Puis, au defilement, tout suit l'avancement de l'ouverture (le meme nombre
 * que le trou noir qui retrecit) :
 *   - chaque lettre du titre s'envole vers le haut en basculant un peu, avec
 *     un leger decalage sur la precedente ;
 *   - les autres elements s'effacent en montant, l'un apres l'autre ; une
 *     fois effaces, ils sont caches pour de bon (ni clic, ni tabulation sur
 *     un bouton invisible).
 *
 * La boucle n'ecrit dans la page que si l'avancement a change.
 *
 * Sous reduced-motion, tout est en place des le depart et rien ne s'envole :
 * l'ouverture defile comme un bloc de texte ordinaire.
 */
export default function Ouverture() {
  const { t, lang } = useLang();
  const racineRef = useRef<HTMLDivElement>(null);
  const titreRef = useRef<HTMLHeadingElement>(null);

  // La revelation, a la fin de l'intro.
  useEffect(() => {
    const titre = titreRef.current;
    const racine = racineRef.current;
    if (!titre || !racine) return;
    const reveler = () => {
      titre.classList.add('visible');
      racine.querySelectorAll<HTMLElement>('.brouille').forEach(brouiller);
    };
    if (phaseIntro() === 'fini') {
      // Changement de langue apres l'intro : le nouveau texte est deja en place.
      titre.classList.add('visible');
      return;
    }
    return surPhase((phase) => {
      if (phase === 'fini') reveler();
    });
  }, [lang]);

  // L'envol, au defilement.
  useEffect(() => {
    const racine = racineRef.current;
    const titre = titreRef.current;
    if (!racine || !titre || mouvementReduit()) return;
    const lettres = Array.from(titre.querySelectorAll<HTMLElement>('.car'));
    const elements = Array.from(racine.querySelectorAll<HTMLElement>('[data-intro]'));

    let dernier = -1;
    const retirer = inscrire({
      ordre: ORDRE.trouNoir,
      image: ({ y, hauteur }) => {
        if (phaseIntro() !== 'fini') return;
        const e = avancementOuverture(y, hauteur, false);
        const arrondi = Math.round(e * 10000) / 10000;
        if (arrondi === dernier) return;
        // Le premier mouvement du defilement prend la main sur les transitions
        // d'apparition : desormais, c'est la boucle qui place ces elements.
        if (dernier === -1 && arrondi === 0) return;
        dernier = arrondi;

        lettres.forEach((lettre, i) => {
          const pc = borne(e * 1.9 - i * 0.045, 0, 1);
          const k = sortie(pc);
          lettre.style.transform = pc > 0 ? `translateY(${(-k * 115).toFixed(1)}%) rotate(${(-k * 6).toFixed(2)}deg)` : '';
        });
        elements.forEach((element, i) => {
          const pe = borne(e * 1.6 - 0.1 * i, 0, 1);
          element.style.transition = 'none';
          element.style.opacity = (1 - pe).toFixed(3);
          element.style.transform = `translateY(${(-pe * 40).toFixed(1)}px)`;
          // Efface, il ne doit plus recevoir ni clic ni tabulation.
          element.style.visibility = pe >= 1 ? 'hidden' : '';
        });
      },
    });
    return retirer;
  }, [lang]);

  return (
    <section className="ouverture" id="haut" aria-label={t.ouverture.aria}>
      <div ref={racineRef} className="ouverture__colle">
        <div className="ouverture__contenu">
          <div className="surtitre" data-intro="">
            <TexteBrouille texte={t.ouverture.surtitre} />
          </div>
          <h1 key={lang} ref={titreRef}>
            <TexteDecoupe lignes={[[{ texte: t.ouverture.titre1 }], [{ texte: t.ouverture.titre2 }]]} />
          </h1>
          <p data-intro="" style={{ '--d': 'calc(var(--d-court) * 1.5)' } as CSSProperties}>
            {t.ouverture.chapo}
          </p>
          <div className="actions" data-intro="" style={{ '--d': 'var(--d-moyen)' } as CSSProperties}>
            <a className="bouton bouton-plein" href="#projets" data-aimant="">
              <span>{t.ouverture.voirProjets}</span>
            </a>
            <a className="bouton bouton-creux" href="#contact" data-aimant="">
              {t.ouverture.contacter}
            </a>
          </div>
        </div>
        <div className="ouverture__indice" aria-hidden="true" data-intro="" style={{ '--d': 'var(--d-long)' } as CSSProperties}>
          <span>{t.ouverture.defiler}</span>
          <span />
        </div>
      </div>
    </section>
  );
}
