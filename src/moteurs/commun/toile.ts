import type { Rgb } from '../../moteur/palette';

/**
 * LA TOILE : un canvas 2D dont la taille suit celle de son cadre, a la bonne
 * densite de pixels.
 *
 * Trois moteurs dessinent en 2D (le saut, la constellation, le voyage), et
 * tous ont besoin de la meme chose : connaitre la taille de leur canvas, la
 * garder a jour, et dessiner nettement sur les ecrans a haute densite sans
 * payer le prix d'un canvas demesure.
 *
 * La taille n'est jamais lue dans la mise en page a chaque image : un
 * `ResizeObserver` la met en memoire quand elle change.
 */
export const REGLAGES = {
  /** Au-dela de cette densite de pixels, on ne calcule pas plus de points : le gain ne se voit plus. */
  densiteMax: 2,
} as const;

export class Toile {
  readonly ctx: CanvasRenderingContext2D;
  /** La taille du canvas en pixels CSS. */
  largeur = 0;
  hauteur = 0;
  private densite = 1;
  private readonly observateur: ResizeObserver;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Le canvas 2D est indisponible');
    this.ctx = ctx;
    this.mesurer();
    this.observateur = new ResizeObserver(() => this.mesurer());
    this.observateur.observe(canvas);
  }

  private mesurer(): void {
    this.largeur = this.canvas.clientWidth;
    this.hauteur = this.canvas.clientHeight;
    this.densite = Math.min(window.devicePixelRatio || 1, REGLAGES.densiteMax);
    const w = Math.round(this.largeur * this.densite);
    const h = Math.round(this.hauteur * this.densite);
    // Affecter la taille efface le canvas : on ne le fait que si elle a change.
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
  }

  /** Prepare une image : repere en pixels CSS, melange normal. */
  commencer(): CanvasRenderingContext2D {
    this.ctx.setTransform(this.densite, 0, 0, this.densite, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1;
    return this.ctx;
  }

  liberer(): void {
    this.observateur.disconnect();
  }
}

/**
 * Une lueur : un disque dont le centre est a la couleur donnee et le bord
 * transparent. C'est la brique de toutes les etoiles du site.
 */
export function lueur(ctx: CanvasRenderingContext2D, x: number, y: number, rayon: number, couleur: Rgb, alpha: number): void {
  const degrade = ctx.createRadialGradient(x, y, 0, x, y, rayon);
  degrade.addColorStop(0, `rgba(${couleur[0]},${couleur[1]},${couleur[2]},1)`);
  degrade.addColorStop(1, `rgba(${couleur[0]},${couleur[1]},${couleur[2]},0)`);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = degrade;
  ctx.beginPath();
  ctx.arc(x, y, rayon, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
