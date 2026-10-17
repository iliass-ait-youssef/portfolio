import { useLang } from '../i18n/useLang';
import { formatNombre } from './comptage';

/**
 * UN NOMBRE QUI COMPTE quand son bloc est revele (voir revelation.ts et
 * comptage.ts).
 *
 * La partie visible affiche la valeur finale tant qu'elle n'a pas compte (son
 * bloc est alors invisible), puis le nombre qui monte ; elle est cachee aux
 * lecteurs d'ecran, qui lisent la valeur finale une seule fois. La cle sur la
 * langue recree la partie visible quand la langue change : le compteur ecrit
 * directement dans ce noeud, React ne doit pas y ecrire apres lui.
 */
export default function Compteur({ valeur }: { valeur: number }) {
  const { lang } = useLang();
  const texte = formatNombre(lang).format(valeur);
  return (
    <span className="compteur" data-compteur={valeur} data-langue={lang}>
      <span key={lang} className="compteur__vu" aria-hidden="true">
        {texte}
      </span>
      <span className="visuellement-cache">{texte}</span>
    </span>
  );
}
