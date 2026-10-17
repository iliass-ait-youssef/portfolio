// LE TROU NOIR : fragment shader.
//
// Ce programme tourne UNE FOIS PAR PIXEL. Pour chaque pixel, il lance un rayon
// de lumiere depuis la camera et le fait avancer pas a pas. La gravite courbe
// sa trajectoire. S'il traverse le disque de gaz qui tourne autour du trou
// noir, il en ramasse la lumiere. S'il tombe dans le trou, il est perdu (noir).
// S'il s'echappe, il voit le ciel etoile au loin.
//
// Les unites : le rayon de l'horizon du trou noir (rayon de Schwarzschild) vaut
// 1. Tout ce qui passe a moins de 1 du centre ne ressort jamais.
//
// La logique est celle du prototype valide, sans changement. Seuls ajouts, a la
// fin : les couleurs viennent de tokens.css, et un masque arrondi decoupe le
// rectangle ou dessiner (le trou noir retrecit jusqu'au logo).
// Explication detaillee : README.md, dans ce dossier.

precision highp float;   // les calculs de trajectoire ont besoin de toute la precision

// ---- Ce que le JavaScript envoie --------------------------------------------
uniform vec2 uRes;        // taille du rectangle ou l'on dessine, en pixels du tampon
uniform vec2 uOrigine;    // coin bas-gauche de ce rectangle, en pixels du tampon
uniform float uRayon;     // rayon des coins arrondis, en pixels du tampon
uniform float uPixel;     // combien de pixels du tampon font un pixel CSS
uniform float uAnneau;    // opacite du liseré violet autour du logo (0 = aucun)
uniform float uTime;      // temps, en secondes : le disque tourne
uniform float uFov;       // angle de vue vertical de la camera, en radians
uniform vec3 uCamPos;     // position de la camera
uniform vec3 uCamRight;   // les trois axes de la camera : la droite,
uniform vec3 uCamUp;      //   le haut,
uniform vec3 uCamFwd;     //   et la direction du regard
uniform vec3 uFroid;      // couleurs du disque : la plus froide (violet sombre),
uniform vec3 uTiede;      //   la tiede (violet clair),
uniform vec3 uChaud;      //   la plus chaude (presque blanc)
uniform vec3 uEtoileBleue;    // couleurs des etoiles du ciel : des bleutees
uniform vec3 uEtoileOrangee;  //   aux orangees
uniform vec3 uCouleurAnneau;  // couleur du liseré

// ---- Le hasard reproductible ------------------------------------------------
// Un « hash » donne un nombre qui a l'air aleatoire, entre 0 et 1, mais qui est
// toujours le meme pour la meme entree. sin() d'un grand nombre, multiplie
// encore, puis on garde la partie decimale : les decimales tombent n'importe ou.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }

// Le bruit de valeur : un hash sur une grille, interpole en douceur entre les
// quatre coins de chaque case. On obtient des taches douces au lieu de grains.
float bruit(vec2 p) {
  vec2 i = floor(p);                    // la case de la grille
  vec2 f = fract(p);                    // la position dans la case, de 0 a 1
  f = f * f * (3.0 - 2.0 * f);          // lissage : pas de cassure aux bords des cases
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),                    // le bas de la case
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),   // le haut de la case
    f.y);                                                           // melange des deux
}

// Le bruit fractal : cinq bruits superposes, chacun deux fois plus fin et deux
// fois plus faible que le precedent. C'est ce qui donne au gaz son aspect de
// nuages, avec des details a toutes les echelles.
float fbm(vec2 p) {
  float v = 0.0;    // la somme
  float a = 0.5;    // l'amplitude de la couche courante
  for (int i = 0; i < 5; i++) {
    v += a * bruit(p);
    p = p * 2.03 + vec2(3.1, 1.7);   // deux fois plus fin, et decale pour ne pas aligner les couches
    a *= 0.5;                        // deux fois plus faible
  }
  return v;
}

// ---- Le ciel lointain -------------------------------------------------------
// Pour une direction d, on regarde dans quelle case d'une grande grille elle
// tombe ; certaines cases contiennent une etoile. Deux grilles de finesse
// differente : des etoiles de deux tailles.
vec3 ciel(vec3 d) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    vec3 g = d * (60.0 + fi * 70.0);   // la direction, agrandie : une grille de 60 puis de 130 cases
    vec3 id = floor(g);                // la case
    vec3 f = fract(g) - 0.5;           // la position dans la case, centree
    float h = hash3(id + fi * 17.0);   // le tirage de la case : y a-t-il une etoile ?
    vec3 o = vec3(hash3(id + 1.3), hash3(id + 2.7), hash3(id + 4.1)) - 0.5;   // ou, dans la case
    float e = length(f - o * 0.6);     // la distance du pixel a l'etoile
    c += mix(uEtoileBleue, uEtoileOrangee, hash3(id + 5.5))   // sa couleur, tiree au hasard
      * step(0.93 - fi * 0.02, h)                             // seulement 7 a 9 % des cases ont une etoile
      * exp(-e * e * 60.0)                                     // un point net, qui s'eteint vite
      * (0.4 + 1.2 * pow(hash3(id + 9.1), 6.0));               // quelques rares etoiles tres brillantes
  }
  return c;
}

