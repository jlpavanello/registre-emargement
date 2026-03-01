import{r as n,n as t,g as o,h as e,i as d,j as s,k as r}from"./main-D023wjAX.js";import"./pdf-libs-B1B0vrY-.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";function a(){return`
<div class="config-overlay" id="configPanel">
  <div class="config-header">
    <h2>Configuration</h2>
    <button class="header-btn" id="btnCloseConfig" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="config-info">Configurez votre équipe, vos responsables et vos machines. Ces données sont sauvegardées et pré-remplies chaque jour.</div>
  <div class="config-section-title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
    Responsables / Signataires
  </div>
  <div class="config-card">
    <div class="cnum resp-bg"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width:16px;height:16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
    <div class="fields">
      <input class="name-input" type="text" placeholder="Nom du Chef d'unité" id="configChefUnite">
      <input class="sub-input" type="text" placeholder="Matricule (optionnel)" id="configChefMat">
    </div>
  </div>
  <div class="config-card">
    <div class="cnum resp-bg"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width:16px;height:16px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
    <div class="fields">
      <select class="cat-select" id="configArmurierSelect" style="font-weight:600; font-size:13px;">
        <option value="">— Choisir l'Armurier parmi les agents —</option>
      </select>
      <div id="configArmurierInfo" style="font-size:11px; color:#94a3b8; font-weight:500; padding:2px 4px;"></div>
    </div>
  </div>
  <div class="config-section-title" style="margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    Agents
  </div>
  <div id="configEmpList"></div>
  <div class="config-add-row">
    <button class="config-add-btn" id="btnAddEmp">+ Agent</button>
  </div>
  <div class="config-section-title" style="margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
    Catégories d'armes
  </div>
  <div class="config-info" style="background:linear-gradient(135deg,#eff6ff,#dbeafe); border-color:#93c5fd; color:#1e40af;">
    Créez vos catégories ici. Elles apparaîtront dans le menu déroulant lors de la signature et dans la config des armes.
  </div>
  <div id="configCatList"></div>
  <div class="config-add-row">
    <button class="config-add-btn" id="btnAddCat">+ Catégorie</button>
  </div>
  <div class="config-section-title" style="margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
    Armes
  </div>
  <div id="configMachList"></div>
  <div class="config-add-row">
    <button class="config-add-btn" id="btnAddMach">+ Arme</button>
  </div>
  <div class="config-section-title" style="margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
    Véhicules
  </div>
  <div id="configVehiclesList"></div>
  <div class="config-add-row">
    <button class="config-add-btn" id="btnAddVeh">+ Véhicule</button>
  </div>
  <div class="config-section-title" style="margin-top:16px; color: var(--red);">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    Zone de remise à zéro
  </div>
  <div style="margin:6px 12px; padding:14px; background:#fef2f2; border:1px solid #fecaca; border-radius:14px;">
    <p style="font-size:12px; color:#991b1b; margin-bottom:10px; line-height:1.5;">
      Utilisez ce bouton uniquement lorsque le registre du jour est <strong>finalisé</strong> (PDF généré).
      Cela efface toutes les signatures, les visas, la sélection des présents et remet le compteur de page à zéro.
    </p>
    <button id="btnFullReset" style="width:100%; padding:12px; background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color:white; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 4px 12px rgba(239,68,68,0.3);">
      Remise à zéro complète
    </button>
  </div>
  <div style="height:90px;"></div>
  <div class="config-bottom"><button class="btn-config-save" id="btnSaveConfig">Enregistrer</button></div>
</div>
`}function c(){document.getElementById("btnCloseConfig").addEventListener("click",()=>t("/")),document.getElementById("btnSaveConfig").addEventListener("click",()=>{o(),t("/registre")}),document.getElementById("btnAddEmp").addEventListener("click",()=>e("emp")),document.getElementById("btnAddCat").addEventListener("click",d),document.getElementById("btnAddMach").addEventListener("click",()=>e("mach")),document.getElementById("configArmurierSelect").addEventListener("change",s),document.getElementById("btnFullReset").addEventListener("click",r),document.getElementById("btnAddVeh").addEventListener("click",()=>e("veh"))}const p={title:"Configuration",mount(i){i.innerHTML=a(),c(),n()},unmount(){}};export{p as configPage};
