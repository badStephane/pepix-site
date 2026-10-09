/* ==========================================================
   Pépix · script principal
   - données des produits
   - affichage des cartes, du calendrier et des fiches
   - fiche produit (fenêtre), panier (tiroir), commande et notifications
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

// Mois de semis (s) et de récolte (r) : 0 = janvier ... 11 = décembre
const CALENDRIER = {
  oignon: { s: [9, 10, 11], r: [1, 2, 3, 4] },
  tomate: { s: [9, 10, 11, 0, 1], r: [0, 1, 2, 3, 4] },
  chou:   { s: [9, 10, 11, 0], r: [0, 1, 2, 3] },
  piment: { s: [9, 10, 11, 0, 1, 2], r: [0, 1, 2, 3, 4, 5] },
};
const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const FRAIS_LIVRAISON = 1000;

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
};
const icone = (nom, classe = 'icone') =>
  `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[nom]}</svg>`;

// Format "1 500"
const prix = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const $ = sel => document.querySelector(sel);
const produit = id => PRODUITS.find(p => p.id === id);

/* ---------- Panier (sauvegardé dans le navigateur) ---------- */
let panier = {};
try { panier = JSON.parse(localStorage.getItem('pepix-panier')) || {}; } catch (e) { panier = {}; }
let vuePanier = 'lignes';          // 'lignes' | 'formulaire' | 'confirmation'
let derniereCommande = null;

function sauverPanier() {
  try { localStorage.setItem('pepix-panier', JSON.stringify(panier)); } catch (e) { /* navigation privée */ }
  majCompteur();
}

const nombreArticles = () => Object.values(panier).reduce((a, b) => a + b, 0);
const sousTotal = () => PRODUITS.reduce((a, p) => a + (panier[p.id] || 0) * p.prix, 0);

function majCompteur(animer) {
  const n = nombreArticles();
  document.querySelectorAll('.btn-panier').forEach(b => {
    const c = b.querySelector('.compteur');
    c.textContent = n;
    b.setAttribute('aria-label', 'Panier, ' + n + ' article' + (n > 1 ? 's' : ''));
    if (animer) { c.classList.remove('saut'); void c.offsetWidth; c.classList.add('saut'); }
  });
}

function ajouter(id, qte = 1, bouton) {
  panier[id] = (panier[id] || 0) + qte;
  vuePanier = 'lignes';
  sauverPanier();
  majCompteur(true);
  notifier(`${produit(id).nom} ajouté au panier`);
  if (bouton) confirmerBouton(bouton);
}

// Le bouton « Ajouter » affiche « Ajouté » quelques instants
function confirmerBouton(bouton) {
  if (!bouton.dataset.texte) bouton.dataset.texte = bouton.innerHTML;
  bouton.innerHTML = icone('check') + 'Ajouté';
  bouton.classList.add('ajoute');
  clearTimeout(bouton._t);
  bouton._t = setTimeout(() => { bouton.innerHTML = bouton.dataset.texte; bouton.classList.remove('ajoute'); }, 1400);
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
  t.innerHTML = `${icone('check')}<span>${texte}</span><button type="button" data-voir-panier>Voir le panier</button>`;
  t.classList.add('visible');
  clearTimeout(minuteur);
  minuteur = setTimeout(() => t.classList.remove('visible'), 3200);
}

/* ---------- Cartes produit (accueil et boutique) ---------- */
function carteProduit(p, avecLivraison) {
  // Toute la carte est cliquable grâce au bouton du titre (étendu en CSS),
  // sans imbriquer deux boutons l'un dans l'autre.
  return `
    <article class="carte apparait" data-id="${p.id}">
      <div class="carte-image photo-${p.id}" role="img" aria-label="Sachet de semences ${p.nom} Pépix"><span class="voir" aria-hidden="true">Voir la fiche</span></div>
      <div class="carte-corps">
        <span class="origine">Semences Pépix</span>
        <h3><button type="button" class="carte-ouvrir" data-ouvrir="${p.id}" aria-label="${p.nom}, voir la fiche">${p.nom}</button></h3>
        <span class="variete">Variété ${p.variete} · 5 g</span>
        ${avecLivraison ? `<span class="livraison">${icone('camion')}Livraison 24–48 h à Dakar</span>` : ''}
        <div class="carte-pied">
          <strong>${prix(p.prix)} FCFA</strong>
          <button type="button" class="btn btn-jaune" data-ajouter="${p.id}" aria-label="Ajouter ${p.nom} au panier">Ajouter</button>
        </div>
      </div>
    </article>`;
}

function afficherProduits(conteneur, avecLivraison) {
  conteneur.innerHTML = PRODUITS.map(p => carteProduit(p, avecLivraison)).join('');
  conteneur.addEventListener('click', e => {
    const bouton = e.target.closest('[data-ajouter]');
    if (bouton) { ajouter(bouton.dataset.ajouter, 1, bouton); return; }
    const carte = e.target.closest('.carte');
    if (carte) ouvrirFiche(carte.dataset.id);
  });
}

