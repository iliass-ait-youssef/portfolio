import { borne, sortie } from '../../moteur/maths';
import { couleur, rgba, type Rgb } from '../../moteur/palette';
import type { MoteurDeSection } from '../../moteur/useSection';
import { COUCHES, ciel, type EtoileOutil, type EtoileProjet } from '../ciel/donnees';
import { lueur, Toile } from '../commun/toile';

/**
 * LA CONSTELLATION DES COMPETENCES : cinq couches d'outils, du silicium a
 * l'interface, qui apparaissent l'une apres l'autre du bas vers le haut ;
 * chaque etoile nait d'une particule partie du logo. Puis quatre projets
 * relient les couches, et survoler une etoile eclaire ses liens.
 *
 * Tout est une fonction de la PROGRESSION dans la section (0 a 1) : la carte
 * est reversible. Tous les reglages sont ici.
 */
export const REGLAGES = {
  /** La zone de dessin. Grand ecran : a droite du texte. Petit ecran : en haut. */
  largeEcran: 900,
  grand: { partGauche: 0.36, gaucheMax: 460, haut: 0.1, hauteur: 0.8, margeDroite: 0.05 },
  petit: { x: 0.06, haut: 0.08, largeur: 0.88, hauteur: 0.6 },
  /** Le calendrier de la progression. */
  couches: {
    /** La premiere couche commence ici, chacune suivante `pas` plus loin, et met `duree` a apparaitre. */
    debut: 0.06,
    pas: 0.1,
    duree: 0.1,
    /** La derniere couche est complete a ce point ; ensuite viennent les projets. */
    fin: 0.58,
  },
  projets: {
    debut: 0.6,
    duree: 0.22,
    finCommentaire: 0.86,
    decalageParProjet: 0.6,
    /** L'ordre dans lequel le commentaire nomme les projets (les plus recents d'abord). */
    ordreCommentaire: ['zmobile', 'portfolio', 'bts', 'bacpro'],
  },
  /** Les particules parties du logo : leur nombre, l'ecart entre elles, la duree du trajet. */
  particules: { nombre: 7, ecart: 0.035, trajet: 0.09, rayonTete: 10, rayonQueue: 6, reduction: 0.6, eclatTete: 0.9, eclatQueue: 0.5 },
  /** Le survol : rayon de detection (px), et progression a partir de laquelle il compte. */
  survol: { rayon: 22, seuil: 0.6 },
  /** Les etoiles-outils et les etoiles-projets : rayon de la lueur, du point, eclat, police. */
  outil: { lueur: 16, point: 2.4, eclatActif: 0.55, eclatEteint: 0.12, decalageLibelle: 20, police: 12, vitesseScintillement: 1.6 },
  projet: { lueur: 34, point: 4.2, eclatActif: 0.6, eclatEteint: 0.15, decalageLibelle: 16, police: 15, vitesseScintillement: 1.3 },
  /** Les etiquettes de couche, a gauche de la zone. */
  couche: { police: 11, decalageX: 6, decalageY: 30, eclatCourante: 1, eclatAutre: 0.55 },
  /** Les traits : opacite d'une figure de couche, d'un lien projet-outil, d'un lien eclaire ou estompe. */
  trait: { figure: 0.35, lien: 0.3, lienEstompe: 0.08, lienFort: 0.95, epaisseur: 1, epaisseurForte: 1.6 },
  /** La poussiere du fond : cote d'un point, eclat. */
  poussiere: { cote: 1.2, eclat: 0.5 },
} as const;

/** Les textes que la constellation ecrit, dans la langue courante. */
export interface TextesConstellation {
  titreDebut: string;
  texteDebut: string;
  couche: string;
  titreProjets: string;
  texteProjets: string;
  titreExplore: string;
  texteExplore: string;
  etatExplore: string;
  couches: { nom: string; texte: string }[];
  outils: Record<string, string>;
  projets: Record<string, string>;
}

/** Les elements de la page que la constellation pilote. */
export interface ElementsConstellation {
  canvas: HTMLCanvasElement;
  titre: HTMLElement;
  description: HTMLElement;
  etat: HTMLElement;
  jauge: HTMLElement;
  /** Le logo de la barre : d'ou partent les particules. */
  logo: HTMLElement;
}

