import { useRef, type CSSProperties } from 'react';
import { COORDONNEES, CV_DISPONIBLE } from '../coordonnees';
import { useLang } from '../i18n/useLang';
import { ORDRE } from '../moteur/boucle';
import { useSection } from '../moteur/useSection';
import { mouvementReduit, pointeurFin } from '../mouvement/preferences';
import { creerGraisse } from '../moteurs/graisse/graisse';
import { useRevelations } from '../texte/revelation';
import TexteBrouille from '../texte/TexteBrouille';
import TexteDecoupe from '../texte/TexteDecoupe';
import './contact.css';

/**
 * LE CONTACT : le dernier message, pose sur le trou noir revenu en plein ecran
 * (voir sections/TrouNoir.tsx). Un sur-titre qui se decode, la question en
 * grand, l'adresse, et deux liens.
 *
 * La section est transparente : le trou noir passe derriere elle, et un voile
 * sombre au centre garde le texte lisible sur le disque lumineux.
 */
export default function Contact() {
  const { t, lang } = useLang();
  const racineRef = useRef<HTMLElement>(null);
  useRevelations(racineRef, [lang]);

  // Les lettres du titre s'epaississent sous le curseur : seulement avec une
  // souris, et pas sous reduced-motion. Elles sont refaites quand la langue change.
  useSection(racineRef, ORDRE.graisse, (element) => (mouvementReduit() || !pointeurFin() ? null : creerGraisse(element)), [lang]);

  return (
    <section ref={racineRef} className="section contact" id="contact" aria-label={t.contact.aria}>
      <div className="interieur contact__interieur">
        <div className="surtitre" data-apparait="" data-brouille="">
          <TexteBrouille texte={t.contact.surtitre} />
        </div>
        <h2 className="contact__titre" data-apparait-lettres="" data-graisse="">
          <TexteDecoupe lignes={[[{ texte: t.contact.titre }]]} />
        </h2>
        <a
          className="contact__courriel"
          href={`mailto:${COORDONNEES.email}`}
          data-apparait=""
          data-aimant=""
          style={{ '--d': 'calc(var(--d-court) / 3 * 2)' } as CSSProperties}
        >
          {COORDONNEES.email}
        </a>
        <div className="contact__liens" data-apparait="" style={{ '--d': 'var(--d-court)' } as CSSProperties}>
          <a href={COORDONNEES.github} target="_blank" rel="noopener noreferrer">
            {t.contact.github}
            <span className="visuellement-cache"> {t.contact.nouvelleFenetre}</span>
          </a>
          {CV_DISPONIBLE && (
            <a href={COORDONNEES.cv} target="_blank" rel="noopener">
              {t.contact.cv}
              <span className="visuellement-cache"> {t.contact.nouvelleFenetre}</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
