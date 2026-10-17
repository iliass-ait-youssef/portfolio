import type { CSSProperties } from 'react';

/** L'espace fine insecable, avant les deux-points en francais. */
const ESPACE_FINE = '\u202f';
/**
 * Seule dans sa boite, l'espace fine s'ecrase presque a rien : elle est
 * affichee comme une espace insecable pleine, qui garde sa largeur.
 */
const INSECABLE = '\u00a0';

/** Un morceau de texte, accentue ou non (l'accent passe en violet clair). */
export interface Morceau {
  texte: string;
  accent?: boolean;
}

/**
 * UN TEXTE DECOUPE EN LETTRES, lisible par tous.
 *
 * Pour les yeux : chaque mot est une boite masquee, chaque lettre une boite
 * qui monte depuis le bas du masque en basculant (voir texte.css). Les lettres
 * se suivent avec un petit retard, une « cascade », grace a leur indice `--i`.
 *
 * Pour les lecteurs d'ecran : les lettres sont cachees (`aria-hidden`), et le
 * texte complet est donne une seule fois, dans une copie invisible a l'ecran.
 * Personne n'entend « D, u, c, a, b, l, e ».
 *
 * Le decoupage est fait par React, pas par une manipulation du DOM apres coup :
 * quand la langue change, React reconstruit les lettres lui-meme, sans conflit.
 *
 * `lignes` : chaque ligne est une suite de morceaux ; un retour a la ligne est
 * place entre deux lignes.
 *
 * Seules les espaces ordinaires separent les mots : une espace insecable (celle
 * qui precede les deux-points en francais) reste dans son mot, et la ligne ne
 * se coupe jamais devant la ponctuation.
 */
export default function TexteDecoupe({ lignes }: { lignes: Morceau[][] }) {
  let indice = 0;
  const complet = lignes
    .map((ligne) => ligne.map((m) => m.texte).join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const mots = (texte: string) =>
    texte.split(/([ \t\n]+)/).map((morceau, i) => {
      if (!morceau) return null;
      if (/^[ \t\n]+$/.test(morceau)) return ' ';
      return (
        <span key={i} className="mot">
          {Array.from(morceau).map((lettre, j) => (
            <span key={j} className="car">
              <span className="car-int" style={{ '--i': indice++ } as CSSProperties}>
                {/* Seule dans sa boite, une espace fine s'ecrase : elle devient une insecable pleine. */}
                {lettre === ESPACE_FINE ? INSECABLE : lettre}
              </span>
            </span>
          ))}
        </span>
      );
    });

  return (
    <>
      <span className="visuellement-cache">{complet}</span>
      <span aria-hidden="true">
        {lignes.map((ligne, l) => (
          <span key={l}>
            {l > 0 && <br />}
            {ligne.map((m, k) => (m.accent ? <em key={k}>{mots(m.texte)}</em> : <span key={k}>{mots(m.texte)}</span>))}
          </span>
        ))}
      </span>
    </>
  );
}