/* ---------- Page Conseils : calendrier et fiches ---------- */
function afficherCalendrier(conteneur) {
  const ceMois = new Date().getMonth();
  let html = '<div class="ligne-cal" aria-hidden="true"><span></span>' +
    MOIS.map((m, i) => `<span class="mois${i === ceMois ? ' actuel' : ''}">${m}</span>`).join('') + '</div>';
  for (const p of PRODUITS) {
    const c = CALENDRIER[p.id];
    html += `<div class="ligne-cal"><strong>${p.nom}</strong>`;
    MOIS.forEach((m, i) => {
      const s = c.s.includes(i), r = c.r.includes(i);
      const classe = (s && r ? 'sr' : s ? 's' : r ? 'r' : '') + (i === ceMois ? ' actuel' : '');
      const texte = s && r ? 'S·R' : s ? 'S' : r ? 'R' : '';
      const titre = s && r ? 'semis et récolte' : s ? 'semis' : r ? 'récolte' : 'pas de semis ni de récolte';
      html += `<span class="case ${classe}" title="${MOIS_LONGS[i]} : ${titre}"><span aria-hidden="true">${texte}</span><span class="sr-only">${p.nom}, ${MOIS_LONGS[i]} : ${titre}</span></span>`;
    });
    html += '</div>';
  }
  // Conseil calculé pour le mois en cours
  const aSemer = PRODUITS.filter(p => CALENDRIER[p.id].s.includes(ceMois)).map(p => p.nom.toLowerCase());
  const aRecolter = PRODUITS.filter(p => CALENDRIER[p.id].r.includes(ceMois)).map(p => p.nom.toLowerCase());
  const phrase = [
    aSemer.length ? `à semer : ${aSemer.join(', ')}` : '',
    aRecolter.length ? `à récolter : ${aRecolter.join(', ')}` : '',
  ].filter(Boolean).join(' · ') || 'période de repos pour ces cultures';
  html += `<p class="cal-note"><b>En ${MOIS_LONGS[ceMois]}</b>, ${phrase}.</p>`;
  conteneur.insertAdjacentHTML('beforeend', html);
}

function afficherFiches(conteneur) {
  conteneur.innerHTML = PRODUITS.map(p => `
    <article class="fiche apparait" id="fiche-${p.id}">
      <div class="fiche-haut">
        <div>
          <span class="fiche-vignette photo-${p.id}" aria-hidden="true"></span>
          <div><h2>${p.nom}</h2><span class="variete-fiche">${p.variete}</span></div>
        </div>
      </div>
      <div class="reperes">
        <div class="repere"><span>Semis</span><b>${p.semis}</b></div>
        <div class="repere"><span>Cycle</span><b>${p.cycle}</b></div>
        <div class="repere"><span>Espacement</span><b>${p.espacement}</b></div>
      </div>
      <ol>${p.conseils.map(c => `<li>${c}</li>`).join('')}</ol>
      <div class="fiche-pied">
        <strong>Sachet 5 g · ${prix(p.prix)} FCFA</strong>
        <button type="button" class="btn btn-jaune" data-ajouter="${p.id}" aria-label="Ajouter ${p.nom} au panier">Ajouter au panier</button>
      </div>
    </article>`).join('');
  conteneur.addEventListener('click', e => {
    const bouton = e.target.closest('[data-ajouter]');
    if (bouton) ajouter(bouton.dataset.ajouter, 1, bouton);
  });
}

/* ---------- Fenêtre fiche produit ---------- */
let produitOuvert = null;
let quantite = 1;

function ouvrirFiche(id) {
  produitOuvert = produit(id);
  quantite = 1;
  const p = produitOuvert;
  $('#fiche-contenu').innerHTML = `
    <div class="modale-image photo-${p.id}" role="img" aria-label="Sachet de semences ${p.nom} Pépix"></div>
    <div class="modale-corps">
      <div class="modale-haut">
        <span class="origine">Semences Pépix</span>
        <button type="button" class="btn-rond" data-fermer aria-label="Fermer">${icone('x')}</button>
      </div>
      <h2 id="fiche-titre">${p.nom}</h2>
      <span class="variete">Variété ${p.variete} · sachet 5 g</span>
      <div class="reperes">
        <div class="repere"><span>Semis</span><b>${p.semis}</b></div>
        <div class="repere"><span>Cycle</span><b>${p.cycle}</b></div>
        <div class="repere"><span>Espacement</span><b>${p.espacement}</b></div>
      </div>
      <span class="livraison">${icone('camion')}Livraison 24–48 h à Dakar</span>
      <a class="modale-lien" href="conseils.html#fiche-${p.id}">Voir la fiche de culture complète</a>
      <div class="modale-actions">
        <div class="quantite" role="group" aria-label="Quantité">
          <button type="button" data-moins aria-label="Diminuer la quantité" disabled>${icone('moins')}</button>
          <strong id="fiche-qte" aria-live="polite">1</strong>
          <button type="button" data-plus aria-label="Augmenter la quantité">${icone('plus')}</button>
        </div>
        <button type="button" class="btn btn-vert" data-valider>Ajouter · <span id="fiche-total">${prix(p.prix)}</span>&nbsp;FCFA</button>
      </div>
    </div>`;
  ouvrir('#voile-fiche');
}

