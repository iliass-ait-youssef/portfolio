import { useEffect, useRef, type CSSProperties } from 'react';
import { useLang } from '../i18n/useLang';
import { ORDRE } from '../moteur/boucle';
import { ouvrirDetail } from '../moteur/detail';
import { useSection } from '../moteur/useSection';
import { mouvementReduit, pointeurFin } from '../mouvement/preferences';
import { creerPencheeGrille, inclinerCartes } from '../moteurs/cartes/cartes';
import Compteur from '../texte/Compteur';
import { useRevelations } from '../texte/revelation';
import TexteBrouille from '../texte/TexteBrouille';
import TexteDecoupe from '../texte/TexteDecoupe';
import './projets.css';

/** Le retard entre deux blocs voisins d'une rangee : un tiers de la duree « courte ». */
const decalage = (i: number) => ({ '--d': `calc(var(--d-court) / 3 * ${i})` }) as CSSProperties;

/**
 * LES PROJETS : deux etudes de cas en grandes cartes, trois emplacements « a
 * venir » dessous.
 *
 * Les cartes arrivent de la profondeur (inclinees vers l'arriere, elles se
 * redressent en montant, voir projets.css), pivotent vers le curseur avec un
 * reflet qui le suit, et la grille penche un peu quand on defile vite (voir
 * moteurs/cartes/cartes.ts). Avec un ecran tactile ou sans animation, les
 * cartes restent a plat.
 */
export default function Projets() {
  const { t, lang } = useLang();
  const racineRef = useRef<HTMLElement>(null);
  const grilleRef = useRef<HTMLDivElement>(null);
  useRevelations(racineRef, [lang]);

  // La grille penche avec la vitesse du defilement, sauf sans animation.
  useSection(grilleRef, ORDRE.bandeau + 1, (element) => (mouvementReduit() ? null : creerPencheeGrille(element)));

  // Les cartes pivotent vers le curseur : seulement avec une souris.
  useEffect(() => {
    const grille = grilleRef.current;
    if (!grille || mouvementReduit() || !pointeurFin()) return;
    return inclinerCartes(Array.from(grille.querySelectorAll<HTMLElement>('.carte-projet')));
  }, [lang]);

  return (
    <section ref={racineRef} className="section" id="projets" aria-label={t.projets.aria}>
      <div className="interieur">
        <div className="entete">
          <h2 data-apparait-lettres="">
            <TexteDecoupe lignes={[[{ texte: t.projets.titre }]]} />
          </h2>
          <span className="surtitre" data-brouille="" data-apparait="">
            <TexteBrouille texte={t.projets.surtitre} />
          </span>
        </div>
        <div ref={grilleRef} className="cartes">
          {t.projets.cartes.map((carte, i) => (
            <div key={carte.titre} className="cadre" data-apparait="" style={decalage(i)}>
              <article className="carte-projet" data-curseur={t.projets.lire}>
                <span className="surtitre">
                  {carte.code} · {carte.etat}
                </span>
                <h3>
                  {/* Le lien couvre toute la carte (voir projets.css) ; il porte l'adresse de la page. */}
                  <a
                    href={`#/projets/${i + 1}`}
                    onClick={(e) => {
                      e.preventDefault();
                      // Au clavier, il n'y a pas de clic : le cercle s'ouvre du lien lui-meme.
                      const r = e.currentTarget.getBoundingClientRect();
                      const origine = e.detail > 0 ? { x: e.clientX, y: e.clientY } : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                      ouvrirDetail('projets', i, origine, e.currentTarget);
                    }}
                  >
                    {carte.titre}
                  </a>
                </h3>
                <p>{carte.resume}</p>
                <div className="metriques">
                  {carte.metriques.map((m) => (
                    <div key={m.legende}>
                      <b>{m.compteur ? <Compteur valeur={Number(m.valeur)} /> : m.valeur}</b>
                      <span className="metriques__legende">{m.legende}</span>
                    </div>
                  ))}
                </div>
                <ul className="etiquettes">
                  {carte.etiquettes.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
          {t.projets.aVenir.map((p, i) => (
            <div key={p.titre} className="a-venir" data-apparait="" style={decalage(i)}>
              <b>{p.titre}</b>
              {p.texte}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
