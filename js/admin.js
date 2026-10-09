/* ==========================================================
   Pépix · espace admin (démo)
   Vues : tableau de bord, commandes, produits, textes du site.
   Les données viennent de js/donnees.js (localStorage).
   ========================================================== */

const CODE_DEMO = 'pepix2026';
const $ = sel => document.querySelector(sel);
const prix = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const echapper = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONES = {
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  loupe: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};
const icone = nom => `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[nom]}</svg>`;

const dateCourte = iso => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const heure = iso => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dateLongue = iso => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const pastilleStatut = s => `<span class="statut statut-${s}">${STATUTS[s] || s}</span>`;
const articles = c => (c.lignes || []).map(l => `${l.qte} × ${l.nom}`).join(', ');
const nbSachets = c => (c.lignes || []).reduce((a, l) => a + l.qte, 0);
const telSansIndicatif = t => String(t).replace(/[\s.-]/g, '').replace(/^(\+221|00221)/, '');

/* ---------- Connexion ---------- */
const connecte = () => { try { return sessionStorage.getItem('pepix-admin') === '1'; } catch (e) { return false; } };

function afficherConnexion() {
  $('#admin').hidden = true;
  $('#connexion').hidden = false;
  $('#connexion').setAttribute('role', 'main');
  $('#code').focus();
}

function entrer() {
  $('#connexion').hidden = true;
  $('#connexion').removeAttribute('role');
  $('#admin').hidden = false;
  router();
}

/* ---------- Navigation par ancre (#tableau, #commandes...) ---------- */
const VUES = { tableau: vueTableau, commandes: vueCommandes, produits: vueProduits, textes: vueTextes };
let filtreStatut = 'toutes';
let recherche = '';

