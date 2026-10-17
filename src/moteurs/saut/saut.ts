import { borne, lisse, sortie } from '../../moteur/maths';
import { couleur, rgba } from '../../moteur/palette';
import type { MoteurDeSection } from '../../moteur/useSection';
import { ciel } from '../ciel/donnees';
import { lueur, Toile } from '../commun/toile';

/**
 * LE SAUT EN VITESSE LUMIERE : des etoiles qui s'etirent en traits, un tunnel
 * d'anneaux, un flash, puis le mot PROJETS qui arrive du fond de l'espace.
 *
 * Rien ici ne se joue dans le temps : tout est une fonction de la PROGRESSION
 * dans la section (0 a 1), donc le saut est reversible. Remonter la page le
 * rejoue a l'envers.
 *
 * Tous les reglages sont ici.
 */
export const REGLAGES = {
  /** La distance focale, en part du plus petit cote de l'ecran. */
  focale: 0.55,
  /** Le profil de vitesse : accelere jusqu'a ce point, freine entre les deux suivants. */
  accelerationFin: 0.22,
  freinageDebut: 0.7,
  freinageFin: 0.86,
  /** Distance parcourue par unite de vitesse, et derive constante. */
  echelleDistance: 5,
  deriveConstante: 0.25,
  /** La lueur violette du fond : rayon (part du plus grand cote), eclat au repos et ajoute par la vitesse. */
  lueurRayon: 0.6,
  lueurBase: 0.12,
  lueurVitesse: 0.35,
  /** Les traits d'etoiles : etirement de base, ajoute par la vitesse, epaisseur. */
  etirementBase: 0.006,
  etirementVitesse: 0.22,
  epaisseurMin: 0.6,
  epaisseurMax: 2.4,
  /** Au-dela de cette vitesse, les traits passent du blanc au violet pale. */
  seuilTraitVif: 0.5,
  /** Le tunnel : vitesse a partir de laquelle il apparait, nombre d'anneaux, opacite maximale. */
  tunnelSeuil: 0.35,
  tunnelAnneaux: 12,
  tunnelOpacite: 0.7,
  /** Le flash : position dans le saut, largeur, intensite. */
  flashPosition: 0.8,
  flashLargeur: 0.035,
  flashIntensite: 0.85,
  /** L'etiquette « saut vers les projets » s'efface entre ces deux points. */
  etiquetteDebut: 0.3,
  etiquetteDuree: 0.15,
  /** Le mot arrive du fond : debut, duree de l'arrivee, recul initial (px), bascule initiale (deg). */
  motDebut: 0.55,
  motApparition: 0.15,
  motArrivee: 0.4,
  motRecul: 2400,
  motBascule: 25,
  /** L'ecartement des lettres du mot (em) : ajoute au depart, fonde en une valeur de repos a l'arrivee. */
  motEcartDepart: 0.4,
  motEcartArrivee: -0.045,
} as const;

/** Les elements de la page que le saut pilote. */
export interface ElementsSaut {
  canvas: HTMLCanvasElement;
  mot: HTMLElement;
  etiquette: HTMLElement;
  eclair: HTMLElement;
}

/** La vitesse du saut, de 0 a 1, selon l'avancement : elan, croisiere, freinage. */
function vitesseSaut(p: number): number {
  return lisse(p / REGLAGES.accelerationFin) * (1 - lisse((p - REGLAGES.freinageDebut) / (REGLAGES.freinageFin - REGLAGES.freinageDebut)));
}

/**
 * La distance parcourue : l'integrale de la vitesse, calculee une fois sur 200
 * pas. Une etoile ne se deplace pas a la vitesse du moment, mais depuis le
 * debut : sans l'integrale, remonter la page ferait reculer les etoiles de
 * travers.
 */
const PAS = 200;
const trajet: number[] = (() => {
  const t: number[] = [];
  let cumul = 0;
  for (let i = 0; i <= PAS; i += 1) {
    t.push(cumul);
    cumul += vitesseSaut(i / PAS) / PAS;
  }
  return t;
})();

function distance(p: number): number {
  const f = borne(p, 0, 1) * PAS;
  const i = Math.floor(f);
  const reste = f - i;
  const suivant = trajet[Math.min(PAS, i + 1)] ?? trajet[i];
  return (trajet[i] + (suivant - trajet[i]) * reste) * REGLAGES.echelleDistance + p * REGLAGES.deriveConstante;
}

