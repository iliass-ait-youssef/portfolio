import { lisse } from '../../moteur/maths';
import { couleur, type Rgb } from '../../moteur/palette';

/**
 * LES SPRITES D'ETOILES DU VOYAGE : des images, calculees UNE fois, que le
 * moteur dessine ensuite des milliers de fois.
 *
 * Une etoile-etape est une croix lumineuse simple : un coeur blanc, quatre
 * branches fines aux pointes arrondies, un halo doux. Son profil de luminosite
 * est une formule ; on l'evalue pour chaque pixel d'une image de 384 x 384,
 * une seule fois, et le moteur ne fait plus que la poser a la taille voulue.
 * Le calcul coute quelques dizaines de millisecondes : il est lance quand le
 * navigateur n'a rien d'autre a faire (voir `preparerSprites`), pas pendant
 * le defilement.
 *
 * Tous les reglages de la forme sont ici.
 */
export const REGLAGES = {
  /** Cote de l'image, en pixels. Plus grand = plus net de pres, plus long a calculer. */
  taille: 384,
  /** Fraction du rayon ou l'image s'eteint en douceur (sinon le bord de l'image se verrait). */
  bord: { debut: 0.82, fondu: 0.18 },
  /**
   * Les quatre branches : longueur (part du rayon), largeur au centre
   * (`base` + `epaisseur`), puissance d'affinement vers la pointe, et rapport
   * entre la lueur qui les entoure et leur largeur.
   */
  branche: { longueur: 0.94, base: 0.004, epaisseur: 0.045, affinement: 0.85, lueur: 3.2 },
  /** Le corps en etincelle, aux flancs creuses : etendue et raideur. */
  corps: { etendue: 0.42, raideur: 6 },
  /** Le coeur blanc : rayon (part du rayon) et eclat. */
  coeur: { rayon: 0.05, eclat: 2.2 },
  /** Le halo doux : rayon de base, extinction (debut et largeur), eclat. */
  halo: { rayon: 0.13, extinctionDebut: 0.45, extinctionLargeur: 0.35, eclat: 0.9 },
  /** Poids des branches nettes, de leur lueur et du corps dans la teinte. */
  poids: { branches: 1.6, lueurBranches: 0.45, corpsBase: 0.55, corpsTeinte: 0.45 },
  /** Courbe de tonalite : plus c'est grand, plus vite le blanc sature. */
  tonalite: 1.4,
  /** Les points lumineux des groupes d'etoiles de la galaxie : cote de l'image et arrets du degrade. */
  point: { taille: 32, arretCoeur: 0.25, alphaCoeur: 0.55 },
} as const;

/** Une image de sprite : un canvas, plus facile a poser que des pixels bruts. */
export type Sprite = HTMLCanvasElement;

export interface Sprites {
  /** L'etoile de l'etape en cours et des etapes passees : teinte violette. */
  actuelle: Sprite | null;
  /** Les etapes a venir : teinte bleutee. */
  future: Sprite | null;
  /** Un point lumineux par famille d'etoiles de la galaxie. */
  points: (Sprite | null)[];
}

