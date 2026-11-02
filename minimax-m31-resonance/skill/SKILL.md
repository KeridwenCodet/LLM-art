---
name: llm-art
description: Use when making generative art or fixing vision_analyze.
---

# Générer et livrer une œuvre d'art (profil llm-art)

## Où travailler
- Docker est le backend terminal. `/workspace` correspond côté Windows à
  a folder on the Windows host (path removed for the archive).
- Chrome headless : `/root/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome`.
- `puppeteer-core` s'installe avec `npm i puppeteer-core` — node_modules est local
  au dossier : lancer node depuis le dossier qui le contient.
- Flags Chrome : `--no-sandbox --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader`.

## Règle critique : vision_analyze ne lit PAS un chemin de fichier
Le sandbox de `vision_analyze` convertit le chemin en chemin Windows et tente un
fetch qui echoue avec `Only base64 data is allowed` (ou
`sandbox returned non-image data`). Ce n'est PAS un probleme de taille : un
temoin de 70 octets passe, un fichier de 15 Ko echoue, un PNG de 3,8 Mo echoue.

**Ce qui marche : passer l'image directement en data-URL base64.**
```
image_url = "data:image/jpeg;base64," + <base64 du fichier>
```
Procedure fiable :
1. Rendre l'image en PNG via Chrome headless.
2. La re-decoder/encoder en JPEG ~400-520 px de large dans Chrome, puis base64.
3. Ecrire le payload base64 dans un fichier texte, le relire avec read_file
   (segments de ~2000 caracteres) et le passer tel quel.
4. Verifier avant envoi : `len(payload) % 4 == 0` et magic decode `ffd8ff` (JPEG)
   ou `89504e47` (PNG). Un payload tronque donne
   `invalid base64 in data: URL` ou `broken data stream`.

Piege : recopier manuellement un base64 long depuis la sortie terminal le tronque
souvent. Toujours relire le fichier depuis le disque avant de l'envoyer.

## Livraison
- L'app desktop tourne sur l'hote WINDOWS ; le terminal tourne dans un conteneur
  Docker qui partage les fichiers de l'hote via un montage 9p.
- Correspondance : `/workspace/oeuvre/x.png` (conteneur) ==
  `C:\…\HermesWorkspace\test\oeuvre\x.png` (hote).
- `MEDIA:<chemin absolu>` : l'app doit pouvoir lire le chemin SUR L'HOTE. Un
  chemin de conteneur (`/workspace/...`) peut ne pas etre resolu par l'app, et
  un chemin Windows n'est pas resolu par l'outillage conteneur. Solution sure :
  mettre le tag `MEDIA:` ET donner le CHEMIN WINDOWS en clair dans le texte,
  pour que l'utilisateur puisse double-cliquer dans l'explorateur.
- Extensions images acceptees en inline : png, jpg, jpeg, gif, webp, bmp, tiff, svg.
- PIEGE : ne jamais passer un chemin `C:\...` a un outil du conteneur (exec,
  write_file, navigateur) : il est converti en NOM DE FICHIER litteral
  contenant des backslashes, laisse a la racine `/` et dans `/root`.
  Cote conteneur, toujours utiliser `/workspace/...`.

## HTML : toujours penser « page web », pas « image »
Un canvas 2400x2400 avec `width:2400px` en CSS est un piege : dans un panneau
de previsualisation de 1400x900 on ne voit QUE le coin superieur gauche, et la
typographie (dessinee en bas) est hors ecran. Mesure : bloc de texte a y=2016
pour un viewport de 900.

Deux corrections, a faire systematiquement :
1. **Cadre responsive** : conteneur `aspect-ratio:1/1`, `width:min(100%, calc(100vh - 210px))`,
   canvas en `position:absolute;inset:0;width:100%;height:100%`.
   Ajouter `container-type:inline-size` sur le cadre : sans ca, `cqw` se
   rapporte a la FENETRE et non au cadre (police 2x trop grande).
2. **Typographie en vrai HTML**, superposee sur le canvas (`.typo` + `h1`/`p`),
   et non peinte dans le canvas : sinon le texte n'est ni selectionnable, ni
   indexable, ni lu par un lecteur d'ecran. Retirer le bloc de `fillText` du
   script et le recreer en balises. Utiliser `cqw` (container query units) pour
   une taille de police proportionnelle au cadre.
3. Le filet fin de la gravure : le recreer aussi en HTML (div de 1px), sinon il
   disparait avec le bloc peinture.