function majQuantite() {
  $('#fiche-qte').textContent = quantite;
  $('#fiche-total').textContent = prix(produitOuvert.prix * quantite);
  $('[data-moins]').disabled = quantite <= 1;
}

/* ---------- Tiroir panier ---------- */
function afficherPanier() {
  const zone = $('#panier-zone');
  const lignes = PRODUITS.filter(p => panier[p.id]);

  if (vuePanier === 'confirmation' && derniereCommande) {
    const c = derniereCommande;
    zone.innerHTML = `
      <div class="panier-message" tabindex="-1" id="confirmation">
        <span class="grand-icone ok">${icone('check')}</span>
        <strong>Merci ${c.nom.split(' ')[0]} !</strong>
        <span>Votre commande <b>${c.numero}</b> est enregistrée. Nous vous appelons au ${c.tel} pour confirmer la livraison.</span>
        <div class="recap">
          <div><span>Articles</span><span>${c.articles}</span></div>
          <div><span>Livraison</span><span>${c.adresse}</span></div>
          <div><span>Paiement</span><span>${c.paiement}</span></div>
          <div><b>Total</b><b>${prix(c.total)} FCFA</b></div>
        </div>
        <span style="font-size:13px">Site de démonstration (projet d'école) : aucune commande n'est réellement envoyée.</span>
        <button type="button" class="btn btn-vert" data-fermer>Continuer mes achats</button>
      </div>`;
    $('#confirmation').focus();
    return;
  }

  if (lignes.length === 0) {
    vuePanier = 'lignes';
    zone.innerHTML = `
      <div class="panier-message">
        <span class="grand-icone">${icone('sac')}</span>
        <span>Votre panier est vide.</span>
        <a class="btn btn-vert" href="boutique.html">Voir la boutique</a>
      </div>`;
    return;
  }

  const st = sousTotal();
  const recapTotal = `
    <div class="panier-total">
      <div><span>Sous-total</span><span>${prix(st)} FCFA</span></div>
      <div><span>Livraison</span><span>${prix(FRAIS_LIVRAISON)} FCFA</span></div>
      <div class="total"><span>Total</span><span>${prix(st + FRAIS_LIVRAISON)} FCFA</span></div>
      ${vuePanier === 'lignes'
        ? `<button type="button" class="btn btn-sombre" data-etape-formulaire>Commander ${icone('fleche')}</button>
           <small>Wave · Orange Money · Paiement à la livraison</small>`
        : `<button type="submit" form="form-commande" class="btn btn-sombre">Confirmer la commande</button>`}
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
      ${lignes.map(p => `
        <div class="ligne">
          <div class="ligne-info">
            <span class="ligne-vignette photo-${p.id}" aria-hidden="true"></span>
            <div><strong>${p.nom}</strong><span>${p.variete} · ${prix(p.prix)} F</span></div>
          </div>
          <div class="ligne-qte">
            <button type="button" data-retirer="${p.id}" aria-label="Retirer un ${p.nom}">${icone('moins')}</button>
            <strong aria-label="${panier[p.id]} sachet${panier[p.id] > 1 ? 's' : ''}">${panier[p.id]}</strong>
            <button type="button" data-remettre="${p.id}" aria-label="Ajouter un ${p.nom}">${icone('plus')}</button>
          </div>
          <strong>${prix(p.prix * panier[p.id])} F</strong>
        </div>`).join('')}
    </div>` + recapTotal;
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
    derniereCommande = {
      numero: 'PX-' + Math.floor(1000 + Math.random() * 9000),
      nom: d.get('nom').trim(),
      tel: d.get('tel').trim(),
      adresse: d.get('adresse').trim(),
      paiement: d.get('paiement'),
      articles: PRODUITS.filter(p => panier[p.id]).map(p => `${panier[p.id]} × ${p.nom}`).join(', '),
      total: st + FRAIS_LIVRAISON,
    };
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

/* ---------- Apparition douce des blocs au défilement ---------- */
function animerApparitions() {
  // Pas d'animation si le visiteur a demandé à réduire les mouvements : tout reste visible
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-anim');
  const blocs = document.querySelectorAll('.apparait');
  const obs = new IntersectionObserver(entrees => {
    entrees.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  blocs.forEach(b => obs.observe(b));
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

  // Met la vidéo en pause quand l'accueil n'est plus à l'écran (économise la batterie)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) video.pause();
      else if (voulue) lire();
    }).observe(video);
  }
}

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
    else if (e.target.closest('[data-valider]')) { ajouter(produitOuvert.id, quantite); fermer(); }
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
  animerApparitions();
  videoHeros();
});
