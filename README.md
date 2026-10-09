# Pépix · Semences maraîchères

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

## Fonctionnalités

- Navigation entre les 4 pages, en-tête fixe.
- Fiche produit en fenêtre (clic sur une carte), choix de la quantité.
- Panier en tiroir : ajout, retrait, sous-total, livraison, total, commande (simulée).
- Le panier est gardé dans le navigateur (`localStorage`), il reste après un changement de page.
- Accessible au clavier (Tab, Entrée, Échap).

## Lancer en local

Aucune installation nécessaire : ouvrir `index.html` dans un navigateur, ou lancer un petit serveur :

```bash
python3 -m http.server 8000
```

puis aller sur http://localhost:8000.

## Mise en ligne

Hébergé sur Netlify (site statique, pas d'étape de build, voir `netlify.toml`).
