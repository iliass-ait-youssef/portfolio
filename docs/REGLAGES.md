# Guide des réglages

Ce guide dit **où** et **quoi** changer pour modifier le site, sans avoir à lire
tout le code. Chaque ligne donne : le fichier, le nom du réglage, ce qu'il
change, et sa **valeur actuelle**.

Trois règles pour s'y retrouver :

1. **Les couleurs, tailles de texte, espacements, durées et courbes** sont dans
   un seul fichier : `src/styles/tokens.css`. On les change là, jamais ailleurs.
2. **Les textes** (français et anglais) sont dans `src/i18n/fr.json` et
   `src/i18n/en.json`. Les coordonnées (e-mail, GitHub, CV) sont dans
   `src/coordonnees.ts`.
3. **Le comportement de chaque effet** est dans un objet `REGLAGES` en tête du
   module de l'effet (`src/moteurs/…`). Chaque réglage y est commenté.

Après un changement : `npx tsc --noEmit` puis `npm run build` doivent passer sans
erreur ni avertissement. Vérifier ensuite dans le navigateur (`npm run dev`).

---

## 1. Les questions les plus fréquentes

| Je veux… | Je change… | Valeur actuelle |
|---|---|---|
| La **couleur d'accent** (le violet) | `src/styles/tokens.css` → `--violet` (et `--violet-clair` pour les titres et le curseur) | `#a98bff` et `#c9b6ff` |
| La **durée de l'intro** (compteur puis rideau) | `src/styles/tokens.css` → `--d-tres-long` (le compteur compte jusqu'à 100 en cette durée) ; `--d-eclair` et `--d-court` fixent le début de la sortie et la fin | `1.4s`, `0.15s`, `0.3s` → rideau levé en 3,25 s, page libérée à 1,85 s |
| La **taille des étoiles-étapes** du voyage | `src/moteurs/voyage/voyage.ts` → `REGLAGES.etape` (`facteur`, `min`, `max`) | `facteur: 0.16`, `min: 16`, `max: 330` (pixels) |
| La **forme** des étoiles-étapes (branches, halo, cœur) | `src/moteurs/voyage/sprites.ts` → `REGLAGES` | voir § 6 |
| La **vitesse du voyage** (longueur de défilement entre deux étoiles) | `src/moteurs/voyage/voyage.ts` → `REGLAGES.temps.segment` | `0.95` hauteur d'écran par étape |
| Le **nombre d'étoiles** de la galaxie | `src/moteurs/ciel/donnees.ts` → `REGLAGES.etoilesDeLaGalaxie` | `8000` |
| Le **nombre d'étoiles du saut** (traits de vitesse lumière) | `src/moteurs/ciel/donnees.ts` → `REGLAGES.etoilesDuSaut` | `650` |
| Le **ciel** (changer la disposition des étoiles) | `src/moteurs/ciel/donnees.ts` → `REGLAGES.graine` | `11` (même ciel à chaque chargement) |
| Les **textes des cartes projet** | `src/i18n/fr.json` et `en.json` → `projets.cartes` | — |
| Les **étapes du parcours** (titres, dates, résumés) | `fr.json` et `en.json` → `voyage.jalons` | 7 étapes |
| Le **texte « à préciser »** (orange) | `fr.json` et `en.json` → `aPreciser` de chaque jalon, `detail.aRediger`, `suite.emplacement` | — |
| L'**e-mail**, le lien GitHub, le **CV** | `src/coordonnees.ts` | voir le fichier |
| Le **fichier CV** servi | déposer le PDF dans `public/` sous le nom de `cvAffiche`, puis réactiver le bouton (voir § 12) | `cv-ait-youssef-iliass.pdf` |
| La **police** des titres, du texte, du code | `tokens.css` → `--titre`, `--corps`, `--mono` ; et le lien Google Fonts dans `index.html` | Space Grotesk, Instrument Sans, JetBrains Mono |

