import { useRef } from 'react';
import { useLang } from '../i18n/useLang';
import { ORDRE } from '../moteur/boucle';
import { useSection } from '../moteur/useSection';
import { mouvementReduit } from '../mouvement/preferences';
import { creerBandeau } from '../moteurs/bandeau/bandeau';
import './bandeau.css';

/**
 * LE BANDEAU : deux rangees de technologies, l'une en contour, l'autre en
 * violet, qui defilent en sens contraires (voir moteurs/bandeau/bandeau.ts).
 *
 * C'est une decoration : les technologies sont dites ailleurs, en texte, dans
 * les projets et la constellation. Le bandeau est donc cache aux lecteurs
 * d'ecran en entier. Chaque rangee est ecrite deux fois, pour que la boucle
 * du defilement ne se voie pas ; la copie ne sert qu'a l'oeil.
 *
 * Sans animation, il reste immobile, les deux rangees visibles.
 */
export default function Bandeau() {
  const { t } = useLang();
  const racineRef = useRef<HTMLDivElement>(null);
  useSection(racineRef, ORDRE.bandeau, (element) => (mouvementReduit() ? null : creerBandeau(element)));

  const rangs = [
    { mots: t.bandeau.rang1, sens: -1 },
    { mots: t.bandeau.rang2, sens: 1 },
  ];

  return (
    <div ref={racineRef} className="bandeau" aria-hidden="true">
      {rangs.map(({ mots, sens }) => (
        <div key={sens} className="bandeau__rang" data-sens={sens}>
          <div className="bandeau__piste">
            {[0, 1].map((copie) =>
              mots.map((mot, i) => (
                <span key={`${copie}-${i}`} className="bandeau__groupe">
                  <span className="bandeau__mot">{mot}</span>
                  <i>/</i>
                </span>
              )),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
