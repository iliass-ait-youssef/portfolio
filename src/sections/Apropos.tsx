import { useRef, type CSSProperties } from 'react';
import { useLang } from '../i18n/useLang';
import Compteur from '../texte/Compteur';
import { useRevelations } from '../texte/revelation';
import TexteDecoupe from '../texte/TexteDecoupe';
import './apropos.css';

/**
 * L'A-PROPOS : une declaration en grand, dont les lettres montent quand elle
 * entre a l'ecran, puis trois chiffres qui apparaissent l'un apres l'autre et
 * comptent jusqu'a leur valeur.
 *
 * Le prototype appliquait par erreur le style des legendes (15 px, gris) au
 * nombre lui-meme : les chiffres s'affichaient en petit a cote de leur unite.
 * Ici, le nombre et son unite ont la meme taille.
 */
export default function Apropos() {
  const { t, lang } = useLang();
  const racineRef = useRef<HTMLElement>(null);
  useRevelations(racineRef, [lang]);

  return (
    <section ref={racineRef} className="section" id="apropos" aria-label={t.apropos.aria}>
      <div className="interieur">
        <p className="declaration" data-apparait-lettres="">
          <TexteDecoupe lignes={[[{ texte: `${t.apropos.declaration} ` }, { texte: t.apropos.declarationFin, accent: true }]]} />
        </p>
        <div className="chiffres">
          {t.apropos.chiffres.map((chiffre, i) => (
            <div
              key={i}
              className={`chiffre${chiffre.unite ? '' : ' chiffre--seul'}`}
              data-apparait=""
              style={{ '--d': `calc(var(--d-court) / 3 * ${i})` } as CSSProperties}
            >
              <b>
                <Compteur valeur={chiffre.valeur} />
                {chiffre.unite}
              </b>
              <span className="chiffre__legende">{chiffre.legende}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
