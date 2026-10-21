/* ==========================================================
   Pépix · script principal
   - données des produits
   - affichage des cartes, du calendrier et des fiches
   - fiche produit (fenêtre), panier (tiroir), commande et notifications
   Le panier est gardé dans le navigateur (localStorage).
   ========================================================== */

// Produits et réglages : valeurs par défaut + modifications de l'admin (js/donnees.js)
const TOUS_PRODUITS = Pepix.produits();
// Un produit sans aucun format à prix valide n'est pas affiché
const PRODUITS = TOUS_PRODUITS.filter(p => p.visible && Object.values(p.prix || {}).some(v => Number(v) > 0));
const REGLAGES = Pepix.reglages();

// Mois de semis (s) et de récolte (r) : 0 = janvier ... 11 = décembre
const CALENDRIER = {
  oignon: { s: [9, 10, 11], r: [1, 2, 3, 4] },
  tomate: { s: [9, 10, 11, 0, 1], r: [0, 1, 2, 3, 4] },
  chou:   { s: [9, 10, 11, 0], r: [0, 1, 2, 3] },
  piment: { s: [9, 10, 11, 0, 1, 2], r: [0, 1, 2, 3, 4, 5] },
};
// En-têtes du calendrier sur 3 lettres : lève l'ambiguïté J / J / J et M / M
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const FRAIS_LIVRAISON = Math.max(0, Number(REGLAGES.fraisLivraison) || 0);

// Petites icônes (style Lucide), dessinées en SVG
const ICONES = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  moins: '<path d="M5 12h14"/>',
  fleche: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  retour: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  sac: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  camion: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  lecture: '<polygon points="6 3 20 12 6 21 6 3"/>',
  alerte: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  // Réassurance et saison (Lucide, licence ISC)
  pousse: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  calendrier: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  // Étapes de culture (dessinées pour Pépix, même trait que Lucide)
  semis: '<path d="M12 3v7"/><path d="m9 7 3 3 3-3"/><path d="M3 14h18"/><ellipse cx="12" cy="18" rx="2.5" ry="1.5"/>',
  pepiniere: '<path d="M3 15h18l-1.5 5h-15z"/><path d="M12 15V9"/><path d="M12 10.5c0-2 1.3-3.5 3.5-3.5 0 2-1.3 3.5-3.5 3.5z"/><path d="M12 12c0-2-1.3-3.5-3.5-3.5 0 2 1.3 3.5 3.5 3.5z"/><path d="M6 15v-3"/><path d="M18 15v-3"/>',
  repiquage: '<path d="M3 20h18"/><path d="M15 20v-6"/><path d="M15 15.5c0-2 1.3-3.5 3.5-3.5 0 2-1.3 3.5-3.5 3.5z"/><path d="M15 17c0-2-1.3-3.5-3.5-3.5 0 2 1.3 3.5 3.5 3.5z"/><path d="M4 10c2-4 6-5 9-3"/><path d="m10 4 3 3-3 2"/>',
  // Arrosoir simplifié après contrôle à 24 px : anse sur le côté (l'anse en arche faisait penser à un cadenas)
  arrosoir: '<path d="M5 10h9v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M5 12a2.5 2.5 0 0 0 0 5"/><path d="m14 13 5-6"/><path d="m17.5 5.5 3 2.5"/><path d="M21 11v.01"/><path d="M22 14v.01"/>',
  panier: '<path d="M3 10h18l-2 9a2 2 0 0 1-2 1.6H7A2 2 0 0 1 5 19z"/><path d="m8 10 3-6"/><path d="m16 10-3-6"/><path d="M9 14v3"/><path d="M12 14v3"/><path d="M15 14v3"/>',
};
// Les 5 étapes de culture, dans l'ordre des textes de PRODUITS_BASE[].etapes
const ETAPES = [
  { icone: 'semis', nom: 'Semis' },
  { icone: 'pepiniere', nom: 'Pépinière' },
  { icone: 'repiquage', nom: 'Repiquage' },
  { icone: 'arrosoir', nom: 'Entretien' },
  { icone: 'panier', nom: 'Récolte' },
];
// Illustration des états vides (panier vide, 404) : une graine en terre qui germe
const ILLU_GRAINE = `<svg class="illu-graine" viewBox="0 0 96 96" width="96" height="96" aria-hidden="true" focusable="false">
  <circle cx="48" cy="48" r="46" fill="#E3E7E0"/>
  <path d="M14 62h68" stroke="#58402A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M24 72h10M44 76h8M62 72h10" stroke="#58402A" stroke-width="2" stroke-linecap="round" fill="none" opacity=".5"/>
  <ellipse cx="48" cy="70" rx="7" ry="4.5" transform="rotate(-20 48 70)" fill="#58402A"/>
  <g class="illu-pousse">
    <path d="M48 66V46" stroke="#3C572C" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M48 50c0-7 5-11 12-11 0 7-5 11-12 11z" fill="#3C572C"/>
    <path d="M48 54c0-6-4-9-10-9 0 6 4 9 10 9z" fill="#3C572C"/>
  </g>
</svg>`;
const icone = (nom, classe = 'icone') =>
  `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[nom]}</svg>`;

// Format "1 500"
const prix = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// Même format avec une espace insécable : "1 500 plants" ne se coupe pas
const nombre = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
// "oignon, tomate et chou"
const liste = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : (l[0] || '');
const $ = sel => document.querySelector(sel);
// Tout texte saisi (admin ou client) est échappé avant d'aller dans du HTML
const echapper = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Téléphone lisible "77 123 45 67", insécable (affichage seulement, la valeur saisie reste intacte)
const telLisible = tel => {
  const chiffres = String(tel).replace(/\D/g, '').replace(/^(00)?221/, '');
  return chiffres.length === 9 ? chiffres.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1\u00A0$2\u00A0$3\u00A0$4') : String(tel);
};
const livraisonTexte = () => FRAIS_LIVRAISON ? `${prix(FRAIS_LIVRAISON)} FCFA` : 'offerte';
const produit = id => PRODUITS.find(p => p.id === id);
const format = id => FORMATS.find(f => f.id === id);
// Prix d'un format, ou null s'il n'est pas vendu (prix absent ou nul)
const prixFormat = (p, f) => Number(p.prix[f.id]) > 0 ? Number(p.prix[f.id]) : null;
const formatsVendus = p => FORMATS.filter(f => prixFormat(p, f));
const prixDepart = p => Math.min(...formatsVendus(p).map(f => prixFormat(p, f)));

/* ---------- Panier (sauvegardé dans le navigateur) ---------- */
// Une ligne par produit et par format : { 'tomate:500g': 2, 'oignon:5000g': 1 }
const cleLigne = (id, formatId) => `${id}:${formatId}`;
const lireCle = cle => {
  const [id, formatId] = cle.split(':');
  const p = produit(id), f = format(formatId);
  return p && f && prixFormat(p, f) ? { p, f } : null;
};
let panier = {};
try { panier = JSON.parse(localStorage.getItem('pepix-panier')) || {}; } catch (e) { panier = {}; }
// Un produit masqué ou épuisé depuis l'admin, un format retiré ou un ancien panier (sachets de 5 g) sort du panier
panier = Object.fromEntries(Object.entries(panier).filter(([cle, qte]) => {
  const l = lireCle(cle);
  return l && l.p.enStock && Number.isInteger(qte) && qte > 0;
}));
let vuePanier = 'lignes';          // 'lignes' | 'formulaire' | 'confirmation'
let derniereCommande = null;

