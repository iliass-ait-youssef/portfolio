import { creerAlea } from '../../moteur/alea';

/**
 * LES DONNEES DU CIEL : toutes les formes que les moteurs du saut, de la
 * constellation et du voyage dessinent, tirees d'UNE seule suite de nombres.
 *
 * Le prototype valide tire tous ses nombres au hasard dans une seule suite, a
 * graine fixe, dans cet ordre : les etoiles de la constellation, les etoiles
 * du fond, celles du saut, puis la galaxie. Changer l'ordre, ou en sauter un,
 * decale tout ce qui suit : la galaxie serait un autre ciel. Ce module fait
 * les tirages dans le meme ordre, une fois, et chaque moteur lit sa part.
 *
 * Les REGLAGES sont les nombres que l'on change pour avoir plus ou moins
 * d'etoiles. Attention : les changer change aussi la suite, donc la forme de
 * tout ce qui est tire apres eux.
 */
export const REGLAGES = {
  /** La graine : meme ciel a chaque chargement. */
  graine: 11,
  /** Les points de poussiere du fond de la constellation. */
  etoilesDeFond: 160,
  /** Les etoiles qui se transforment en traits pendant le saut. */
  etoilesDuSaut: 650,
  /** Les etoiles de la galaxie du voyage. */
  etoilesDeLaGalaxie: 8000,
  /** Nombre de bras de la galaxie. */
  bras: 3,
  /** Rayon de la galaxie, en unites. */
  rayonGalaxie: 3.2,
} as const;

/** Une couche de la constellation, du silicium (0) a l'interface (4). */
export interface CoucheDef {
  /** La cle du nom et du texte dans les dictionnaires. */
  cle: 'silicium' | 'reseau' | 'donnees' | 'application' | 'interface';
  /** Le numero affiche : 01 a 05. */
  numero: string;
  /** Le jeton de couleur de la couche. */
  jeton: string;
  /** Les cles des outils de la couche, dans l'ordre d'affichage. */
  outils: readonly string[];
}

/** Les cinq couches. L'ordre est celui du bas vers le haut de l'ecran. */
export const COUCHES: readonly CoucheDef[] = [
  { cle: 'silicium', numero: '01', jeton: '--couche-1', outils: ['cisco', 'postes', 'fibre'] },
  { cle: 'reseau', numero: '02', jeton: '--couche-2', outils: ['ad', 'dhcp', 'dns', 'vlan', 'proxmox', 'apache'] },
  { cle: 'donnees', numero: '03', jeton: '--couche-3', outils: ['sql', 'mcd'] },
  { cle: 'application', numero: '04', jeton: '--couche-4', outils: ['php', 'csharp', 'javascript', 'threejs'] },
  { cle: 'interface', numero: '05', jeton: '--couche-5', outils: ['html', 'css', 'webgl', 'accessibilite'] },
];

/** Les projets et formations, avec les outils qu'ils ont vraiment utilises. */
export const PROJETS: readonly { cle: string; liens: readonly string[] }[] = [
  { cle: 'bacpro', liens: ['cisco', 'postes', 'fibre', 'ad', 'dhcp', 'dns', 'vlan', 'proxmox'] },
  { cle: 'bts', liens: ['sql', 'mcd', 'csharp', 'php'] },
  { cle: 'zmobile', liens: ['php', 'javascript', 'threejs', 'apache', 'html', 'css'] },
  { cle: 'portfolio', liens: ['threejs', 'webgl', 'javascript', 'html', 'css', 'accessibilite'] },
];

/** Une etoile-outil, placee dans le carre de la carte (x et y de 0 a 1). */
export interface EtoileOutil {
  cle: string;
  couche: number;
  x: number;
  y: number;
  /** Decalage du scintillement, en radians. */
  phase: number;
}

/** Une etoile-projet, placee au barycentre de ses outils. */
export interface EtoileProjet {
  cle: string;
  liens: readonly string[];
  x: number;
  y: number;
  phase: number;
}

/** Une etoile du saut : position dans le plan, profondeur, eclat. */
export interface EtoileSaut {
  x: number;
  y: number;
  z: number;
  eclat: number;
}

