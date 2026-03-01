import{I,S as h,v as t,y as w,q as D,z as O,A as j,B as A,C as L,D as C,E as P,F as V,G as x,t as _,H as F}from"./main-D023wjAX.js";import"./pdf-libs-B1B0vrY-.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";let v="audit",f="all",m="all";function Y(){document.getElementById("auditPanel").classList.add("active"),v="audit",b(),y()}function U(){document.getElementById("auditPanel").classList.remove("active")}function J(i){v=i,b(),y()}function b(){document.querySelectorAll("#auditPanel .audit-tab").forEach(i=>{i.classList.toggle("active",i.dataset.tab===v)})}function y(){const i=document.getElementById("auditTabContent");if(i)switch(v){case"audit":N(i);break;case"incidents":E(i);break;case"new-incident":M(i);break}}function N(i){const n=P(),o=f==="all"?V(100):F(x()).filter(s=>s.category===f);let l="";l+=`<div class="audit-stats">
    <div class="audit-stat"><span class="audit-stat-num">${n.total}</span><span class="audit-stat-label">Actions</span></div>
    <div class="audit-stat"><span class="audit-stat-num">${n.signatures}</span><span class="audit-stat-label">Signatures</span></div>
    <div class="audit-stat"><span class="audit-stat-num">${n.incidents}</span><span class="audit-stat-label">Incidents</span></div>
    <div class="audit-stat"><span class="audit-stat-num">${n.stock}</span><span class="audit-stat-label">Stock</span></div>
  </div>`;const d=[{key:"all",label:"Tout"},{key:"signature",label:"Signatures"},{key:"visa",label:"Visas"},{key:"presence",label:"Présence"},{key:"config",label:"Config"},{key:"stock",label:"Stock"},{key:"incident",label:"Incidents"},{key:"system",label:"Système"}];if(l+='<div class="audit-filters">',d.forEach(s=>{l+=`<button class="audit-filter-btn ${f===s.key?"active":""}" data-filter="${s.key}">${s.label}</button>`}),l+="</div>",o.length===0)l+=`<div class="audit-empty">
      <div class="audit-empty-icon">📋</div>
      <div>Aucune action enregistrée.</div>
    </div>`;else{let s="";o.forEach(e=>{if(e.date!==s){const r=new Date(e.date+"T00:00:00"),u=e.date===x()?"Aujourd'hui":r.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});l+=`<div class="audit-date-sep">${u}</div>`,s=e.date}l+=`<div class="audit-entry" data-category="${e.category}">
        <div class="audit-entry-icon">${e.icon}</div>
        <div class="audit-entry-info">
          <div class="audit-entry-label">${t(e.label)}</div>
          ${e.details&&e.details.description?`<div class="audit-entry-desc">${t(e.details.description)}</div>`:""}
          ${e.details&&e.details.agentName?`<div class="audit-entry-desc">Agent : ${t(e.details.agentName)}</div>`:""}
        </div>
        <div class="audit-entry-time">
          <span>${t(e.heure)}</span>
          <span class="audit-entry-role">${t(e.deviceRole)}</span>
        </div>
      </div>`})}i.innerHTML=l,i.querySelectorAll(".audit-filter-btn").forEach(s=>{s.addEventListener("click",()=>{f=s.dataset.filter,N(i)})})}function E(i){var s;const n=j(),o=[{key:"all",label:`Tous (${n.total})`},{key:"ouvert",label:`Ouverts (${n.ouverts})`},{key:"en_cours",label:`En cours (${n.enCours})`},{key:"resolu",label:`Résolus (${n.resolus})`}];let l=m==="all"?A():A({status:m}),d="";n.critiques>0&&(d+=`<div class="incident-alert critical">🚨 ${n.critiques} incident${n.critiques>1?"s":""} critique${n.critiques>1?"s":""} en cours</div>`),n.graves>0&&(d+=`<div class="incident-alert grave">⚠️ ${n.graves} incident${n.graves>1?"s":""} grave${n.graves>1?"s":""} en cours</div>`),d+='<button class="incident-new-btn" id="btnNewIncident">+ Signaler un incident</button>',d+='<div class="audit-filters">',o.forEach(e=>{d+=`<button class="audit-filter-btn ${m===e.key?"active":""}" data-ifilter="${e.key}">${e.label}</button>`}),d+="</div>",l.length===0?d+=`<div class="audit-empty">
      <div class="audit-empty-icon">✅</div>
      <div>Aucun incident ${m!=="all"?"avec ce statut":"signalé"}.</div>
    </div>`:l.forEach(e=>{const r=I[e.type]||I.autre,u=h[e.severity]||h.moyen,p=L[e.status]||L.ouvert;d+=`<div class="incident-card" data-id="${t(e.id)}">
        <div class="incident-card-header">
          <span class="incident-type-badge" style="background:${r.color}20;color:${r.color};">${r.icon} ${t(r.label)}</span>
          <span class="incident-severity-badge severity-${e.severity}">${t(u.label)}</span>
          <span class="incident-status-badge">${p.icon} ${t(p.label)}</span>
        </div>
        <div class="incident-card-title">${t(e.title)}</div>
        ${e.description?`<div class="incident-card-desc">${t(e.description.length>150?e.description.substring(0,150)+"...":e.description)}</div>`:""}
        <div class="incident-card-meta">
          ${e.agentName?`<span>👤 ${t(e.agentName)}</span>`:""}
          ${e.armeName?`<span>🔫 ${t(e.armeName)}</span>`:""}
          ${e.lieu?`<span>📍 ${t(e.lieu)}</span>`:""}
          <span>📅 ${t(e.date)} ${t(e.heure)}</span>
        </div>
        ${e.status!=="cloture"?`<div class="incident-card-actions">
          ${e.status==="ouvert"?`<button class="incident-action-btn" data-action="en_cours" data-iid="${t(e.id)}">Prendre en charge</button>`:""}
          ${e.status==="en_cours"?`<button class="incident-action-btn resolve" data-action="resolu" data-iid="${t(e.id)}">Marquer résolu</button>`:""}
          ${e.status==="resolu"?`<button class="incident-action-btn close" data-action="cloture" data-iid="${t(e.id)}">Clôturer</button>`:""}
        </div>`:""}
      </div>`}),i.innerHTML=d,(s=i.querySelector("#btnNewIncident"))==null||s.addEventListener("click",()=>{v="new-incident",b(),y()}),i.querySelectorAll(".audit-filter-btn[data-ifilter]").forEach(e=>{e.addEventListener("click",()=>{m=e.dataset.ifilter,E(i)})}),i.querySelectorAll(".incident-action-btn").forEach(e=>{e.addEventListener("click",()=>{const r=e.dataset.action,u=e.dataset.iid,p=r==="resolu"&&prompt("Commentaire de résolution (optionnel) :")||"";C(u,{status:r},p),E(i)})})}function M(i){var k,S;const{team:n,machines:o,vehicles:l}=_(),d=n.filter(a=>a.nom),s=o.filter(a=>a.nom);let e=Object.entries(I).map(([a,c])=>`<option value="${a}">${c.icon} ${c.label}</option>`).join(""),r=Object.entries(h).map(([a,c])=>`<option value="${a}">${c.label}</option>`).join(""),u='<option value="">— Aucun agent —</option>'+d.map((a,c)=>`<option value="${n.indexOf(a)}">${t(a.nom)}${a.matricule?" ("+t(a.matricule)+")":""}</option>`).join(""),p='<option value="">— Aucune arme —</option>'+s.map((a,c)=>`<option value="${o.indexOf(a)}">${t(a.nom)}${a.ref?" ("+t(a.ref)+")":""}</option>`).join(""),q='<option value="">— Aucun véhicule —</option>'+l.map((a,c)=>`<option value="${c}">${t(a.marque||"Véhicule")} ${t(a.immatriculation||"")}</option>`).join(""),B=`
    <div class="incident-form">
      <button class="incident-back-btn" id="btnBackToIncidents">← Retour aux incidents</button>
      <h3 class="incident-form-title">🚨 Signaler un incident</h3>

      <label>Type d'incident</label>
      <select id="incidentType">${e}</select>

      <label>Gravité</label>
      <select id="incidentSeverity">${r}</select>

      <label>Titre</label>
      <input type="text" id="incidentTitle" placeholder="Ex: Arme enrayée lors du contrôle" maxlength="120">

      <label>Description</label>
      <textarea id="incidentDesc" placeholder="Décrivez l'incident en détail..." rows="4" maxlength="1000"></textarea>

      <label>Agent concerné</label>
      <select id="incidentAgent">${u}</select>

      <label>Arme concernée</label>
      <select id="incidentArme">${p}</select>

      <label>Véhicule concerné</label>
      <select id="incidentVehicule">${q}</select>

      <label>Lieu</label>
      <input type="text" id="incidentLieu" placeholder="Ex: Place du Marché, RN7 km 42..." maxlength="120">

      <button class="incident-submit-btn" id="btnSubmitIncident">Enregistrer l'incident</button>
    </div>
  `;i.innerHTML=B,(k=i.querySelector("#btnBackToIncidents"))==null||k.addEventListener("click",()=>{v="incidents",b(),y()}),(S=i.querySelector("#btnSubmitIncident"))==null||S.addEventListener("click",()=>{var T;const a=document.getElementById("incidentTitle").value.trim();if(!a){alert("Veuillez saisir un titre.");return}const c=document.getElementById("incidentAgent").value,$=document.getElementById("incidentArme").value,g=document.getElementById("incidentVehicule").value;w({type:document.getElementById("incidentType").value,severity:document.getElementById("incidentSeverity").value,title:a,description:document.getElementById("incidentDesc").value.trim(),agentIdx:c?parseInt(c):null,agentName:c&&((T=n[parseInt(c)])==null?void 0:T.nom)||"",armeIdx:$?parseInt($):null,armeName:$?O(parseInt($)):"",vehiculeIdx:g?parseInt(g):null,vehiculeName:g?D(parseInt(g)):"",lieu:document.getElementById("incidentLieu").value.trim()}),alert("Incident enregistré."),v="incidents",b(),y()})}export{U as closeAuditPanel,Y as openAuditPanel,J as switchAuditTab};