/** Evalue `pixel` en chaque point de l'image et en fait un canvas. */
function ecrireSprite(pixel: (u: number, v: number, r: number) => Rgb): Sprite | null {
  const T = REGLAGES.taille;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = T;
  const x = canvas.getContext('2d');
  if (!x || !x.createImageData) return null;
  const image = x.createImageData(T, T);
  if (!image || !image.data) return null;
  const d = image.data;
  const h = T / 2;
  for (let py = 0; py < T; py += 1) {
    for (let px = 0; px < T; px += 1) {
      const u = (px + 0.5 - h) / h;
      const v = (py + 0.5 - h) / h;
      const r = Math.sqrt(u * u + v * v);
      const col = pixel(u, v, r);
      const bord = 1 - lisse((r - REGLAGES.bord.debut) / REGLAGES.bord.fondu);
      const o = (py * T + px) * 4;
      // Une courbe de tonalite (1 - e^(-x)) : les valeurs fortes saturent en blanc sans jamais depasser.
      d[o] = 255 * (1 - Math.exp(-col[0] * REGLAGES.tonalite)) * bord;
      d[o + 1] = 255 * (1 - Math.exp(-col[1] * REGLAGES.tonalite)) * bord;
      d[o + 2] = 255 * (1 - Math.exp(-col[2] * REGLAGES.tonalite)) * bord;
      d[o + 3] = 255;
    }
  }
  x.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Une branche : epaisse au centre, effilee, la pointe reste arrondie (et non
 * en aiguille). `le` est la distance le long de la branche, `la` la distance a
 * son axe. Renvoie la partie nette, et la lueur plus large qui l'entoure.
 */
function branche(le: number, la: number): [number, number] {
  const B = REGLAGES.branche;
  if (le >= B.longueur) return [0, 0];
  const k = le / B.longueur;
  const largeur = B.epaisseur * (1 - k) ** B.affinement + B.base;
  const e = la / largeur;
  const fin = (1 - k * k) * (1 - k * k);
  const eg = la / (largeur * B.lueur);
  return [Math.exp(-e * e) * fin, Math.exp(-eg * eg) * fin];
}

/** L'etoile-etape : la croix lumineuse, a la teinte donnee (composantes de 0 a 1). */
function spriteEtoile(teinte: Rgb): Sprite | null {
  const { corps, coeur, halo, poids } = REGLAGES;
  return ecrireSprite((u, v, r) => {
    const au = Math.abs(u);
    const av = Math.abs(v);
    const h = branche(au, av);
    const vv = branche(av, au);
    const net = h[0] + vv[0];
    const lueurBranches = h[1] + vv[1];
    // Le corps en etincelle : sqrt(|u|) + sqrt(|v|) creuse les flancs en losange.
    const q = Math.sqrt(au) + Math.sqrt(av);
    const c = Math.exp(-((q / corps.etendue) ** corps.raideur));
    const noyau = Math.exp(-((r / coeur.rayon) ** 2)) * coeur.eclat;
    const lueurHalo = (1 + (r / halo.rayon) ** 2) ** -1.5 * (1 - lisse((r - halo.extinctionDebut) / halo.extinctionLargeur));
    return [0, 1, 2].map(
      (k) =>
        noyau +
        net * poids.branches +
        c * (poids.corpsBase + poids.corpsTeinte * teinte[k]) +
        (lueurBranches * poids.lueurBranches + lueurHalo * halo.eclat) * teinte[k],
    ) as Rgb;
  });
}

/** Un point lumineux rond : un degrade du blanc au transparent, a la couleur de la famille. */
function pointLumineux(couleurFamille: Rgb): Sprite | null {
  const { taille, arretCoeur, alphaCoeur } = REGLAGES.point;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = taille;
  const x = canvas.getContext('2d');
  if (!x || !x.createRadialGradient) return null;
  const m = taille / 2;
  const degrade = x.createRadialGradient(m, m, 0, m, m, m);
  const rgb = couleurFamille.join(',');
  degrade.addColorStop(0, `rgba(${rgb},1)`);
  degrade.addColorStop(arretCoeur, `rgba(${rgb},${alphaCoeur})`);
  degrade.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = degrade;
  x.fillRect(0, 0, taille, taille);
  return canvas;
}

/**
 * Les sprites sont calcules une seule fois pour tout le site : le voyage et la
 * page de detail dessinent la meme croix lumineuse, et le calcul est le cout
 * le plus lourd de l'etoile.
 */
let partages: Sprites | null = null;

/** Les sprites, calcules si ce n'est pas deja fait. Les jetons sont ceux des familles d'etoiles. */
export function creerSprites(jetonsFamilles: readonly string[]): Sprites {
  if (partages) return partages;
  const unite = (jeton: string): Rgb => {
    const [r, g, b] = couleur(jeton);
    return [r / 255, g / 255, b / 255];
  };
  partages = {
    actuelle: spriteEtoile(unite('--etape-actuelle')),
    future: spriteEtoile(unite('--etape-future')),
    points: jetonsFamilles.map((jeton) => pointLumineux(couleur(jeton))),
  };
  return partages;
}

/**
 * Prepare les sprites quand le navigateur est au repos. Le calcul d'un sprite
 * est une double boucle de 147 000 pixels : lance pendant le defilement, il
 * ferait un a-coup. `requestIdleCallback` le range dans un moment creux ;
 * sans lui (Safari), un delai court suffit. Si les sprites existent deja, on
 * les rend tout de suite.
 */
export function preparerSprites(jetonsFamilles: readonly string[], pret: (sprites: Sprites) => void): () => void {
  if (partages) {
    pret(partages);
    return () => {};
  }
  let annule = false;
  const lancer = () => {
    if (!annule) pret(creerSprites(jetonsFamilles));
  };
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(lancer, { timeout: 2000 });
    return () => {
      annule = true;
      window.cancelIdleCallback(id);
    };
  }
  const id = window.setTimeout(lancer, 300);
  return () => {
    annule = true;
    window.clearTimeout(id);
  };
}
