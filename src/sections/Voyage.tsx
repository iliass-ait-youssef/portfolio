import { useEffect, useRef } from 'react';
import { useCapacites } from '../capacites/useCapacites';
import { useLang } from '../i18n/useLang';
import { ORDRE } from '../moteur/boucle';
import { enregistrerOrigine, ouvrirDetail } from '../moteur/detail';
import { imposerMot } from '../moteurs/curseur/curseur';
import { useSection } from '../moteur/useSection';
import { creerVoyage, type MoteurVoyage } from '../moteurs/voyage/voyage';
import './voyage.css';

/**
 * LE VOYAGE : le parcours, raconte comme un vol dans une galaxie. Une section
 * collante de 880 vh ; le canvas dessine les etoiles et le chemin (voir
 * moteurs/voyage/voyage.ts), les cartes d'etape suivent leur etoile.
 *
 * Pour les yeux : une carte a la fois, qui suit son etoile. Pour les lecteurs
 * d'ecran et le clavier : les cartes sont cachees, et remplacees par une liste
 * des sept etapes avec de vrais liens vers leurs pages de detail, plus un lien
 * d'acces qui apparait au focus. Personne n'a a defiler pour lire le parcours.
 *
 * Sans animation, le voyage n'existe pas : la section devient une liste de
 * cartes ordinaires, toutes visibles, avec leur bouton (voir voyage.css).
 */
export default function Voyage() {
  const { t, lang } = useLang();
  const { reduit } = useCapacites();
  const racineRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enteteRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const etapeRef = useRef<HTMLSpanElement>(null);
  const barreRef = useRef<HTMLSpanElement>(null);
  const voileRef = useRef<HTMLDivElement>(null);
  const jalonsRef = useRef<(HTMLLIElement | null)[]>([]);
  const cransRef = useRef<(HTMLElement | null)[]>([]);
  const moteurRef = useRef<MoteurVoyage | null>(null);

  const v = t.voyage;
  const N = v.jalons.length;

  useSection(
    racineRef,
    ORDRE.voyage,
    () => {
      const canvas = canvasRef.current;
      const entete = enteteRef.current;
      const hud = hudRef.current;
      const etape = etapeRef.current;
      const barre = barreRef.current;
      const voile = voileRef.current;
      const jalons = jalonsRef.current.filter((j): j is HTMLLIElement => !!j);
      const crans = cransRef.current.filter((c): c is HTMLElement => !!c);
      if (reduit || !canvas || !entete || !hud || !etape || !barre || !voile || jalons.length !== N) return null;
      const moteur = creerVoyage(
        { canvas, entete, hud, etape, barre, crans, voile, jalons },
        v.etape,
        {
          surEtoile: (i, origine) => ouvrirDetail('parcours', i, origine, null),
          // Sur une etoile, la pastille du curseur annonce « Details ».
          surSurvol: (i) => imposerMot(i >= 0 ? v.details : null),
        },
      );
      moteurRef.current = moteur;
      return {
        ...moteur,
        liberer: () => {
          moteur.liberer?.();
          moteurRef.current = null;
          imposerMot(null);
        },
      };
    },
    [lang, reduit],
  );

  // La page de detail se referme sur l'etoile de son etape, si elle est a l'ecran.
  useEffect(() => enregistrerOrigine('parcours', (i) => moteurRef.current?.position(i) ?? null), []);

  return (
    <section ref={racineRef} className="voyage" id="parcours" aria-label={v.aria}>
      {/* Le clavier : un lien qui n'apparait qu'au focus, et qui ouvre la premiere etape. */}
      {!reduit && (
        <a className="voyage__acces" href="#/parcours/1">
          {v.acces}
        </a>
      )}
      <div className="colle">
        <canvas ref={canvasRef} id="c-voyage" className="voyage__canvas" aria-hidden="true" />
        <div ref={enteteRef} className="voyage-entete">
          <span className="surtitre">{v.surtitre}</span>
          <h2>{v.titre}</h2>
          <p>{v.texte}</p>
        </div>

        <ol className="jalons" aria-hidden={!reduit}>
          {v.jalons.map((j, i) => (
            <li key={j.titre} ref={(el) => (jalonsRef.current[i] = el)} className="jalon">
              <div className="quand">{j.quand}</div>
              <h3>{j.titre}</h3>
              <p>
                {j.texte}
                {'aPreciser' in j && j.aPreciser && (
                  <>
                    {' '}
                    <span className="a-preciser">{j.aPreciser}</span>
                  </>
                )}
              </p>
              <button
                className="jalon-lien"
                type="button"
                tabIndex={reduit ? 0 : -1}
                onClick={(e) => ouvrirDetail('parcours', i, moteurRef.current?.position(i) ?? null, e.currentTarget)}
              >
                {v.voirDetail} <span aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ol>

        <div ref={hudRef} className="voyage-hud" aria-hidden="true">
          <span ref={etapeRef}>
            {v.etape} 1 / {N}
          </span>
          <div className="piste-temps">
            <span ref={barreRef} />
          </div>
          <div className="crans">
            {v.jalons.map((j, i) => (
              <i key={j.titre} ref={(el) => (cransRef.current[i] = el)} />
            ))}
          </div>
        </div>
        <div ref={voileRef} className="voyage__voile" aria-hidden="true" />
      </div>

      {/* Les etapes, ecrites : pour les lecteurs d'ecran, avec de vrais liens vers chaque page de detail. */}
      {!reduit && (
        <div className="visuellement-cache">
          <h3>{v.liste}</h3>
          <ol>
            {v.jalons.map((j, i) => (
              <li key={j.titre}>
                <a href={`#/parcours/${i + 1}`}>
                  {j.quand} : {j.titre}
                </a>
                <p>
                  {j.texte} {'aPreciser' in j && j.aPreciser ? j.aPreciser : ''}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