// Lignes du panier dans l'ordre des produits puis des formats
const lignesPanier = () => PRODUITS.flatMap(p => FORMATS
  .filter(f => panier[cleLigne(p.id, f.id)] && prixFormat(p, f))
  .map(f => ({ cle: cleLigne(p.id, f.id), p, f, qte: panier[cleLigne(p.id, f.id)], prix: prixFormat(p, f) })));
const quantiteProduit = id => FORMATS.reduce((a, f) => a + (panier[cleLigne(id, f.id)] || 0), 0);

function sauverPanier() {
  try { localStorage.setItem('pepix-panier', JSON.stringify(panier)); } catch (e) { /* navigation privée */ }
  majCompteur();
  majPastillesPanier();
}

// Pastille « 2 dans le panier » sur les cartes (accueil et boutique)
function majPastillesPanier() {
  document.querySelectorAll('[data-dans-panier]').forEach(el => {
    const n = quantiteProduit(el.dataset.dansPanier);
    el.hidden = !n;
    el.lastChild.textContent = `${n} dans le panier`;
  });
}

const nombreArticles = () => Object.values(panier).reduce((a, b) => a + b, 0);
const sousTotal = () => lignesPanier().reduce((a, l) => a + l.qte * l.prix, 0);

function majCompteur(animer) {
  const n = nombreArticles();
  document.querySelectorAll('.btn-panier').forEach(b => {
    const c = b.querySelector('.compteur');
    c.textContent = n;
    b.setAttribute('aria-label', 'Panier ' + n + ' article' + (n > 1 ? 's' : ''));   // commence par le texte visible « Panier 0 »
    if (animer) { c.classList.remove('saut'); void c.offsetWidth; c.classList.add('saut'); }
  });
}

// articles : [{ id, format, qte }] ; texte : le message de la notification
function ajouter(articles, texte, bouton) {
  panier = articles.reduce((acc, a) => {
    const cle = cleLigne(a.id, a.format);
    return { ...acc, [cle]: (acc[cle] || 0) + a.qte };
  }, panier);
  vuePanier = 'lignes';
  sauverPanier();
  majCompteur(true);
  notifier(texte);
  if (bouton) confirmerBouton(bouton);
}

// Le bouton « Ajouter » affiche « Ajouté » quelques instants
function confirmerBouton(bouton) {
  if (!bouton.dataset.texte) bouton.dataset.texte = bouton.innerHTML;
  if (!bouton.dataset.libelle) bouton.dataset.libelle = bouton.getAttribute('aria-label') || '';
  bouton.innerHTML = icone('check') + 'Ajouté';
  bouton.setAttribute('aria-label', 'Ajouté au panier');
  bouton.classList.add('ajoute');
  clearTimeout(bouton._t);
  bouton._t = setTimeout(() => {
    bouton.innerHTML = bouton.dataset.texte;
    if (bouton.dataset.libelle) bouton.setAttribute('aria-label', bouton.dataset.libelle); else bouton.removeAttribute('aria-label');
    bouton.classList.remove('ajoute');
  }, 1400);
}

function changerQuantite(cle, qte) {
  const { [cle]: _retire, ...reste } = panier;
  panier = qte > 0 ? { ...panier, [cle]: qte } : reste;
  sauverPanier();
  afficherPanier();
}

/* ---------- Notification en bas de l'écran ---------- */
let minuteur;
function notifier(texte) {
  const t = $('#toast');
  t.innerHTML = `${icone('check')}<span>${texte}</span><button type="button" data-voir-panier>Voir le panier</button>`;
  t.classList.add('visible');
  clearTimeout(minuteur);
  minuteur = setTimeout(() => t.classList.remove('visible'), 3200);
}

/* ---------- Saison : ce qui se sème ce mois-ci (d'après CALENDRIER) ---------- */
function saison() {
  const mois = new Date().getMonth();
  const aSemer = PRODUITS.filter(p => CALENDRIER[p.id].s.includes(mois));
  // Toutes les semences affichées sont à semer : un seul message, pas de pastille (des pastilles identiques ne diraient rien)
  const tous = aSemer.length > 0 && aSemer.length === PRODUITS.length;
  return { mois, nomMois: MOIS_LONGS[mois], aSemer, tous, pastille: aSemer.length > 0 && !tous };
}

// Bandeau de la boutique, au-dessus de la grille
function bandeauSaison(zone) {
  if (!PRODUITS.length) { zone.hidden = true; return; }
  const { nomMois, aSemer, tous } = saison();
  const texte = tous
    ? `En ${nomMois}, ${PRODUITS.length === 4 ? 'les quatre semences se sèment' : 'toutes nos semences se sèment'}. C'est le bon moment pour commander.`
    : aSemer.length
      ? `À semer en ${nomMois} : ${liste(aSemer.map(p => p.nom.toLowerCase()))}.`
      : `Pas de semis en ${nomMois}. Les semis reprennent en octobre : commandez en septembre pour être prêt.`;
  zone.innerHTML = `${icone('calendrier')}<span>${texte}</span>`;
  zone.hidden = false;
}

/* ---------- Visuels des sachets : fond kraft tant que l'image n'est pas chargée ---------- */
// Une seule promesse par visuel : la carte, la fiche et le panier partagent le même chargement
const visuels = {};
function chargerVisuels(racine = document) {
  racine.querySelectorAll('.carte-image, .modale-image, .fiche-vignette, .choix-vignette, .ligne-vignette').forEach(el => {
    const id = (el.className.match(/\bphoto-([a-z]+)/) || [])[1];
    if (!id) return;
    // Cartes, fiche produit et fiches de culture : sachet détouré sur une teinte ; panier : photo d'origine
    const detoure = ['carte-image', 'modale-image', 'fiche-vignette', 'choix-vignette'].some(c => el.classList.contains(c));
    const fichier = detoure ? `sachet-${id}-detoure` : `sachet-${id}`;
    if (!visuels[fichier]) {
      const img = new Image();
      img.src = `img/${fichier}.webp`;
      visuels[fichier] = (img.decode ? img.decode() : Promise.resolve()).then(() => true, () => false);
    }
    // En cas d'erreur, le fond kraft et la pousse restent (le nom du sachet est dans aria-label)
    visuels[fichier].then(ok => { if (ok) el.classList.add('charge'); });
  });
}

/* ---------- Cartes produit (accueil et boutique) ---------- */
function carteProduit(p, avecSaison) {
  // Carte façon sachet : photo, nom, variété, repères de culture, prix.
  // Toute la carte ouvre la fiche grâce au bouton du titre (étendu en CSS).
  // La pastille de saison est hors de l'image (role="img" masquerait son texte)
  return `
    <article class="carte${p.enStock ? '' : ' carte-epuisee'}" data-id="${p.id}">
      <div class="carte-image photo-${p.id}" role="img" aria-label="Sachet de semences ${p.nom} Pépix"></div>
      <div class="carte-corps">
        <h3><button type="button" class="carte-ouvrir" data-ouvrir="${p.id}" aria-label="${p.nom}, voir la fiche">${p.nom}</button></h3>
        ${avecSaison ? `<p class="pastille-saison">${icone('calendrier')}À semer en ${MOIS_LONGS[new Date().getMonth()]}</p>` : ''}
        <p class="pastille-panier" data-dans-panier="${p.id}" hidden>${icone('check')}<span></span></p>
        <span class="variete">${echapper(p.variete)}, en ${liste(formatsVendus(p).map(f => f.nom))}</span>
        <dl class="carte-reperes">
          <div><dt>Semis</dt><dd>${p.semis.replace(' (pépinière)', '')}</dd></div>
          <div><dt>Cycle</dt><dd>${p.cycle}</dd></div>
        </dl>
        <div class="carte-pied">
          <strong><small>dès</small> ${prix(prixDepart(p))} FCFA</strong>
          ${p.enStock
            ? `<button type="button" class="btn btn-vert" data-choisir="${p.id}" aria-label="Choisir le format : ${p.nom}">Choisir</button>`
            : `<span class="epuise">Épuisé</span>`}
        </div>
      </div>
    </article>`;
}

