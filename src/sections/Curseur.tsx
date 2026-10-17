import { useEffect, useRef } from 'react';
import { mouvementReduit, pointeurFin } from '../mouvement/preferences';
import { demarrerAimants } from '../moteurs/curseur/aimants';
import { demarrerCurseur } from '../moteurs/curseur/curseur';
import './curseur.css';

/**
 * LE CURSEUR ET LES AIMANTS : deux elements decoratifs, et les deux moteurs
 * qui les animent (moteurs/curseur/).
 *
 * Avec un ecran tactile, ou sous reduced-motion, il n'y a ni curseur ni
 * aimants : les deux elements restent invisibles (`opacity: 0` tant que
 * `body.curseur-actif` n'est pas pose) et rien n'est ecoute.
 */
export default function Curseur() {
  const pointRef = useRef<HTMLDivElement>(null);
  const anneauRef = useRef<HTMLDivElement>(null);
  const texteRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const point = pointRef.current;
    const anneau = anneauRef.current;
    const texte = texteRef.current;
    if (!point || !anneau || !texte || mouvementReduit() || !pointeurFin()) return;
    const arreterCurseur = demarrerCurseur(point, anneau, texte);
    const arreterAimants = demarrerAimants();
    return () => {
      arreterCurseur();
      arreterAimants();
    };
  }, []);

  return (
    <>
      <div ref={pointRef} className="curseur-point" aria-hidden="true" />
      <div ref={anneauRef} className="curseur-anneau" aria-hidden="true">
        <span ref={texteRef} />
      </div>
    </>
  );
}
