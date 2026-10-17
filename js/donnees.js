/* ==========================================================
   Pépix · données partagées entre le site et l'espace admin
   Démo : tout est gardé dans le navigateur (localStorage).
   - produits : valeurs par défaut + modifications faites dans l'admin
   - réglages : textes du site, frais de livraison, WhatsApp, annonce
   - commandes : enregistrées au moment où le client valide
   ========================================================== */

/* « Pour quelle surface ? » (fiche produit et fiches de culture)
   grainesParGramme : bas de la fourchette des catalogues publics, pour ne pas promettre trop.
     Oignon 250 : 100 graines = 0,356 g, soit environ 280/g (Wikifarmer, graines d'oignon) ;
                  « environ 250 dans un gramme » (référence horticole française).
     Tomate 300 : 75 graines pour 0,2 g (375/g, San Marzano) et 500 pour 1 g (tomate cerise),
                  catalogue Truffaut ; la Marmande a de grosses graines, d'où 300.
     Chou   200 : 600 graines pour 3 g, chou cabus « Cœur de bœuf » (même variété), catalogue Truffaut.
     Piment 130 : 20 graines pour 0,15 g, Capsicum annuum (ProSpecieRara, graines en grandes portions).
   Calcul (fonction surfaceSachet de js/main.js) :
     [a, b]  = espacement lu dans « 50 × 70 cm » (en cm ; illisible : le bloc n'est pas affiché)
     graines = GRAMMES_SACHET (5) × grainesParGramme
     plants  = arrondiBas(graines)                  plafond : 1 graine = 1 plant au mieux
     surface = arrondiBas(plants × a × b / 10 000)  en m², depuis les plants affichés
     arrondiBas(n) = n < 100 : à l'unité ; n < 1 000 : à la dizaine ; sinon à la centaine, vers le bas
   Pas de taux de germination publié par Pépix : on affiche « Jusqu'à » et la mention « Indicatif ».
   Valeurs à faire relire par le porteur du projet (ISM). Spec : docs/squad/02-design-evolution.md §6.

   etapes : 5 étapes dans l'ordre Semis, Pépinière, Repiquage, Entretien, Récolte.
     court : la valeur affichée dans la fiche produit ; long : le texte des fiches de culture. */
const GRAMMES_SACHET = 5;

const PRODUITS_BASE = [
  {
    id: 'oignon', nom: 'Oignon', variete: 'Jaune Paille', prix: 1500,
    semis: 'Oct. – Déc. (pépinière)', cycle: '120–150 jours', espacement: '10 × 20 cm',
    conseils: ['Semer en pépinière, repiquer à 6–8 semaines', "Arrêter l'arrosage 2 semaines avant récolte", "Sécher les bulbes à l'ombre avant stockage"],
    grainesParGramme: 250,
    etapes: [
      { court: 'oct. à déc.', long: 'Oct. à déc., en pépinière.' },
      { court: '6 à 8 semaines', long: 'Planche ombragée, terreau fin, arrosage léger matin et soir. Repiquer 6 à 8 semaines après le semis.' },
      { court: '10 × 20 cm', long: 'En fin de journée, à 10 × 20 cm.' },
      { court: "arrêter l'eau 2 semaines avant la récolte", long: "Arroser au pied, tôt le matin ou en fin d'après-midi. Arrêter l'arrosage 2 semaines avant la récolte." },
      { court: 'févr. à mai, 120 à 150 jours', long: "Févr. à mai, après 120 à 150 jours. Sécher les bulbes à l'ombre avant de les stocker." },
    ],
  },
  {
    id: 'tomate', nom: 'Tomate', variete: 'Marmande', prix: 1800,
    semis: 'Oct. – Févr.', cycle: '70–90 jours', espacement: '50 × 70 cm',
    conseils: ['Semis en pépinière 3–4 semaines avant repiquage', 'Tuteurer dès 20 cm de hauteur', 'Supprimer les gourmands régulièrement'],
    grainesParGramme: 300,
    etapes: [
      { court: 'oct. à févr.', long: 'Oct. à févr., en pépinière.' },
      { court: '3 à 4 semaines', long: 'Planche ombragée, terreau fin, arrosage léger matin et soir. Repiquer 3 à 4 semaines après le semis.' },
      { court: '50 × 70 cm', long: 'En fin de journée, à 50 × 70 cm.' },
      { court: 'tuteurer dès 20 cm', long: 'Tuteurer dès 20 cm de hauteur. Supprimer les gourmands régulièrement.' },
      { court: 'janv. à mai, 70 à 90 jours', long: 'Janv. à mai, après 70 à 90 jours.' },
    ],
  },
  {
    id: 'chou', nom: 'Chou', variete: 'Cœur de bœuf', prix: 1200,
    semis: 'Oct. – Janv.', cycle: '80–100 jours', espacement: '50 × 60 cm',
    conseils: ['Repiquer à 4–5 feuilles', 'Arrosage régulier, sans excès', 'Surveiller les chenilles en début de cycle'],
    grainesParGramme: 200,
    etapes: [
      { court: 'oct. à janv.', long: 'Oct. à janv., en pépinière.' },
      { court: "jusqu'à 4 à 5 feuilles", long: 'Planche ombragée, terreau fin, arrosage léger matin et soir. Repiquer quand le plant a 4 à 5 feuilles.' },
      { court: '50 × 60 cm', long: 'En fin de journée, à 50 × 60 cm.' },
      { court: 'surveiller les chenilles', long: 'Arrosage régulier, sans excès. Surveiller les chenilles en début de cycle.' },
      { court: 'janv. à avr., 80 à 100 jours', long: 'Janv. à avr., après 80 à 100 jours.' },
    ],
  },
  {
    id: 'piment', nom: 'Piment', variete: 'Super Cayenne', prix: 1500,
    semis: 'Oct. – Mars', cycle: '90–120 jours', espacement: '40 × 60 cm',
    conseils: ['Semis en pépinière 4–6 semaines avant repiquage', 'Repiquer à 4–6 feuilles vraies', "Éviter l'excès d'eau au pied"],
    grainesParGramme: 130,
    etapes: [
      { court: 'oct. à mars', long: 'Oct. à mars, en pépinière.' },
      { court: '4 à 6 semaines', long: 'Planche ombragée, terreau fin, arrosage léger matin et soir. Repiquer 4 à 6 semaines après le semis.' },
      { court: '40 × 60 cm', long: 'En fin de journée, à 4 à 6 feuilles vraies, à 40 × 60 cm.' },
      { court: "pas d'excès d'eau au pied", long: "Arroser au pied, sans excès d'eau. Pailler pour limiter l'évaporation." },
      { court: 'janv. à juin, 90 à 120 jours', long: 'Janv. à juin, après 90 à 120 jours.' },
    ],
  },
];