function afficherProduits(conteneur) {
  if (!PRODUITS.length) {
    // Tous les produits masqués depuis l'admin
    conteneur.classList.add('produits-vide');
    conteneur.innerHTML = `
      <div class="etat-vide">
        <p>Les semences reviennent bientôt. Écrivez-nous sur WhatsApp pour être prévenu.</p>
        <a class="btn btn-sombre" href="${echapper(Pepix.lienWhatsApp("Bonjour Pépix, j'ai une question sur mes cultures."))}" target="_blank" rel="noopener">Écrire sur WhatsApp</a>
      </div>`;
    return;
  }
  const { aSemer, pastille } = saison();
  conteneur.innerHTML = PRODUITS.map(p => carteProduit(p, pastille && aSemer.includes(p))).join('');
  chargerVisuels(conteneur);
  majPastillesPanier();
  // Toute la carte, bouton « Choisir » compris, ouvre la fiche : le format se choisit là
  conteneur.addEventListener('click', e => {
    const carte = e.target.closest('.carte');
    if (carte) ouvrirFiche(carte.dataset.id);
  });
}

/* ---------- Quantité de semences selon la surface ---------- */
// Doses et sources : voir le commentaire de FORMATS (js/donnees.js)
const arrondiBas = n => n < 100 ? Math.floor(n) : n < 1000 ? Math.floor(n / 10) * 10 : Math.floor(n / 100) * 100;
const M2_PAR_HA = 10000;
const SURFACE_MAX_HA = 1000;          // au-delà, la saisie est sans doute une erreur d'unité
const TARIF_PRODUCTEUR_G = 20000;     // à partir de 20 kg, on propose d'écrire pour un tarif producteur
const MAX_2500G = 3, MAX_500G = 9;    // bornes de la recherche de la combinaison la moins chère

// "8,5 kg" ou "750 g", arrondi au-dessus (on ne propose jamais moins que le besoin)
const poids = g => g >= 1000
  ? `${String(Math.ceil(g / 100) / 10).replace('.', ',')}\u00A0kg`
  : `${nombre(Math.ceil(g / 10) * 10)}\u00A0g`;
// "1,5 ha" ou "1 250 m²", arrondi en dessous (on ne promet jamais plus que ce que couvre le format)
const surfaceLisible = ha => ha >= 1
  ? `${String(Math.floor(ha * 10) / 10).replace('.', ',')}\u00A0ha`
  : `${nombre(arrondiBas(ha * M2_PAR_HA))}\u00A0m²`;
const surfaceCouverte = (p, f) => p.doseHa > 0 ? f.grammes / p.doseHa : 0;

function espacementCm(p) {
  const m = String(p.espacement || '').match(/(\d+)\s*×\s*(\d+)/);
  return m && Number(m[1]) && Number(m[2]) ? { a: Number(m[1]), b: Number(m[2]) } : null;
}
const plantsParHa = p => { const e = espacementCm(p); return e ? (M2_PAR_HA * 10000) / (e.a * e.b) : 0; };

// Combinaison de formats la moins chère qui couvre le besoin (à prix égal, la plus proche du besoin)
function meilleureCombinaison(p, besoinG) {
  const [f500, f2500, f5000] = FORMATS.map(f => (prixFormat(p, f) ? f : null));
  const essais = [];
  const max5000 = f5000 ? Math.ceil(besoinG / f5000.grammes) : 0;
  for (let n5 = 0; n5 <= max5000; n5++)
    for (let n25 = 0; n25 <= (f2500 ? MAX_2500G : 0); n25++)
      for (let n05 = 0; n05 <= (f500 ? MAX_500G : 0); n05++) {
        const lignes = [[f5000, n5], [f2500, n25], [f500, n05]].filter(([f, n]) => f && n > 0);
        const grammes = lignes.reduce((a, [f, n]) => a + f.grammes * n, 0);
        if (grammes < besoinG) continue;
        essais.push({ lignes, grammes, total: lignes.reduce((a, [f, n]) => a + prixFormat(p, f) * n, 0) });
      }
  return essais.sort((x, y) => x.total - y.total || x.grammes - y.grammes)[0] || null;
}

// Fiches de culture : la dose et ce que couvre le plus petit format
function blocQuantite(p) {
  const plus_petit = formatsVendus(p)[0];
  if (!(p.doseHa > 0) || !plus_petit) return '';
  const id = `quantite-${p.id}`;
  const plants = plantsParHa(p);
  const e = espacementCm(p);
  return `
    <div class="surface" role="group" aria-labelledby="${id}">
      <div class="surface-haut"><h4 id="${id}">Quelle quantité&nbsp;?</h4><span class="indicatif">Indicatif</span></div>
      <dl>
        <div><dt>Pour 1 hectare</dt><dd>${poids(p.doseHa)}</dd></div>
        <div><dt>${plus_petit.nom} couvrent</dt><dd>${surfaceLisible(surfaceCouverte(p, plus_petit))}</dd></div>
      </dl>
      <p>${e ? `Plants repiqués à ${e.a} × ${e.b} cm, soit environ ${nombre(arrondiBas(plants))} plants par hectare. ` : ''}La dose comprend une marge pour les pertes à la levée et au repiquage.</p>
      <a class="lien" href="boutique.html?culture=${p.id}#calculateur" data-calcul="${p.id}">Calculer pour ma surface</a>
    </div>`;
}

