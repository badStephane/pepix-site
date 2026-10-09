# Pépix · Semences maraîchères

Projet d'école réalisé par Yannick Felix Viera MOREIRA (ISM).

Site vitrine et boutique de démonstration pour Pépix, une marque de semences maraîchères (oignon, tomate, chou, piment) au Sénégal. Projet d'école.

## Contenu

| Page | Fichier |
|---|---|
| Accueil | `index.html` |
| Qui sommes-nous | `qui-sommes-nous.html` |
| Conseils de culture (calendrier, fiches, FAQ) | `conseils.html` |
| Boutique | `boutique.html` |

- `css/style.css` : toute la mise en forme (couleurs dans les variables en haut du fichier, responsive mobile inclus).
- `js/main.js` : les données des produits, l'affichage des cartes, du calendrier et des fiches, la fenêtre produit et le panier.
- `img/` : logo et photos des sachets.
- `video/` : vidéo de fond de l'accueil, en WebM et MP4 (environ 650 Ko chacune, boucle sans coupure de 9 s).

## Fonctionnalités

- Accueil avec une vidéo de pépinière en fond et le texte dans un bandeau vert inspiré du sachet. Bouton pause, pause automatique quand l'accueil sort de l'écran, et image fixe à la place si le visiteur réduit les animations ou économise ses données.
- Navigation entre les 4 pages, en-tête fixe, page 404 personnalisée.
- Fiche produit en fenêtre (clic sur une carte), choix de la quantité, lien vers la fiche de culture.
- Panier en tiroir : ajout, retrait, sous-total, livraison, total. Le bouton « Ajouter » confirme l'ajout et une notification propose d'ouvrir le panier.
- Commande en deux étapes : formulaire (nom, téléphone sénégalais, quartier, mode de paiement) vérifié champ par champ, puis récapitulatif. La commande est simulée, rien n'est envoyé.
- Calendrier de semis qui met en avant le mois en cours et dit quoi semer ou récolter.
- Le panier est gardé dans le navigateur (`localStorage`), il reste après un changement de page.
- Accessibilité : contrastes conformes WCAG AA, navigation au clavier (Tab, Entrée, Échap), focus gardé dans les fenêtres ouvertes, lien « Aller au contenu », textes pour lecteurs d'écran, animations coupées si le visiteur réduit les mouvements. Testé avec axe-core : aucune violation.
- Responsive : testé de 390 px (mobile) à 1440 px.

## Lancer en local

Aucune installation nécessaire : ouvrir `index.html` dans un navigateur, ou lancer un petit serveur :

```bash
python3 -m http.server 8000
```

puis aller sur http://localhost:8000.

## Mise en ligne

Hébergé sur Netlify (site statique, pas d'étape de build, voir `netlify.toml`).

## Crédits

Vidéo de l'accueil : « Seedlings growing from the starting tray », Frank Meriño, [Pexels](https://www.pexels.com/video/seedlings-growing-from-the-starting-tray-8459699/) (licence Pexels, utilisation gratuite).

Photo de la page Qui sommes-nous : « A small plant sprouting from the soil », Nikolett Emmert, [Pexels](https://www.pexels.com/photo/a-small-plant-sprouting-from-the-soil-17497507/).
