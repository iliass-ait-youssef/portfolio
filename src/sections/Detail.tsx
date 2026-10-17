import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n/useLang';
import {
  changerDetail,
  demarrerRoutage,
  elementDeRetour,
  fermerDetail,
  lireDetail,
  surDetail,
  type EtatDetail,
} from '../moteur/detail';
import { creerSprites } from '../moteurs/voyage/sprites';
import { ciel } from '../moteurs/ciel/donnees';
import './detail.css';

const deux = (n: number) => String(n).padStart(2, '0');
const FOCALISABLES = 'a[href], button:not([disabled])';

/**
 * LA PAGE DE DETAIL : une page en surimpression, pour une etape du parcours ou
 * un projet. Elle s'ouvre en cercle depuis l'etoile ou la carte cliquee, et se
 * referme dessus.
 *
 * Elle est une vraie boite de dialogue modale :
 *   - tout le reste de la page est rendu inerte (`inert`) : ni clic, ni
 *     tabulation, ni lecteur d'ecran n'y accede ;
 *   - le focus entre sur le bouton de retour, et boucle dans la page ;
 *   - Echap ferme ; le focus revient a l'element qui l'avait.
 * L'adresse porte la page (voir moteur/detail.ts).
 *
 * Les quatre blocs de texte de chaque page restent « a rediger » : leur
 * contenu est a preciser par Iliass, rien n'est invente.
 */
export default function Detail() {
  const { t } = useLang();
  const etat = useSyncExternalStore(surDetail, lireDetail);
  const dialogueRef = useRef<HTMLDivElement>(null);
  const retourRef = useRef<HTMLButtonElement>(null);
  const etoileRef = useRef<HTMLCanvasElement>(null);
  const titreAvant = useRef<string | null>(null);

  const nombres = { parcours: t.voyage.jalons.length, projets: t.projets.cartes.length };
  useEffect(() => demarrerRoutage(nombres), [nombres.parcours, nombres.projets]); // eslint-disable-line react-hooks/exhaustive-deps

  // La page garde son contenu pendant qu'elle se referme : sinon le texte
  // disparaitrait au debut de l'animation.
  const [affiche, setAffiche] = useState<EtatDetail>(etat);
  useEffect(() => {
    if (etat.ouvert) setAffiche(etat);
  }, [etat]);
  const contenu = etat.ouvert ? etat : affiche;
  const { mode, i } = contenu;

  const parcours = mode === 'parcours';
  const total = parcours ? nombres.parcours : nombres.projets;
  const jalon = t.voyage.jalons[i] as (typeof t.voyage.jalons)[number] & { aPreciser?: string };
  const projet = t.projets.cartes[i];
  const haut = parcours ? jalon?.quand.toUpperCase() : `${projet?.code} · ${projet?.etat}`;
  const titre = parcours ? jalon?.titre : projet?.titre;
  const resume = parcours ? jalon?.texte : projet?.resume;
  const aPreciser = parcours ? jalon?.aPreciser : undefined;
  const compte = `${parcours ? t.detail.etape : t.detail.projet} ${deux(i + 1)} / ${deux(total)}`;

  // Ouverture : le reste de la page devient inerte, le focus entre ; fermeture : tout est rendu.
  const dejaOuvert = useRef(false);
  useEffect(() => {
    const racine = document.getElementById('root');
    if (etat.ouvert) {
      dejaOuvert.current = true;
      racine?.setAttribute('inert', '');
      if (titreAvant.current === null) titreAvant.current = document.title;
      // Un instant : la page est cachee jusqu'au debut de l'animation, et le
      // focus ne peut pas entrer dans ce qui est encore invisible.
      const id = window.setTimeout(() => retourRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
    racine?.removeAttribute('inert');
    if (titreAvant.current !== null) {
      document.title = titreAvant.current;
      titreAvant.current = null;
    }
    if (dejaOuvert.current) elementDeRetour()?.focus?.();
  }, [etat.ouvert]);

  // Le titre de l'onglet suit la page ouverte.
  useEffect(() => {
    if (etat.ouvert && titre) document.title = `${titre} · ${t.meta.titre}`;
  }, [etat.ouvert, titre, t.meta.titre]);

  // Une nouvelle page repart du haut ; son etoile est redessinee.
  useEffect(() => {
    if (dialogueRef.current) dialogueRef.current.scrollTop = 0;
    const canvas = etoileRef.current;
    const x = canvas?.getContext('2d');
    if (!canvas || !x) return;
    const sprite = creerSprites(ciel().galaxie.map((g) => g.jeton)).actuelle;
    if (!sprite) return;
    const taille = Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)) || 360;
    canvas.width = canvas.height = taille;
    x.clearRect(0, 0, taille, taille);
    x.drawImage(sprite, 0, 0, taille, taille);
  }, [mode, i, etat.ouvert]);

  // Echap ferme.
  useEffect(() => {
    if (!etat.ouvert) return;
    const surTouche = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') fermerDetail();
    };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [etat.ouvert]);

  // Le focus boucle dans la page : Tab sur le dernier element revient au premier.
  const surTouche = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const elements = Array.from(dialogueRef.current?.querySelectorAll<HTMLElement>(FOCALISABLES) ?? []);
    if (elements.length === 0) return;
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (e.shiftKey && document.activeElement === premier) {
      e.preventDefault();
      dernier.focus();
    } else if (!e.shiftKey && document.activeElement === dernier) {
      e.preventDefault();
      premier.focus();
    }
  };

  const style = { '--ox': `${contenu.origine.x}px`, '--oy': `${contenu.origine.y}px` } as CSSProperties;

  return createPortal(
    <div
      ref={dialogueRef}
      className={`detail${etat.ouvert ? ' ouvert' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-titre"
      aria-hidden={!etat.ouvert}
      data-lenis-prevent=""
      style={style}
      onKeyDown={surTouche}
    >
      <canvas ref={etoileRef} className="detail__etoile" aria-hidden="true" />
      <div className="detail__interieur">
        <div className="detail__haut">
          <button ref={retourRef} className="detail__retour" type="button" onClick={() => fermerDetail()}>
            {parcours ? t.detail.retourParcours : t.detail.retourProjets}
          </button>
          <span className="surtitre">{compte}</span>
        </div>
        <div className="detail__tete">
          <span className="surtitre">{haut}</span>
          <h2 id="detail-titre">{titre}</h2>
          <p>
            {resume}
            {aPreciser && (
              <>
                {' '}
                <span className="a-preciser">{aPreciser}</span>
              </>
            )}
          </p>
        </div>
        <div className="detail__grille">
          {t.detail.blocs.map((bloc) => (
            <div key={bloc} className="detail__bloc">
              <h3>{bloc}</h3>
              <p className="a-rediger">{t.detail.aRediger}</p>
            </div>
          ))}
          <div className="detail__bloc detail__galerie">
            <p className="a-rediger">{t.detail.galerie}</p>
          </div>
        </div>
        <div className="detail__nav">
          <button type="button" disabled={i === 0} onClick={() => changerDetail(-1)}>
            {parcours ? t.detail.etapePrecedente : t.detail.projetPrecedent}
          </button>
          <button type="button" disabled={i === total - 1} onClick={() => changerDetail(1)}>
            {parcours ? t.detail.etapeSuivante : t.detail.projetSuivant}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
