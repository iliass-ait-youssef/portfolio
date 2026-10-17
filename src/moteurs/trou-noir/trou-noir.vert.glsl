// Le trou noir : vertex shader.
//
// Il ne fait presque rien. On dessine UN triangle qui deborde de l'ecran et
// le couvre entierement ; tout le travail est dans le fragment shader, qui
// tourne une fois par pixel. Les trois sommets sont (-1,-1), (3,-1), (-1,3) :
// un triangle assez grand pour contenir le carre [-1, 1] x [-1, 1], c'est-a-dire
// tout l'ecran (un seul triangle coute moins que deux qui formeraient un carre).

attribute vec2 a;   // la position du sommet, deja en coordonnees d'ecran (-1 a 1)

void main() {
  // z = 0 : pas de profondeur ; w = 1 : pas de perspective, le point est ou il est.
  gl_Position = vec4(a, 0.0, 1.0);
}
