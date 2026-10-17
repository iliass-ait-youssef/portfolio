/**
 * UN TEXTE QUI PEUT SE BROUILLER, lisible par tous.
 *
 * La partie visible est cachee aux lecteurs d'ecran (elle affiche des glyphes
 * au hasard pendant le brouillage) ; le vrai texte est donne dans une copie
 * invisible. La cle sur le texte force React a recreer la partie visible quand
 * la langue change : le brouillage modifie son contenu, et React ne doit pas
 * ecrire dans un noeud qu'il ne possede plus.
 */
export default function TexteBrouille({ texte }: { texte: string }) {
  return (
    <>
      <span key={texte} className="brouille" aria-hidden="true">
        {texte}
      </span>
      <span className="visuellement-cache">{texte}</span>
    </>
  );
}