function router() {
  if (!connecte()) { afficherConnexion(); return; }
  const nom = (location.hash || '#tableau').slice(1).split('/')[0];
  const vue = VUES[nom] ? nom : 'tableau';
  document.querySelectorAll('.admin-nav a').forEach(a => {
    if (a.dataset.vue === vue) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  majPastille();
  VUES[vue]();
  const titre = $('#vue h1');
  document.title = `${titre ? titre.textContent : 'Admin'}, Pépix admin`;
}

function majPastille() {
  const n = Pepix.commandes().filter(c => c.statut === 'nouvelle').length;
  const p = $('#pastille-nouvelles');
  p.hidden = !n;
  p.textContent = n;
  p.setAttribute('aria-label', `${n} nouvelle${n > 1 ? 's' : ''}`);
}

const hautMobile = () => `
  <div class="admin-haut-mobile">
    <img src="img/logo.webp" alt="Pépix admin" width="44" height="40">
    <div><a href="index.html" target="_blank" rel="noopener">Voir le site</a> <button type="button" data-deconnexion>Déconnexion</button></div>
  </div>`;

function rendre(html) {
  const vue = $('#vue');
  vue.innerHTML = hautMobile() + html;
}

/* ---------- Tableau de bord ---------- */
function vueTableau() {
  const toutes = Pepix.commandes();
  const valides = toutes.filter(c => c.statut !== 'annulee');
  const ca = valides.reduce((a, c) => a + c.total, 0);
  const nouvelles = toutes.filter(c => c.statut === 'nouvelle').length;
  const moyen = valides.length ? ca / valides.length : 0;

  if (!toutes.length) {
    rendre(`
      <div class="admin-entete"><div><h1>Tableau de bord</h1><p>Vue d'ensemble des ventes Pépix.</p></div></div>
      <div class="bloc">${etatVide()}</div>`);
    return;
  }

  // Ventes des 14 derniers jours (commandes non annulées)
  const jours = [];
  const aujourdHui = new Date(); aujourdHui.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(aujourdHui); d.setDate(d.getDate() - i);
    jours.push({ d, total: 0, nb: 0 });
  }
  for (const c of valides) {
    const d = new Date(c.date); d.setHours(0, 0, 0, 0);
    const j = jours.find(x => x.d.getTime() === d.getTime());
    if (j) { j.total += c.total; j.nb++; }
  }
  const max = Math.max(...jours.map(j => j.total), 1);
  const pas = arrondiGraphe(max);

  // Sachets vendus par produit
  const parProduit = {};
  for (const c of valides) for (const l of c.lignes || []) parProduit[l.nom] = (parProduit[l.nom] || 0) + l.qte;
  const classement = Object.entries(parProduit).sort((a, b) => b[1] - a[1]);
  const maxProduit = Math.max(...classement.map(x => x[1]), 1);

  rendre(`
    <div class="admin-entete">
      <div><h1>Tableau de bord</h1><p>${valides.length} commande${valides.length > 1 ? 's' : ''} valide${valides.length > 1 ? 's' : ''}, annulées exclues.</p></div>
      <div class="admin-actions"><a class="btn btn-sombre btn-petit" href="#commandes">Voir les commandes</a></div>
    </div>

    <section class="chiffres" aria-label="Chiffres clés">
      <div class="chiffre"><span>Chiffre d'affaires</span><strong>${prix(ca)} F</strong><small>livraison comprise</small></div>
      <div class="chiffre"><span>Commandes</span><strong>${toutes.length}</strong><small>${toutes.filter(c => c.statut === 'livree').length} livrées</small></div>
      <div class="chiffre${nouvelles ? ' alerte' : ''}"><span>À traiter</span><strong>${nouvelles}</strong><small>${nouvelles ? 'à confirmer par téléphone' : 'rien en attente'}</small></div>
      <div class="chiffre"><span>Panier moyen</span><strong>${prix(moyen)} F</strong><small>${(valides.reduce((a, c) => a + nbSachets(c), 0) / (valides.length || 1)).toFixed(1).replace('.', ',')} sachets par commande</small></div>
    </section>

    <div class="grille-bas">
      <section class="bloc" aria-labelledby="t-ventes">
        <div class="bloc-tete"><h2 id="t-ventes">Ventes des 14 derniers jours</h2><span class="aide">en FCFA</span></div>
        <div class="graphe">
          <div class="graphe-axe" aria-hidden="true"><span>${prix(pas * 2)}</span><span>${prix(pas)}</span><span>0</span></div>
          <div class="graphe-zone" id="graphe-zone">
            ${jours.map(j => `<div class="barre" role="img" tabindex="0" data-jour="${j.d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}" data-total="${j.total}" data-nb="${j.nb}"
              aria-label="${j.d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : ${prix(j.total)} FCFA, ${j.nb} commande${j.nb > 1 ? 's' : ''}">
              <i style="height:${(j.total / (pas * 2)) * 100}%"></i></div>`).join('')}
          </div>
          <div class="graphe-mois" aria-hidden="true">${jours.map((j, i) => `<span>${i % 2 === 0 ? j.d.getDate() : ''}</span>`).join('')}</div>
        </div>
      </section>

      <section class="bloc" aria-labelledby="t-produits">
        <div class="bloc-tete"><h2 id="t-produits">Sachets vendus</h2><a class="lien" href="#produits">Produits</a></div>
        ${classement.length ? `<ol class="palmares">
          ${classement.map(([nom, n]) => `<li><span>${echapper(nom)}</span><span class="piste" aria-hidden="true"><i style="width:${(n / maxProduit) * 100}%"></i></span><b>${n}</b></li>`).join('')}
        </ol>` : '<p>Aucun sachet vendu.</p>'}
      </section>
    </div>

    <section class="bloc" aria-labelledby="t-dernieres">
      <div class="bloc-tete"><h2 id="t-dernieres">Dernières commandes</h2><a class="lien" href="#commandes">Tout voir</a></div>
      ${listeCommandes(toutes.slice(0, 5))}
    </section>`);

  brancherGraphe();
}

// Graduation lisible : 2 paliers égaux au-dessus du maximum
function arrondiGraphe(max) {
  const brut = max / 2;
  const p = Math.pow(10, Math.floor(Math.log10(brut)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= brut) return m * p;
  return 10 * p;
}

function brancherGraphe() {
  const zone = $('#graphe-zone');
  if (!zone) return;
  const bulle = document.createElement('div');
  bulle.className = 'infobulle';
  bulle.hidden = true;
  zone.appendChild(bulle);
  const montrer = barre => {
    const { jour, total, nb } = barre.dataset;
    bulle.innerHTML = `<b>${prix(total)} FCFA</b>${jour}, ${nb} commande${nb > 1 ? 's' : ''}`;
    const r = barre.getBoundingClientRect(), z = zone.getBoundingClientRect();
    const hauteur = barre.querySelector('i').getBoundingClientRect().height;
    const x = Math.min(Math.max(r.left - z.left + r.width / 2, 70), z.width - 70);
    bulle.style.left = x + 'px';
    bulle.style.top = (z.height - hauteur) + 'px';
    bulle.hidden = false;
  };
  zone.querySelectorAll('.barre').forEach(b => {
    b.addEventListener('mouseenter', () => montrer(b));
    b.addEventListener('focus', () => montrer(b));
    b.addEventListener('mouseleave', () => { bulle.hidden = true; });
    b.addEventListener('blur', () => { bulle.hidden = true; });
  });
}

function etatVide() {
  return `
    <div class="vide">
      <h2>Aucune commande pour l'instant</h2>
      <p>Les commandes passées sur la boutique depuis ce navigateur apparaîtront ici. Pour une présentation, vous pouvez charger quelques commandes d'exemple.</p>
      <div class="admin-actions">
        <button type="button" class="btn btn-sombre btn-petit" data-exemples>Charger des commandes d'exemple</button>
        <a class="btn btn-contour btn-petit" href="boutique.html" target="_blank" rel="noopener">Ouvrir la boutique</a>
      </div>
    </div>`;
}

/* ---------- Commandes ---------- */
function listeCommandes(liste) {
  if (!liste.length) return '<p class="vide">Aucune commande ne correspond.</p>';
  const exemple = c => c.exemple ? '<span class="etiquette-exemple">exemple</span>' : '';
  return `
    <div class="tableau-defile">
      <table class="tableau">
        <thead><tr><th scope="col">N°</th><th scope="col">Date</th><th scope="col">Client</th><th scope="col">Articles</th><th scope="col" class="num">Total</th><th scope="col">Statut</th></tr></thead>
        <tbody>
          ${liste.map(c => `
          <tr data-commande="${c.numero}">
            <td><button type="button" class="ouvrir-commande" data-commande="${c.numero}">${c.numero}</button>${exemple(c)}</td>
            <td class="date">${dateCourte(c.date)}<br><span>${heure(c.date)}</span></td>
            <td class="client"><b>${echapper(c.nom)}</b><span>${echapper(c.adresse)}</span></td>
            <td>${echapper(articles(c))}</td>
            <td class="num"><b>${prix(c.total)} F</b></td>
            <td>${pastilleStatut(c.statut)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <ul class="cartes-commandes">
      ${liste.map(c => `
      <li><button type="button" class="carte-commande" data-commande="${c.numero}">
        <b>${c.numero} · ${echapper(c.nom)}</b><span class="num">${prix(c.total)} F</span>
        <span>${dateCourte(c.date)} à ${heure(c.date)}, ${echapper(articles(c))}</span>${pastilleStatut(c.statut)}
      </button></li>`).join('')}
    </ul>`;
}

function vueCommandes() {
  const toutes = Pepix.commandes();
  const compte = s => s === 'toutes' ? toutes.length : toutes.filter(c => c.statut === s).length;
  const q = recherche.trim().toLowerCase();
  const liste = toutes
    .filter(c => filtreStatut === 'toutes' || c.statut === filtreStatut)
    .filter(c => !q || [c.numero, c.nom, c.tel, c.adresse, articles(c)].join(' ').toLowerCase().includes(q));

  rendre(`
    <div class="admin-entete">
      <div><h1>Commandes</h1><p>Appelez le client pour confirmer, puis suivez la livraison.</p></div>
      <div class="admin-actions">${toutes.length ? '<button type="button" class="btn btn-contour btn-petit" data-export>Exporter en CSV</button>' : ''}</div>
    </div>
    ${toutes.length ? `
    <div class="outils">
      <div class="recherche">${icone('loupe')}<label class="sr-only" for="recherche">Rechercher une commande</label>
        <input id="recherche" type="search" placeholder="Nom, téléphone, numéro, quartier" value="${echapper(recherche)}" autocomplete="off"></div>
      <div class="filtres" role="group" aria-label="Filtrer par statut">
        ${['toutes', ...Object.keys(STATUTS)].map(s => `<button type="button" data-filtre="${s}" aria-pressed="${filtreStatut === s}">${s === 'toutes' ? 'Toutes' : STATUTS[s]}<span>${compte(s)}</span></button>`).join('')}
      </div>
    </div>
    <div id="resultats" aria-live="polite">${listeCommandes(liste)}</div>` : `<div class="bloc">${etatVide()}</div>`}`);

  const champ = $('#recherche');
  if (champ) champ.addEventListener('input', () => {
    recherche = champ.value;
    const q2 = recherche.trim().toLowerCase();
    const l2 = toutes
      .filter(c => filtreStatut === 'toutes' || c.statut === filtreStatut)
      .filter(c => !q2 || [c.numero, c.nom, c.tel, c.adresse, articles(c)].join(' ').toLowerCase().includes(q2));
    $('#resultats').innerHTML = listeCommandes(l2);
  });
}

/* Détail d'une commande, dans un tiroir à droite */
let dernierFocus = null;
function ouvrirCommande(numero) {
  const c = Pepix.commandes().find(x => x.numero === numero);
  if (!c) return;
  const prenom = String(c.nom).split(' ')[0];
  const tel = telSansIndicatif(c.tel);
  const message = c.statut === 'livree'
    ? `Bonjour ${prenom}, merci pour votre commande ${c.numero} chez Pépix. Bonnes cultures !`
    : `Bonjour ${prenom}, c'est Pépix. Votre commande ${c.numero} (${articles(c)}) est bien reçue. Nous vous livrons à ${c.adresse}. Total : ${prix(c.total)} FCFA.`;
  $('#detail-commande').innerHTML = `
    <div class="panier-haut">
      <div><h2 id="detail-titre">${c.numero}</h2><span class="aide">${dateLongue(c.date)}</span></div>
      <button type="button" class="btn-rond" data-fermer aria-label="Fermer">${icone('x')}</button>
    </div>
    <div class="detail-corps">
      <section>
        <h3 id="t-statut">Statut</h3>
        <div class="etapes-statut" role="group" aria-labelledby="t-statut">
          ${Object.keys(STATUTS).map(s => `<button type="button" data-statut="${s}" aria-pressed="${c.statut === s}">${STATUTS[s]}</button>`).join('')}
        </div>
      </section>
      <section>
        <h3>Client</h3>
        <dl class="detail-infos">
          <dt>Nom</dt><dd>${echapper(c.nom)}</dd>
          <dt>Téléphone</dt><dd><a href="tel:+221${echapper(tel)}">${echapper(c.tel)}</a></dd>
          <dt>Livraison</dt><dd>${echapper(c.adresse)}</dd>
          <dt>Paiement</dt><dd>${echapper(c.paiement)}</dd>
        </dl>
      </section>
      <section>
        <h3>Articles</h3>
        <ul class="detail-lignes">
          ${(c.lignes || []).map(l => `<li><b>${l.qte} × ${echapper(l.nom)}</b><span>${prix(l.qte * l.prix)} F</span></li>`).join('')}
        </ul>
        <div class="detail-total">
          <div><span>Sous-total</span><span>${prix(c.sousTotal)} F</span></div>
          <div><span>Livraison</span><span>${prix(c.livraison)} F</span></div>
          <div class="total"><span>Total</span><span>${prix(c.total)} FCFA</span></div>
        </div>
      </section>
    </div>
    <div class="detail-pied">
      <a class="btn btn-sombre btn-petit" href="https://wa.me/221${encodeURIComponent(tel)}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">Écrire au client</a>
      <a class="btn btn-contour btn-petit" href="tel:+221${echapper(tel)}">Appeler</a>
    </div>`;
  $('#detail-commande').dataset.numero = numero;
  if (!$('#voile-commande').classList.contains('ouvert')) {
    dernierFocus = document.activeElement;
    $('#voile-commande').classList.add('ouvert');
    document.body.classList.add('bloque');
  }
  $('#detail-commande [data-fermer]').focus();
}

function fermerCommande() {
  if (!$('#voile-commande').classList.contains('ouvert')) return;
  $('#voile-commande').classList.remove('ouvert');
  document.body.classList.remove('bloque');
  const num = $('#detail-commande').dataset.numero;
  const cible = document.querySelector(`#vue [data-commande="${num}"]:not(tr)`);
  (cible && cible.offsetParent ? cible : dernierFocus)?.focus?.();
}

function changerStatut(numero, statut) {
  const liste = Pepix.commandes();
  const c = liste.find(x => x.numero === numero);
  if (!c || c.statut === statut) return;
  c.statut = statut;
  Pepix.sauverCommandes(liste);
  notifier(`${numero} : ${STATUTS[statut].toLowerCase()}`);
  router();
  ouvrirCommande(numero);
  const bouton = $(`#detail-commande [data-statut="${statut}"]`);
  if (bouton) bouton.focus();
}

function exporterCSV() {
  const lignes = [['Numéro', 'Date', 'Client', 'Téléphone', 'Adresse', 'Paiement', 'Articles', 'Sous-total', 'Livraison', 'Total', 'Statut']];
  for (const c of Pepix.commandes()) {
    lignes.push([c.numero, new Date(c.date).toLocaleString('fr-FR'), c.nom, c.tel, c.adresse, c.paiement, articles(c), c.sousTotal, c.livraison, c.total, STATUTS[c.statut]]);
  }
  const csv = '﻿' + lignes.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `pepix-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Produits ---------- */
function vueProduits() {
  const produits = Pepix.produits();
  rendre(`
    <div class="admin-entete">
      <div><h1>Produits</h1><p>Prix, variété et disponibilité. Les changements s'appliquent au site dès l'enregistrement.</p></div>
      <div class="admin-actions"><button type="button" class="btn btn-contour btn-petit" data-reinit-produits>Rétablir les valeurs d'origine</button></div>
    </div>
    <div class="produits-admin">
      ${produits.map(p => `
      <article class="produit-admin">
        <div class="produit-admin-haut">
          <span class="vignette photo-${p.id}" aria-hidden="true"></span>
          <div><h2>${p.nom}</h2>${!p.visible ? '<span class="statut statut-annulee">Masqué</span>' : !p.enStock ? '<span class="statut statut-nouvelle">Épuisé</span>' : '<span class="statut statut-confirmee">En vente</span>'}</div>
        </div>
        <form data-produit="${p.id}" novalidate>
          <div class="champ-ligne">
            <div class="champ">
              <label for="var-${p.id}">Variété</label>
              <input id="var-${p.id}" name="variete" value="${echapper(p.variete)}" maxlength="40" required>
            </div>
            <div class="champ">
              <label for="prix-${p.id}">Prix (FCFA)</label>
              <input id="prix-${p.id}" name="prix" type="number" inputmode="numeric" min="100" max="100000" step="50" value="${p.prix}" required aria-describedby="e-prix-${p.id}">
              <span class="msg-erreur" id="e-prix-${p.id}">Entre 100 et 100 000 FCFA.</span>
            </div>
          </div>
          <label class="interrupteur"><span>En stock<small>Sinon la carte affiche « Épuisé »</small></span><input type="checkbox" name="enStock" ${p.enStock ? 'checked' : ''}></label>
          <label class="interrupteur"><span>Affiché sur le site<small>Masqué : retiré de la boutique et des conseils</small></span><input type="checkbox" name="visible" ${p.visible ? 'checked' : ''}></label>
          <button type="submit" class="btn btn-sombre btn-petit">Enregistrer</button>
        </form>
      </article>`).join('')}
    </div>`);
}

function enregistrerProduit(form) {
  const id = form.dataset.produit;
  const prixChamp = form.elements.prix;
  const variete = form.elements.variete;
  const valeur = Number(prixChamp.value);
  const prixOk = Number.isFinite(valeur) && valeur >= 100 && valeur <= 100000;
  prixChamp.setAttribute('aria-invalid', prixOk ? 'false' : 'true');
  variete.setAttribute('aria-invalid', variete.value.trim() ? 'false' : 'true');
  if (!prixOk) { prixChamp.focus(); return; }
  if (!variete.value.trim()) { variete.focus(); return; }
  Pepix.sauverProduit(id, {
    variete: variete.value.trim(),
    prix: Math.round(valeur),
    enStock: form.elements.enStock.checked,
    visible: form.elements.visible.checked,
  });
  notifier(`${Pepix.produits().find(p => p.id === id).nom} enregistré`);
  router();
  const bouton = $(`form[data-produit="${id}"] [type="submit"]`);
  if (bouton) bouton.focus();
}

/* ---------- Textes du site ---------- */
const CHAMPS_TEXTES = [
  { titre: 'Annonce en haut du site', champs: [
    { cle: 'annonce', label: 'Message', aide: 'Laissez vide pour ne rien afficher. Exemple : Livraison offerte ce week-end à Dakar.', max: 120 },
  ] },
  { titre: "Accueil, haut de page", champs: [
    { cle: 'herosTitre', label: 'Titre', aide: 'Le dernier mot passe en jaune.', max: 60, requis: true },
    { cle: 'herosTexte', label: 'Texte sous le titre', max: 200, zone: true, requis: true },
  ] },
  { titre: 'Accueil, bandeau photo', champs: [
    { cle: 'bandeauTitre', label: 'Titre', max: 80, requis: true },
    { cle: 'bandeauTexte', label: 'Texte', max: 160, zone: true, requis: true },
  ] },
  { titre: 'Livraison et contact', champs: [
    { cle: 'fraisLivraison', label: 'Frais de livraison (FCFA)', aide: '0 pour une livraison offerte.', type: 'number' },
    { cle: 'whatsapp', label: 'Numéro WhatsApp', aide: 'Avec l\'indicatif, par exemple 221771234567. Utilisé par les boutons « Écrire sur WhatsApp ».', type: 'tel' },
  ] },
];

function vueTextes() {
  const r = Pepix.reglages();
  const champ = f => {
    const v = echapper(r[f.cle]);
    const attrs = `id="r-${f.cle}" name="${f.cle}" ${f.max ? `maxlength="${f.max}"` : ''} ${f.requis ? 'required' : ''} aria-describedby="${f.aide ? `a-${f.cle} ` : ''}e-${f.cle}"`;
    const entree = f.zone ? `<textarea ${attrs}>${v}</textarea>`
      : f.type === 'number' ? `<input ${attrs} type="number" inputmode="numeric" min="0" max="20000" step="50" value="${v}">`
      : f.type === 'tel' ? `<input ${attrs} type="tel" inputmode="tel" value="${v}">`
      : `<input ${attrs} value="${v}">`;
    return `<div class="champ">
      <label for="r-${f.cle}">${f.label}</label>
      ${f.aide ? `<span class="aide" id="a-${f.cle}">${f.aide}</span>` : ''}
      ${entree}
      <span class="msg-erreur" id="e-${f.cle}">${f.type === 'number' ? 'Entre 0 et 20 000 FCFA.' : f.type === 'tel' ? 'Chiffres uniquement, avec l\'indicatif.' : 'Ce champ ne peut pas être vide.'}</span>
    </div>`;
  };
  rendre(`
    <div class="admin-entete">
      <div><h1>Textes du site</h1><p>Ce que voient les visiteurs. Ouvrez le site dans un autre onglet pour voir le résultat.</p></div>
    </div>
    <form class="form-textes" id="form-textes" novalidate>
      ${CHAMPS_TEXTES.map(g => `<fieldset><legend>${g.titre}</legend>${g.champs.map(champ).join('')}</fieldset>`).join('')}
      <div class="barre-enregistrer">
        <button type="submit" class="btn btn-sombre btn-petit">Enregistrer les textes</button>
        <a class="btn btn-contour btn-petit" href="index.html" target="_blank" rel="noopener">Voir l'accueil</a>
        <button type="button" class="btn btn-contour btn-petit" data-reinit-textes>Textes d'origine</button>
      </div>
      <fieldset class="zone-danger">
        <legend>Données de démonstration</legend>
        <p>Les commandes et réglages sont gardés dans ce navigateur. Vous pouvez ajouter des commandes d'exemple pour une présentation, ou tout effacer.</p>
        <div class="admin-actions">
          <button type="button" class="btn btn-contour btn-petit" data-exemples>Ajouter des commandes d'exemple</button>
          <button type="button" class="btn btn-danger btn-petit" data-effacer>Effacer toutes les commandes</button>
        </div>
      </fieldset>
    </form>`);
}

function enregistrerTextes(form) {
  const r = Pepix.reglages();
  let premierFautif = null;
  for (const g of CHAMPS_TEXTES) for (const f of g.champs) {
    const el = form.elements[f.cle];
    let ok = true;
    if (f.requis) ok = el.value.trim().length > 0;
    if (f.type === 'number') { const n = Number(el.value); ok = el.value !== '' && Number.isFinite(n) && n >= 0 && n <= 20000; }
    if (f.type === 'tel') ok = el.value.trim() === '' || /^\d{8,15}$/.test(el.value.replace(/[\s+.-]/g, ''));
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (!ok && !premierFautif) premierFautif = el;
    if (ok) r[f.cle] = f.type === 'number' ? Math.round(Number(el.value)) : f.type === 'tel' ? el.value.replace(/[\s+.-]/g, '') : el.value.trim();
  }
  if (premierFautif) { premierFautif.focus(); return; }
  Pepix.sauverReglages(r);
  notifier('Textes enregistrés');
}

/* ---------- Commandes d'exemple (marquées comme telles) ---------- */
function chargerExemples() {
  const clients = [
    ['Awa Ndiaye', '771234501', 'Point E, Dakar'], ['Moussa Diop', '781234502', 'Pikine, Dakar'],
    ['Fatou Sarr', '761234503', 'Rufisque'], ['Ibrahima Fall', '701234504', 'Thiès'],
    ['Mariama Ba', '771234505', 'Parcelles Assainies, Dakar'], ['Cheikh Sy', '751234506', 'Mbour'],
    ['Aminata Diallo', '771234507', 'Keur Massar'], ['Ousmane Gueye', '781234508', 'Sangalkam'],
  ];
  const produits = Pepix.produits();
  const paiements = ['Wave', 'Orange Money', 'Paiement à la livraison'];
  const liste = Pepix.commandes();
  let n = liste.reduce((m, x) => Math.max(m, parseInt(String(x.numero).replace(/\D/g, ''), 10) || 0), 1000);
  const frais = Number(Pepix.reglages().fraisLivraison) || 0;
  const nouvelles = [];
  for (let i = 0; i < 12; i++) {
    const [nom, tel, adresse] = clients[i % clients.length];
    const choix = produits.filter((_, k) => (i + k) % 3 !== 0).slice(0, 1 + (i % 3));
    const lignes = choix.map((p, k) => ({ id: p.id, nom: p.nom, variete: p.variete, prix: p.prix, qte: 1 + ((i + k) % 4) }));
    const st = lignes.reduce((a, l) => a + l.qte * l.prix, 0);
    const d = new Date(); d.setDate(d.getDate() - Math.floor(i * 1.1)); d.setHours(8 + (i * 3) % 11, (i * 17) % 60, 0, 0);
    nouvelles.push({
      numero: 'PX-' + (++n), date: d.toISOString(), nom, tel, adresse, paiement: paiements[i % 3],
      lignes, sousTotal: st, livraison: frais, total: st + frais, exemple: true,
      statut: i < 2 ? 'nouvelle' : i === 5 ? 'annulee' : i < 4 ? 'confirmee' : 'livree',
    });
  }
  const tout = [...nouvelles, ...liste].sort((a, b) => b.date.localeCompare(a.date));
  Pepix.sauverCommandes(tout);
  notifier("12 commandes d'exemple ajoutées");
  router();
}

/* ---------- Notification ---------- */
let minuteur;
function notifier(texte) {
  const t = $('#toast');
  t.innerHTML = `${icone('check')}<span>${echapper(texte)}</span>`;
  t.classList.add('visible');
  clearTimeout(minuteur);
  minuteur = setTimeout(() => t.classList.remove('visible'), 2800);
}

/* ---------- Événements ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#form-connexion').addEventListener('submit', e => {
    e.preventDefault();
    const champ = $('#code');
    if (champ.value.trim() === CODE_DEMO) {
      try { sessionStorage.setItem('pepix-admin', '1'); } catch (err) { /* navigation privée */ }
      champ.value = '';
      entrer();
      $('#vue').focus();
    } else {
      champ.setAttribute('aria-invalid', 'true');
      champ.select();
    }
  });
  $('#code').addEventListener('input', e => e.target.removeAttribute('aria-invalid'));

  const sortir = () => { try { sessionStorage.removeItem('pepix-admin'); } catch (e) { /* rien */ } fermerCommande(); afficherConnexion(); };
  $('#deconnexion').addEventListener('click', sortir);

  window.addEventListener('hashchange', () => { fermerCommande(); router(); $('#vue').focus(); });

  // Clics dans la vue (délégation)
  $('#vue').addEventListener('click', e => {
    const cible = e.target.closest('[data-commande], [data-filtre], [data-export], [data-exemples], [data-effacer], [data-reinit-produits], [data-reinit-textes], [data-deconnexion]');
    if (!cible) return;
    if (cible.dataset.commande) ouvrirCommande(cible.dataset.commande);
    else if (cible.dataset.filtre) { filtreStatut = cible.dataset.filtre; vueCommandes(); $(`[data-filtre="${filtreStatut}"]`).focus(); }
    else if (cible.matches('[data-export]')) exporterCSV();
    else if (cible.matches('[data-exemples]')) chargerExemples();
    else if (cible.matches('[data-effacer]')) {
      if (cible.dataset.confirmer) { Pepix.sauverCommandes([]); notifier('Toutes les commandes ont été effacées'); router(); }
      else { cible.dataset.confirmer = '1'; cible.textContent = 'Cliquez encore pour confirmer'; setTimeout(() => { if (cible.isConnected) { delete cible.dataset.confirmer; cible.textContent = 'Effacer toutes les commandes'; } }, 4000); }
    }
    else if (cible.matches('[data-reinit-produits]')) { Pepix.reinitialiserProduits(); notifier("Produits remis aux valeurs d'origine"); router(); }
    else if (cible.matches('[data-reinit-textes]')) { Pepix.reinitialiserReglages(); notifier("Textes d'origine rétablis"); router(); }
    else if (cible.matches('[data-deconnexion]')) sortir();
  });

  $('#vue').addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.matches('[data-produit]')) enregistrerProduit(e.target);
    else if (e.target.id === 'form-textes') enregistrerTextes(e.target);
  });
  $('#vue').addEventListener('input', e => {
    if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid');
  });

  // Tiroir de détail
  $('#voile-commande').addEventListener('click', e => {
    if (e.target.id === 'voile-commande' || e.target.closest('[data-fermer]')) { fermerCommande(); return; }
    const b = e.target.closest('[data-statut]');
    if (b) changerStatut($('#detail-commande').dataset.numero, b.dataset.statut);
  });
  document.addEventListener('keydown', e => {
    if (!$('#voile-commande').classList.contains('ouvert')) return;
    if (e.key === 'Escape') { fermerCommande(); return; }
    if (e.key !== 'Tab') return;
    const f = [...$('#detail-commande').querySelectorAll('a[href], button:not([disabled])')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  // Une commande passée dans un autre onglet apparaît tout de suite
  window.addEventListener('storage', e => {
    if (!connecte() || e.key !== 'pepix-commandes') return;
    const avant = JSON.parse(e.oldValue || '[]').length, apres = JSON.parse(e.newValue || '[]').length;
    if (apres > avant) notifier(`Nouvelle commande : ${JSON.parse(e.newValue)[0].numero}`);
    const ouvert = $('#voile-commande').classList.contains('ouvert');
    if (!ouvert) router(); else majPastille();
  });

  if (connecte()) entrer(); else afficherConnexion();
});
