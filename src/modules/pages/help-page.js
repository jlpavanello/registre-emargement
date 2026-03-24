// =============================================
// help-page.js — Page Aide / Mode d'emploi
// =============================================

const SECTIONS = [
  { id: 'presentation', title: 'Présentation générale', icon: '📋' },
  { id: 'vue-mois', title: 'Vue Mois', icon: '📆' },
  { id: 'affecter-creneau', title: 'Affecter un créneau à un agent', icon: '✏️' },
  { id: 'vue-semaine', title: 'Vue Semaine', icon: '📅' },
  { id: 'absence-imprevue', title: 'Signaler une absence imprévue', icon: '🚨' },
  { id: 'conges', title: 'Gérer les congés et absences planifiées', icon: '🌴' },
  { id: 'cycles', title: 'Cycles de roulement', icon: '🔄' },
  { id: 'compteurs', title: 'Compteurs par agent', icon: '📊' },
  { id: 'config-horaires', title: 'Configuration des horaires', icon: '⚙️' },
  { id: 'legende', title: 'Légende des icônes', icon: '🏷️' },
];

function getTocHTML() {
  return `
    <nav class="help-toc" id="helpToc">
      <div class="help-toc-title">Sommaire</div>
      <ol class="help-toc-list">
        ${SECTIONS.map(s => `<li><a href="#help-${s.id}" class="help-toc-link" data-section="${s.id}">${s.icon} ${s.title}</a></li>`).join('')}
      </ol>
    </nav>`;
}

function tip(text) {
  return `<div class="help-callout help-callout--tip">💡 <strong>Astuce :</strong> ${text}</div>`;
}

function warn(text) {
  return `<div class="help-callout help-callout--warn">⚠️ <strong>Attention :</strong> ${text}</div>`;
}

function backToTop() {
  return `<a href="#help-top" class="help-back-top">↑ Retour en haut</a>`;
}

