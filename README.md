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

- `css/style.css` : toute la mise en forme, alignée sur la charte graphique Pépix v1.0 (palette en variables en haut du fichier, Montserrat Bold pour les titres, Nunito Sans pour le texte, motif de points, responsive mobile inclus).
- `js/donnees.js` : produits (variété, prix par format, dose de semis à l'hectare, étapes de culture), réglages et commandes. Les prix sont provisoires, à remplacer depuis l'admin.
- `js/main.js` : l'affichage des cartes, du calendrier et des fiches, le calculateur, la fenêtre produit et le panier.
- `js/plan.js` : le plan de culture daté affiché sous le calculateur (dates, fichier agenda, message WhatsApp).
- `img/` : logo de la charte (couleur et négatif blanc), icônes et visuels des sachets.
- `fonts/` : Montserrat Bold et Nunito Sans, hébergées sur le site.
- `video/` : vidéo de fond de l'accueil, en WebM et MP4 (environ 650 Ko chacune, boucle sans coupure de 9 s).

## Fonctionnalités

- Accueil avec une vidéo de pépinière en fond, le texte dans un bandeau vert inspiré du sachet et les quatre sachets en éventail. Bouton pause, pause automatique quand l'accueil sort de l'écran, et image fixe à la place si le visiteur réduit les animations ou économise ses données.
- Accueil : les semis du mois mènent directement aux sachets (carrousel sur mobile), « Comment ça marche » porte les garanties, une frise de culture montre les 5 étapes du légume choisi, et des questions fréquentes ouvrent WhatsApp avec le message prérempli. Les blocs apparaissent en fondu au défilement, sauf si le visiteur réduit les animations.
- Navigation entre les 4 pages, en-tête fixe sur grand écran (logo à 120 px, taille minimale de la charte), barre du bas avec le panier sur mobile, page 404 personnalisée.
- Trois formats par semence : 50 g, 500 g et 1 kg.
- Calculateur (boutique et conseils) : la culture et la surface (m² ou hectares) donnent la quantité de semences, le nombre de plants et la combinaison de formats la moins chère, ajoutée au panier en un clic. Au-delà de 20 kg, il propose un tarif producteur sur WhatsApp.
- Plan de culture daté, sous le résultat du calculateur : à partir de la date de semis, les dates de repiquage et de début des récoltes, un fichier agenda avec un rappel à 8 h pour chaque étape, et le plan à envoyer sur WhatsApp. Hors saison, il propose la prochaine date de semis possible.
- Fiche produit en fenêtre (clic sur une carte), choix du format (avec la surface couverte) et de la quantité, liens vers le calculateur et la fiche de culture.
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

Hébergé sur Cloudflare Pages : https://pepix.pages.dev. Chaque push sur `main` déploie le site.
Pas d'étape de build, le dossier est publié tel quel. Les en-têtes HTTP sont dans `_headers`.

## Crédits

Vidéo de l'accueil : « Seedlings growing from the starting tray », Frank Meriño, [Pexels](https://www.pexels.com/video/seedlings-growing-from-the-starting-tray-8459699/) (licence Pexels, utilisation gratuite).

Photo de la page Qui sommes-nous : « A small plant sprouting from the soil », Nikolett Emmert, [Pexels](https://www.pexels.com/photo/a-small-plant-sprouting-from-the-soil-17497507/).

## Espace admin (démo)

Adresse : `/admin.html` (lien « Espace admin » en bas de chaque page). Code de démo : `pepix2026`.

- **Tableau de bord** : chiffre d'affaires, commandes, commandes à traiter, panier moyen, ventes des 14 derniers jours, semences vendues par produit (en kg).
- **Commandes** : recherche, filtre par statut, détail, changement de statut (nouvelle, confirmée, livrée, annulée), message WhatsApp au client, export CSV.
- **Produits** : variété, un prix par format (50 g, 500 g, 1 kg), en stock ou épuisé, affiché ou masqué.
- **Textes du site** : annonce en haut du site, titres et textes de l'accueil, frais de livraison, numéro WhatsApp.

Version de démonstration : commandes et réglages sont gardés dans le navigateur (localStorage), dans `js/donnees.js`. Une commande passée sur la boutique apparaît dans l'admin ouvert dans le même navigateur, même dans un autre onglet. Le code d'accès n'est pas une vraie sécurité : pour un usage réel, il faudrait une base de données et une authentification côté serveur.
