import { couleurUnite } from '../../moteur/palette';
import { normer, type Vec3 } from '../../moteur/maths';
import type { Plan } from './choregraphie';
import fragment from './trou-noir.frag.glsl?raw';
import vertex from './trou-noir.vert.glsl?raw';

/** L'angle de vue de la camera, en degres. */
const FOV = 50;
/** Le ratio de pixels est plafonne : au-dela de 2, le cout explose sans gain visible. */
const RATIO_PIXELS_MAX = 2;
/** En dessous de cette largeur (le logo et ses abords), on dessine en pleine resolution. */
const LARGEUR_PLEINE_RESOLUTION = 220;
/** La qualite de depart : la part de la resolution reellement calculee. */
const QUALITE_DEPART = 0.6;
const QUALITE_DEPART_MOBILE = 0.45;
/** La qualite adaptative : bornes, pas, et seuils d'intervalle entre images (ms). */
const QUALITE_MIN = 0.35;
const QUALITE_MAX = 1;
const BAISSE = 0.08;
const HAUSSE = 0.04;
/** Une moyenne au-dela : moins de 50 images par seconde, on baisse. */
const TROP_LENT = 20;
/** Aucune image au-dela : pas une seule image en retard, on peut monter. */
const A_L_HEURE = 20;
const IMAGES_PAR_BILAN = 30;
/** La rotation lente de la camera autour du trou noir, en radians par seconde. */
const ROTATION = 0.03;

const UNIFORMES = [
  'uRes', 'uOrigine', 'uRayon', 'uPixel', 'uAnneau', 'uTime', 'uFov',
  'uCamPos', 'uCamRight', 'uCamUp', 'uCamFwd',
  'uFroid', 'uTiede', 'uChaud', 'uEtoileBleue', 'uEtoileOrangee', 'uCouleurAnneau',
] as const;
type Uniforme = (typeof UNIFORMES)[number];

/**
 * LE TROU NOIR — un moteur WebGL, sans bibliotheque.
 *
 * Il dessine dans UN canvas fixe, plein ecran et transparent. A chaque image,
 * il recoit un `Plan` (le rectangle ou dessiner, ses coins, la camera) et ne
 * calcule que les pixels de ce rectangle : en plein ecran au debut, 44 pixels
 * de cote quand il est range dans le logo.
 *
 * Le prototype redimensionnait le canvas lui-meme a chaque image, ce qui force
 * le navigateur a recalculer la mise en page. Ici, le canvas ne bouge jamais :
 * c'est le shader qui decoupe son rectangle arrondi.
 *
 * La qualite est adaptative, comme dans le prototype : toutes les 30 images,
 * on fait le bilan. Le prototype regardait si l'image moyenne prenait moins de
 * 14 ms ; ici la boucle est plafonnee a 60 images par seconde, l'intervalle ne
 * descend donc jamais sous 16,7 ms et ce test ne passerait jamais. On regarde
 * plutot les retards :
 *   - en moyenne plus de 20 ms entre deux images (sous 50 par seconde) : on
 *     calcule moins de pixels (le navigateur agrandit l'image), et cette
 *     qualite devient un plafond, pour ne pas osciller ;
 *   - pas une seule image au-dela de 20 ms : on en calcule un peu plus,
 *     jusqu'au plafond.
 */
