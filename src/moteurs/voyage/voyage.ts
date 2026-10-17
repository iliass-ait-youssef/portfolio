import { borne, lisse, melange, normer, sortie, type Vec3 } from '../../moteur/maths';
import { couleur, rgba } from '../../moteur/palette';
import type { MoteurDeSection } from '../../moteur/useSection';
import { ciel } from '../ciel/donnees';
import { lueur, Toile } from '../commun/toile';
import { preparerSprites, creerSprites, type Sprites } from './sprites';

/**
 * LE VOYAGE DANS LA GALAXIE : chaque etoile est une etape du parcours.
 *
 * On part du dessus de la galaxie, on descend vers la premiere etoile, puis on
 * vole d'etoile en etoile le long d'un bras, en s'arretant a chacune ; a la fin
 * la camera recule et revele tout le chemin.
 *
 * Tout est une fonction de la PROGRESSION de defilement, exprimee en hauteurs
 * d'ecran : le voyage est reversible, et l'avancement ne depend jamais du temps.
 *
 * Tous les reglages sont ici.
 */
export const REGLAGES = {
  /** Les trois temps du voyage, en hauteurs d'ecran de defilement. */
  temps: { approche: 1.4, segment: 0.95, sortie: 1.3 },
  /** Dans un segment, la camera attend avant et apres : elle ne bouge qu'entre ces deux fractions. */
  arret: { debut: 0.25, mouvement: 0.5 },
  /** Les deux vues fixes : au-dessus de la galaxie, et la vue d'ensemble de la sortie. */
  vues: {
    dessus: { hauteur: 9, inclinaisonDegres: 68 },
    ensemble: { pos: [0.4, 6.2, 2.2] as Vec3, vise: [-0.2, 0, -0.1] as Vec3 },
  },
  /** Le bras : rayon de la premiere et de la derniere etape, enroulement, ecart alterne en hauteur et en angle. */
  bras: { rayonDebut: 2.9, rayonFin: 0.45, enroulement: 1.35, alterneHauteur: [-0.025, 0.03], alterneAngle: [-0.05, 0.07] },
  /** La camera suit le chemin : recul derriere le point, decalage de cote, hauteur, avance du regard, pas de la tangente. */
  camera: { recul: 0.42, cote: 0.13, hauteur: 0.09, avance: 0.05, tangente: 0.02, focale: 0.95, plan: 0.04 },
  /** Les etoiles de la galaxie : taille (min, gain, max), seuil au-dela duquel on pose un sprite, son facteur, eclat par proximite. */
  galaxie: { tailleMin: 0.7, tailleGain: 1.2, tailleMax: 3.4, seuilSprite: 1.5, facteurSprite: 2.2, gainEclat: 1.5, marge: 10, paliersOpacite: 32 },
  /** La lueur du coeur de la galaxie : rayon (hauteurs d'ecran), eclat. */
  coeur: { rayon: 0.9, rayonMax: 1.2, eclat: 0.5 },
  /** Le chemin : nombre de segments, epaisseur et opacite de la partie parcourue et de la partie a venir. */
  chemin: {
    segments: 120,
    parcouru: { halo: 0.16, haloEpaisseur: 6, trait: 0.85, epaisseur: 1.3 },
    aVenir: { trait: 0.2, epaisseur: 1, tirets: [2, 6] as [number, number] },
  },
  /** Une etoile-etape : taille a l'ecran (facteur, min, max), grossissement de l'etape en cours, pulsation. */
  etape: { facteur: 0.16, min: 16, max: 330, agrandissement: 0.55, pulsation: 0.045, vitessePulsation: 1.7, dephasage: 1.3 },
  /** Opacite d'une etoile passee, a venir, ou proche. */
  etapeOpacite: { passee: 0.55, venir: 0.8, courante: 1 },
  /** L'onde de lumiere a chaque arrivee : duree, rayon de depart et gain, opacite, epaisseur. */
  onde: { duree: 1.6, depart: 0.25, gain: 1.6, opacite: 0.45, epaisseur: 0.6, epaisseurGain: 1.4 },
  /** Le numero sous chaque etoile : police et decalage. */
  numero: { police: 11, decalage: 22, facteur: 0.42, marge: 12 },
  /** La zone ou l'on peut cliquer une etoile : rayon minimal (px) et part du rayon de l'etoile. */
  clic: { rayonMin: 30, partRayon: 0.35 },
  /** L'en-tete s'efface, le compteur apparait et disparait, le voile final tombe : seuils en hauteurs d'ecran. */
  interface: { enteteDebut: 0.5, enteteDuree: 0.6, hudAvant: 0.4, hudDuree: 0.4, hudSortie: 0.6, hudSortieDuree: 0.5, voileAvant: 0.35, voileDuree: 0.3 },
  /** Au-dessus de cette largeur, les cartes suivent leur etoile ; en dessous, elles se posent en bas. */
  largeEcran: 900,
  /** Les cartes suivent leur etoile : decalage, largeur reservee, hauteurs min et max. */
  carte: { decalageX: 48, partEtoile: 0.35, largeurReservee: 360, hautMin: 90, hautDecalage: 120, hautMargeBas: 260 },
} as const;