export function creerConstellation(
  elements: ElementsConstellation,
  textes: TextesConstellation,
  fige: boolean,
): MoteurDeSection {
  const toile = new Toile(elements.canvas);
  const donnees = ciel();
  const { outils, projets, fond, parCle } = donnees;
  const tousLesPoints: (EtoileOutil | EtoileProjet)[] = [...outils, ...projets];
  const outilsParCouche = COUCHES.map((_, ci) => outils.filter((o) => o.couche === ci));
  const teintes: Rgb[] = COUCHES.map((c) => couleur(c.jeton));

  const style = getComputedStyle(document.documentElement);
  const police = (poids: number, taille: number, famille: string) => `${poids} ${taille}px ${style.getPropertyValue(famille).trim()}`;
  const policeCouche = police(500, REGLAGES.couche.police, '--mono');
  const policeOutil = police(500, REGLAGES.outil.police, '--mono');
  const policeProjet = police(700, REGLAGES.projet.police, '--titre');

  const colorFond = rgba('--fond-carte', 1);
  const colorPoussiere = couleur('--poussiere');
  const colorProjet = couleur('--etoile-projet');
  const colorBlanc = rgba('--blanc', 1);
  const colorViolet = couleur('--violet');

  // Le logo : le centre du rond de la barre, lu dans la mise en page (offsetLeft
  // ignore la transformation qui cache la barre), relu quand la page change.
  const logo = { x: 0, y: 0 };
  const lireLogo = () => {
    logo.x = elements.logo.offsetLeft + elements.logo.offsetWidth / 2;
    logo.y = elements.logo.offsetTop + elements.logo.offsetHeight / 2;
  };
  lireLogo();
  window.addEventListener('resize', lireLogo);

  // Le pointeur, en pixels du canvas ; -1 : hors du canvas.
  const souris = { x: -1, y: -1 };
  const surMouvement = (e: PointerEvent) => {
    const r = elements.canvas.getBoundingClientRect();
    souris.x = e.clientX - r.left;
    souris.y = e.clientY - r.top;
  };
  const surSortie = () => {
    souris.x = -1;
    souris.y = -1;
  };
  elements.canvas.addEventListener('pointermove', surMouvement);
  elements.canvas.addEventListener('pointerleave', surSortie);

  /** Les outils relies a un nom (un outil ou un projet), lui compris. */
  const voisins = (cle: string): Set<string> => {
    const v = new Set<string>([cle]);
    for (const p of projets) {
      if (p.cle === cle) p.liens.forEach((l) => v.add(l));
      if (p.liens.includes(cle)) v.add(p.cle);
    }
    return v;
  };

  let affiche = '';
  const ecrire = (titre: string, texte: string, etat: string) => {
    const cle = titre + texte + etat;
    if (affiche === cle) return;
    affiche = cle;
    elements.titre.textContent = titre;
    elements.description.textContent = texte;
    elements.etat.textContent = etat;
  };

  /** La zone de dessin, en pixels du canvas. */
  const zone = (W: number, H: number) => {
    if (W > REGLAGES.largeEcran) {
      const g = REGLAGES.grand;
      const gauche = Math.min(W * g.partGauche, g.gaucheMax);
      return { x: gauche, y: H * g.haut, w: W - gauche - W * g.margeDroite, h: H * g.hauteur };
    }
    const p = REGLAGES.petit;
    return { x: W * p.x, y: H * p.haut, w: W * p.largeur, h: H * p.hauteur };
  };

  return {
    image: ({ t, progression }) => {
      const c = fige ? 1 : progression;
      const { largeur: W, hauteur: H } = toile;
      const C = REGLAGES.couches;
      const P = REGLAGES.projets;
      elements.jauge.style.transform = `scaleX(${c.toFixed(3)})`;

      const x = toile.commencer();
      x.fillStyle = colorFond;
      x.fillRect(0, 0, W, H);
      for (const [px, py, eclat] of fond) {
        x.fillStyle = `rgba(${colorPoussiere[0]},${colorPoussiere[1]},${colorPoussiere[2]},${eclat * REGLAGES.poussiere.eclat})`;
        x.fillRect(px * W, py * H, REGLAGES.poussiere.cote, REGLAGES.poussiere.cote);
      }

      const z = zone(W, H);
      const ecran = (px: number, py: number) => ({ x: z.x + px * z.w, y: z.y + py * z.h });

      // L'avancement : chaque couche apparait a son tour, puis les projets relient les couches.
      const apparition = (ci: number) => sortie((c - (C.debut + ci * C.pas)) / C.duree);
      const aProjets = sortie((c - P.debut) / P.duree);
      const coucheCourante = borne(Math.floor((c - C.debut) / C.pas), -1, COUCHES.length - 1);

      if (c < C.debut) ecrire(textes.titreDebut, textes.texteDebut, '');
      else if (c < C.fin) {
        const cou = textes.couches[coucheCourante];
        ecrire(
          `${textes.couche} ${COUCHES[coucheCourante].numero} · ${cou.nom}`,
          cou.texte,
          COUCHES[coucheCourante].outils.map((cle) => textes.outils[cle]).join('  ·  '),
        );
      } else if (c < P.finCommentaire) {
        ecrire(textes.titreProjets, textes.texteProjets, P.ordreCommentaire.map((cle) => textes.projets[cle]).join(' · '));
      } else ecrire(textes.titreExplore, textes.texteExplore, textes.etatExplore);

      // Le survol, une fois la carte dessinee : l'etoile la plus proche du pointeur.
      let survole: string | null = null;
      if (c > REGLAGES.survol.seuil && souris.x >= 0) {
        let mini: number = REGLAGES.survol.rayon;
        for (const s of tousLesPoints) {
          const p = ecran(s.x, s.y);
          const d = Math.hypot(p.x - souris.x, p.y - souris.y);
          if (d < mini) {
            mini = d;
            survole = s.cle;
          }
        }
      }
      elements.canvas.style.cursor = survole ? 'pointer' : 'default';
      const vis = survole ? voisins(survole) : null;

      // Le trou noir donne naissance aux etoiles : une particule part du logo vers chaque outil.
      const PA = REGLAGES.particules;
      x.globalCompositeOperation = 'lighter';
      outils.forEach((s, si) => {
        const arrivee = C.debut + s.couche * C.pas;
        const k = (c - (arrivee - PA.trajet)) / PA.trajet;
        if (k <= 0 || k >= 1.02) return;
        const S = ecran(s.x, s.y);
        const ctrl = { x: (logo.x + S.x) / 2 + (si % 2 ? 80 : -60), y: Math.min(logo.y, S.y) - 60 };
        for (let j = 0; j < PA.nombre; j += 1) {
          const kk = borne(sortie(k) - j * PA.ecart, 0, 1);
          const u = 1 - kk;
          const px = u * u * logo.x + 2 * u * kk * ctrl.x + kk * kk * S.x;
          const py = u * u * logo.y + 2 * u * kk * ctrl.y + kk * kk * S.y;
          const rayon = j === 0 ? PA.rayonTete : PA.rayonQueue - j * PA.reduction;
          lueur(x, px, py, rayon, teintes[s.couche], (j === 0 ? PA.eclatTete : PA.eclatQueue) * (1 - j / PA.nombre));
        }
      });
      x.globalCompositeOperation = 'source-over';

      // Les libelles de couche, et la figure de la constellation : les outils d'une couche reliés entre eux.
      COUCHES.forEach((couche, ci) => {
        const a = apparition(ci);
        if (a <= 0) return;
        const p = ecran(0, 0.86 - ci * 0.18);
        const teinte = teintes[ci];
        x.globalAlpha = a * (ci === coucheCourante && c < C.fin ? REGLAGES.couche.eclatCourante : REGLAGES.couche.eclatAutre);
        x.font = policeCouche;
        x.fillStyle = `rgb(${teinte.join(',')})`;
        x.textAlign = 'left';
        x.fillText(`${couche.numero} ${textes.couches[ci].nom.toUpperCase()}`, p.x - REGLAGES.couche.decalageX, p.y - REGLAGES.couche.decalageY);
        x.globalAlpha = 1;
        const liste = outilsParCouche[ci];
        x.strokeStyle = `rgba(${teinte.join(',')},${REGLAGES.trait.figure * a})`;
        x.lineWidth = REGLAGES.trait.epaisseur;
        for (let k = 0; k < liste.length - 1; k += 1) {
          const A = ecran(liste[k].x, liste[k].y);
          const B = ecran(liste[k + 1].x, liste[k + 1].y);
          const f = borne(a * liste.length - k, 0, 1);
          if (f > 0) {
            x.beginPath();
            x.moveTo(A.x, A.y);
            x.lineTo(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f);
            x.stroke();
          }
        }
      });

      // Les liens entre projets et outils : eclaires si le survol les concerne, estompes sinon.
      projets.forEach((p, pi) => {
        const aP = borne(aProjets * projets.length - pi * P.decalageParProjet, 0, 1);
        if (aP <= 0) return;
        const origine = ecran(p.x, p.y);
        for (const cle of p.liens) {
          const s = parCle[cle];
          const cible = ecran(s.x, s.y);
          const fort = vis && vis.has(p.cle) && vis.has(cle);
          x.strokeStyle = fort
            ? `rgba(${colorProjet[0]},${colorProjet[1]},${colorProjet[2]},${REGLAGES.trait.lienFort})`
            : `rgba(${colorViolet[0]},${colorViolet[1]},${colorViolet[2]},${(vis ? REGLAGES.trait.lienEstompe : REGLAGES.trait.lien) * aP})`;
          x.lineWidth = fort ? REGLAGES.trait.epaisseurForte : REGLAGES.trait.epaisseur;
          x.beginPath();
          x.moveTo(origine.x, origine.y);
          x.lineTo(origine.x + (cible.x - origine.x) * aP, origine.y + (cible.y - origine.y) * aP);
          x.stroke();
        }
      });

      // Les etoiles-outils.
      const O = REGLAGES.outil;
      for (const s of outils) {
        const a = apparition(s.couche);
        if (a <= 0) continue;
        const p = ecran(s.x, s.y);
        const actif = vis ? vis.has(s.cle) : true;
        const sc = 0.85 + 0.15 * Math.sin(t * O.vitesseScintillement + s.phase);
        lueur(x, p.x, p.y, O.lueur * a, teintes[s.couche], (actif ? O.eclatActif : O.eclatEteint) * sc);
        x.globalAlpha = a * (actif ? 1 : 0.3);
        x.fillStyle = colorBlanc;
        x.beginPath();
        x.arc(p.x, p.y, O.point, 0, Math.PI * 2);
        x.fill();
        x.font = policeOutil;
        x.textAlign = 'center';
        const lib = couleur(actif ? '--libelle-actif' : '--libelle-eteint');
        x.fillStyle = `rgba(${lib[0]},${lib[1]},${lib[2]},${actif ? 0.92 : 0.45})`;
        x.fillText(textes.outils[s.cle], p.x, p.y + O.decalageLibelle);
        x.globalAlpha = 1;
      }

      // Les etoiles-projets, plus brillantes.
      const J = REGLAGES.projet;
      projets.forEach((p, pi) => {
        const aP = borne(aProjets * projets.length - pi * P.decalageParProjet, 0, 1);
        if (aP <= 0) return;
        const origine = ecran(p.x, p.y);
        const actif = vis ? vis.has(p.cle) : true;
        const sc = 0.85 + 0.15 * Math.sin(t * J.vitesseScintillement + p.phase);
        lueur(x, origine.x, origine.y, J.lueur * aP, colorProjet, (actif ? J.eclatActif : J.eclatEteint) * sc);
        x.globalAlpha = aP * (actif ? 1 : 0.35);
        x.fillStyle = colorBlanc;
        x.beginPath();
        x.arc(origine.x, origine.y, J.point, 0, Math.PI * 2);
        x.fill();
        x.font = policeProjet;
        x.textAlign = 'center';
        x.fillText(textes.projets[p.cle], origine.x, origine.y - J.decalageLibelle);
        x.globalAlpha = 1;
      });
    },
    liberer: () => {
      window.removeEventListener('resize', lireLogo);
      elements.canvas.removeEventListener('pointermove', surMouvement);
      elements.canvas.removeEventListener('pointerleave', surSortie);
      toile.liberer();
    },
  };
}
