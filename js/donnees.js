/* ==========================================================
   Pépix · données partagées entre le site et l'espace admin
   Démo : tout est gardé dans le navigateur (localStorage).
   - produits : valeurs par défaut + modifications faites dans l'admin
   - réglages : textes du site, frais de livraison, WhatsApp, annonce
   - commandes : enregistrées au moment où le client valide
   ========================================================== */

const PRODUITS_BASE = [
  {
    id: 'oignon', nom: 'Oignon', variete: 'Jaune Paille', prix: 1500,
    semis: 'Oct. – Déc. (pépinière)', cycle: '120–150 jours', espacement: '10 × 20 cm',
    conseils: ['Semer en pépinière, repiquer à 6–8 semaines', "Arrêter l'arrosage 2 semaines avant récolte", "Sécher les bulbes à l'ombre avant stockage"],
  },
  {
    id: 'tomate', nom: 'Tomate', variete: 'Marmande', prix: 1800,
    semis: 'Oct. – Févr.', cycle: '70–90 jours', espacement: '50 × 70 cm',
    conseils: ['Semis en pépinière 3–4 semaines avant repiquage', 'Tuteurer dès 20 cm de hauteur', 'Supprimer les gourmands régulièrement'],
  },
  {
    id: 'chou', nom: 'Chou', variete: 'Cœur de bœuf', prix: 1200,
    semis: 'Oct. – Janv.', cycle: '80–100 jours', espacement: '50 × 60 cm',
    conseils: ['Repiquer à 4–5 feuilles', 'Arrosage régulier, sans excès', 'Surveiller les chenilles en début de cycle'],
  },
  {
    id: 'piment', nom: 'Piment', variete: 'Super Cayenne', prix: 1500,
    semis: 'Oct. – Mars', cycle: '90–120 jours', espacement: '40 × 60 cm',
    conseils: ['Semis en pépinière 4–6 semaines avant repiquage', 'Repiquer à 4–6 feuilles vraies', "Éviter l'excès d'eau au pied"],
  },
];

const REGLAGES_BASE = {
  annonce: '',
  herosTitre: 'Tout commence par une graine.',
  herosTexte: 'Oignon, tomate, chou et piment en sachets de 5 g. Livrés à Dakar en 24 à 48 h, avec la fiche de culture.',
  bandeauTitre: "Chaque lot est mis à germer avant d'être ensaché.",
  bandeauTexte: 'Au dos du sachet, un QR code ouvre la fiche de culture de la variété.',
  fraisLivraison: 1000,
  whatsapp: '',
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
