import { useRef } from 'react';
import { useLang } from '../i18n/useLang';
import { ORDRE } from '../moteur/boucle';
import { useSection } from '../moteur/useSection';
import { mouvementReduit } from '../mouvement/preferences';
import { creerSaut } from '../moteurs/saut/saut';
import './saut.css';

/**
 * LE SAUT : l'interlude entre l'a-propos et les projets. On traverse une
 * longue section collante ; son canvas montre le saut en vitesse lumiere
 * (voir moteurs/saut/saut.ts), piloté par le defilement.
 *
 * C'est une decoration : toute la section est cachee aux lecteurs d'ecran. La
 * section « Projets » qui suit porte son propre titre. Sous reduced-motion, le
 * saut n'existe pas : la section n'est pas affichee, rien ne s'anime.
 */
export default function Saut() {
  const { t } = useLang();
  const racineRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motRef = useRef<HTMLDivElement>(null);
  const etiquetteRef = useRef<HTMLDivElement>(null);
  const eclairRef = useRef<HTMLDivElement>(null);

  useSection(racineRef, ORDRE.saut, () => {
    const canvas = canvasRef.current;
    const mot = motRef.current;
    const etiquette = etiquetteRef.current;
    const eclair = eclairRef.current;
    if (mouvementReduit() || !canvas || !mot || !etiquette || !eclair) return null;
    return creerSaut({ canvas, mot, etiquette, eclair });
  });

  return (
    <section ref={racineRef} className="interlude saut" id="saut" aria-hidden="true">
      <div className="colle">
        <canvas ref={canvasRef} className="interlude__canvas" />
        <div className="saut__texte">
          <div ref={etiquetteRef} className="surtitre">
            {t.saut.etiquette}
          </div>
          <div ref={motRef} className="saut__mot">
            {t.saut.mot}
          </div>
        </div>
        <div ref={eclairRef} className="saut__eclair" />
      </div>
    </section>
  );
}