/** Un point de la galaxie : x, y, z, eclat. */
export type PointGalaxie = [number, number, number, number];

/** Les quatre familles d'etoiles de la galaxie, du coeur au rose. */
export interface GroupeGalaxie {
  /** Le jeton de couleur de la famille. */
  jeton: string;
  points: PointGalaxie[];
}

export interface Ciel {
  outils: EtoileOutil[];
  parCle: Record<string, EtoileOutil>;
  projets: EtoileProjet[];
  fond: [number, number, number][];
  saut: EtoileSaut[];
  galaxie: GroupeGalaxie[];
}

let memoire: Ciel | null = null;

/** Le ciel complet, tire une fois, dans l'ordre du prototype. */
export function ciel(): Ciel {
  if (memoire) return memoire;
  const R = creerAlea(REGLAGES.graine);

  // 1. Les etoiles-outils : decalage en x, en y, puis phase du scintillement.
  const outils: EtoileOutil[] = [];
  const parCle: Record<string, EtoileOutil> = {};
  COUCHES.forEach((couche, ci) => {
    couche.outils.forEach((cle, oi) => {
      const x = 0.1 + ((oi + 0.5) / couche.outils.length) * 0.8 + (R() - 0.5) * 0.06;
      const y = 0.86 - ci * 0.18 + (R() - 0.5) * 0.07;
      const etoile = { cle, couche: ci, x, y, phase: R() * 6.28 };
      outils.push(etoile);
      parCle[cle] = etoile;
    });
  });

  // 2. Les projets : au barycentre de leurs outils, decales de cote ; seule
  //    la phase est tiree au hasard.
  const projets: EtoileProjet[] = PROJETS.map((p, i) => {
    let mx = 0;
    let my = 0;
    p.liens.forEach((cle) => {
      mx += parCle[cle].x;
      my += parCle[cle].y;
    });
    return {
      cle: p.cle,
      liens: p.liens,
      x: mx / p.liens.length + (i % 2 ? 0.05 : -0.05),
      y: my / p.liens.length + (i < 2 ? 0.02 : -0.03),
      phase: R() * 6.28,
    };
  });

  // 3. La poussiere du fond de la constellation : x, y, eclat.
  const fond: [number, number, number][] = [];
  for (let i = 0; i < REGLAGES.etoilesDeFond; i += 1) {
    fond.push([R(), R(), 0.2 + R() ** 4 * 0.7]);
  }

  // 4. Les etoiles du saut.
  const saut: EtoileSaut[] = [];
  for (let i = 0; i < REGLAGES.etoilesDuSaut; i += 1) {
    saut.push({ x: R() * 2 - 1, y: R() * 2 - 1, z: R(), eclat: 0.4 + R() * 0.6 });
  }

  // 5. La galaxie : trois bras en spirale, plus dense au coeur, epaissie par
  //    un tirage gaussien. La famille de couleur depend du rayon.
  const gauss = () => Math.sqrt(-2 * Math.log(R() + 1e-9)) * Math.cos(6.2831853 * R());
  const galaxie: GroupeGalaxie[] = [
    { jeton: '--galaxie-coeur', points: [] },
    { jeton: '--violet-clair', points: [] },
    { jeton: '--galaxie-bleu', points: [] },
    { jeton: '--galaxie-rose', points: [] },
  ];
  for (let i = 0; i < REGLAGES.etoilesDeLaGalaxie; i += 1) {
    const bras = i % REGLAGES.bras;
    const r = R() ** 1.5 * REGLAGES.rayonGalaxie;
    const angle = (bras / REGLAGES.bras) * Math.PI * 2 + r * 1.35 + gauss() * 0.22 * (0.4 + r * 0.25);
    const y = gauss() * 0.07 * (1.2 - r / REGLAGES.rayonGalaxie);
    const famille = r < 0.55 ? 0 : R() < 0.04 ? 3 : R() < 0.6 ? 1 : 2;
    galaxie[famille].points.push([Math.cos(angle) * r, y, Math.sin(angle) * r, 0.35 + R() * 0.65]);
  }

  memoire = { outils, parCle, projets, fond, saut, galaxie };
  return memoire;
}