const REGLAGES_BASE = {
  annonce: '',
  herosTitre: 'Tout commence par une graine.',
  herosTexte: 'Oignon, tomate, chou et piment en sachets de 5 g. Livrés à Dakar en 24 à 48 h, avec la fiche de culture.',
  bandeauTitre: "Chaque lot est mis à germer avant d'être ensaché.",
  bandeauTexte: 'Au dos du sachet, un QR code ouvre la fiche de culture de la variété.',
  fraisLivraison: 1000,
  whatsapp: '221771786915',
};

const STATUTS = {
  nouvelle: 'Nouvelle',
  confirmee: 'Confirmée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const Pepix = {
  lire(cle, defaut) {
    try { const v = JSON.parse(localStorage.getItem(cle)); return v == null ? defaut : v; } catch (e) { return defaut; }
  },
  ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
  },

  // Produits : chaque produit garde ses valeurs par défaut, l'admin ne modifie
  // que variété, prix, disponibilité et affichage.
  produits() {
    const modifs = this.lire('pepix-produits', {});
    return PRODUITS_BASE.map(p => ({ ...p, enStock: true, visible: true, ...(modifs[p.id] || {}) }));
  },
  sauverProduit(id, champs) {
    const modifs = this.lire('pepix-produits', {});
    modifs[id] = { ...(modifs[id] || {}), ...champs };
    return this.ecrire('pepix-produits', modifs);
  },
  reinitialiserProduits() { localStorage.removeItem('pepix-produits'); },

  reglages() { return { ...REGLAGES_BASE, ...this.lire('pepix-reglages', {}) }; },
  sauverReglages(r) { return this.ecrire('pepix-reglages', r); },
  reinitialiserReglages() { localStorage.removeItem('pepix-reglages'); },

  commandes() { return this.lire('pepix-commandes', []); },
  sauverCommandes(liste) { return this.ecrire('pepix-commandes', liste); },
  ajouterCommande(c) {
    const liste = this.commandes();
    const dernier = liste.reduce((m, x) => Math.max(m, parseInt(String(x.numero).replace(/\D/g, ''), 10) || 0), 1000);
    const commande = { ...c, numero: 'PX-' + (dernier + 1), date: new Date().toISOString(), statut: 'nouvelle' };
    liste.unshift(commande);
    this.sauverCommandes(liste);
    return commande;
  },

  // Lien WhatsApp : numéro réglé dans l'admin, sinon lien sans destinataire
  lienWhatsApp(texte) {
    const num = String(this.reglages().whatsapp || '').replace(/\D/g, '');
    return `https://wa.me/${num}?text=${encodeURIComponent(texte)}`;
  },
};