function getSectionsHTML() {
  return `

<!-- Section 1 -->
<section class="help-section" id="help-presentation">
  <h3>📋 1. Présentation générale</h3>
  <p>Le module <strong>Planning</strong> est l'outil central pour organiser le travail des agents. Il est accessible depuis le menu latéral gauche.</p>
  <p>Il se compose de <strong>6 onglets</strong> :</p>
  <div class="help-grid-cards">
    <div class="help-mini-card"><strong>📆 Mois</strong><br>Vue mensuelle</div>
    <div class="help-mini-card"><strong>📋 Semaine</strong><br>Vue hebdomadaire avec total d'heures</div>
    <div class="help-mini-card"><strong>🔄 Cycles</strong><br>Roulements automatiques</div>
    <div class="help-mini-card"><strong>🌴 Congés</strong><br>Demandes de congés</div>
    <div class="help-mini-card"><strong>📊 Compteurs</strong><br>Synthèse heures et soldes</div>
    <div class="help-mini-card"><strong>⚙️ Config</strong><br>Paramétrage horaires</div>
  </div>
  ${tip('Pour accéder au Planning, cliquez sur l\'icône 📅 dans le menu latéral gauche.')}
  ${backToTop()}
</section>

<!-- Section 2 -->
<section class="help-section" id="help-vue-mois">
  <h3>📆 2. Vue Mois</h3>
  <p>La vue Mois affiche une <strong>grille</strong> avec les agents en lignes et les jours en colonnes.</p>
  <ul>
    <li>Chaque cellule contient une <strong>icône colorée</strong> représentant le créneau affecté.</li>
    <li>Naviguez avec les boutons <strong>◀ Précédent / Suivant ▶</strong>.</li>
    <li>Les colonnes <strong>S</strong> et <strong>D</strong> (week-ends) sont teintées pour mieux les distinguer.</li>
    <li>Une cellule vide = aucun créneau affecté.</li>
    <li>Un <strong>point rouge</strong> = alerte (conflit ou anomalie).</li>
  </ul>
  ${tip('La légende complète des icônes est disponible dans la <a href="#help-legende">section 10</a> en bas de page.')}
  ${backToTop()}
</section>

<!-- Section 3 -->
<section class="help-section" id="help-affecter-creneau">
  <h3>✏️ 3. Affecter un créneau à un agent</h3>
  <p><strong>Cliquez sur une cellule</strong> de la grille. Un popup apparaît avec le nom de l'agent et la date.</p>
  <p>Deux catégories sont proposées :</p>

  <h4>🔵 SERVICE</h4>
  <table class="help-table">
    <thead><tr><th>Créneau</th><th>Horaires</th><th>Durée</th></tr></thead>
    <tbody>
      <tr><td>📅 Journée</td><td>09:00 – 17:00</td><td>8h</td></tr>
      <tr><td>🌅 Matin</td><td>07:00 – 12:00</td><td>5h</td></tr>
      <tr><td>☀️ Après-midi</td><td>14:00 – 22:00</td><td>8h</td></tr>
      <tr><td>🌙 Nuit</td><td>22:00 – 06:00</td><td>8h</td></tr>
      <tr><td>🛡️ Garde</td><td>18:00 – 06:00</td><td>12h</td></tr>
      <tr><td>📞 Permanence</td><td>08:00 – 20:00</td><td>12h</td></tr>
    </tbody>
  </table>

  <h4>🔴 ABSENCES</h4>
  <table class="help-table">
    <thead><tr><th>Type</th><th>Icône</th></tr></thead>
    <tbody>
      <tr><td>Congé annuel</td><td>🌴</td></tr>
      <tr><td>RTT</td><td>⏰</td></tr>
      <tr><td>Maladie</td><td>🩺</td></tr>
      <tr><td>Formation</td><td>🎓</td></tr>
      <tr><td>Absence injustifiée</td><td>❓</td></tr>
      <tr><td>Autre absence</td><td>📅</td></tr>
    </tbody>
  </table>

  <p>Cliquez sur le créneau souhaité pour l'affecter. Pour <strong>modifier</strong>, recliquez sur la cellule et choisissez un autre créneau.</p>
  ${warn('Un créneau déjà affecté sera remplacé. Il n\'y a pas de confirmation avant le changement.')}
  ${backToTop()}
</section>

<!-- Section 4 -->
<section class="help-section" id="help-vue-semaine">
  <h3>📅 4. Vue Semaine</h3>
  <p>Affiche <strong>7 jours</strong> (lundi à dimanche) avec une colonne <strong>Total</strong> à droite indiquant les heures de la semaine.</p>
  <ul>
    <li>Navigation par semaine avec <strong>◀ Précédente / Suivante ▶</strong>.</li>
    <li>Le <strong>jour en cours</strong> est mis en gras.</li>
    <li>Même fonctionnement que la vue Mois pour affecter des créneaux.</li>
  </ul>
  ${tip('La colonne Total permet de vérifier rapidement si un agent a atteint ses heures hebdomadaires.')}
  ${backToTop()}
</section>

<!-- Section 5 -->
<section class="help-section" id="help-absence-imprevue">
  <h3>🚨 5. Signaler une absence imprévue</h3>
  <p>Bouton rouge <strong>"Signaler une absence"</strong> en haut à droite de la vue Mois ou Semaine.</p>
  <ol>
    <li>Sélectionner l'<strong>agent</strong> concerné.</li>
    <li>Choisir le <strong>type</strong> : Maladie, Formation, Absence injustifiée, Autre absence.</li>
    <li>Préciser la <strong>durée</strong> : Aujourd'hui seulement ou Plusieurs jours.</li>
    <li>Ajouter un <strong>motif</strong> (optionnel).</li>
    <li>Cliquer sur <strong>Enregistrer</strong>.</li>
  </ol>
  ${warn('L\'absence sera immédiatement reportée sur le planning. Pensez à réorganiser les équipages si nécessaire.')}
  ${backToTop()}
</section>

<!-- Section 6 -->
<section class="help-section" id="help-conges">
  <h3>🌴 6. Gérer les congés et absences planifiées</h3>
  <p>Onglet <strong>Congés</strong> : cliquez sur le bouton <strong>"+ Nouvelle demande de congé"</strong>.</p>
  <p>Filtres disponibles :</p>
  <ul>
    <li><strong>Tous</strong> — toutes les demandes</li>
    <li><strong>En attente</strong> — demandes non traitées</li>
    <li><strong>Approuvés</strong> — demandes validées</li>
    <li><strong>Refusés</strong> — demandes rejetées</li>
  </ul>
  <p>Chaque demande affiche le nom, le type, les dates et le statut. Utilisez l'icône <strong>🗑️ poubelle</strong> pour supprimer une demande.</p>
  ${tip('Les congés approuvés sont automatiquement reportés sur le planning mensuel et hebdomadaire.')}
  ${backToTop()}
</section>

<!-- Section 7 -->
<section class="help-section" id="help-cycles">
  <h3>🔄 7. Cycles de roulement</h3>
  <p>Onglet <strong>Cycles</strong> : cliquez sur le bouton <strong>"+ Créer un roulement"</strong>.</p>
  <ol>
    <li>Définissez une <strong>séquence</strong> de créneaux qui se répète (ex : Matin, Matin, Après-midi, Après-midi, Repos, Repos).</li>
    <li><strong>Assignez</strong> les agents concernés.</li>
    <li>Choisissez la <strong>date de démarrage</strong>.</li>
  </ol>
  <p>Le planning se remplit ensuite <strong>automatiquement</strong> selon le cycle défini.</p>
  ${tip('Les cycles sont idéaux pour les roulements réguliers. Les absences et congés restent prioritaires sur le cycle.')}
  ${backToTop()}
</section>

<!-- Section 8 -->
<section class="help-section" id="help-compteurs">
  <h3>📊 8. Compteurs par agent</h3>
  <p>Affiche pour chaque agent :</p>
  <table class="help-table">
    <thead><tr><th>Compteur</th><th>Objectif / Quota</th></tr></thead>
    <tbody>
      <tr><td>Heures cette semaine</td><td>48h</td></tr>
      <tr><td>Heures ce mois</td><td>—</td></tr>
      <tr><td>Heures cumulées annuelles</td><td>1 607h</td></tr>
      <tr><td>Congé annuel</td><td>25 jours</td></tr>
      <tr><td>RTT</td><td>—</td></tr>
      <tr><td>Maladie</td><td>—</td></tr>
      <tr><td>Formation</td><td>5 jours</td></tr>
      <tr><td>Absences injustifiées</td><td>—</td></tr>
    </tbody>
  </table>
  <p>Les soldes en <span style="color:#10b981;font-weight:700;">vert</span> indiquent les jours encore disponibles.</p>
  ${backToTop()}
</section>

<!-- Section 9 -->
<section class="help-section" id="help-config-horaires">
  <h3>⚙️ 9. Configuration des horaires</h3>
  <p>Onglet <strong>Config</strong> : modifiez les heures de début et de fin de chaque créneau (Matin, Après-midi, Journée, etc.).</p>
  <p>Cliquez sur <strong>"Enregistrer les horaires"</strong> pour sauvegarder vos modifications.</p>
  ${warn('La modification des horaires s\'applique à tous les futurs créneaux. Les créneaux déjà affectés ne sont pas impactés rétroactivement.')}
  ${backToTop()}
</section>

<!-- Section 10 -->
<section class="help-section" id="help-legende">
  <h3>🏷️ 10. Légende des icônes</h3>
  <table class="help-table help-table--legend">
    <thead><tr><th>Icône</th><th>Signification</th><th>Couleur</th></tr></thead>
    <tbody>
      <tr><td>📅</td><td>Journée</td><td><span class="help-color-dot" style="background:#10b981"></span> Vert</td></tr>
      <tr><td>🌅</td><td>Matin</td><td><span class="help-color-dot" style="background:#f59e0b"></span> Ambre</td></tr>
      <tr><td>☀️</td><td>Après-midi</td><td><span class="help-color-dot" style="background:#3b82f6"></span> Bleu</td></tr>
      <tr><td>🌙</td><td>Nuit</td><td><span class="help-color-dot" style="background:#6366f1"></span> Indigo</td></tr>
      <tr><td>🛡️</td><td>Garde</td><td><span class="help-color-dot" style="background:#ef4444"></span> Rouge</td></tr>
      <tr><td>📞</td><td>Permanence</td><td><span class="help-color-dot" style="background:#8b5cf6"></span> Violet</td></tr>
      <tr><td><strong>R</strong></td><td>Repos</td><td><span class="help-color-dot" style="background:#94a3b8"></span> Gris</td></tr>
      <tr><td>🌴</td><td>Congé annuel</td><td><span class="help-color-dot" style="background:#22c55e"></span> Vert clair</td></tr>
      <tr><td>⏰</td><td>RTT</td><td><span class="help-color-dot" style="background:#06b6d4"></span> Cyan</td></tr>
      <tr><td>🩺</td><td>Maladie</td><td><span class="help-color-dot" style="background:#f97316"></span> Orange</td></tr>
      <tr><td>🎓</td><td>Formation</td><td><span class="help-color-dot" style="background:#8b5cf6"></span> Violet</td></tr>
      <tr><td>❓</td><td>Absence injustifiée</td><td><span class="help-color-dot" style="background:#ef4444"></span> Rouge</td></tr>
      <tr><td>📅</td><td>Autre absence</td><td><span class="help-color-dot" style="background:#64748b"></span> Gris foncé</td></tr>
      <tr><td>🔴</td><td>Alerte (conflit / anomalie)</td><td><span class="help-color-dot" style="background:#ef4444"></span> Rouge</td></tr>
    </tbody>
  </table>
  ${backToTop()}
</section>
`;
}

function getPageHTML() {
  return `
<div class="help-page" id="help-top">
  <div class="help-header">
    <h2>❓ Mode d'emploi — Module Planning</h2>
    <p class="help-subtitle">Guide complet pour maîtriser le module de planification des agents</p>
  </div>
  ${getTocHTML()}
  <div class="help-content">
    ${getSectionsHTML()}
  </div>
</div>`;
}

function bindEvents() {
  // Smooth scroll for TOC links & back-to-top links
  document.querySelectorAll('.help-toc-link, .help-back-top').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

export const helpPage = {
  title: 'Aide',
  mount(container) {
    container.innerHTML = getPageHTML();
    bindEvents();
  },
  unmount() {},
};
