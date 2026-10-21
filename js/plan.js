/* ==========================================================
   Pépix · plan de culture daté, sous le résultat du calculateur
   Le calculateur (afficherCalculateur, js/main.js) appelle maj() à chaque calcul.
   Chargé avant js/main.js : il n'utilise ses fonctions (echapper, icone, notifier...)
   qu'au moment de l'affichage.

   Dates comptées depuis le jour de semis choisi :
     repiquage          = semis + pepiniereSemaines [min, max]   (js/donnees.js)
     début des récoltes = semis + cycle [min, max] en jours, lu dans « 70–90 jours »
   Mois de semis : CALENDRIER (js/main.js). Hors saison, on propose le 1er jour
   du prochain mois de semis. Valeurs indicatives, à faire relire par le porteur du projet.
   ========================================================== */
const PLAN_RAPPEL = 'PT8H';           // rappel d'agenda à 8 h le jour de l'étape
const PLAN_OCTETS_LIGNE = 75;         // longueur maximale d'une ligne de fichier agenda (RFC 5545)
const PLAN_SITE = 'https://pepix.pages.dev';

const planJour = (d, n = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const planIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const planLireIso = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
// « mer. 1er oct. » : le français écrit « 1er » pour le premier du mois
const planPremier = t => t.replace(/(^|\s)1 /, '$11er ');
const planDate = d => planPremier(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }));
const planDateCourte = d => planPremier(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
const planFourchette = (a, b) => +a === +b ? planDate(a) : `entre le ${planDateCourte(a)} et le ${planDateCourte(b)}`;
const planDeMois = m => (/^[aeiouéâ]/.test(m) ? "d'" : 'de ') + m;

// « 120–150 jours » donne [120, 150] ; « 90 jours » donne [90, 90]
function planCycle(p) {
  const n = String(p.cycle || '').match(/\d+/g);
  return n ? [Number(n[0]), Number(n[1] || n[0])] : null;
}

const planSemable = (p, d) => !!CALENDRIER[p.id] && CALENDRIER[p.id].s.includes(d.getMonth());

// Le jour même s'il est dans la saison, sinon le 1er du prochain mois de semis
function planProchainSemis(p, depuis) {
  for (let i = 0; i < 12; i++) {
    const d = i === 0 ? depuis : new Date(depuis.getFullYear(), depuis.getMonth() + i, 1);
    if (planSemable(p, d)) return d;
  }
  return null;
}

function planEtapes(p, semis) {
  const pepiniere = p.pepiniereSemaines;
  const cycle = planCycle(p);
  const entretien = (etapesDe(p) || [])[3];
  return [
    { cle: 'semis', titre: 'Semis en pépinière', debut: semis, fin: semis },
    pepiniere && { cle: 'repiquage', titre: 'Repiquage', debut: planJour(semis, pepiniere[0] * 7), fin: planJour(semis, pepiniere[1] * 7) },
    entretien && { cle: 'entretien', titre: 'Entretien', texte: entretien.court.charAt(0).toUpperCase() + entretien.court.slice(1) },
    cycle && { cle: 'recolte', titre: 'Début des récoltes', debut: planJour(semis, cycle[0]), fin: planJour(semis, cycle[1]) },
  ].filter(Boolean);
}

/* ---------- Fichier agenda (.ics) : une journée par étape datée, rappel à 8 h ---------- */
const planTexteIcs = t => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const planDateIcs = d => planIso(d).replace(/-/g, '');

// Coupe une ligne à 75 octets (les accents comptent pour 2 octets), suite précédée d'une espace
function planPlier(ligne) {
  const enc = new TextEncoder();
  const morceaux = [];
  let courant = '';
  let octets = 0;
  for (const c of ligne) {
    const n = enc.encode(c).length;
    const max = morceaux.length ? PLAN_OCTETS_LIGNE - 1 : PLAN_OCTETS_LIGNE;
    if (octets + n > max) { morceaux.push(courant); courant = ''; octets = 0; }
    courant += c;
    octets += n;
  }
  return [...morceaux, courant].join('\r\n ');
}

function planIcs(p, etapes) {
  const maintenant = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const conseil = etapes.find(e => e.cle === 'entretien');
  const evenements = etapes.filter(e => e.debut).flatMap(e => {
    const titre = `Pépix · ${e.titre} : ${p.nom.toLowerCase()}`;
    const detail = [
      e.fin > e.debut ? `À faire ${planFourchette(e.debut, e.fin)}.` : '',
      e.cle === 'repiquage' && conseil ? `Ensuite : ${conseil.texte.toLowerCase()}.` : '',
      `Fiche de culture : ${PLAN_SITE}/conseils#fiche-${p.id}`,
    ].filter(Boolean).join('\n');
    return [
      'BEGIN:VEVENT',
      `UID:pepix-${p.id}-${e.cle}-${planDateIcs(e.debut)}@pepix.pages.dev`,
      `DTSTAMP:${maintenant}`,
      `DTSTART;VALUE=DATE:${planDateIcs(e.debut)}`,
      `DTEND;VALUE=DATE:${planDateIcs(planJour(e.fin, 1))}`,
      `SUMMARY:${planTexteIcs(titre)}`,
      `DESCRIPTION:${planTexteIcs(detail)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${planTexteIcs(titre)}`, `TRIGGER:${PLAN_RAPPEL}`, 'END:VALARM',
      'END:VEVENT',
    ];
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pépix//Plan de culture//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    ...evenements, 'END:VCALENDAR'].map(planPlier).join('\r\n') + '\r\n';
}

function planTelecharger(p, etapes) {
  try {
    const url = URL.createObjectURL(new Blob([planIcs(p, etapes)], { type: 'text/calendar;charset=utf-8' }));
    const lien = Object.assign(document.createElement('a'), { href: url, download: `plan-pepix-${p.id}.ics` });
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notifier("Plan téléchargé : ouvrez le fichier pour l'ajouter à votre agenda");
  } catch (e) {
    notifier("Cet appareil n'a pas pu créer le fichier agenda. Envoyez-vous le plan sur WhatsApp.");
  }
}

/* ---------- Message WhatsApp : le plan en texte, à garder ou à transmettre ---------- */
function planMessage(p, etapes, proposition) {
  const lignes = etapes.map(e => `• ${e.titre} : ${e.debut ? planFourchette(e.debut, e.fin) : e.texte.toLowerCase()}`);
  const commande = proposition.combi.lignes.map(([f, n]) => `${n} × ${f.nom}`).join(' + ');
  return [
    `Mon plan de culture Pépix : ${p.nom.toLowerCase()} sur ${proposition.surface}`,
    ...lignes,
    `Semences : ${commande} (${prix(proposition.combi.total)} FCFA)`,
    `${PLAN_SITE}/boutique?culture=${p.id}#calculateur`,
  ].join('\n');
}

/* ---------- Affichage ---------- */
function creerPlan(zone) {
  const aujourdhui = planJour(new Date());
  zone.innerHTML = `
    <div class="plan" role="group" aria-labelledby="plan-titre">
      <div class="plan-tete">
        <div>
          <p class="surtitre">Et ensuite&nbsp;?</p>
          <h3 id="plan-titre">Votre plan de culture</h3>
        </div>
        <div class="plan-date">
          <label for="plan-date">Date de semis</label>
          <input type="date" id="plan-date" min="${planIso(aujourdhui)}">
        </div>
      </div>
      <div class="plan-alerte" role="status" hidden></div>
      <ol class="plan-etapes"></ol>
      <div class="plan-actions">
        <button type="button" class="btn btn-vert" data-plan-agenda>${icone('calendrier')}Ajouter les dates à mon agenda</button>
        <a class="btn btn-contour" data-plan-wa href="#" target="_blank" rel="noopener">Envoyer le plan sur WhatsApp</a>
      </div>
      <p class="calcul-mention">Dates indicatives, selon la fiche de culture. L'agenda vous rappelle chaque étape à 8&nbsp;h.</p>
    </div>`;

  const champ = zone.querySelector('#plan-date');
  const alerte = zone.querySelector('.plan-alerte');
  const liste = zone.querySelector('.plan-etapes');
  const actions = zone.querySelector('.plan-actions');
  const lienWa = zone.querySelector('[data-plan-wa]');
  let proposition = null;
  let etapes = [];
  let dateChoisie = false;   // tant que le visiteur n'a pas choisi, la date suit la culture

  const dessiner = () => {
    const p = proposition.p;
    const semis = planLireIso(champ.value);
    const saison = CALENDRIER[p.id] ? CALENDRIER[p.id].s : [];
    const prochain = semis && planProchainSemis(p, semis < aujourdhui ? aujourdhui : semis);
    const valide = !!semis && semis >= aujourdhui && planSemable(p, semis);
    etapes = valide ? planEtapes(p, semis) : [];
    alerte.hidden = valide;
    if (!valide) {
      const texte = !semis || semis < aujourdhui
        ? 'Choisissez une date de semis à partir d’aujourd’hui.'
        : `${echapper(p.nom)} : semis ${planDeMois(MOIS_LONGS[saison[0]])} à ${MOIS_LONGS[saison[saison.length - 1]]}.`;
      alerte.innerHTML = `${icone('alerte')}<span>${texte}</span>${prochain
        ? `<button type="button" class="lien" data-plan-prochain="${planIso(prochain)}">Semer le ${planDate(prochain)}</button>` : ''}`;
    }
    liste.innerHTML = etapes.map(e => `
      <li class="plan-etape plan-${e.cle}">
        <span class="plan-quand">${e.debut ? planFourchette(e.debut, e.fin) : 'Pendant la culture'}</span>
        <strong>${e.titre}</strong>
        ${e.texte ? `<span>${echapper(e.texte)}</span>` : ''}
      </li>`).join('');
    actions.hidden = !valide;
    if (valide) lienWa.href = `https://wa.me/?text=${encodeURIComponent(planMessage(p, etapes, proposition))}`;
  };

  champ.addEventListener('change', () => { dateChoisie = true; dessiner(); });
  alerte.addEventListener('click', e => {
    const bouton = e.target.closest('[data-plan-prochain]');
    if (!bouton) return;
    champ.value = bouton.dataset.planProchain;
    dateChoisie = true;
    dessiner();
    champ.focus();
  });
  zone.querySelector('[data-plan-agenda]').addEventListener('click', () => {
    if (proposition && etapes.length) planTelecharger(proposition.p, etapes);
  });

  return {
    // proposition : { p, combi, surface } du calculateur, ou null quand il n'y a pas de résultat
    maj(nouvelle) {
      const changeCulture = !proposition || !nouvelle || proposition.p !== nouvelle.p;
      proposition = nouvelle;
      zone.hidden = !proposition;
      if (!proposition) return;
      if (changeCulture && !dateChoisie || !champ.value) {
        const depart = planProchainSemis(proposition.p, aujourdhui);
        champ.value = depart ? planIso(depart) : '';
      }
      dessiner();
    },
  };
}