// ---- Le gaz qui tourne -------------------------------------------------------
// Le gaz pres du trou noir tourne plus vite que celui du bord : sa vitesse
// angulaire suit la loi de Kepler, omega = r^(-3/2). Si l'on faisait tourner
// le motif a cette vitesse indefiniment, il s'enroulerait en spirale de plus
// en plus serree. L'astuce : deux copies du motif, decalees d'une demi-periode,
// qui ne tournent chacune que pendant une periode T, et un fondu de l'une a
// l'autre. On voit un gaz qui tourne sans jamais s'emmeler.
float motif(vec2 xz, float r, float t) {
  float omega = 1.0 / pow(r, 1.5);     // vitesse angulaire de Kepler
  float T = 40.0;                      // la periode du fondu, en secondes
  float p0 = fract(t / T);             // ou en est la premiere copie dans sa periode
  float p1 = fract(t / T + 0.5);       // la seconde, decalee d'une demi-periode
  float w0 = 1.0 - abs(1.0 - 2.0 * p0);   // poids de la premiere : 0 au debut et a la fin, 1 au milieu
  float a0 = -omega * (p0 - 0.5) * T - t * 0.02;   // l'angle de rotation de chaque copie
  float a1 = -omega * (p1 - 0.5) * T - t * 0.02;
  vec2 q0 = vec2(cos(a0) * xz.x - sin(a0) * xz.y, sin(a0) * xz.x + cos(a0) * xz.y);   // le point tourne
  vec2 q1 = vec2(cos(a1) * xz.x - sin(a1) * xz.y, sin(a1) * xz.x + cos(a1) * xz.y);
  return mix(
    fbm(q1 * 0.7 + 7.0) * 0.75 + bruit(q1 * 2.4 + 7.0) * 0.35,   // seconde copie : nuages et details
    fbm(q0 * 0.7) * 0.75 + bruit(q0 * 2.4) * 0.35,               // premiere copie
    w0);
}

// ---- Le disque d'accretion ---------------------------------------------------
// p : le point ou le rayon traverse le plan du disque ; v : sa direction.
// Renvoie la lumiere emise (rgb) et l'opacite du gaz (a).
vec4 disque(vec3 p, vec3 v, float t) {
  float r = length(p.xz);    // la distance au centre, dans le plan du disque
  float rin = 3.0;           // le bord interieur : la derniere orbite stable, a 3 rayons d'horizon
  float rout = 14.0;         // le bord exterieur
  if (r < rin * 0.85 || r > rout) return vec4(0.0);   // hors du disque : rien
  float n = motif(p.xz, r, t);                        // la densite du gaz a cet endroit
  float sillons = 0.82 + 0.18 * sin(r * 4.0 + n * 9.0);   // des anneaux, deformes par le gaz
  float x = rin / r;
  // La temperature du gaz : nulle au bord interieur, maximale un peu plus loin,
  // puis decroissante (profil du disque mince de Shakura et Sunyaev).
  float temp = pow(x, 0.75) * pow(max(1.0 - sqrt(x), 0.0), 0.25) * 2.6;
  // La vitesse du gaz : tangente a son orbite, de valeur sqrt(M / r) avec M = 0,5.
  vec3 vD = normalize(vec3(-p.z, 0.0, p.x)) * sqrt(0.5 / r);
  float beta = length(vD);                                  // la vitesse, en fraction de celle de la lumiere
  float gamma = 1.0 / sqrt(max(1.0 - beta * beta, 0.01));   // le facteur de Lorentz
  // L'effet Doppler : le gaz qui vient vers nous parait plus lumineux, celui
  // qui s'eloigne plus sombre. C'est pour cela qu'un cote du disque brille plus.
  float D = 1.0 / (gamma * (1.0 - beta * dot(normalize(vD), -v)));
  // Le decalage gravitationnel : la lumiere qui sort d'un puits de gravite perd
  // de l'energie, d'autant plus qu'elle part pres du trou.
  float g = D * sqrt(max(1.0 - 1.0 / r, 0.0));
  float fin = 1.0 - smoothstep(rout * 0.45, rout, r);   // le bord exterieur s'estompe
  // L'intensite : chaleur, densite du gaz, sillons, et le decalage g eleve au
  // cube (la lumiere est concentree vers l'avant du mouvement).
  float intens = temp * temp * 1.6 * (0.35 + 1.1 * n) * sillons * g * g * g;
  float te = clamp(temp * g * 0.8, 0.0, 1.6);   // la temperature vue d'ici, qui choisit la couleur
  vec3 col = mix(uFroid, uTiede, smoothstep(0.15, 0.55, te));   // du violet sombre au violet clair...
  col = mix(col, uChaud, smoothstep(0.75, 1.3, te));            // ... puis au presque blanc
  return vec4(
    col * intens * fin,                                                      // la lumiere
    clamp(intens * 0.8, 0.0, 0.9) * smoothstep(rin * 0.85, rin, r) * fin);   // l'opacite du gaz
}