/* ---------- Calculateur : la surface donne la quantité et les formats à commander ---------- */
function afficherCalculateur(zone) {
  const cultures = PRODUITS.filter(p => p.doseHa > 0 && formatsVendus(p).length);
  if (!cultures.length) { zone.closest('section').hidden = true; return; }
  const demandee = new URLSearchParams(location.search).get('culture');
  const depart = cultures.find(p => p.id === demandee) || cultures.find(p => p.id === 'tomate') || cultures[0];
  zone.innerHTML = `
    <form class="calcul-form" novalidate>
      <fieldset class="calcul-champ">
        <legend>Culture</legend>
        <div class="calcul-cultures">
          ${cultures.map(p => `<label><input type="radio" name="culture" value="${p.id}"${p === depart ? ' checked' : ''}><span>${echapper(p.nom)}</span></label>`).join('')}
        </div>
      </fieldset>
      <div class="calcul-champ">
        <label for="calcul-surface">Surface à cultiver</label>
        <div class="calcul-surface">
          <input id="calcul-surface" name="surface" inputmode="decimal" autocomplete="off" placeholder="par exemple 2 000" aria-describedby="calcul-erreur">
          <select name="unite" aria-label="Unité de surface">
            <option value="m2">m²</option>
            <option value="ha">hectares</option>
          </select>
        </div>
        <span class="msg-erreur" id="calcul-erreur" hidden>${icone('alerte')}<span></span></span>
      </div>
    </form>
    <div class="calcul-resultat" aria-live="polite"></div>
    <div class="plan-zone" hidden></div>`;

  const form = zone.querySelector('form');
  const resultat = zone.querySelector('.calcul-resultat');
  const champ = form.elements.surface;
  const erreur = zone.querySelector('#calcul-erreur');
  let proposition = null;
  // Plan de culture daté sous le résultat (js/plan.js, absent des pages sans calculateur)
  const plan = typeof creerPlan === 'function' ? creerPlan(zone.querySelector('.plan-zone')) : null;

  const montrerErreur = texte => {
    erreur.hidden = !texte;
    erreur.lastChild.textContent = texte || '';
    champ.setAttribute('aria-invalid', texte ? 'true' : 'false');
  };

  let derniereSaisie = null;
  const calculer = () => {
    const p = produit(form.elements.culture.value);
    const brut = champ.value.trim();
    // « change » arrive après « input » quand le champ perd le focus (toucher sur « Ajouter au panier ») :
    // même saisie, on garde le résultat affiché, sinon le bouton touché est remplacé et le toucher se perd
    const saisie = [p.id, brut, form.elements.unite.value].join('|');
    if (saisie === derniereSaisie) return;
    derniereSaisie = saisie;
    proposition = null;
    if (!brut) {
      montrerErreur('');
      resultat.innerHTML = `<p class="calcul-attente">Indiquez votre surface : on calcule la quantité de semences de ${echapper(p.nom.toLowerCase())} et les formats à commander.</p>`;
      return;
    }
    const valeur = Number(brut.replace(/\s/g, '').replace(',', '.'));
    const ha = form.elements.unite.value === 'ha' ? valeur : valeur / M2_PAR_HA;
    if (!Number.isFinite(valeur) || valeur <= 0) { montrerErreur('Entrez une surface en chiffres, par exemple 2 000 m² ou 0,5 ha.'); resultat.innerHTML = ''; return; }
    if (ha > SURFACE_MAX_HA) { montrerErreur(`Au-delà de ${nombre(SURFACE_MAX_HA)} hectares, écrivez-nous sur WhatsApp. Vérifiez aussi l'unité choisie.`); resultat.innerHTML = ''; return; }
    montrerErreur('');

    const besoin = ha * p.doseHa;
    const combi = meilleureCombinaison(p, besoin);
    const plants = plantsParHa(p) * ha;
    // L'unité garde ses minuscules dans le surtitre en capitales (« 2 000 m² », pas « M² »)
    const surfaceTexte = `${echapper(brut.replace('.', ','))}\u00A0<span class="unite">${form.elements.unite.value === 'ha' ? 'ha' : 'm²'}</span>`;
    if (!combi) { resultat.innerHTML = ''; return; }
    proposition = { p, combi, surface: `${brut.replace('.', ',')}\u00A0${form.elements.unite.value === 'ha' ? 'ha' : 'm²'}` };
    const detail = combi.lignes.map(([f, n]) => `<li><span>${n} × ${f.nom}</span><span>${prix(prixFormat(p, f) * n)} FCFA</span></li>`).join('');
    const surplus = combi.grammes - besoin;
    resultat.innerHTML = `
      <div class="calcul-besoin">
        <span class="surtitre">${echapper(p.nom)} · ${surfaceTexte}</span>
        <strong>Il vous faut environ ${poids(besoin)} de semences</strong>
        ${plants >= 1 ? `<span>Soit à peu près ${nombre(Math.max(1, arrondiBas(plants)))} plant${plants >= 2 ? 's' : ''} à repiquer.</span>` : ''}
      </div>
      <div class="calcul-conseil">
        <h3>Ce que nous vous conseillons</h3>
        <ul>${detail}</ul>
        <p>${poids(combi.grammes)} au total${surplus >= 100 ? `, de quoi refaire une pépinière si la levée est faible` : ''}.</p>
        ${besoin >= TARIF_PRODUCTEUR_G ? `<p class="calcul-note">Pour une commande de cette taille, <a class="lien-texte" data-wa="Bonjour Pépix, je voudrais un tarif producteur pour ${poids(besoin)} de semences de ${p.nom.toLowerCase()}." href="#">demandez un tarif producteur sur WhatsApp</a>.</p>` : ''}
        ${p.enStock
          ? `<button type="button" class="btn btn-vert" data-ajouter-calcul>Ajouter au panier · ${prix(combi.total)} FCFA</button>`
          : `<p class="epuise-note">${echapper(p.nom)} est épuisé pour le moment. Écrivez-nous sur WhatsApp pour être prévenu du retour en stock.</p>`}
      </div>
      <p class="calcul-mention">Estimation indicative, pour un semis en pépinière suivi d'un repiquage.</p>`;
    resultat.querySelectorAll('a[data-wa]').forEach(a => { a.href = Pepix.lienWhatsApp(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
  };
  const recalculer = () => { calculer(); if (plan) plan.maj(proposition); };

  // Liens « Calculer pour ma surface » (fiches, fiche produit) : sur une page qui a le calculateur,
  // on y descend avec la bonne culture au lieu de recharger la page
  document.addEventListener('click', e => {
    const lien = e.target.closest('a[data-calcul]');
    const choix = lien && form.querySelector(`input[name="culture"][value="${lien.dataset.calcul}"]`);
    if (!choix) return;
    e.preventDefault();
    if (voileOuvert) fermer();
    choix.checked = true;
    recalculer();
    zone.closest('section').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    champ.focus({ preventScroll: true });
  });

  form.addEventListener('input', recalculer);
  form.addEventListener('change', recalculer);
  form.addEventListener('submit', e => { e.preventDefault(); recalculer(); });
  resultat.addEventListener('click', e => {
    const bouton = e.target.closest('[data-ajouter-calcul]');
    if (!bouton || !proposition) return;
    const { p, combi } = proposition;
    ajouter(combi.lignes.map(([f, n]) => ({ id: p.id, format: f.id, qte: n })), `Semences de ${p.nom.toLowerCase()} ajoutées au panier`, bouton);
  });
  recalculer();
}

/* ---------- Étapes de culture : pictos toujours doublés d'un texte ---------- */
const etapesDe = p => Array.isArray(p.etapes) && p.etapes.length === ETAPES.length ? p.etapes : null;

// Version courte (fiche produit) : picto, nom de l'étape, valeur
function etapesCourtes(p) {
  const etapes = etapesDe(p);
  if (!etapes) return '';
  return `
    <h3 class="etapes-titre">Les étapes</h3>
    <ol class="etapes-courtes">
      ${ETAPES.map((e, i) => `<li>${icone(e.icone)}<span class="etape-nom">${e.nom}</span><b>${echapper(etapes[i].court)}</b></li>`).join('')}
    </ol>`;
}

// Version illustrée (fiches de culture) : numéro porté par la liste, picto, titre, texte
function etapesIllustrees(p) {
  const etapes = etapesDe(p);
  if (!etapes) return `<ol class="fiche-conseils">${p.conseils.map(c => `<li>${c}</li>`).join('')}</ol>`;
  return `
    <h4 class="etapes-titre">Les étapes</h4>
    <ol class="etapes">
      ${ETAPES.map((e, i) => `
        <li>
          <span class="etape-picto">${icone(e.icone)}</span>
          <div><strong class="etape-titre">${e.nom}</strong><p>${echapper(etapes[i].long)}</p></div>
        </li>`).join('')}
    </ol>`;
}

/* ---------- Accueil : frise de culture, un légume à la fois ---------- */
function afficherFrise(zone) {
  const avecEtapes = PRODUITS.filter(etapesDe);
  if (!avecEtapes.length) { zone.closest('section').hidden = true; return; }
  // La tomate d'abord : c'est la semence la plus demandée
  const depart = avecEtapes.find(p => p.id === 'tomate') || avecEtapes[0];
  zone.innerHTML = `
    <div class="frise-choix" role="group" aria-label="Choisir un légume">
      ${avecEtapes.map(p => `<button type="button" class="frise-onglet" data-frise="${p.id}" aria-pressed="false">${echapper(p.nom)}</button>`).join('')}
    </div>
    <div class="frise-contenu"></div>`;
  const contenu = zone.querySelector('.frise-contenu');
  const montrer = p => {
    const etapes = etapesDe(p);
    contenu.innerHTML = `
      <ol class="frise-etapes" aria-label="Étapes de culture : ${echapper(p.nom)}">
        ${ETAPES.map((e, i) => `<li style="--i: ${i}"><span class="frise-picto">${icone(e.icone)}</span><span class="frise-nom">${e.nom}</span><b>${echapper(etapes[i].court)}</b></li>`).join('')}
      </ol>
      <a class="lien-clair" href="conseils.html#fiche-${p.id}">Voir la fiche de culture complète</a>`;
    zone.querySelectorAll('[data-frise]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.frise === p.id)));
  };
  zone.addEventListener('click', e => {
    const bouton = e.target.closest('[data-frise]');
    if (bouton) montrer(avecEtapes.find(p => p.id === bouton.dataset.frise));
  });
  montrer(depart);
}

/* ---------- Accueil : apparition douce au défilement ---------- */
// Les enfants de chaque [data-apparition] montent en fondu, l'un après l'autre.
// Rien ne bouge si le visiteur réduit les animations : le contenu est visible d'emblée.
function apparitions() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const DECALAGE_MS = 80, DECALAGE_MAX = 4;
  const observateur = new IntersectionObserver(entrees => entrees.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('vu');
    observateur.unobserve(en.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-apparition]').forEach(groupe => {
    [...groupe.children].forEach((el, i) => {
      el.style.setProperty('--delai', `${Math.min(i, DECALAGE_MAX) * DECALAGE_MS}ms`);
      el.classList.add('apparait');
      observateur.observe(el);
    });
  });
}

/* ---------- Textes réglés dans l'admin ---------- */

function appliquerReglages() {
  document.querySelectorAll('[data-reglage]').forEach(el => {
    const cle = el.dataset.reglage;
    const valeur = REGLAGES[cle];
    if (valeur === undefined || valeur === '') return;
    if (cle === 'herosTitre') {
      // Le dernier mot du titre passe en jaune, comme sur le sachet
      const t = String(valeur).trim();
      const i = t.lastIndexOf(' ');
      el.innerHTML = i > 0 ? `${echapper(t.slice(0, i))} <span class="jaune">${echapper(t.slice(i + 1))}</span>` : echapper(t);
    } else if (cle === 'fraisLivraison') {
      el.textContent = livraisonTexte();
    } else {
      el.textContent = valeur;
    }
  });
  // data-wa peut porter le message prérempli (sujets fréquents de l'accueil)
  document.querySelectorAll('a[data-wa]').forEach(a => {
    a.href = Pepix.lienWhatsApp(a.dataset.wa || "Bonjour Pépix, j'ai une question sur mes cultures.");
  });
  const annonce = String(REGLAGES.annonce || '').trim();
  if (annonce) {
    document.body.insertAdjacentHTML('afterbegin', `<p class="annonce" role="note">${echapper(annonce)}</p>`);
  }
}

/* ---------- Page Conseils : calendrier et fiches ---------- */
function afficherCalendrier(conteneur) {
  const ceMois = new Date().getMonth();
  // Le mois en cours passe en tête, avant la légende
  const aSemer = PRODUITS.filter(p => CALENDRIER[p.id].s.includes(ceMois)).map(p => p.nom.toLowerCase());
  const aRecolter = PRODUITS.filter(p => CALENDRIER[p.id].r.includes(ceMois)).map(p => p.nom.toLowerCase());
  const phrases = [
    aSemer.length ? `À semer : ${aSemer.join(', ')}.` : '',
    aRecolter.length ? `À récolter : ${aRecolter.join(', ')}.` : '',
  ].filter(Boolean).join(' ') || 'Période de repos pour ces cultures.';
  conteneur.querySelector('h2').insertAdjacentHTML('afterend',
    `<p class="cal-mois">${icone('calendrier')}<span>Nous sommes en ${MOIS_LONGS[ceMois]}. ${phrases}</span></p>`);

  let html = '<p class="cal-glisser">Faites glisser le tableau pour voir toute l\'année.</p><div class="cal-defile" tabindex="0" role="region" aria-label="Calendrier, défilement horizontal"><div class="ligne-cal" aria-hidden="true"><span></span>' +
    MOIS.map((m, i) => `<span class="mois${i === ceMois ? ' actuel' : ''}">${m}</span>`).join('') + '</div>';
  for (const p of PRODUITS) {
    const c = CALENDRIER[p.id];
    html += `<div class="ligne-cal"><strong><a class="lien-cal" href="#fiche-${p.id}">${p.nom}</a></strong>`;
    MOIS.forEach((m, i) => {
      const s = c.s.includes(i), r = c.r.includes(i);
      const classe = (s && r ? 'sr' : s ? 's' : r ? 'r' : '') + (i === ceMois ? ' actuel' : '');
      const texte = s && r ? 'S·R' : s ? 'S' : r ? 'R' : '';
      const titre = s && r ? 'semis et récolte' : s ? 'semis' : r ? 'récolte' : 'pas de semis ni de récolte';
      html += `<span class="case ${classe}" title="${MOIS_LONGS[i]} : ${titre}"><span aria-hidden="true">${texte}</span><span class="sr-only">${p.nom}, ${MOIS_LONGS[i]} : ${titre}</span></span>`;
    });
    html += '</div>';
  }
  html += '</div>';
  conteneur.insertAdjacentHTML('beforeend', html);
  // Sur petit écran, le calendrier défile : on amène le mois en cours dans la vue
  const defile = conteneur.querySelector('.cal-defile');
  const actuel = conteneur.querySelector('.mois.actuel');
  if (defile && actuel && defile.scrollWidth > defile.clientWidth) {
    defile.scrollLeft = Math.max(0, actuel.offsetLeft - defile.offsetLeft - defile.clientWidth / 2 + 60);
  }
}

function afficherFiches(conteneur) {
  if (!PRODUITS.length) {
    conteneur.innerHTML = '<p class="etat-vide">Les fiches reviennent avec les semences.</p>';
    return;
  }
  conteneur.innerHTML = `
    <div class="choix-culture" role="group" aria-label="Choisir une culture">
      ${PRODUITS.map(p => `
        <button type="button" class="choix" data-culture="${p.id}" aria-pressed="false" aria-controls="fiche-${p.id}">
          <span class="choix-vignette photo-${p.id}" aria-hidden="true"></span>${echapper(p.nom)}
        </button>`).join('')}
    </div>
    ${PRODUITS.map(p => `
    <article class="fiche" id="fiche-${p.id}" aria-labelledby="t-fiche-${p.id}">
      <div class="fiche-haut">
        <span class="fiche-vignette photo-${p.id}" aria-hidden="true"></span>
        <div><h3 id="t-fiche-${p.id}">${echapper(p.nom)}</h3><span class="variete-fiche">${echapper(p.variete)}</span></div>
      </div>
      <div class="reperes">
        <div class="repere"><span>Semis</span><b>${p.semis}</b></div>
        <div class="repere"><span>Cycle</span><b>${p.cycle}</b></div>
        <div class="repere"><span>Espacement</span><b>${p.espacement}</b></div>
      </div>
      ${blocQuantite(p)}
      <div class="fiche-etapes">${etapesIllustrees(p)}</div>
      <div class="fiche-pied">
        <strong>${liste(formatsVendus(p).map(f => f.nom))}, dès ${prix(prixDepart(p))} FCFA</strong>
        ${p.enStock ? `<button type="button" class="btn btn-vert" data-choisir="${p.id}" aria-label="Choisir le format : ${echapper(p.nom)}">Choisir le format</button>` : '<span class="epuise">Épuisé</span>'}
      </div>
    </article>`).join('')}`;
  chargerVisuels(conteneur);

  // Une fiche à la fois. L'ancre de l'adresse (#fiche-tomate, lien partagé) choisit la fiche.
  const idDepuisAncre = () => (location.hash.match(/^#fiche-([a-z]+)$/) || [])[1];
  const montrer = id => {
    const p = produit(id) || PRODUITS[0];
    conteneur.querySelectorAll('.fiche').forEach(f => { f.hidden = f.id !== `fiche-${p.id}`; });
    conteneur.querySelectorAll('[data-culture]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.culture === p.id)));
    return p;
  };
  const { aSemer } = saison();
  const depart = idDepuisAncre() || (aSemer[0] || PRODUITS[0]).id;
  montrer(depart);
  if (idDepuisAncre()) requestAnimationFrame(() => $(`#fiche-${depart}`)?.scrollIntoView());

  conteneur.addEventListener('click', e => {
    const choix = e.target.closest('[data-culture]');
    if (choix) {
      const p = montrer(choix.dataset.culture);
      // L'adresse suit le choix (partage du lien), sans saut de page
      history.replaceState(null, '', `#fiche-${p.id}`);
      return;
    }
    const bouton = e.target.closest('[data-choisir]');
    if (bouton) ouvrirFiche(bouton.dataset.choisir);
  });
  // Liens #fiche-… dans la page (noms du calendrier) : on affiche la fiche, puis le navigateur y descend
  window.addEventListener('hashchange', () => {
    const id = idDepuisAncre();
    if (!id) return;
    montrer(id);
    $(`#fiche-${id}`)?.scrollIntoView();
  });
}

/* ---------- Fenêtre fiche produit ---------- */
let produitOuvert = null;
let formatOuvert = null;
let quantite = 1;

function ouvrirFiche(id) {
  produitOuvert = produit(id);
  const p = produitOuvert;
  const formats = formatsVendus(p);
  formatOuvert = formats[0];
  quantite = 1;
  $('#fiche-contenu').innerHTML = `
    <div class="modale-image photo-${p.id}" role="img" aria-label="Semences ${p.nom} Pépix"></div>
    <div class="modale-corps">
      <div class="modale-haut">
        <span class="variete">Semences maraîchères</span>
        <button type="button" class="btn-rond" data-fermer aria-label="Fermer">${icone('x')}</button>
      </div>
      <h2 id="fiche-titre">${p.nom}</h2>
      <span class="variete">Variété ${echapper(p.variete)}</span>
      ${etapesCourtes(p)}
      <fieldset class="formats"${p.enStock ? '' : ' disabled'}>
        <legend>Format</legend>
        ${formats.map((f, i) => `
          <label class="format">
            <input type="radio" name="format" value="${f.id}"${i === 0 ? ' checked' : ''}>
            <span class="format-nom">${f.nom}</span>
            <span class="format-prix">${prix(prixFormat(p, f))} FCFA</span>
            ${p.doseHa > 0 ? `<span class="format-surface">jusqu'à ${surfaceLisible(surfaceCouverte(p, f))}</span>` : ''}
          </label>`).join('')}
      </fieldset>
      <a class="modale-lien" href="boutique.html?culture=${p.id}#calculateur" data-calcul="${p.id}">Quelle quantité pour ma surface&nbsp;? Le calculateur</a>
      <span class="livraison">Livré en 24 à 48 h à Dakar, 3 à 5 jours en région</span>
      <a class="modale-lien" href="conseils.html#fiche-${p.id}">Voir la fiche de culture complète</a>
      ${p.enStock ? '' : '<p class="epuise-note">Épuisé pour le moment. Écrivez-nous sur WhatsApp pour être prévenu du retour en stock.</p>'}
      <div class="modale-actions"${p.enStock ? '' : ' hidden'}>
        <div class="quantite" role="group" aria-label="Quantité">
          <button type="button" data-moins aria-label="Diminuer la quantité" disabled>${icone('moins')}</button>
          <strong id="fiche-qte" aria-live="polite">1</strong>
          <button type="button" data-plus aria-label="Augmenter la quantité">${icone('plus')}</button>
        </div>
        <button type="button" class="btn btn-vert" data-valider><span>Ajouter pour <span id="fiche-total">${prix(prixFormat(p, formatOuvert))}</span>&nbsp;FCFA</span></button>
      </div>
    </div>`;
  chargerVisuels($('#fiche-contenu'));
  ouvrir('#voile-fiche');
}

function majQuantite() {
  $('#fiche-qte').textContent = quantite;
  $('#fiche-total').textContent = prix(prixFormat(produitOuvert, formatOuvert) * quantite);
  $('[data-moins]').disabled = quantite <= 1;
}

/* ---------- Tiroir panier ---------- */
// Titre du tiroir selon l'étape : l'utilisateur sait où il en est
const TITRES_PANIER = { lignes: 'Panier', formulaire: 'Vos coordonnées (2/2)', confirmation: 'Commande enregistrée' };

function afficherPanier() {
  const zone = $('#panier-zone');
  const lignes = lignesPanier();
  const vueAffichee = vuePanier === 'confirmation' && derniereCommande ? 'confirmation'
    : vuePanier === 'formulaire' && lignes.length ? 'formulaire' : 'lignes';
  $('#panier-titre').textContent = TITRES_PANIER[vueAffichee];

  if (vuePanier === 'confirmation' && derniereCommande) {
    const c = derniereCommande;
    zone.innerHTML = `
      <div class="panier-message" tabindex="-1" id="confirmation">
        <span class="grand-icone ok">${icone('check')}</span>
        <strong>Jërëjëf, ${echapper(c.nom.split(' ')[0])} !</strong>
        <span>Commande de démonstration <b>${c.numero}</b> enregistrée. Ce site est un projet d'école : rien n'est envoyé et personne ne vous appellera. Sur le vrai site, Pépix vous appellerait au ${echapper(telLisible(c.tel))} pour confirmer la livraison.</span>
        <div class="recap">
          <div><span>Articles</span><span>${c.articles}</span></div>
          <div><span>Livraison</span><span>${echapper(c.adresse)}</span></div>
          <div><span>Paiement</span><span>${echapper(c.paiement)}</span></div>
          <div><b>Total</b><b>${prix(c.total)} FCFA</b></div>
        </div>
        <button type="button" class="btn btn-vert" data-fermer>Continuer mes achats</button>
      </div>`;
    $('#confirmation').focus();
    return;
  }

  if (lignes.length === 0) {
    vuePanier = 'lignes';
    zone.innerHTML = `
      <div class="panier-message">
        ${ILLU_GRAINE}
        <strong class="panier-vide-titre">Votre panier est vide.</strong>
        <span>Choisissez vos semences, ou calculez d'abord la quantité pour votre surface.</span>
        <a class="btn btn-vert" href="boutique.html">Voir la boutique</a>
      </div>`;
    return;
  }

  const st = sousTotal();
  const total = `${prix(st + FRAIS_LIVRAISON)} FCFA`;
  const recapTotal = `
    <div class="panier-total">
      <div><span>Sous-total</span><span>${prix(st)} FCFA</span></div>
      <div><span>Livraison</span><span>${livraisonTexte()}</span></div>
      <div class="total"><span>Total</span><span>${total}</span></div>
      ${vuePanier === 'lignes'
        ? `<button type="button" class="btn btn-sombre" data-etape-formulaire>Commander · ${total}</button>
           <small>Wave, Orange Money ou paiement à la livraison</small>`
        : `<button type="submit" form="form-commande" class="btn btn-sombre">Confirmer · ${total}</button>`}
    </div>`;

  if (vuePanier === 'formulaire') {
    zone.innerHTML = `
      <form class="formulaire" id="form-commande" novalidate>
        <button type="button" class="retour" data-etape-lignes>${icone('retour')}Retour au panier</button>
        <div id="resume-erreurs" class="resume-erreurs" role="alert" tabindex="-1" hidden></div>
        <div class="champ">
          <label for="c-nom">Nom complet</label>
          <input id="c-nom" name="nom" autocomplete="name" required aria-describedby="e-nom">
          <span class="msg-erreur" id="e-nom">${icone('alerte')}Indiquez votre nom.</span>
        </div>
        <div class="champ">
          <label for="c-tel">Téléphone</label>
          <span class="aide" id="a-tel">Numéro sénégalais, par exemple 77 123 45 67</span>
          <input id="c-tel" name="tel" type="tel" inputmode="tel" autocomplete="tel" required aria-describedby="a-tel e-tel">
          <span class="msg-erreur" id="e-tel">${icone('alerte')}Entrez un numéro à 9 chiffres commençant par 7.</span>
        </div>
        <div class="champ">
          <label for="c-adresse">Quartier et ville</label>
          <input id="c-adresse" name="adresse" autocomplete="street-address" required aria-describedby="e-adresse">
          <span class="msg-erreur" id="e-adresse">${icone('alerte')}Indiquez où livrer, par exemple Point E, Dakar.</span>
        </div>
        <fieldset class="champ">
          <legend>Mode de paiement</legend>
          <div class="choix">
            <label><input type="radio" name="paiement" value="Wave" checked>Wave</label>
            <label><input type="radio" name="paiement" value="Orange Money">Orange Money</label>
            <label><input type="radio" name="paiement" value="Paiement à la livraison">Paiement à la livraison</label>
          </div>
        </fieldset>
      </form>` + recapTotal;
    brancherFormulaire();
    $('#c-nom').focus();
    return;
  }

  zone.innerHTML = `
    <div class="panier-lignes">
      ${lignes.map(({ cle, p, f, qte, prix: unitaire }) => `
        <div class="ligne">
          <div class="ligne-info">
            <span class="ligne-vignette photo-${p.id}" aria-hidden="true"></span>
            <div><strong>${p.nom}, ${f.nom}</strong><span>${echapper(p.variete)}, ${prix(unitaire)} FCFA</span></div>
          </div>
          <div class="ligne-qte">
            <button type="button" data-retirer="${cle}" aria-label="Retirer un ${p.nom} ${f.nom}">${icone('moins')}</button>
            <strong aria-label="${qte} × ${f.nom}">${qte}</strong>
            <button type="button" data-remettre="${cle}" aria-label="Ajouter un ${p.nom} ${f.nom}">${icone('plus')}</button>
          </div>
          <strong>${prix(unitaire * qte)} FCFA</strong>
        </div>`).join('')}
    </div>` + recapTotal;
  chargerVisuels(zone);
}

/* ---------- Formulaire de commande : vérification des champs ---------- */
const REGLES = {
  nom: v => v.trim().length >= 2,
  tel: v => /^7[05678]\d{7}$/.test(v.replace(/[\s.-]/g, '').replace(/^(\+221|00221)/, '')),
  adresse: v => v.trim().length >= 3,
};
const LIBELLES = { nom: 'Nom complet', tel: 'Téléphone', adresse: 'Quartier et ville' };

function verifierChamp(input) {
  const ok = REGLES[input.name](input.value);
  input.setAttribute('aria-invalid', ok ? 'false' : 'true');
  return ok;
}

function brancherFormulaire() {
  const form = $('#form-commande');
  // Vérification quand on quitte un champ, puis en direct une fois l'erreur affichée
  form.querySelectorAll('input[required]').forEach(input => {
    input.addEventListener('blur', () => { if (input.value) verifierChamp(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') verifierChamp(input); });
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const champs = [...form.querySelectorAll('input[required]')];
    const fautifs = champs.filter(i => !verifierChamp(i));
    const resume = $('#resume-erreurs');
    if (fautifs.length) {
      resume.innerHTML = `<strong>Il manque ${fautifs.length > 1 ? 'des informations' : 'une information'} :</strong>
        <ul>${fautifs.map(i => `<li><a href="#${i.id}">${LIBELLES[i.name]}</a></li>`).join('')}</ul>`;
      resume.hidden = false;
      resume.focus();
      return;
    }
    const d = new FormData(form);
    const st = sousTotal();
    const lignesCommande = lignesPanier().map(({ p, f, qte, prix: unitaire }) => ({ id: p.id, nom: p.nom, variete: p.variete, format: f.nom, grammes: f.grammes, prix: unitaire, qte }));
    // Enregistrée dans le navigateur : l'espace admin la retrouve (démo)
    derniereCommande = Pepix.ajouterCommande({
      nom: d.get('nom').trim(),
      tel: d.get('tel').trim(),
      adresse: d.get('adresse').trim(),
      paiement: d.get('paiement'),
      lignes: lignesCommande,
      sousTotal: st,
      livraison: FRAIS_LIVRAISON,
      total: st + FRAIS_LIVRAISON,
    });
    derniereCommande.articles = lignesCommande.map(l => `${l.qte} × ${l.nom} ${l.format}`).join(', ');
    panier = {};
    sauverPanier();
    vuePanier = 'confirmation';
    afficherPanier();
  });
  form.addEventListener('click', e => {
    const lien = e.target.closest('.resume-erreurs a');
    if (lien) { e.preventDefault(); $(lien.getAttribute('href')).focus(); }
  });
}

/* ---------- Ouvrir / fermer les fenêtres (focus gardé à l'intérieur) ---------- */
let dernierFocus = null;
let voileOuvert = null;

function ouvrir(sel) {
  if (voileOuvert) voileOuvert.classList.remove('ouvert');
  dernierFocus = document.activeElement;
  $('#toast').classList.remove('visible');
  voileOuvert = $(sel);
  voileOuvert.classList.add('ouvert');
  document.body.classList.add('bloque');
  document.querySelectorAll('.btn-panier').forEach(b => b.setAttribute('aria-expanded', sel === '#voile-panier'));
  const premier = voileOuvert.querySelector('button, a[href], input');
  if (premier && !voileOuvert.contains(document.activeElement)) setTimeout(() => premier.focus(), 30);
}

function fermer() {
  if (!voileOuvert) return;
  voileOuvert.classList.remove('ouvert');
  voileOuvert = null;
  document.body.classList.remove('bloque');
  document.querySelectorAll('.btn-panier').forEach(b => b.setAttribute('aria-expanded', 'false'));
  if (vuePanier === 'confirmation') vuePanier = 'lignes';
  if (dernierFocus && document.contains(dernierFocus)) dernierFocus.focus();
}

function garderFocus(e) {
  if (!voileOuvert || e.key !== 'Tab') return;
  const elements = [...voileOuvert.querySelectorAll('button:not([disabled]), a[href], input, [tabindex="0"]')]
    .filter(el => el.offsetParent !== null);
  if (!elements.length) return;
  const premier = elements[0], dernier = elements[elements.length - 1];
  if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
  else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
}

function ouvrirPanier() {
  afficherPanier();
  ouvrir('#voile-panier');
}

/* ---------- Almanach de l'accueil : le mois en cours ---------- */
function almanach() {
  const zone = $('#almanach-mois');
  if (!zone) return;
  const m = new Date().getMonth();
  const aSemer = PRODUITS.filter(p => CALENDRIER[p.id].s.includes(m)).map(p => p.nom.toLowerCase());
  const aRecolter = PRODUITS.filter(p => CALENDRIER[p.id].r.includes(m)).map(p => p.nom.toLowerCase());
  zone.textContent = MOIS_LONGS[m][0].toUpperCase() + MOIS_LONGS[m].slice(1);
  if (m === 9) return; // octobre : le texte écrit dans la page convient
  const titre = $('#almanach-titre'), detail = $('#almanach-detail');
  if (aSemer.length) {
    titre.textContent = `C'est le moment de semer : ${liste(aSemer)}.`;
    detail.textContent = aRecolter.length
      ? `Et côté récolte : ${liste(aRecolter)}. Les dates précises sont sur chaque fiche.`
      : 'Semez en pépinière à l\'ombre, puis repiquez 4 à 8 semaines plus tard selon l\'espèce.';
  } else if (aRecolter.length) {
    titre.textContent = `Le temps des récoltes : ${liste(aRecolter)}.`;
    detail.textContent = 'Les prochains semis reprennent en octobre. Profitez-en pour préparer et amender vos planches.';
  } else {
    titre.textContent = 'Hivernage : on prépare la prochaine saison.';
    detail.textContent = 'Les semis de saison sèche reprennent en octobre. Commandez vos semences en septembre pour être prêt.';
  }
}

/* ---------- Vidéo en fond de l'accueil ---------- */
function videoHeros() {
  const video = $('.heros-fond');
  if (!video) return;
  const bouton = $('.video-bouton');
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const economie = navigator.connection && navigator.connection.saveData;
  let voulue = !reduit && !economie;   // lecture souhaitée par le visiteur

  const majBouton = () => {
    const enLecture = !video.paused;
    bouton.innerHTML = icone(enLecture ? 'pause' : 'lecture');
    bouton.setAttribute('aria-label', enLecture ? 'Mettre la vidéo en pause' : 'Lire la vidéo');
    bouton.setAttribute('aria-pressed', String(!enLecture));
  };
  const lire = () => { video.preload = 'auto'; return video.play().catch(() => {}); };

  bouton.hidden = false;
  video.addEventListener('play', majBouton);
  video.addEventListener('pause', majBouton);
  bouton.addEventListener('click', () => {
    voulue = video.paused;
    if (voulue) lire(); else video.pause();
  });
  majBouton();
  if (voulue) lire();

  // Reprend la lecture quand on revient sur l'onglet (le navigateur la met en pause en arrière-plan)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && voulue) lire();
  });

  // Met la vidéo en pause quand l'accueil n'est plus à l'écran (économise la batterie)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) video.pause();
      else if (voulue) lire();
    }).observe(video);
  }
}

/* ---------- Zones générées par le script ---------- */
// Chaque zone n'est remplie qu'une fois. Sur la boutique et les conseils, le script est
// chargé juste après la grille et le calendrier : ils sont remplis avant le premier
// affichage, et le pied de page n'est plus poussé vers le bas (décalage de mise en page).
const ZONES = {
  'saison': bandeauSaison,
  'produits-accueil': afficherProduits,
  'frise': afficherFrise,
  'produits-boutique': afficherProduits,
  'calcul-zone': afficherCalculateur,
  'calendrier': afficherCalendrier,
  'fiches': afficherFiches,
};
function rendreZones() {
  for (const [id, afficher] of Object.entries(ZONES)) {
    const zone = document.getElementById(id);
    if (!zone || zone.dataset.rendu) continue;
    zone.dataset.rendu = '1';
    afficher(zone);
  }
}
if (document.readyState === 'loading') rendreZones();

/* ---------- Démarrage ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Fenêtres communes à toutes les pages
  document.body.insertAdjacentHTML('beforeend', `
    <div class="voile voile-centre" id="voile-fiche">
      <div class="modale" id="fiche-contenu" role="dialog" aria-modal="true" aria-labelledby="fiche-titre"></div>
    </div>
    <div class="voile voile-droite" id="voile-panier">
      <aside class="panier" id="panier" role="dialog" aria-modal="true" aria-labelledby="panier-titre">
        <div class="panier-haut">
          <h2 id="panier-titre">Panier</h2>
          <button type="button" class="btn-rond" data-fermer aria-label="Fermer le panier">${icone('x')}</button>
        </div>
        <div id="panier-zone" class="panier-zone"></div>
      </aside>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  // Contenus générés selon la page (ceux qui ne l'ont pas déjà été pendant la lecture du HTML)
  rendreZones();
  chargerVisuels();

  // Lien « Aller au contenu » : focus direct, sinon la balise <base> de la 404 renvoie vers l'accueil
  const evitement = $('.evitement');
  if (evitement) evitement.addEventListener('click', e => {
    const cible = $(evitement.getAttribute('href'));
    if (cible) { e.preventDefault(); cible.focus(); }
  });

  // Bouton panier de l'en-tête
  document.querySelectorAll('.btn-panier').forEach(b => {
    b.setAttribute('aria-controls', 'panier');
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', ouvrirPanier);
  });

  // Bouton « Voir le panier » de la notification
  $('#toast').addEventListener('click', e => {
    if (e.target.closest('[data-voir-panier]')) { $('#toast').classList.remove('visible'); ouvrirPanier(); }
  });

  // Fiche produit
  $('#voile-fiche').addEventListener('click', e => {
    if (e.target.id === 'voile-fiche' || e.target.closest('[data-fermer]')) fermer();
    else if (e.target.closest('[data-moins]')) { quantite = Math.max(1, quantite - 1); majQuantite(); }
    else if (e.target.closest('[data-plus]')) { quantite++; majQuantite(); }
    else if (e.target.closest('[data-valider]')) {
      ajouter([{ id: produitOuvert.id, format: formatOuvert.id, qte: quantite }], `${produitOuvert.nom} ${formatOuvert.nom} ajouté au panier`);
      fermer();
    }
  });
  $('#voile-fiche').addEventListener('change', e => {
    if (e.target.name !== 'format') return;
    formatOuvert = format(e.target.value);
    majQuantite();
  });

  // Panier
  $('#voile-panier').addEventListener('click', e => {
    const cible = e.target.closest('[data-retirer], [data-remettre], [data-etape-formulaire], [data-etape-lignes], [data-fermer]');
    if (e.target.id === 'voile-panier') { fermer(); return; }
    if (!cible) return;
    if (cible.matches('[data-fermer]')) fermer();
    else if (cible.dataset.retirer || cible.dataset.remettre) {
      // Après le nouvel affichage, on remet le focus sur le même bouton (ou sur « Fermer » si la ligne a disparu)
      const id = cible.dataset.retirer || cible.dataset.remettre;
      const attr = cible.dataset.retirer ? 'data-retirer' : 'data-remettre';
      changerQuantite(id, panier[id] + (cible.dataset.retirer ? -1 : 1));
      ($(`[${attr}="${id}"]`) || $('#voile-panier [data-fermer]')).focus();
    }
    else if (cible.matches('[data-etape-formulaire]')) { vuePanier = 'formulaire'; afficherPanier(); }
    else if (cible.matches('[data-etape-lignes]')) { vuePanier = 'lignes'; afficherPanier(); $('[data-etape-formulaire]').focus(); }
  });

  // Clavier : Échap ferme, Tab reste dans la fenêtre ouverte
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fermer();
    garderFocus(e);
  });

  majCompteur();
  appliquerReglages();
  almanach();
  videoHeros();
  apparitions();
});
