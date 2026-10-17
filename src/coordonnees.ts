/**
 * Les coordonnees publiques du site. Ce sont des donnees, pas des textes :
 * elles ne changent pas avec la langue, d'ou leur place hors des dictionnaires.
 */
export const COORDONNEES = {
  email: 'aityoussef.iliass07@gmail.com',
  github: 'https://github.com/iliass-ait-youssef',
  githubAffiche: 'github.com/iliass-ait-youssef',
  /** Le depot du site lui-meme ; le nom suit la base de vite.config.ts. */
  depot: 'https://github.com/iliass-ait-youssef/portfolio',
  /** Le CV est servi depuis public/, sous la base du site (GitHub Pages). */
  cv: `${import.meta.env.BASE_URL}cv-ait-youssef-iliass.pdf`,
  cvAffiche: 'cv-ait-youssef-iliass.pdf',
} as const;

/**
 * Le CV n'est propose que si le fichier existe. Tant que `public/cv-ait-youssef-iliass.pdf`
 * n'est pas depose, le bouton est masque (un lien vers un fichier absent ferait une erreur 404).
 * Une fois le PDF depose : passer cette valeur a `true` (voir docs/REGLAGES.md).
 */
export const CV_DISPONIBLE = false;