## PIEGE : top vs bottom pour un element « juste au-dessus du texte »
Le canvas source plaçait le filet a `H*0.8565`, le titre a `H*0.8850`.
`0.8565` = 85.65 % depuis le HAUT = 14.35 % depuis le BAS. Ecrire
`top:14.35%` place le filet a 14 % depuis le haut : il traverse l'image.
Toujours convertir : `top% = valeur_canvas * 100`.

## Positionner une LIGNE DE BASE en HTML
Le canvas positionne le texte par sa ligne de base ; le HTML positionne des
boites. Deux problemes distincts :

**a) La descendante.** `translateY(-100%)` aligne le BORD BAS de la boite, pas
la baseline. Il faut decaler de la descendante. Selon la fonte et la taille,
elle vaut ~0.44 % de la hauteur du cadre — mais ce n'est PAS constant.

**b) La solution robuste : CALIBRER A L'EXECUTION.** Ne pas calculer l'ecart,
le MESURER dans le navigateur, au chargement et a chaque resize :
```js
function baselineOf(el){                    // mesure la baseline reelle
  var m = document.createElement('span');
  m.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';
  el.appendChild(m);
  var y = m.getBoundingClientRect().bottom;
  m.remove();
  return y;
}
function calibrate(){
  var pr = plate.getBoundingClientRect();
  var descender = frac(span.getBoundingClientRect().bottom) - frac(baselineOf(span));
  holder.style.top = (CIBLE + descender).toFixed(4) + '%';
}
```
Brancher : `resize`, `ResizeObserver` sur le cadre, et `document.fonts.ready`.
Sans ca, les lignes derivent de ~0.2 % quand la planche retreecit.

**c) La police doit suivre le cadre en cqw PUR** (pas de `clamp()`) : un
clamp fige la taille et casse la proportion. Et `container-type:inline-size`
sur le cadre, sinon `cqw` se rapporte a la fenetre.

Valeurs de reference (canvas 2400x2400), en % depuis le HAUT :
  filet      H*0.8565  -> 85.65 %
  titre      H*0.8850  -> 88.50 %
  sous-titre H*0.9175  -> 91.75 %
  legende    H*0.9415  -> 94.15 %
  numero     H*0.8850  -> 88.50 % (aligne a droite)

Attention : `.ligne` en `position:absolute` avec `bottom:` ne fonctionne pas
si le parent a `height:0` -> passer par `top:` + `translateY(-100%)`.

## Verifier la mise en page, ne pas la supposer
Script de controle : mesurer dans le navigateur la position relative de chaque
element dans le cadre (`(rect.top - plate.top) / plate.height * 100`) et la
comparer aux valeurs attendues du canvas. Tester au moins 4 largeurs de
viewport (1600 / 1400 / 900 / 480).

Mesurer ausi la MARGE filet -> haut du texte (accent) a CHAQUE largeur, et
exiger qu'elle reste strictement positive : la hauteur de l'accent croit avec
le cadre, donc une marge correcte a une taille peut devenir nulle a une
autre. Faire la meme mesure au pixel sur le PNG livre (le DOM dit ou un
element est place, seul le PNG dit ce que l'utilisateur recoit).

### Verifier au PIXEL, sur le PNG reellement livre
Le DOM dit ou un element est place ; seul le PNG dit ce que l'utilisateur
recoit. Decoder le PNG (zlib + defiltreage des scanlines) et mesurer les
lignes reelles : position du filet, premiere ligne de texte, baseline.
`scripts/png-probe.py` fait cela sans dependance et affiche aussi la zone
en ASCII — ce qui donne un controle visuel dans le terminal quand
l'image ne passe pas par la vision. Le copier dans le workspace
(`skill_view` puis `write_file`) avant de l'executer.

Regle d'arbitrage : **avant de "corriger" un ecart, etablir quelle piece est
faisable.** Un print peut etre correct alors que le web derive, ou l'inverse.
Mesurer les deux au pixel et corriger celui qui s'ecarte de la source (le
canvas d'origine fait foi) — sinon on "corrige" le bon pour le mauvais motif.

### Tester le telechargement pour de vrai
Un bouton qui repond ne prouve pas que le fichier livre porte le bon nom et
le bon contenu. Via CDP `Page.setDownloadBehavior` (`downloadPath`), cliquer,
puis relire le dossier de telechargement :
- le nom du fichier contient-il la graine attendue ?
- le PNG a-t-il les dimensions annoncees ?
- le contenu est-il bien celui attendu ?
`scripts/verify-download.js` fait ce controle.

ATTENTION : comparer deux PNG issus de graines DIFFERENTES ne prouve rien —
le motif change, ~8 % des pixels different. Comparer avec la meme graine, ou
se limiter aux zones stables (typographie, filet).

### Verifier sans la vision : le dire
Quand l'image ne peut pas passer par `vision_analyze` (payload tronque,
URL locale refusee), basculer sur la verification programmatique au pixel et
**annoncer la methode** dans la reponse. Ne jamais presenter une mesure
programmatique comme un controle visuel, ni l'inverse.

