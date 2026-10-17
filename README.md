# Portfolio — Iliass Ait Youssef

Vite + React + TypeScript + Three.js. Bilingue francais / anglais. Deploye sur GitHub Pages.

## Demarrer

    npm install
    npm run dev

Le site tourne sur http://localhost:5173/portfolio/

## Mettre en ligne, etape par etape

1. Cree un repo sur GitHub sous le compte `iliass-ait-youssef`.

2. Ouvre `vite.config.ts` et regle `base` selon le nom que tu as choisi :

   - repo nomme `portfolio`            -> `base: '/portfolio/'`
   - repo nomme `iliass-ait-youssef.github.io`  -> `base: '/'`

   Si tu changes la base, reporte aussi les trois URL absolues de `index.html`
   (`og:url`, `og:image`, `canonical`) et `depot` dans `src/coordonnees.ts`.
   Si tu te trompes de base, le site s'affichera sans CSS ni images : c'est
   le symptome classique.

3. Envoie le code (le depot est deja initialise, avec un commit par tache) :

       git branch -M main
       git remote add origin https://github.com/iliass-ait-youssef/<nom-du-repo>.git
       git push -u origin main

4. Sur GitHub : Settings > Pages > Source > choisis **GitHub Actions**.

5. Chaque `git push` sur `main` redeploie le site automatiquement.

## Arborescence

    src/
      styles/tokens.css        TOUT le design system. Un seul point de verite.
      styles/base.css          remise a zero, accessibilite, boutons, reduced-motion
      styles/sections.css      socle commun des sections (en-tete, etiquettes,
                               halo de lisibilite)
      styles/grain.css         le grain : bruit SVG fin sur toute la page
      i18n/fr.json             textes francais
      i18n/en.json             textes anglais
      i18n/useLang.tsx         contexte de langue, choix garde en localStorage,
                               lang / title / description mis a jour
      i18n/useLibelleCouche.ts "04 · Application" dans la langue courante
      navigation.ts            les cinq couches, l'ancre couche-N, les liens de barre
      coordonnees.ts           e-mail, GitHub, CV, depot (des donnees)
      hooks/useCoucheVisible.ts la couche courante selon la section visible (repli)
      components/
        ChampEtoiles.tsx       ciel en SVG : le REPLI de la scene 3D
        EchelleAltitude.tsx    l'element signature : rail fixe a droite,
                               reglette en bas sous 1100px ; suit la camera 3D
        BasculeLangue.tsx      bascule FR / EN
        MenuMobile.tsx         menu plein ecran sous 860px, focus piege
        Marque.tsx             sigle + nom
        EnTeteSection.tsx      repere de couche + titre + chapo
        Fleche.tsx             fleche en trait (bas, haut, diagonale)
      sections/
        Hero.tsx               la vue en orbite, couche 05
        Projets.tsx            couche 04, etude de cas Zmobile01, projets a venir
        Parcours.tsx           couche 03, frise verticale
        Competences.tsx        couche 02, competences rangees par couche
        Contact.tsx            couche 01, quatre acces
        PiedDePage.tsx         signature, credits, retour en orbite
      three/                   la descente (palier 2), chargee a la demande
        Scene.tsx              fournisseur : capacites, frontiere d'erreur, chunk 3D
        capacites.ts           WebGL, reduced-motion, largeur >= 860, >= 4 coeurs
        useCapacites.ts        reevalue a chaud (largeur, preference de mouvement)
        SceneCanvas.tsx        canvas fixe, pause, perte de contexte, liberation
        Moteur.ts              UN renderer, UNE boucle, plafond 60 ips, dispose
        Progression.ts         defilement -> progression 0..1, calee sur les
                               sections, amortie ; densite de texte (retrait)
        useProgression.ts      branche la progression sur la page
        altitudes.ts           les cinq bandes, hauteurs des calques, fondus
        couleurs.ts            lit la palette depuis tokens.css
        Descente.ts            camera + calques + brouillard + retrait
        Etoiles.ts / Planete.ts / Reseau.ts / Circuit.ts / Silicium.ts
        etatScene.ts           ce que la scene publie au rail (couche, defilement)
        generateur.ts          aleatoire deterministe partage
        textures.ts            masques de points dessines sur canvas
        shaders/               le shader signature (atmosphere) + README explicatif
      App.tsx                  barre de navigation + assemblage
    public/
      favicon.svg, apple-touch-icon.png, og.png
    scripts/generer-images.mjs  regenere les deux PNG (node, sans dependance)
    .github/workflows/deploy.yml   deploiement automatique
    JOURNAL.md                 ce qui a ete fait, tache par tache, avec les scores
    QUESTIONS.md               les decisions prises seul, a relire

## Les paliers

**Palier 1, termine.** Le site complet sans 3D : hero, projets, parcours,
competences, contact, pied de page, menu mobile, navigation flottante,
metadonnees. Responsive de 360 a 1920, bilingue, accessible au clavier,
complet sous `prefers-reduced-motion`. Publiable tel quel.

**Palier 2, termine.** La descente en Three.js, en fond permanent : la camera
descend en continu pendant le defilement a travers cinq altitudes (orbite,
atmosphere, reseau, circuit, silicium), calees sur les cinq sections. Une
seule scene, un seul renderer, chargee a la demande (≈ 127 Ko gzip en plus)
et seulement si WebGL, un ecran d'au moins 860px, 4 coeurs et pas de
reduced-motion. Sinon, le ciel SVG reste. Le rail suit l'altitude de la
camera. Tout est genere par code, aucun modele externe. Le shader de
l'atmosphere est explique ligne par ligne dans `src/three/shaders/README.md`.

**Palier 3.** La constellation des projets : chaque projet est une etoile,
reliee aux autres par technologie partagee, cliquable.

## Regles a ne pas casser

- Aucune couleur ni taille en dur dans un composant. Tout passe par les
  tokens de `tokens.css` ; la scene 3D lit la palette au montage.
- Une seule scene 3D, un seul renderer, un seul canvas ; pause quand l'onglet
  est cache ; tout est libere au demontage.
- `prefers-reduced-motion` doit toujours donner un site beau et complet.
- Focus clavier visible partout.
- Aucun texte en dur dans les composants : tout dans `fr.json` et `en.json`.

## A fournir

- `public/cv-ait-youssef-iliass.pdf` (les boutons du hero et du contact le telechargent)
- Les captures et le contenu des projets autres que Zmobile01
- Les vraies photos avant / apres de Zmobile01
- Une relecture de `QUESTIONS.md` : dates, textes des stages, URL du depot,
  reglages de la scene 3D
