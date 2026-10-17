import { useRef } from 'react';
import { useLang } from '../i18n/useLang';
import { useRevelations } from '../texte/revelation';
import TexteDecoupe from '../texte/TexteDecoupe';
import './suite.css';

/**
 * LA PAGE QUI SUIT LE VOYAGE, encore a definir.
 *
 * Son contenu sera decrit plus tard par Iliass : on garde la place, bien
 * visible, avec l'emplacement en orange « a preciser ». Rien n'est invente.
 */
export default function Suite() {
  const { t, lang } = useLang();
  const racineRef = useRef<HTMLElement>(null);
  useRevelations(racineRef, [lang]);

  return (
    <section ref={racineRef} className="section suite" id="suite" aria-label={t.suite.aria}>
      <div className="interieur">
        <div className="entete">
          <h2 data-apparait-lettres="">
            <TexteDecoupe lignes={[[{ texte: t.suite.titre }]]} />
          </h2>
          <span className="surtitre">{t.suite.surtitre}</span>
        </div>
        <p className="suite__texte" data-apparait="">
          {t.suite.texte}
        </p>
        <div className="suite__emplacement" data-apparait="">
          {t.suite.emplacement}
        </div>
      </div>
    </section>
  );
}