export function creerSaut(elements: ElementsSaut): MoteurDeSection {
  const toile = new Toile(elements.canvas);
  const etoiles = ciel().saut;
  const lueurFond = couleur('--saut-lueur');
  const fond = rgba('--fond', 1);

  return {
    image: ({ progression: p }) => {
      const v = vitesseSaut(p);
      const d = distance(p);
      const { largeur: W, hauteur: H } = toile;
      const x = toile.commencer();
      x.fillStyle = fond;
      x.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const f = Math.min(W, H) * REGLAGES.focale;

      lueur(x, cx, cy, Math.max(W, H) * REGLAGES.lueurRayon, lueurFond, REGLAGES.lueurBase + REGLAGES.lueurVitesse * v);

      // Les etoiles : chacune s'approche (sa profondeur z diminue avec la
      // distance), et son trait va de sa position d'avant a sa position d'apres.
      x.globalCompositeOperation = 'lighter';
      const [tr, tg, tb] = couleur(v > REGLAGES.seuilTraitVif ? '--saut-trait-vif' : '--saut-trait');
      for (const s of etoiles) {
        const zc = ((((s.z - d) % 1) + 1) % 1) + 0.02;
        const zq = Math.min(1.02, zc + REGLAGES.etirementBase + v * REGLAGES.etirementVitesse);
        const sx = cx + (s.x / zc) * f;
        const sy = cy + (s.y / zc) * f;
        const qx = cx + (s.x / zq) * f;
        const qy = cy + (s.y / zq) * f;
        const a = Math.min(1, (1 - zc) * 1.4) * s.eclat;
        x.strokeStyle = `rgba(${tr},${tg},${tb},${a.toFixed(3)})`;
        x.lineWidth = Math.max(REGLAGES.epaisseurMin, (1 - zc) * REGLAGES.epaisseurMax);
        x.beginPath();
        x.moveTo(qx, qy);
        x.lineTo(sx + 0.1, sy + 0.1);
        x.stroke();
      }

      // Le tunnel : des anneaux qui foncent vers nous, en deux teintes.
      if (v > REGLAGES.tunnelSeuil) {
        const [vr, vg, vb] = couleur('--violet');
        const [br, bg, bb] = couleur('--saut-anneau-bleu');
        for (let k = 0; k < REGLAGES.tunnelAnneaux; k += 1) {
          const z = ((((k / REGLAGES.tunnelAnneaux - d * 1.6) % 1) + 1) % 1) + 0.04;
          const rayon = (f * 0.3) / z;
          const alpha = Math.min(1, (1 - z) * 1.2) * ((v - REGLAGES.tunnelSeuil) / (1 - REGLAGES.tunnelSeuil)) * REGLAGES.tunnelOpacite;
          x.strokeStyle = k % 2 ? `rgba(${vr},${vg},${vb},${alpha.toFixed(3)})` : `rgba(${br},${bg},${bb},${alpha.toFixed(3)})`;
          x.lineWidth = 1.5 + (1 - z) * 5;
          x.beginPath();
          x.ellipse(cx + (Math.sin(d * 9 + k) * 18) / z, cy + (Math.cos(d * 7 + k) * 12) / z, rayon, rayon * 0.82, d * 2 + k * 0.3, 0, Math.PI * 2);
          x.stroke();
        }
      }
      x.globalCompositeOperation = 'source-over';

      // Le flash, l'etiquette qui s'efface, et le mot qui arrive du fond.
      const flash = Math.exp(-(((p - REGLAGES.flashPosition) / REGLAGES.flashLargeur) ** 2));
      elements.eclair.style.opacity = (flash * REGLAGES.flashIntensite).toFixed(3);
      elements.etiquette.style.opacity = (1 - lisse((p - REGLAGES.etiquetteDebut) / REGLAGES.etiquetteDuree)).toFixed(3);
      const arrivee = sortie((p - REGLAGES.motDebut) / REGLAGES.motArrivee);
      elements.mot.style.opacity = lisse((p - REGLAGES.motDebut) / REGLAGES.motApparition).toFixed(3);
      elements.mot.style.transform = `translateZ(${(-REGLAGES.motRecul + REGLAGES.motRecul * arrivee).toFixed(0)}px) rotateX(${(REGLAGES.motBascule * (1 - arrivee)).toFixed(2)}deg)`;
      elements.mot.style.letterSpacing = `${(REGLAGES.motEcartDepart * (1 - arrivee) + REGLAGES.motEcartArrivee).toFixed(3)}em`;
    },
    liberer: () => toile.liberer(),
  };
}
