/**
 * LE HASARD REPRODUCTIBLE.
 *
 * Toutes les formes du site — etoiles de la constellation, du saut, de la
 * galaxie — sont tirees d'un generateur a graine fixe : meme ciel a chaque
 * chargement, et le meme que celui du prototype valide.
 *
 * C'est le generateur de Park et Miller (1988) : x(n+1) = 16807 x(n) mod
 * (2^31 - 1). Simple, rapide, et assez bon pour placer des etoiles.
 *
 * Le prototype tire TOUS ses nombres dans une seule suite, dans un ordre
 * precis : constellation, puis saut, puis galaxie. Pour retrouver exactement
 * ses positions, les moteurs consomment la meme suite dans le meme ordre (voir
 * `donnees.ts`).
 */
export function creerAlea(graine: number): () => number {
  let x = graine;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}
