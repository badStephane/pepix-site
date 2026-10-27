/* ==========================================================
   Pépix · données partagées entre le site et l'espace admin
   Démo : tout est gardé dans le navigateur (localStorage).
   - produits : valeurs par défaut + modifications faites dans l'admin
   - réglages : textes du site, frais de livraison, WhatsApp, annonce
   - commandes : enregistrées au moment où le client valide
   ========================================================== */

/* Formats vendus : 50 g, 500 g et 1 kg.
   prix : un prix par format, en FCFA. PRIX PROVISOIRES de démonstration, à remplacer par les prix
   négociés avec les fournisseurs (modifiables dans l'espace admin, rubrique Produits).
   Base 500 g ; 50 g = un dixième du 500 g + 30 % (petit format plus cher au gramme) ; 1 kg = deux 500 g − 5 %.

   variete : une variété, ou plusieurs séparées par une virgule (« Agora, cerise ») : le client choisit alors
   la sienne dans la fiche produit et le calculateur. Les variétés d'un même produit partagent doses et calendrier
   (tomate cerise : valeurs de la tomate, à faire relire).

   doseHa : grammes de semences pour un hectare, semis en pépinière puis repiquage
   (fourchettes courantes des fiches maraîchères d'Afrique de l'Ouest, prises dans le haut pour ne pas manquer) :
     Oignon 4 000 g, tomate 250 g, chou 400 g, piment 500 g.
   Contrôle avec l'espacement et le nombre de graines par gramme (catalogues publics) :
     Oignon  10 × 20 cm = 500 000 plants/ha, 250 graines/g : 4 kg = 1 000 000 graines, marge × 2
     Tomate  50 × 70 cm =  28 500 plants/ha, 300 graines/g : 250 g =  75 000 graines, marge × 2,6
     Chou    50 × 60 cm =  33 300 plants/ha, 200 graines/g : 400 g =  80 000 graines, marge × 2,4
     Piment  40 × 60 cm =  41 600 plants/ha, 130 graines/g : 500 g =  65 000 graines, marge × 1,6
   La marge couvre les pertes à la levée, en pépinière et au repiquage. Valeurs à faire relire
   par le porteur du projet ; elles alimentent le calculateur (js/main.js, besoinSemences).

   pepiniereSemaines : [min, max] entre le semis et le repiquage, pour le plan de culture daté (js/plan.js).
     Repris des fiches (oignon 6 à 8, tomate 3 à 4, piment 4 à 6 semaines). Chou : la fiche dit « 4 à 5 feuilles »,
     soit environ 4 à 6 semaines (hypothèse). Valeurs à faire relire par le porteur du projet.

   etapes : 5 étapes dans l'ordre Semis, Pépinière, Repiquage, Entretien, Récolte.
     court : la valeur affichée dans la fiche produit ; long : le texte des fiches de culture. */
// petitSachet : visuel du sachet 50 g (img/sachet-<produit>-50g*.webp) au lieu du sachet 500 g
const FORMATS = [
  { id: '50g', grammes: 50, nom: '50 g', petitSachet: true },
  { id: '500g', grammes: 500, nom: '500 g' },
  { id: '1000g', grammes: 1000, nom: '1 kg' },
];

// « Agora, cerise » → ['Agora', 'cerise']
const varietesDe = p => String(p.variete || '').split(',').map(v => v.trim()).filter(Boolean);

