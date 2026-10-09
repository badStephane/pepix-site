/* ==========================================================
   Pépix · script principal
   - données des produits
   - affichage des cartes, du calendrier et des fiches
   - fiche produit (fenêtre), panier (tiroir) et notifications
   Le panier est gardé dans le navigateur (localStorage).
   ========================================================== */

const PRODUITS = [
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

// Mois de semis (S) et de récolte (R) : 0 = janvier ... 11 = décembre
const CALENDRIER = {
  oignon: { s: [9, 10, 11], r: [1, 2, 3, 4] },
  tomate: { s: [9, 10, 11, 0, 1], r: [0, 1, 2, 3, 4] },
  chou:   { s: [9, 10, 11, 0], r: [0, 1, 2, 3] },
  piment: { s: [9, 10, 11, 0, 1, 2], r: [0, 1, 2, 3, 4, 5] },
};
const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const FRAIS_LIVRAISON = 1000;

// Format "1 500"
const prix = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const $ = sel => document.querySelector(sel);

/* ---------- Panier (sauvegardé dans le navigateur) ---------- */
let panier = {};
try { panier = JSON.parse(localStorage.getItem('pepix-panier')) || {}; } catch (e) { panier = {}; }
let commandeEnvoyee = false;

function sauverPanier() {
  try { localStorage.setItem('pepix-panier', JSON.stringify(panier)); } catch (e) { /* navigation privée */ }
  majCompteur();
}

function nombreArticles() {
  return Object.values(panier).reduce((a, b) => a + b, 0);
}

function majCompteur() {
  const n = nombreArticles();
  document.querySelectorAll('.btn-panier').forEach(b => {
    b.querySelector('.compteur').textContent = n;
    b.setAttribute('aria-label', 'Panier, ' + n + ' article' + (n > 1 ? 's' : ''));
  });
}

function ajouter(id, qte = 1) {
  panier[id] = (panier[id] || 0) + qte;
  commandeEnvoyee = false;
  sauverPanier();
  const p = PRODUITS.find(x => x.id === id);
  notifier(p.nom + ' ajouté au panier');
}

function changerQuantite(id, qte) {
  if (qte <= 0) delete panier[id]; else panier[id] = qte;
  sauverPanier();
  afficherPanier();
}

/* ---------- Notification en bas de l'écran ---------- */
let minuteur;
function notifier(texte) {
  const t = $('#toast');
  t.textContent = texte;
  t.classList.add('visible');
  clearTimeout(minuteur);
  minuteur = setTimeout(() => t.classList.remove('visible'), 1800);
}

/* ---------- Cartes produit (accueil et boutique) ---------- */
function carteProduit(p, avecLivraison) {
  return `
    <article class="carte" tabindex="0" role="button" data-id="${p.id}"
             aria-label="Semences de ${p.nom.toLowerCase()}, variété ${p.variete}">
      <div class="carte-image photo-${p.id}"></div>
      <div class="carte-corps">
        <span class="origine">Semences Pépix</span>
        <h3>${p.nom}</h3>
        <span class="variete">Variété ${p.variete} · 5 g</span>
        ${avecLivraison ? '<span class="livraison">Livraison 24–48 h à Dakar</span>' : ''}
        <div class="carte-pied">
          <strong>${prix(p.prix)} FCFA</strong>
          <button class="btn btn-jaune" data-ajouter="${p.id}" aria-label="Ajouter ${p.nom} au panier">Ajouter</button>
        </div>
      </div>
    </article>`;
}

function afficherProduits(conteneur, avecLivraison) {
  conteneur.innerHTML = PRODUITS.map(p => carteProduit(p, avecLivraison)).join('');
  conteneur.addEventListener('click', e => {
    const bouton = e.target.closest('[data-ajouter]');
    if (bouton) { ajouter(bouton.dataset.ajouter); return; }
    const carte = e.target.closest('.carte');
    if (carte) ouvrirFiche(carte.dataset.id);
  });
  conteneur.addEventListener('keydown', e => {
    const carte = e.target.closest('.carte');
    if (carte && e.target === carte && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      ouvrirFiche(carte.dataset.id);
    }
  });
}

/* ---------- Page Conseils : calendrier et fiches ---------- */
function afficherCalendrier(conteneur) {
  let html = '<div class="ligne-cal"><span></span>' + MOIS.map(m => `<span class="mois">${m}</span>`).join('') + '</div>';
  for (const p of PRODUITS) {
    const c = CALENDRIER[p.id];
    html += `<div class="ligne-cal"><strong>${p.nom}</strong>`;
    MOIS.forEach((m, i) => {
      const s = c.s.includes(i), r = c.r.includes(i);
      const classe = s && r ? 'sr' : s ? 's' : r ? 'r' : '';
      const texte = s && r ? 'S·R' : s ? 'S' : r ? 'R' : '';
      const titre = s && r ? 'semis et récolte' : s ? 'semis' : r ? 'récolte' : 'rien';
      html += `<span class="case ${classe}" title="${m} : ${titre}">${texte}</span>`;
    });
    html += '</div>';
  }
  conteneur.insertAdjacentHTML('beforeend', html);
}

function afficherFiches(conteneur) {
  conteneur.innerHTML = PRODUITS.map(p => `
    <article class="fiche">
      <div class="fiche-haut"><h2>${p.nom}</h2><span>${p.variete}</span></div>
      <div class="reperes">
        <div class="repere"><span>Semis</span><b>${p.semis}</b></div>
        <div class="repere"><span>Cycle</span><b>${p.cycle}</b></div>
        <div class="repere"><span>Espacement</span><b>${p.espacement}</b></div>
      </div>
      <ol>${p.conseils.map(c => `<li>${c}</li>`).join('')}</ol>
    </article>`).join('');
}

/* ---------- Fenêtre fiche produit ---------- */
let produitOuvert = null;
let quantite = 1;

function ouvrirFiche(id) {
  produitOuvert = PRODUITS.find(p => p.id === id);
  quantite = 1;
  const p = produitOuvert;
  $('#fiche-contenu').innerHTML = `
    <div class="modale-image photo-${p.id}"></div>
    <div class="modale-corps">
      <div class="modale-haut">
        <span class="origine">Semences Pépix</span>
        <button class="btn-rond" data-fermer aria-label="Fermer">✕</button>
      </div>
      <h2>${p.nom}</h2>
      <span class="variete">Variété ${p.variete} · sachet 5 g</span>
      <div class="reperes">
        <div class="repere"><span>Semis</span><b>${p.semis}</b></div>
        <div class="repere"><span>Cycle</span><b>${p.cycle}</b></div>
        <div class="repere"><span>Espacement</span><b>${p.espacement}</b></div>
      </div>
      <span class="livraison">Livraison 24–48 h à Dakar</span>
      <div class="modale-actions">
        <div class="quantite">
          <button data-moins aria-label="Diminuer la quantité">−</button>
          <strong id="fiche-qte">1</strong>
          <button data-plus aria-label="Augmenter la quantité">+</button>
        </div>
        <button class="btn btn-vert" data-valider>Ajouter · <span id="fiche-total">${prix(p.prix)}</span>&nbsp;FCFA</button>
      </div>
    </div>`;
  $('#fiche-contenu').setAttribute('aria-label', p.nom);
  ouvrir('#voile-fiche');
}

function majQuantite() {
  $('#fiche-qte').textContent = quantite;
  $('#fiche-total').textContent = prix(produitOuvert.prix * quantite);
}

/* ---------- Tiroir panier ---------- */
function afficherPanier() {
  const zone = $('#panier-zone');
  const lignes = PRODUITS.filter(p => panier[p.id]);

  if (commandeEnvoyee) {
    zone.innerHTML = `
      <div class="panier-message">
        <span class="ok">✓</span>
        <strong>Commande envoyée</strong>
        <span>Vous recevrez une confirmation par SMS et WhatsApp.</span>
      </div>`;
    return;
  }
  if (lignes.length === 0) {
    zone.innerHTML = `
      <div class="panier-message">
        <span>Votre panier est vide.</span>
        <a class="btn btn-vert" href="boutique.html" style="padding:12px 18px">Voir la boutique</a>
      </div>`;
    return;
  }
  const sousTotal = lignes.reduce((a, p) => a + p.prix * panier[p.id], 0);
  zone.innerHTML = `
    <div class="panier-lignes">
      ${lignes.map(p => `
        <div class="ligne">
          <div><strong>${p.nom}</strong><span>${p.variete}</span></div>
          <div class="ligne-qte">
            <button data-retirer="${p.id}" aria-label="Retirer un ${p.nom}">−</button>
            <strong>${panier[p.id]}</strong>
            <button data-remettre="${p.id}" aria-label="Ajouter un ${p.nom}">+</button>
          </div>
          <strong>${prix(p.prix * panier[p.id])} F</strong>
        </div>`).join('')}
    </div>
    <div class="panier-total">
      <div><span>Sous-total</span><span>${prix(sousTotal)} FCFA</span></div>
      <div><span>Livraison</span><span>${prix(FRAIS_LIVRAISON)} FCFA</span></div>
      <div class="total"><span>Total</span><span>${prix(sousTotal + FRAIS_LIVRAISON)} FCFA</span></div>
      <button class="btn" data-commander>Commander</button>
      <small>Wave · Orange Money · Paiement à la livraison</small>
    </div>`;
}

/* ---------- Ouvrir / fermer les fenêtres ---------- */
let dernierFocus = null;
function ouvrir(sel) {
  dernierFocus = document.activeElement;
  $(sel).classList.add('ouvert');
  document.body.classList.add('bloque');
  const premier = $(sel).querySelector('button');
  if (premier) premier.focus();
}
function fermer() {
  document.querySelectorAll('.voile.ouvert').forEach(v => v.classList.remove('ouvert'));
  document.body.classList.remove('bloque');
  if (dernierFocus) dernierFocus.focus();
}

/* ---------- Démarrage ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Fenêtres communes à toutes les pages
  document.body.insertAdjacentHTML('beforeend', `
    <div class="voile voile-centre" id="voile-fiche">
      <div class="modale" id="fiche-contenu" role="dialog" aria-modal="true"></div>
    </div>
    <div class="voile voile-droite" id="voile-panier">
      <aside class="panier" role="dialog" aria-modal="true" aria-label="Panier">
        <div class="panier-haut">
          <h2>Panier</h2>
          <button class="btn-rond" data-fermer aria-label="Fermer le panier">✕</button>
        </div>
        <div id="panier-zone" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>
      </aside>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  // Contenus générés selon la page
  const accueil = $('#produits-accueil');
  if (accueil) afficherProduits(accueil, false);
  const boutique = $('#produits-boutique');
  if (boutique) afficherProduits(boutique, true);
  const cal = $('#calendrier');
  if (cal) afficherCalendrier(cal);
  const fiches = $('#fiches');
  if (fiches) afficherFiches(fiches);

  // Bouton panier de l'en-tête
  document.querySelectorAll('.btn-panier').forEach(b => b.addEventListener('click', () => {
    commandeEnvoyee = false;
    afficherPanier();
    ouvrir('#voile-panier');
  }));

  // Fiche produit
  $('#voile-fiche').addEventListener('click', e => {
    if (e.target.id === 'voile-fiche' || e.target.closest('[data-fermer]')) fermer();
    else if (e.target.closest('[data-moins]')) { quantite = Math.max(1, quantite - 1); majQuantite(); }
    else if (e.target.closest('[data-plus]')) { quantite++; majQuantite(); }
    else if (e.target.closest('[data-valider]')) { ajouter(produitOuvert.id, quantite); fermer(); }
  });

  // Panier
  $('#voile-panier').addEventListener('click', e => {
    if (e.target.id === 'voile-panier' || e.target.closest('[data-fermer]')) fermer();
    else if (e.target.closest('[data-retirer]')) { const id = e.target.closest('[data-retirer]').dataset.retirer; changerQuantite(id, panier[id] - 1); }
    else if (e.target.closest('[data-remettre]')) { const id = e.target.closest('[data-remettre]').dataset.remettre; changerQuantite(id, panier[id] + 1); }
    else if (e.target.closest('[data-commander]')) { panier = {}; commandeEnvoyee = true; sauverPanier(); afficherPanier(); }
  });

  // Touche Échap pour fermer
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });

  majCompteur();
});
