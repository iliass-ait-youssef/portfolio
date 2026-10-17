import { useCapacites } from './capacites/useCapacites';
import { useLang } from './i18n/useLang';
import { changerPhase } from './moteur/etatIntro';
import { useSite } from './moteur/useSite';
import Apropos from './sections/Apropos';
import Bandeau from './sections/Bandeau';
import Barre from './sections/Barre';
import Constellation from './sections/Constellation';
import Contact from './sections/Contact';
import Curseur from './sections/Curseur';
import Detail from './sections/Detail';
import Garde from './sections/Garde';
import Intro from './sections/Intro';
import Ouverture from './sections/Ouverture';
import Pied from './sections/Pied';
import Projets from './sections/Projets';
import Saut from './sections/Saut';
import Suite from './sections/Suite';
import TrouNoir from './sections/TrouNoir';
import Voyage from './sections/Voyage';

/**
 * L'ASSEMBLAGE DU SITE : une page unique qui se defile, dans l'ordre du
 * prototype. Les pages de detail viennent en surimpression.
 *
 * Chaque section est un composant ; chaque moteur graphique est un module a
 * part, sans React, que sa section inscrit dans la boucle unique. Chaque
 * section est gardee : si elle tombe, elle seule disparait (voir Garde.tsx).
 * Si c'est l'intro, le defilement est rendu quand meme.
 */
export default function App() {
  const { t } = useLang();
  const capacites = useCapacites();
  useSite();

  return (
    <>
      <a className="saut-contenu" href="#contenu">
        {t.commun.sautContenu}
      </a>
      <Garde nom="intro" surErreur={() => changerPhase('fini')}>
        <Intro />
      </Garde>
      <Garde nom="trou noir">
        <TrouNoir capacites={capacites} />
      </Garde>
      <Garde nom="barre">
        <Barre />
      </Garde>
      <main id="contenu">
        <Garde nom="ouverture">
          <Ouverture />
        </Garde>
        <Garde nom="a propos">
          <Apropos />
        </Garde>
        <Garde nom="bandeau">
          <Bandeau />
        </Garde>
        <Garde nom="saut">
          <Saut />
        </Garde>
        <Garde nom="projets">
          <Projets />
        </Garde>
        <Garde nom="constellation">
          <Constellation />
        </Garde>
        <Garde nom="voyage">
          <Voyage />
        </Garde>
        <Garde nom="suite">
          <Suite />
        </Garde>
        <Garde nom="contact">
          <Contact />
        </Garde>
      </main>
      <Pied />
      <Garde nom="curseur">
        <Curseur />
      </Garde>
      <Garde nom="detail">
        <Detail />
      </Garde>
    </>
  );
}