export class TrouNoir {
  private readonly gl: WebGLRenderingContext;
  private programme: WebGLProgram | null = null;
  private tampon: WebGLBuffer | null = null;
  private uniformes = {} as Record<Uniforme, WebGLUniformLocation | null>;
  private qualite: number;
  private temps = 20;
  private azimut = 0.4;
  private cumul = 0;
  private pire = 0;
  private images = 0;
  /** La qualite au-dela de laquelle la machine a deja decroche. */
  private plafond = QUALITE_MAX;
  private perdu = false;
  /** La signature de la derniere image, pour ne pas redessiner une image figee identique. */
  private signature = '';

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext,
    private readonly fige: boolean,
    mobile: boolean,
  ) {
    this.gl = gl;
    this.qualite = mobile ? QUALITE_DEPART_MOBILE : QUALITE_DEPART;
    this.preparer();
    canvas.addEventListener('webglcontextlost', this.surPerte);
    canvas.addEventListener('webglcontextrestored', this.surRetour);
  }

  /** Cree le moteur, ou renvoie `null` si WebGL n'est pas disponible. */
  static creer(canvas: HTMLCanvasElement, options: { fige: boolean; mobile: boolean }): TrouNoir | null {
    // Transparent (le reste de la page passe dessous), pre-multiplie, sans
    // anticrenelage : le shader lisse lui-meme ses bords.
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return null;
    return new TrouNoir(canvas, gl, options.fige, options.mobile);
  }

  /** Compile le programme, prepare le triangle et les uniformes. */
  private preparer(): void {
    const gl = this.gl;
    const compiler = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    };
    const vs = compiler(gl.VERTEX_SHADER, vertex);
    const fs = compiler(gl.FRAGMENT_SHADER, fragment);
    const programme = gl.createProgram()!;
    gl.attachShader(programme, vs);
    gl.attachShader(programme, fs);
    gl.linkProgram(programme);
    // Une fois lies, les shaders ne servent plus : on les rend tout de suite.
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(programme);
    this.programme = programme;

    // Un seul triangle qui couvre tout l'ecran (voir le vertex shader).
    this.tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tampon);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(programme, 'a');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    for (const nom of UNIFORMES) this.uniformes[nom] = gl.getUniformLocation(programme, nom);
    // Les couleurs ne changent pas : envoyees une fois, lues dans tokens.css.
    const u = this.uniformes;
    gl.uniform3fv(u.uFroid, couleurUnite('--trou-disque-froid'));
    gl.uniform3fv(u.uTiede, couleurUnite('--trou-disque-tiede'));
    gl.uniform3fv(u.uChaud, couleurUnite('--trou-disque-chaud'));
    gl.uniform3fv(u.uEtoileBleue, couleurUnite('--trou-etoile-bleue'));
    gl.uniform3fv(u.uEtoileOrangee, couleurUnite('--trou-etoile-orangee'));
    gl.uniform3fv(u.uCouleurAnneau, couleurUnite('--violet'));
    gl.uniform1f(u.uFov, (FOV * Math.PI) / 180);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
  }

  /**
   * La camera : sur une sphere autour du trou noir, a `distance`, levee de
   * `inclinaison` degres au-dessus du plan du disque, et qui tourne lentement
   * autour (l'azimut). Ses trois axes : le regard vers le centre, la droite
   * (horizontale), et le haut (perpendiculaire aux deux).
   */
  private camera(distance: number, inclinaisonDeg: number) {
    const el = (inclinaisonDeg * Math.PI) / 180;
    const ce = Math.cos(el);
    const pos: Vec3 = [Math.sin(this.azimut) * ce * distance, Math.sin(el) * distance, Math.cos(this.azimut) * ce * distance];
    const regard = normer([-pos[0], -pos[1], -pos[2]]);
    const droite = normer([-regard[2], 0, regard[0]]);
    const haut: Vec3 = [
      droite[1] * regard[2] - droite[2] * regard[1],
      droite[2] * regard[0] - droite[0] * regard[2],
      droite[0] * regard[1] - droite[1] * regard[0],
    ];
    return { pos, regard, droite, haut };
  }

  /** Une image. `dt` : secondes ecoulees ; l'ecran en pixels CSS. */
  dessiner(plan: Plan, dt: number, largeurEcran: number, hauteurEcran: number): void {
    if (this.perdu || !this.programme) return;
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, RATIO_PIXELS_MAX);
    const qualite = plan.largeur < LARGEUR_PLEINE_RESOLUTION ? 1 : this.qualite;
    const echelle = dpr * qualite;
    const bw = Math.max(2, Math.round(largeurEcran * echelle));
    const bh = Math.max(2, Math.round(hauteurEcran * echelle));

    // Sous reduced-motion, le temps est fige : une image identique a la
    // precedente n'est pas recalculee (le trou noir coute cher).
    const signature = `${bw}|${bh}|${plan.x.toFixed(1)}|${plan.y.toFixed(1)}|${plan.largeur.toFixed(1)}|${plan.hauteur.toFixed(1)}|${plan.rayon.toFixed(1)}|${plan.coupeHaut.toFixed(0)}|${plan.distance.toFixed(3)}`;
    if (this.fige && signature === this.signature) return;
    this.signature = signature;

    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    if (!this.fige) {
      this.temps += dt;
      this.azimut += dt * ROTATION;
    }

    // Tout le canvas redevient transparent ; puis on ne dessine que dans le
    // rectangle (plus deux pixels pour le liseré), et sous la coupe du haut.
    gl.viewport(0, 0, bw, bh);
    gl.disable(gl.SCISSOR_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const rx = plan.x * echelle;
    const rw = plan.largeur * echelle;
    const rh = plan.hauteur * echelle;
    const ry = bh - (plan.y + plan.hauteur) * echelle; // l'origine de WebGL est en bas
    const bord = Math.ceil(2 * echelle);
    const basCoupe = bh - plan.coupeHaut * echelle; // au-dessus de cette ligne, rien
    const sx = Math.max(0, Math.floor(rx - bord));
    const sy = Math.max(0, Math.floor(ry - bord));
    const sw = Math.min(bw, Math.ceil(rx + rw + bord)) - sx;
    const sh = Math.min(bh, Math.ceil(Math.min(ry + rh + bord, basCoupe))) - sy;
    if (sw <= 0 || sh <= 0) return;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(sx, sy, sw, sh);

    const cam = this.camera(plan.distance, plan.inclinaison);
    const u = this.uniformes;
    gl.uniform2f(u.uRes, rw, rh);
    gl.uniform2f(u.uOrigine, rx, ry);
    gl.uniform1f(u.uRayon, plan.rayon * echelle);
    gl.uniform1f(u.uPixel, echelle);
    gl.uniform1f(u.uAnneau, plan.anneau);
    gl.uniform1f(u.uTime, this.temps);
    gl.uniform3fv(u.uCamPos, cam.pos);
    gl.uniform3fv(u.uCamRight, cam.droite);
    gl.uniform3fv(u.uCamUp, cam.haut);
    gl.uniform3fv(u.uCamFwd, cam.regard);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // La qualite adaptative, seulement quand le trou noir est grand.
    if (!this.fige && plan.largeur >= LARGEUR_PLEINE_RESOLUTION) this.adapter(dt);
  }

  private adapter(dt: number): void {
    this.cumul += dt;
    this.pire = Math.max(this.pire, dt);
    this.images += 1;
    if (this.images < IMAGES_PAR_BILAN) return;
    const moyenne = (this.cumul / this.images) * 1000;
    if (moyenne > TROP_LENT && this.qualite > QUALITE_MIN) {
      this.qualite = Math.max(QUALITE_MIN, this.qualite - BAISSE);
      this.plafond = this.qualite;
    } else if (this.pire * 1000 < A_L_HEURE && this.qualite < this.plafond) {
      this.qualite = Math.min(this.plafond, this.qualite + HAUSSE);
    }
    this.cumul = 0;
    this.pire = 0;
    this.images = 0;
  }

  /** La qualite courante : exposee pour les mesures. */
  get qualiteCourante(): number {
    return this.qualite;
  }

  private surPerte = (e: Event) => {
    // Demande au navigateur de tenter de rendre le contexte, et arrete de dessiner.
    e.preventDefault();
    this.perdu = true;
  };

  private surRetour = () => {
    this.perdu = false;
    this.signature = '';
    this.preparer();
  };

  /** Rend au navigateur tout ce que le moteur tient sur la carte graphique. */
  liberer(): void {
    const gl = this.gl;
    this.canvas.removeEventListener('webglcontextlost', this.surPerte);
    this.canvas.removeEventListener('webglcontextrestored', this.surRetour);
    if (this.tampon) gl.deleteBuffer(this.tampon);
    if (this.programme) gl.deleteProgram(this.programme);
    this.tampon = null;
    this.programme = null;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
