import { useEffect, useState } from 'react';
import { LARGEUR_MOBILE, verifierCapacites, type Capacites } from './capacites';

/**
 * Les capacites, tenues a jour : si l'utilisateur active la reduction des
 * animations ou change la largeur de la fenetre, le site s'adapte sans
 * rechargement.
 */
export function useCapacites(): Capacites {
  const [capacites, setCapacites] = useState(verifierCapacites);

  useEffect(() => {
    const reevaluer = () => {
      const nouvelles = verifierCapacites();
      setCapacites((actuelles) =>
        actuelles.webgl === nouvelles.webgl &&
        actuelles.reduit === nouvelles.reduit &&
        actuelles.mobile === nouvelles.mobile
          ? actuelles
          : nouvelles,
      );
    };
    const mouvement = window.matchMedia('(prefers-reduced-motion: reduce)');
    const largeur = window.matchMedia(`(min-width: ${LARGEUR_MOBILE}px)`);
    mouvement.addEventListener('change', reevaluer);
    largeur.addEventListener('change', reevaluer);
    return () => {
      mouvement.removeEventListener('change', reevaluer);
      largeur.removeEventListener('change', reevaluer);
    };
  }, []);

  return capacites;
}