## Ce que la session laisse sur le disque
`/workspace` et `/root` sont des montages 9p de `C:\\` : tout ce qu'on y ecrit
est PERSISTANT sur le disque Windows et survit a la fin de la session. Compter
l'empreinte : `node_modules` (~31 Mo) + les PNG haute definition (~4 Mo
l'un) + les pages web.

**Auditer ce qui a ete installe, sans deviner.** Les logs npm gardent
l'historique exact — commande, cwd, horodatage :
    ls -t /root/.npm/_logs/ | head
    grep -E "verbose title|verbose cwd" /root/.npm/_logs/<log>.log
Une ligne `verbose title npm i <paquet>` = une installation reelle. Comparer
ensuite la date de creation de chaque element (`stat -c '%y %n'`) a celle du
debut de session : ce qui precede est pre-existant, ce qui suit vient de nous.

**PIEGE npm :** `npm i puppeteer-core` peut RETIRER le paquet `puppeteer`
complet deja present dans l'arbre (npm reify le deplace hors du `node_modules`).
Le paquet complet embarque son propre Chrome : on ne le veut pas, mais il faut
SIGNALER la suppression plutot que la subir en silence. Verifier apres
install : `npm ls --depth=0` et le contenu de `package-lock.json`.

**Nettoyage :** scanner `/` et `/root` pour les fichiers dont le NOM contient
un backslash litteral (dechets du bug de conversion de chemin) et les
supprimer. Voir `references/delivery-and-footprint.md`.

## Numeros de tirage : ou ils doivent vivre
Un numero « tirage n° 12345 » imprime DANS la planche est perdu des que
l'utilisateur enregistre l'image (le PNG du canvas ne contient pas le texte
HTML). Le mettre :
- dans le NOM DU FICHIER telecharge : `resonance-planche-IV-tirage-12345.png`
- et dans la legende / la barre de controle, hors de la planche.
Si le bouton « Enregistrer » doit livrer une estampe complete, il faut
REDESSINER la typographie sur un canvas d'export (memes fontes, memes
positions de baseline que le canvas d'origine), pas seulement copier le canvas
de la page (qui n'a pas de texte).
Chrome expose `ctx.letterSpacing = '0.42em'` en Canvas2D : indispensable pour
reproduire l'interlettrage du titre a l'export. Idem
`ctx.textBaseline='alphabetic'`, et `textAlign='right'` pour le numero en coin
(reinitialiser a 'left' apres, sinon le filet ou le sous-titre se deplace).

## Rendre le HTML vivant
Astucieusement : sortir le corps du rendu dans une fonction `render(seed)` et
exposer `window.__render`. Un bouton re-tire la planche avec une nouvelle
graine. Pieges d'ecriture :
- `SEED` et `rnd` doivent etre `let` et pilotes par `render()`.
- `cv`/`ctx`/`W`/`H`/`N` doivent rester AU NIVEAU EXTERNE de `render()` : si
  ils sont declares dans le corps, ils sont redeclares a chaque appel
  (« Identifier 'ctx' has already been declared »).
- `modes` doit rester DANS `render()` pour que la graine change la figure.
- Penser a `ctx.clearRect()` + reinitialiser `globalAlpha`/`globalCompositeOperation`
  entre deux tirages, sinon le nouveau rendu se superpose a l'ancien.

## Methode artistique qui a bien marche : plaque cymantique
- Champ de modes propres d'une membrane circulaire : `f = Σ w·cos(n·θ+φ)·cos(k·r)`.
- Deux couches (une seule pivotee/mise a l'echelle) → interference riche.
- Rendu : grille de valeurs → halo gaussien + contours par marching squares
  (table de cas + interpolation sur les aretes) → poussiere de sable accumulee
  sur les lignes nodales.
- Pieges corriges en iteration : halo et contours doivent etre derives du MEME
  champ (sinon des filaments orphelins apparaissent) ; les segments doivent etre
  bornes au disque ; l'opacite des contours doit decroitre vers le bord ;
  le trait net ne doit pas etre blanc pur (aspect « cheveux »).