---

## 2. Le socle (défilement, boucle, mouvement)

| Fichier | Réglage | Effet | Valeur actuelle |
|---|---|---|---|
| `src/moteur/defilement.ts` | `lerp` (Lenis) | Douceur du défilement : plus petit = plus de glisse | `0.085` |
| `src/moteur/defilement.ts` | `wheelMultiplier` | Force de la molette | `0.9` |
| `src/moteur/boucle.ts` | plafond d'images | La boucle unique ne dépasse jamais cette cadence | 60 img/s |
| `src/moteur/inclinaison.ts` | `lissageVitesse` | Lissage de la vitesse de défilement (part rattrapée par image à 60 Hz) | `0.12` |
| `src/moteur/inclinaison.ts` | `lissageInclinaison` | Lissage de l'inclinaison | `0.15` |
| `src/moteur/inclinaison.ts` | `degresParVitesse` | Inclinaison du bandeau et des cartes par unité de vitesse | `0.22` |
| `src/moteur/inclinaison.ts` | `degresMax` | Inclinaison maximale (degrés) | `9` |
| `src/styles/tokens.css` | `--d-eclair`, `--d-court`, `--d-moyen`, `--d-long`, `--d-tres-long` | Les cinq durées du site (suivre la souris, micro-interaction, un élément qui bouge, une révélation, un rideau) | `0.15s`, `0.3s`, `0.6s`, `0.9s`, `1.4s` |
| `src/styles/tokens.css` | `--courbe-entree`, `--courbe-sortie`, `--courbe-trans`, `--courbe-ressort` | Les courbes d'accélération | voir le fichier |
| `src/styles/tokens.css` | `--cascade` | Retard entre deux lettres d'un titre | `0.035s` |

---

## 3. Le trou noir (ouverture, logo, contact)