void main() {
  // La position du pixel dans le rectangle ou l'on dessine, en pixels du tampon.
  vec2 pixel = gl_FragCoord.xy - uOrigine;
  vec2 vUv = pixel / uRes;   // de (0,0) en bas a gauche a (1,1) en haut a droite

  // La direction du rayon : on part de l'axe du regard et on s'ecarte d'autant
  // plus que le pixel est loin du centre ; tan(fov/2) fixe l'angle de vue, et
  // le rapport largeur / hauteur evite d'ecraser l'image.
  vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.0 * tan(uFov * 0.5);
  vec3 v = normalize(uCamFwd + uv.x * uCamRight + uv.y * uCamUp);

  vec3 p = uCamPos;           // le rayon part de la camera
  vec3 hv = cross(p, v);      // son moment cinetique : il ne change pas le long du trajet
  float h2 = dot(hv, hv);     // son carre, qui regle la force de la courbure
  vec3 col = vec3(0.0);       // la lumiere ramassee
  float trans = 1.0;          // la part de lumiere qui passe encore (le gaz en absorbe)
  float capture = 0.0;        // 1 si le rayon tombe dans le trou

  for (int i = 0; i < 260; i++) {
    float r = length(p);
    float dt = clamp(0.08 * r, 0.02, 1.5);   // petits pas pres du trou, grands pas au loin
    vec3 pp = p;                             // la position d'avant, pour detecter le disque
    // La courbure : pour la lumiere autour d'un trou noir, l'equation de la
    // relativite generale revient a une acceleration vers le centre en
    // 1,5 h^2 / r^4. On l'applique a la direction, puis on avance.
    v += -1.5 * h2 * p / pow(r, 5.0) * dt;
    p += v * dt;
    // Le disque est dans le plan y = 0 : si y a change de signe pendant ce pas,
    // le rayon l'a traverse. On retrouve le point exact par interpolation.
    if (pp.y * p.y < 0.0) {
      vec3 pc = mix(pp, p, pp.y / (pp.y - p.y));
      vec4 dc = disque(pc, normalize(v), uTime);
      col += dc.rgb * trans;     // la lumiere du gaz, attenuee par le gaz deja traverse
      trans *= 1.0 - dc.a;       // le gaz absorbe une part de ce qui vient derriere
      if (trans < 0.02) break;   // plus rien ne passe : inutile de continuer
    }
    if (length(p) < 1.0) { capture = 1.0; break; }   // sous l'horizon : perdu
    if (length(p) > 70.0) break;                     // assez loin : il s'est echappe
  }
  // Ce qui s'est echappe voit le ciel, dans sa direction finale (courbee).
  col += ciel(normalize(v)) * trans * (1.0 - capture);
  // Une compression douce : les tres fortes lumieres tendent vers 1 sans saturer net.
  vec3 image = 1.0 - exp(-col * 1.3);

  // ---- Le masque : un rectangle aux coins arrondis -----------------------
  // La distance signee du pixel au bord du rectangle arrondi : negative dedans,
  // positive dehors (la formule classique du rectangle arrondi).
  vec2 q = abs(pixel - uRes * 0.5) - (uRes * 0.5 - uRayon);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRayon;
  float dedans = clamp(0.5 - d, 0.0, 1.0);   // 1 dedans, 0 dehors, un pixel de fondu au bord
  // Le liseré : une bande d'un pixel CSS juste a l'exterieur du bord.
  float bande = clamp(1.0 - abs(d - 0.5 * uPixel) / (0.5 * uPixel), 0.0, 1.0) * uAnneau * (1.0 - dedans);
  // Couleurs « pre-multipliees » par l'opacite : c'est ce qu'attend le
  // navigateur pour poser ce canvas transparent sur la page.
  gl_FragColor = vec4(image * dedans + uCouleurAnneau * bande, dedans + bande);
}
