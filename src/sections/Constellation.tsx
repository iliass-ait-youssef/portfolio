import { useRef } from 'react';
import { useLang } from '../i18n/useLang';
import { ORDRE } from '../moteur/boucle';
import { useSection } from '../moteur/useSection';
import { mouvementReduit } from '../mouvement/preferences';
import { COUCHES, PROJETS } from '../moteurs/ciel/donnees';
import { creerConstellation } from '../moteurs/constellation/constellation';
import './constellation.css';

/**
 * LA CONSTELLATION DES COMPETENCES : une section collante de 330 vh. Son
 * canvas dessine les etoiles (voir moteurs/constellation/constellation.ts) ;
 * le panneau de texte a gauche explique la couche en cours.
 *
 * Un canvas n'est lu par aucun lecteur d'ecran, et son panneau change au fil
 * du defilement. Les deux sont donc caches aux technologies d'assistance, et
 * remplaces par une liste ecrite : les cinq couches avec leurs outils, puis
 * les projets avec ceux qu'ils ont utilises. C'est la meme information, dans
 * un ordre qu'on peut lire.
 *
 * Sans animation, la carte est completement dessinee d'emblee.
 */
export default function Constellation() {
  const { t, lang } = useLang();
  const racineRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titreRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const etatRef = useRef<HTMLDivElement>(null);
  const jaugeRef = useRef<HTMLSpanElement>(null);

  useSection(
    racineRef,
    ORDRE.constellation,
    () => {
      const canvas = canvasRef.current;
      const titre = titreRef.current;
      const description = descriptionRef.current;
      const etat = etatRef.current;
      const jauge = jaugeRef.current;
      const logo = document.querySelector<HTMLElement>('.barre__logo');
      if (!canvas || !titre || !description || !etat || !jauge || !logo) return null;
      return creerConstellation({ canvas, titre, description, etat, jauge, logo }, t.constellation, mouvementReduit());
    },
    // Le texte du canvas est dans la langue courante : le moteur est refait au changement.
    [lang],
  );

  const c = t.constellation;
  return (
    <section ref={racineRef} className="carte-ciel" id="competences" aria-label={c.aria}>
      <div className="colle">
        <canvas ref={canvasRef} className="carte-ciel__canvas" role="img" aria-label={c.canvas} />
        <div className="carte-texte" aria-hidden="true">
          <span className="surtitre">{c.surtitre}</span>
          <h2 ref={titreRef}>{c.titreDebut}</h2>
          <p ref={descriptionRef}>{c.texteDebut}</p>
          <div ref={etatRef} className="carte-texte__etat" />
          <div className="jauge">
            <span ref={jaugeRef} />
          </div>
        </div>
      </div>

      {/* La meme information, ecrite : pour les lecteurs d'ecran. */}
      <div className="visuellement-cache">
        <h2>{c.surtitre}</h2>
        <p>{c.texteDebut}</p>
        <ol>
          {COUCHES.map((couche, i) => (
            <li key={couche.cle}>
              <h3>
                {c.couche} {couche.numero} · {c.couches[i].nom}
              </h3>
              <p>{c.couches[i].texte}</p>
              <p>
                {c.outilsLabel} : {couche.outils.map((o) => c.outils[o as keyof typeof c.outils]).join(', ')}
              </p>
            </li>
          ))}
        </ol>
        <h3>{c.titreProjets}</h3>
        <p>{c.texteProjets}</p>
        <ul>
          {PROJETS.map((p) => (
            <li key={p.cle}>
              {c.projets[p.cle as keyof typeof c.projets]} : {p.liens.map((o) => c.outils[o as keyof typeof c.outils]).join(', ')}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