const PRODUITS_BASE = [
  {
    id: 'oignon', nom: 'Oignon', variete: 'Violet de Galmi', prix: { '50g': 2600, '500g': 20000, '1000g': 38000 },
    semis: 'Oct. – Déc. (pépinière)', cycle: '120–150 jours', espacement: '10 × 20 cm',
    conseils: ['Semer en pépinière, repiquer à 6–8 semaines', "Arrêter l'arrosage 2 semaines avant récolte", "Sécher les bulbes à l'ombre avant stockage"],
    doseHa: 4000,
    pepiniereSemaines: [6, 8],
    etapes: [
      { court: 'oct. à déc.', long: 'Oct. à déc., en pépinière.' },
      { court: '6 à 8 semaines', long: 'Planche ombragée, terreau fin, arrosage léger matin et soir. Repiquer 6 à 8 semaines après le semis.' },
      { court: '10 × 20 cm', long: 'En fin de journée, à 10 × 20 cm.' },
      { court: "arrêter l'eau 2 semaines avant la récolte", long: "Arroser au pied, tôt le matin ou en fin d'après-midi. Arrêter l'arrosage 2 semaines avant la récolte." },
      { court: 'févr. à mai, 120 à 150 jours', long: "Févr. à mai, après 120 à 150 jours. Sécher les bulbes à l'ombre avant de les stocker." },
    ],
  },
  {
    id: 'tomate', nom: 'Tomate', variete: 'Agora, cerise', prix: { '50g': 5200, '500g': 40000, '1000g': 76000 },
    semis: 'Oct. – Févr.', cycle: '70–90 jours', espacement: '50 × 70 cm',
    conseils: ['Semis en pépinière 3–4 semaines avant repiquage', 'Tuteurer dès 20 cm de hauteur', 'Supprimer les gourmands régulièrement'],
    doseHa: 250,
    pepiniereSemaines: [3, 4],
    etapes: [
      { court: 'oct. à févr.', long: 'Oct. à févr., en pépinière.' },
      { court: '3 à 4 semaines', long: 'Planche ombragée, terreau fin, arrosage léger matin et soir. Repiquer 3 à 4 semaines après le semis.' },
      { court: '50 × 70 cm', long: 'En fin de journée, à 50 × 70 cm.' },
      { court: 'tuteurer dès 20 cm', long: 'Tuteurer dès 20 cm de hauteur. Supprimer les gourmands régulièrement.' },
      { court: 'janv. à mai, 70 à 90 jours', long: 'Janv. à mai, après 70 à 90 jours.' },
    ],
  },
  {
    id: 'chou', nom: 'Chou', variete: 'Pommé', prix: { '50g': 3600, '500g': 27500, '1000g': 52500 },
    semis: 'Oct. – Janv.', cycle: '80–100 jours', espacement: '50 × 60 cm',
    conseils: ['Repiquer à 4–5 feuilles', 'Arrosage régulier, sans excès', 'Surveiller les chenilles en début de cycle'],
    doseHa: 400,
    pepiniereSemaines: [4, 6],
    etapes: [
      { court: 'oct. à janv.', long: 'Oct. à janv., en pépinière.' },
      { court: "jusqu'à 4 à 5 feuilles", long: 'Planche ombragée, terreau fin, arrosage léger matin et soir. Repiquer quand le plant a 4 à 5 feuilles.' },
      { court: '50 × 60 cm', long: 'En fin de journée, à 50 × 60 cm.' },
      { court: 'surveiller les chenilles', long: 'Arrosage régulier, sans excès. Surveiller les chenilles en début de cycle.' },
      { court: 'janv. à avr., 80 à 100 jours', long: 'Janv. à avr., après 80 à 100 jours.' },
    ],
  },
  {
    id: 'piment', nom: 'Piment', variete: 'Cayenne', prix: { '50g': 4600, '500g': 35000, '1000g': 66500 },
    semis: 'Oct. – Mars', cycle: '90–120 jours', espacement: '40 × 60 cm',
    conseils: ['Semis en pépinière 4–6 semaines avant repiquage', 'Repiquer à 4–6 feuilles vraies', "Éviter l'excès d'eau au pied"],
    doseHa: 500,
    pepiniereSemaines: [4, 6],
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
  herosTexte: 'Oignon, tomate, chou et piment en 50 g, 500 g et 1 kg. Indiquez votre surface : on calcule la quantité, on vous livre.',
  friseTitre: 'De la graine à la récolte, on vous guide.',
  friseTexte: 'Chaque semence a sa fiche de culture, en ligne. Voici les grandes étapes.',
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
  // que variété, prix (un par format), disponibilité et affichage.
  produits() {
    const modifs = this.lire('pepix-produits', {});
    return PRODUITS_BASE.map(p => {
      // Un prix enregistré avant les formats (un seul nombre) est ignoré
      const { prix: prixModifies, ...autres } = modifs[p.id] || {};
      const prix = prixModifies && typeof prixModifies === 'object' ? { ...p.prix, ...prixModifies } : p.prix;
      return { ...p, enStock: true, visible: true, ...autres, prix };
    });
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