/** Les elements de la page que le voyage pilote. */
export interface ElementsVoyage {
  canvas: HTMLCanvasElement;
  entete: HTMLElement;
  hud: HTMLElement;
  etape: HTMLElement;
  barre: HTMLElement;
  crans: HTMLElement[];
  voile: HTMLElement;
  jalons: HTMLElement[];
}

export interface RappelsVoyage {
  /** Un clic sur une etoile : son indice et sa position a l'ecran (d'ou la page de detail s'ouvrira). */
  surEtoile: (indice: number, origine: { x: number; y: number }) => void;
  /** Le pointeur entre sur une etoile (son indice) ou la quitte (-1). */
  surSurvol?: (indice: number) => void;
}

export interface MoteurVoyage extends MoteurDeSection {
  /** La position a l'ecran d'une etoile-etape, ou `null` si elle est derriere la camera. */
  position: (indice: number) => { x: number; y: number; r: number } | null;
}

/** Les jetons des quatre familles d'etoiles de la galaxie, dans l'ordre des donnees. */
const JETONS_FAMILLES = ciel().galaxie.map((g) => g.jeton);

export function creerVoyage(elements: ElementsVoyage, texteEtape: string, rappels: RappelsVoyage): MoteurVoyage {
  const toile = new Toile(elements.canvas);
  const N = elements.jalons.length;
  const T = REGLAGES.temps;
  const fin = T.approche + (N - 1) * T.segment;
  const familles = ciel().galaxie.map((g, i) => ({
    points: Float32Array.from(g.points.flat()),
    paliers: Array.from({ length: REGLAGES.galaxie.paliersOpacite + 1 }, (_, q) => rgba(JETONS_FAMILLES[i], q / REGLAGES.galaxie.paliersOpacite)),
  }));

  // ---- Les sprites : prepares au repos, ou tout de suite si on arrive avant ----
  let sprites: Sprites | null = null;
  const annulerSprites = preparerSprites(JETONS_FAMILLES, (s) => (sprites = s));

  // ---- Les etapes, posees le long d'un bras, du bord vers le coeur ----
  const B = REGLAGES.bras;
  const jalons: Vec3[] = [];
  for (let i = 0; i < N; i += 1) {
    const r = B.rayonDebut - i * ((B.rayonDebut - B.rayonFin) / (N - 1));
    const a = r * B.enroulement + B.alterneAngle[i % 2];
    jalons.push([Math.cos(a) * r, B.alterneHauteur[i % 2], Math.sin(a) * r]);
  }
  const catmull = (a: number, b: number, c: number, d: number, t: number) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  };
  /** Le chemin : une courbe lisse qui passe par chaque etape. `u` va de 0 a N-1. */
  const chemin = (u: number): Vec3 => {
    const uu = borne(u, 0, N - 1);
    const i = Math.min(N - 2, Math.floor(uu));
    const t = uu - i;
    const P0 = jalons[Math.max(0, i - 1)];
    const P1 = jalons[i];
    const P2 = jalons[i + 1];
    const P3 = jalons[Math.min(N - 1, i + 2)];
    return [0, 1, 2].map((k) => catmull(P0[k], P1[k], P2[k], P3[k], t)) as Vec3;
  };
  const C = REGLAGES.camera;
  const poseCamera = (u: number) => {
    const point = chemin(u);
    const avant = chemin(u - C.tangente);
    const apres = chemin(u + C.tangente);
    const direction = normer([apres[0] - avant[0], apres[1] - avant[1], apres[2] - avant[2]]);
    const cote = normer([-direction[2], 0, direction[0]]);
    return {
      pos: [point[0] - direction[0] * C.recul + cote[0] * C.cote, point[1] + C.hauteur, point[2] - direction[2] * C.recul + cote[2] * C.cote] as Vec3,
      vise: [point[0] + direction[0] * C.avance, point[1], point[2] + direction[2] * C.avance] as Vec3,
    };
  };
  const dessus = (() => {
    const a = (REGLAGES.vues.dessus.inclinaisonDegres * Math.PI) / 180;
    return { pos: [0, REGLAGES.vues.dessus.hauteur * Math.sin(a), REGLAGES.vues.dessus.hauteur * Math.cos(a)] as Vec3, vise: [0, 0, 0] as Vec3 };
  })();
  // Le chemin ne bouge pas : ses points sont calcules une fois, seule la projection change.
  const SEG = REGLAGES.chemin.segments;
  const trace: Vec3[] = Array.from({ length: SEG + 1 }, (_, k) => chemin((k / SEG) * (N - 1)));

  // ---- L'etat entre deux images ----
  const positions: ({ x: number; y: number; r: number } | null)[] = Array(N).fill(null);
  let survolEtoile = -1;
  let impulsions: { i: number; t0: number }[] = [];
  let arriveePrecedente = -1;
  let dernierNumero = '';
  let dernierPasse = -1;
  const stylesCartes: string[] = Array(N).fill('');

  const etoileSous = (e: PointerEvent): number => {
    const r = elements.canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let meilleure = -1;
    let mini = Infinity;
    positions.forEach((p, i) => {
      if (!p) return;
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < Math.max(REGLAGES.clic.rayonMin, p.r * REGLAGES.clic.partRayon) && d < mini) {
        mini = d;
        meilleure = i;
      }
    });
    return meilleure;
  };
  const surMouvement = (e: PointerEvent) => {
    const i = etoileSous(e);
    if (i === survolEtoile) return;
    survolEtoile = i;
    elements.canvas.style.cursor = i >= 0 ? 'pointer' : 'default';
    rappels.surSurvol?.(i);
  };
  const surSortie = () => {
    if (survolEtoile < 0) return;
    survolEtoile = -1;
    elements.canvas.style.cursor = 'default';
    rappels.surSurvol?.(-1);
  };
  const surClic = (e: MouseEvent) => {
    const i = etoileSous(e as PointerEvent);
    const p = i >= 0 ? positions[i] : null;
    if (p) rappels.surEtoile(i, { x: p.x, y: p.y });
  };
  elements.canvas.addEventListener('pointermove', surMouvement);
  elements.canvas.addEventListener('pointerleave', surSortie);
  elements.canvas.addEventListener('click', surClic);

  const G = REGLAGES.galaxie;
  const E = REGLAGES.etape;
  const O = REGLAGES.onde;
  const I = REGLAGES.interface;
  const colorOnde = couleur('--onde-arrivee');
  const colorChemin = couleur('--chemin-fait');
  const colorViolet = couleur('--violet');
  const colorCoeur = couleur('--galaxie-lueur');
  const colorEtape = couleur('--etape-actuelle');
  const colorFond = rgba('--fond', 1);
  const colorNumero = couleur('--libelle-actif');
  const styleHalo = `rgba(${colorViolet[0]},${colorViolet[1]},${colorViolet[2]},${REGLAGES.chemin.parcouru.halo})`;
  const styleParcouru = `rgba(${colorChemin[0]},${colorChemin[1]},${colorChemin[2]},${REGLAGES.chemin.parcouru.trait})`;
  const styleAVenir = `rgba(${colorViolet[0]},${colorViolet[1]},${colorViolet[2]},${REGLAGES.chemin.aVenir.trait})`;
  const tiretsAVenir = [...REGLAGES.chemin.aVenir.tirets];
  const policeNumero = `500 ${REGLAGES.numero.police}px ${getComputedStyle(document.documentElement).getPropertyValue('--mono').trim()}`;

  /**
   * Pose une carte : transparence, clic, place. Une carte invisible est aussi
   * cachee pour de bon (`visibility`), pour que ni le clavier ni un lecteur
   * d'ecran ne la trouvent. On n'ecrit dans la page que si quelque chose change.
   */
  function ecrireCarte(carte: HTMLElement, i: number, proche: number, transform: string) {
    const cle = `${proche.toFixed(3)}|${transform}`;
    if (stylesCartes[i] === cle) return;
    stylesCartes[i] = cle;
    carte.style.opacity = proche.toFixed(3);
    carte.style.visibility = proche > 0.01 ? '' : 'hidden';
    carte.style.pointerEvents = proche > 0.6 ? 'auto' : 'none';
    if (transform) carte.style.transform = transform;
  }

  return {
    position: (i) => positions[i] ?? null,
    image: ({ t, ecrans: s, section, largeur }) => {
      if (!sprites) {
        annulerSprites();
        sprites = creerSprites(JETONS_FAMILLES);
      }
      // ---- Ou est la camera ? ----
      let vue: { pos: Vec3; vise: Vec3 };
      let u: number;
      if (s < T.approche) {
        // L'approche : du dessus de la galaxie jusqu'a la premiere etoile.
        const k = sortie(borne(s / T.approche, 0, 1));
        const depart = poseCamera(0);
        vue = { pos: melange(dessus.pos, depart.pos, k), vise: melange(dessus.vise, depart.vise, k) };
        u = 0;
      } else if (s < fin) {
        // Le voyage : on s'arrete a chaque etoile, puis on file vers la suivante.
        const seg = Math.min(N - 2, Math.floor((s - T.approche) / T.segment));
        const loc = (s - T.approche) / T.segment - seg;
        u = seg + lisse(borne((loc - REGLAGES.arret.debut) / REGLAGES.arret.mouvement, 0, 1));
        vue = poseCamera(u);
      } else {
        // La sortie : la camera recule et revele tout le chemin parcouru.
        const k = sortie(borne((s - fin) / T.sortie, 0, 1));
        const derniere = poseCamera(N - 1);
        const E2 = REGLAGES.vues.ensemble;
        vue = { pos: melange(derniere.pos, E2.pos, k), vise: melange(derniere.vise, E2.vise, k) };
        u = N - 1;
      }

      const W = toile.largeur;
      const H = toile.hauteur;
      const x = toile.commencer();
      x.fillStyle = colorFond;
      x.fillRect(0, 0, W, H);

      // Le repere de la camera : avant, droite, haut.
      const cam = vue.pos;
      const fw = normer([vue.vise[0] - cam[0], vue.vise[1] - cam[1], vue.vise[2] - cam[2]]);
      const rt = normer([-fw[2], 0, fw[0]]);
      const up: Vec3 = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      const F = H * C.focale;
      const cx = W / 2;
      const cy = H / 2;
      const proj = (P: Vec3) => {
        const dx = P[0] - cam[0];
        const dy = P[1] - cam[1];
        const dz = P[2] - cam[2];
        const zc = dx * fw[0] + dy * fw[1] + dz * fw[2];
        if (zc < C.plan) return null;
        return {
          x: cx + ((dx * rt[0] + dy * rt[1] + dz * rt[2]) / zc) * F,
          y: cy - ((dx * up[0] + dy * up[1] + dz * up[2]) / zc) * F,
          z: zc,
        };
      };

      // La lueur du coeur de la galaxie.
      const c0 = proj([0, 0, 0]);
      if (c0) lueur(x, c0.x, c0.y, Math.min(W * REGLAGES.coeur.rayonMax, (REGLAGES.coeur.rayon / c0.z) * F), colorCoeur, REGLAGES.coeur.eclat);

      // ---- Les 8 000 etoiles ----
      x.globalCompositeOperation = 'lighter';
      const m = G.marge;
      familles.forEach((famille, gi) => {
        const rond = sprites?.points[gi] ?? null;
        const paths: (Path2D | null)[] = new Array(G.paliersOpacite + 1).fill(null);
        const pts = famille.points;
        for (let p = 0; p < pts.length; p += 4) {
          const dx = pts[p] - cam[0];
          const dy = pts[p + 1] - cam[1];
          const dz = pts[p + 2] - cam[2];
          const zc = dx * fw[0] + dy * fw[1] + dz * fw[2];
          if (zc < C.plan) continue;
          const sx = cx + ((dx * rt[0] + dz * rt[2]) / zc) * F;
          const sy = cy - ((dx * up[0] + dy * up[1] + dz * up[2]) / zc) * F;
          if (sx < -m || sx > W + m || sy < -m || sy > H + m) continue;
          const taille = Math.min(G.tailleMax, G.tailleMin + G.tailleGain / zc);
          const a = Math.min(1, G.gainEclat / zc) * pts[p + 3];
          if (rond && taille > G.seuilSprite) {
            const tr = taille * G.facteurSprite;
            x.globalAlpha = a;
            x.drawImage(rond, sx - tr, sy - tr, tr * 2, tr * 2);
          } else {
            // Les points sont regroupes par palier d'opacite : un trace et un remplissage par palier,
            // pas une couleur differente par etoile.
            const q = Math.round(a * G.paliersOpacite);
            (paths[q] ??= new Path2D()).rect(sx, sy, taille, taille);
          }
        }
        x.globalAlpha = 1;
        paths.forEach((chemin2D, q) => {
          if (!chemin2D) return;
          x.fillStyle = famille.paliers[q];
          x.fill(chemin2D);
        });
      });

      // ---- Le chemin : une ligne de constellation qui relie les etapes ----
      const avance = s < T.approche ? 0 : u;
      const CH = REGLAGES.chemin;
      const projetes = trace.map(proj);
      // Trois traits pour tout le chemin : le halo de la partie parcourue, son
      // trait net, et le pointille de la partie a venir.
      x.beginPath();
      for (let k = 0; k < SEG; k += 1) {
        const A = projetes[k];
        const Bp = projetes[k + 1];
        if (A && Bp && ((k + 1) / SEG) * (N - 1) <= avance + 0.001) {
          x.moveTo(A.x, A.y);
          x.lineTo(Bp.x, Bp.y);
        }
      }
      x.strokeStyle = styleHalo;
      x.lineWidth = CH.parcouru.haloEpaisseur;
      x.stroke();
      x.strokeStyle = styleParcouru;
      x.lineWidth = CH.parcouru.epaisseur;
      x.stroke();
      x.beginPath();
      for (let k = 0; k < SEG; k += 1) {
        const A = projetes[k];
        const Bp = projetes[k + 1];
        if (A && Bp && ((k + 1) / SEG) * (N - 1) > avance + 0.001) {
          x.moveTo(A.x, A.y);
          x.lineTo(Bp.x, Bp.y);
        }
      }
      x.strokeStyle = styleAVenir;
      x.lineWidth = CH.aVenir.epaisseur;
      x.setLineDash(tiretsAVenir);
      x.stroke();
      x.setLineDash([]);

      // ---- Les etoiles-etapes et leurs cartes ----
      const arrivee = s >= T.approche && Math.abs(u - Math.round(u)) < 0.02 ? Math.round(u) : -1;
      if (arrivee >= 0 && arrivee !== arriveePrecedente) impulsions.push({ i: arrivee, t0: t }); // une onde de lumiere a chaque arrivee
      arriveePrecedente = arrivee;
      impulsions = impulsions.filter((p) => t - p.t0 < O.duree);

      jalons.forEach((J, i) => {
        const P = proj(J);
        const carte = elements.jalons[i];
        const proche = s < T.approche ? 0 : borne(1 - Math.abs(u - i) * 2.2, 0, 1);
        if (!P) {
          positions[i] = null;
          ecrireCarte(carte, i, 0, '');
          return;
        }
        const passee = s >= T.approche && i < u - 0.5;
        const base = borne(((E.facteur / P.z) * F), E.min, E.max);
        const echelle = base * (1 + proche * E.agrandissement) * (1 + E.pulsation * Math.sin(t * E.vitessePulsation + i * E.dephasage));
        if (sprites?.actuelle && sprites.future) {
          x.save();
          x.translate(P.x, P.y);
          x.globalAlpha = passee ? REGLAGES.etapeOpacite.passee : proche > 0 ? REGLAGES.etapeOpacite.courante : REGLAGES.etapeOpacite.venir;
          x.drawImage(passee || proche > 0 ? sprites.actuelle : sprites.future, -echelle, -echelle, echelle * 2, echelle * 2);
          x.restore();
          x.globalAlpha = 1;
        } else {
          // Sans sprite (le canvas ne sait pas lire ses pixels) : une lueur et un point.
          lueur(x, P.x, P.y, echelle * 0.6, colorEtape, 0.6 + proche * 0.4);
          lueur(x, P.x, P.y, echelle * 0.15, [255, 255, 255], 0.9);
        }
        for (const onde of impulsions) {
          if (onde.i !== i) continue;
          const k = (t - onde.t0) / O.duree;
          const rayon = echelle * (O.depart + O.gain * sortie(k));
          x.strokeStyle = `rgba(${colorOnde[0]},${colorOnde[1]},${colorOnde[2]},${((1 - k) ** 2 * O.opacite).toFixed(3)})`;
          x.lineWidth = O.epaisseur + O.epaisseurGain * (1 - k);
          x.beginPath();
          x.arc(P.x, P.y, rayon, 0, Math.PI * 2);
          x.stroke();
        }
        x.font = policeNumero;
        x.textAlign = 'center';
        x.fillStyle = `rgba(${colorNumero[0]},${colorNumero[1]},${colorNumero[2]},${(0.45 + proche * 0.55).toFixed(3)})`;
        x.fillText(String(i + 1).padStart(2, '0'), P.x, P.y + Math.max(REGLAGES.numero.decalage, echelle * REGLAGES.numero.facteur) + REGLAGES.numero.marge);
        positions[i] = { x: P.x, y: P.y, r: echelle };

        // La carte suit son etoile (a cote sur grand ecran, en bas sur petit ecran).
        const K = REGLAGES.carte;
        const transform =
          largeur > REGLAGES.largeEcran
            ? `translate(${Math.min(W - K.largeurReservee, P.x + Math.max(K.decalageX, echelle * K.partEtoile)).toFixed(0)}px,${borne(P.y - K.hautDecalage, K.hautMin, H - K.hautMargeBas).toFixed(0)}px)`
            : 'translate(-50%, 0)';
        ecrireCarte(carte, i, proche, transform);
      });
      x.globalCompositeOperation = 'source-over';

      // ---- L'en-tete, le compteur d'etapes, la frise du temps, le voile final ----
      elements.entete.style.opacity = (1 - lisse((s - I.enteteDebut) / I.enteteDuree)).toFixed(3);
      elements.hud.style.opacity = (lisse((s - T.approche + I.hudAvant) / I.hudDuree) * (1 - lisse((s - fin - I.hudSortie) / I.hudSortieDuree))).toFixed(3);
      const numero = `${texteEtape} ${Math.round(u) + 1} / ${N}`;
      if (numero !== dernierNumero) {
        dernierNumero = numero;
        elements.etape.textContent = numero;
      }
      elements.barre.style.transform = `scaleX(${(u / (N - 1)).toFixed(3)})`;
      const passes = s >= T.approche ? Math.floor(u + 0.01) : -1;
      if (passes !== dernierPasse) {
        dernierPasse = passes;
        elements.crans.forEach((c, i) => c.classList.toggle('passe', i <= passes));
      }
      elements.voile.style.opacity = lisse((s - (section.hauteur / toile.hauteur - 1) + I.voileAvant) / I.voileDuree).toFixed(3);
    },
    liberer: () => {
      annulerSprites();
      elements.canvas.removeEventListener('pointermove', surMouvement);
      elements.canvas.removeEventListener('pointerleave', surSortie);
      elements.canvas.removeEventListener('click', surClic);
      elements.jalons.forEach((c) => {
        c.style.opacity = '';
        c.style.transform = '';
        c.style.visibility = '';
        c.style.pointerEvents = '';
      });
      toile.liberer();
    },
  };
}