| Fichier | Réglage | Effet | Valeur actuelle |
|---|---|---|---|
| `src/moteurs/trou-noir/trouNoir.ts` | `FOV` | Angle de vue de la caméra | `50°` |
| `src/moteurs/trou-noir/trouNoir.ts` | `QUALITE_DEPART` / `QUALITE_DEPART_MOBILE` | Part de la résolution calculée au démarrage | `0.6` / `0.45` |
| `src/moteurs/trou-noir/trouNoir.ts` | `QUALITE_MIN`, `QUALITE_MAX` | Bornes de la qualité adaptative (elle baisse seule si l'écran rame) | `0.35`, `1` |
| `src/moteurs/trou-noir/trouNoir.ts` | `BAISSE`, `HAUSSE` | Pas de la qualité adaptative | `0.08`, `0.04` |
| `src/moteurs/trou-noir/trouNoir.ts` | `TROP_LENT` | Intervalle moyen (ms) au-delà duquel on baisse la qualité | `20` |
| `src/moteurs/trou-noir/trouNoir.ts` | `ROTATION` | Rotation lente de la caméra (rad/s) | `0.03` |
| `src/moteurs/trou-noir/trouNoir.ts` | `RATIO_PIXELS_MAX` | Plafond de densité de pixels | `2` |
| `src/moteur/ouverture.ts` | `0.7` dans `avancementOuverture` | Longueur de défilement avant que le trou noir soit rangé dans le logo | 70 % d'un écran |
| `src/moteurs/trou-noir/choregraphie.ts` | `distance`, `inclinaison` | Position de la caméra derrière le contact | `30 → 22`, `10° → 6°` |
| `src/styles/tokens.css` | `--trou-disque-froid`, `-tiede`, `-chaud` | Couleurs du disque d'accrétion (lues aussi par le shader) | violet sombre → blanc |
| `src/styles/tokens.css` | `--repli-rayon`, `--repli-halo`, `--repli-hauteur` | Repli en CSS quand WebGL est absent | `12vmin`, `20vmin`, `52%` |
| `src/styles/tokens.css` | `--largeur-ouverture` | Largeur du bloc de texte du début | `820px` |
| `src/styles/tokens.css` | `--t-hero` | Taille du titre « Du câble au code » | `clamp(56px, 9.5vw, 124px)` |

---

## 4. Le bandeau, les projets, le contact

| Fichier | Réglage | Effet | Valeur actuelle |
|---|---|---|---|
| `src/moteurs/bandeau/bandeau.ts` | `vitesseBase` | Vitesse de glissement du bandeau (px/s) | `40` |
| `src/moteurs/bandeau/bandeau.ts` | `gainVitesse` | Accélération avec le défilement | `18` |
| `src/moteurs/bandeau/bandeau.ts` | `seuilInversion` | Vitesse vers le haut à partir de laquelle les rangées changent de sens | `-0.5` |
| `src/moteurs/cartes/cartes.ts` | `inclinaisonX`, `inclinaisonY` | Inclinaison d'une carte projet vers le curseur (degrés) | `7`, `9` |
| `src/moteurs/cartes/cartes.ts` | `penchee` | Penchée de la grille quand on défile vite | `0.25` |
| `src/styles/tokens.css` | `--perspective-cartes` | Perspective de l'arrivée des cartes | `1400px` |
| `src/moteurs/graisse/graisse.ts` | `portee` | Rayon de l'effet de graisse sur le titre du contact (px) | `130` |
| `src/moteurs/graisse/graisse.ts` | `graisseBase`, `graisseAjout` | Épaisseur des lettres : repos, et ajoutée sous le curseur | `400`, `300` (donc jusqu'à 700) |
| `src/moteurs/graisse/graisse.ts` | `seuilCouleur` | Au-dessus, la lettre passe en violet clair | `0.35` |
| `src/styles/tokens.css` | `--t-contact` | Taille du titre du contact | `clamp(48px, 8vw, 120px)` |
| `src/styles/tokens.css` | `--t-section` | Taille des titres de section | `clamp(34px, 4vw, 56px)` |

---

## 5. Le saut en vitesse lumière (`src/moteurs/saut/saut.ts`, `REGLAGES`)

| Réglage | Effet | Valeur actuelle |
|---|---|---|
| `focale` | Profondeur de la perspective (part du plus petit côté) | `0.55` |
| `accelerationFin`, `freinageDebut`, `freinageFin` | Profil de vitesse dans le saut (0 à 1) | `0.22`, `0.7`, `0.86` |
| `echelleDistance`, `deriveConstante` | Distance parcourue et dérive des étoiles | `5`, `0.25` |
| `lueurRayon`, `lueurBase`, `lueurVitesse` | Lueur violette du fond | `0.6`, `0.12`, `0.35` |
| `etirementBase`, `etirementVitesse` | Longueur des traits d'étoiles | `0.006`, `0.22` |
| `epaisseurMin`, `epaisseurMax` | Épaisseur des traits (px) | `0.6`, `2.4` |
| `seuilTraitVif` | Vitesse au-delà de laquelle les traits passent au violet pâle | `0.5` |
| `tunnelSeuil`, `tunnelAnneaux`, `tunnelOpacite` | Le tunnel d'anneaux | `0.35`, `12`, `0.7` |
| `flashPosition`, `flashLargeur`, `flashIntensite` | Le flash blanc du bout du saut | `0.8`, `0.035`, `0.85` |
| `etiquetteDebut`, `etiquetteDuree` | Disparition de l'étiquette « saut vers les projets » | `0.3`, `0.15` |
| `motDebut`, `motApparition`, `motArrivee` | Arrivée du mot PROJETS | `0.55`, `0.15`, `0.4` |
| `motRecul`, `motBascule` | Recul initial (px) et bascule initiale (°) du mot | `2400`, `25` |
| `motEcartDepart`, `motEcartArrivee` | Écartement des lettres du mot (em) | `0.4` → `-0.045` |
| `src/styles/tokens.css` : `--saut-lueur`, `--saut-trait`, `--saut-trait-vif`, `--saut-anneau-bleu`, `--saut-ombre-mot` | Couleurs du saut | voir le fichier |

---

## 6. La constellation (`src/moteurs/constellation/constellation.ts`, `REGLAGES`)

| Réglage | Effet | Valeur actuelle |
|---|---|---|
| `largeEcran` | Largeur à partir de laquelle la carte est à droite du texte (sinon en haut) | `900` px |
| `grand`, `petit` | Zone de dessin sur grand et petit écran | voir le fichier |
| `couches.debut`, `.pas`, `.duree`, `.fin` | Calendrier d'apparition des cinq couches (0 à 1) | `0.06`, `0.1`, `0.1`, `0.58` |
| `projets.debut`, `.duree`, `.finCommentaire` | Calendrier des projets | `0.6`, `0.22`, `0.86` |
| `projets.ordreCommentaire` | Ordre dans lequel le commentaire nomme les projets | zmobile, portfolio, bts, bacpro |
| `particules.nombre`, `.trajet` | Particules parties du logo | `7`, `0.09` |
| `survol.rayon`, `.seuil` | Distance de détection d'une étoile au survol | `22` px, `0.6` |
| `outil`, `projet` | Taille de lueur, point, éclat et police des étoiles-outils et projets | voir le fichier |
| `trait` | Opacité et épaisseur des liens | voir le fichier |
| `src/moteurs/ciel/donnees.ts` : `COUCHES`, `PROJETS` | Les outils de chaque couche et les liens projet–outil | — |
| `src/styles/sections.css` : `.carte-ciel { height: 330vh }` | Longueur de défilement de la constellation | `330vh` |
| `src/styles/tokens.css` : `--couche-1` … `--couche-5` | Une couleur par couche | bleu → rose |

---

## 7. Le voyage dans la galaxie (`src/moteurs/voyage/voyage.ts`, `REGLAGES`)

| Réglage | Effet | Valeur actuelle |
|---|---|---|
| `temps.approche`, `.segment`, `.sortie` | Longueur de défilement de l'approche, de chaque étape, de la sortie (hauteurs d'écran) | `1.4`, `0.95`, `1.3` |
| `arret.debut`, `.mouvement` | La caméra attend avant, bouge sur cette part, attend après | `0.25`, `0.5` |
| `vues.dessus`, `vues.ensemble` | Les deux vues fixes (au-dessus, vue d'ensemble) | voir le fichier |
| `bras` | Rayon de la première et de la dernière étape, enroulement | `2.9 → 0.45`, `1.35` |
| `camera` | Recul, décalage, hauteur, avance du regard | `0.42`, `0.13`, `0.09`, `0.05` |
| `galaxie.tailleMin`, `.tailleGain`, `.tailleMax` | Taille des étoiles de la galaxie (px) | `0.7`, `1.2`, `3.4` |
| `galaxie.paliersOpacite` | Paliers d'opacité (moins = plus rapide, plus de grain) | `32` |
| `coeur` | Lueur du cœur de la galaxie | `0.9`, `1.2`, `0.5` |
| `chemin.segments` | Finesse du chemin entre les étapes | `120` |
| `chemin.parcouru`, `chemin.aVenir` | Halo, trait, épaisseur, tirets | voir le fichier |
| `etape.facteur`, `.min`, `.max` | **Taille des étoiles-étapes** à l'écran | `0.16`, `16`, `330` |
| `etape.agrandissement`, `.pulsation`, `.vitessePulsation` | Grossissement de l'étape en cours et pulsation | `0.55`, `0.045`, `1.7` |
| `etapeOpacite` | Opacité d'une étoile passée, à venir, courante | `0.55`, `0.8`, `1` |
| `onde` | Onde de lumière à chaque arrivée | durée `1.6` s |
| `numero` | Numéro sous chaque étoile | police `11` |
| `clic.rayonMin`, `.partRayon` | Zone cliquable d'une étoile | `30` px, `0.35` |
| `interface` | Seuils d'apparition de l'en-tête, du compteur, du voile | voir le fichier |
| `largeEcran` | En dessous, les cartes se posent en bas au lieu de suivre l'étoile | `900` px |
| `carte` | Décalage et dimensions des cartes qui suivent leur étoile | voir le fichier |
| `src/moteurs/voyage/sprites.ts` : `REGLAGES.taille` | Finesse de l'image d'étoile (plus grand = plus net, calcul plus long) | `384` |
| `src/moteurs/voyage/sprites.ts` : `branche`, `corps`, `coeur`, `halo`, `poids`, `tonalite` | La forme de la croix lumineuse | voir le fichier |
| `src/styles/tokens.css` : `--etape-actuelle`, `--etape-future` | Teinte des étoiles passées/courante et à venir | violet, bleuté |
| `src/styles/tokens.css` : `--galaxie-*` | Couleurs des étoiles de la galaxie | voir le fichier |
| `src/styles/sections.css` : `.voyage { height: 880vh }` | Longueur totale de défilement du voyage | `880vh` (à garder égale à approche + 7 étapes + sortie) |

---

## 8. Les pages de détail (`src/sections/detail.css`, `src/moteur/detail.ts`)

| Fichier | Réglage | Effet | Valeur actuelle |
|---|---|---|---|
| `src/styles/tokens.css` | `--largeur-detail` | Largeur de la page | `1100px` |
| `src/styles/tokens.css` | `--largeur-tete-detail` | Largeur du chapeau | `640px` |
| `src/styles/tokens.css` | `--taille-etoile-detail` | Taille de l'étoile | `360px` |
| `src/styles/tokens.css` | `--hauteur-galerie` | Hauteur du bloc photos | `180px` |
| `src/styles/tokens.css` | `--detail-lueur` | Lueur violette en haut à droite | `rgba(90, 60, 200, 0.22)` |
| `src/styles/tokens.css` | `--d-long` | Durée de l'ouverture en cercle | `0.9s` |
| `src/i18n/fr.json`, `en.json` | `detail.blocs` | Les quatre titres de blocs | Le contexte, Ce que j'y ai fait, Ce que j'en retiens, Les outils |
| `src/i18n/fr.json`, `en.json` | `detail.aRediger` | Texte provisoire des blocs | `[À rédiger]` |

Les pages sont ouvertes par l'adresse : `#/parcours/1` à `#/parcours/7`,
`#/projets/1` et `#/projets/2`. Ajouter une étape ou un projet dans les
dictionnaires crée sa page automatiquement.

---

## 9. Le curseur et les aimants

| Fichier | Réglage | Effet | Valeur actuelle |
|---|---|---|---|
| `src/moteurs/curseur/curseur.ts` | `suivi` | Retard de l'anneau derrière le pointeur | `0.18` |
| `src/moteurs/curseur/curseur.ts` | `cibleAvecMot`, `cibleCliquable` | Ce qui affiche un mot / ce qui fait grossir l'anneau | `[data-curseur]`, `a, button` |
| `src/moteurs/curseur/aimants.ts` | `forceX`, `forceY` | Force d'attraction des boutons aimantés | `0.28`, `0.36` |
| `src/moteurs/curseur/aimants.ts` | `transitionSuivi`, `transitionRetour` | Réactivité, puis rebond au retour | `--d-eclair`, `--d-long` + `--courbe-ressort` |
| `src/styles/tokens.css` | `--point-curseur`, `--anneau-curseur`, `--anneau-survol`, `--anneau-etiquette` | Tailles du point et de l'anneau | `6px`, `38px`, `62px`, `84px` |
| `src/styles/tokens.css` | `--curseur-trait`, `--curseur-survol` | Couleurs de l'anneau | voir le fichier |
| `src/i18n/*.json` | `projets.lire`, `voyage.details` | Mots affichés dans l'anneau | « Lire », « Détails » |
| HTML | attribut `data-aimant` | Rend un élément aimanté | boutons du début, e-mail du contact |
| HTML | attribut `data-curseur="Mot"` | L'anneau devient une pastille portant ce mot | cartes projet |

---

## 10. Dégradations (ce qui se passe quand une capacité manque)

| Situation | Ce qui change | Où c'est réglé |
|---|---|---|
| `prefers-reduced-motion` | Aucune animation : intro sautée, trou noir figé, effets de curseur coupés, constellation visible d'un coup, voyage en liste de cartes | `src/mouvement/preferences.ts`, `src/styles/sections.css` |
| Pas de WebGL | Repli CSS du trou noir (disque noir et anneau lumineux) | `src/sections/trou-noir.css` (`.trou-repli`), jetons `--repli-*` |
| Écran tactile | Pas de curseur, pas d'aimants, cartes à plat | `src/sections/curseur.css`, `pointeurFin()` |
| Écran étroit (< 720 px) | Voile plus haut sur l'ouverture, constellation et voyage réorganisés (< 900 px) | `src/sections/ouverture.css`, `largeEcran` des moteurs |
| Mobile | Trou noir calculé à plus basse résolution | `QUALITE_DEPART_MOBILE` |
| Écran lent | La qualité du trou noir baisse seule | `QUALITE_MIN` … `TROP_LENT` |

---

## 11. Budgets à garder en tête

| Budget | Seuil | Mesure actuelle |
|---|---|---|
| Bundle JavaScript, gzip | < 250 Ko | 83,8 Ko |
| Cadence à 1440 × 900 | 60 img/s soutenues | 59,9 img/s |
| Cadence à 2560 × 1440 | ≥ 50 img/s | 58,2 img/s |
| Premier affichage | < 2,5 s | 0,08 s (en local) |
| Fuite après 20 ouvertures de pages de détail | aucune | aucune (DOM, écouteurs) |

Si un réglage fait dépasser un budget, simplifier dans cet ordre : la résolution
du trou noir (`QUALITE_DEPART`), puis le nombre d'étoiles de la galaxie
(`etoilesDeLaGalaxie`), puis le nombre d'étoiles du saut (`etoilesDuSaut`).

---

## 12. Choses retirées de la publication (et comment les remettre)

### Le bouton « CV en PDF »

Le bouton du contact est **masqué** tant que le fichier n'existe pas : un lien
vers un PDF absent donnerait une erreur 404 sur GitHub Pages.

1. Déposer le PDF dans `public/` sous le nom exact `cv-ait-youssef-iliass.pdf`.
2. Dans `src/coordonnees.ts`, passer `CV_DISPONIBLE` de `false` à `true`.
3. `npm run build`, puis publier.

Il n'y a pas d'autre bouton de CV dans le site (ni à l'accueil, ni ailleurs).

### Le numéro de téléphone

Il est **retiré** : il n'est plus dans `src/coordonnees.ts`, ni dans les
dictionnaires, et le site n'affichait ni lien `tel:` ni numéro. Pour le remettre :

1. Dans `src/coordonnees.ts`, ajouter dans `COORDONNEES` les deux lignes :
   `telephone: '+33XXXXXXXXX'` (format international, sans espaces, pour le lien)
   et `telephoneAffiche: '0X XX XX XX XX'` (ce qui s'affiche).
2. Dans `src/sections/Contact.tsx`, dans `.contact__liens`, ajouter un lien :
   `<a href={`tel:${COORDONNEES.telephone}`}>{COORDONNEES.telephoneAffiche}</a>`.
3. `npx tsc --noEmit` et `npm run build`.

Un numéro publié sur un site public est lisible par tout le monde, y compris les
robots qui collectent les numéros : à ne remettre que si c'est voulu.

