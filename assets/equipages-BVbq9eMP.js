import{c as s,n as e,d as i,e as c,f as n}from"./main-D023wjAX.js";import"./pdf-libs-B1B0vrY-.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";function l(){return`
<div class="crew-overlay" id="crewPanel">
  <div class="crew-header">
    <h2>🚗 Équipages véhicules</h2>
    <button class="header-btn" id="btnCloseCrew" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="crew-info">Choisissez un véhicule, puis ajoutez les agents de l'équipage.</div>
  <div class="crew-select-section">
    <label class="crew-select-label">Véhicule</label>
    <select id="crewVehicleSelect" class="crew-select">
      <option value="">— Choisir un véhicule —</option>
    </select>
  </div>
  <div class="crew-select-section" id="crewAgentSection" style="display:none;">
    <label class="crew-select-label">Ajouter un agent à l'équipage</label>
    <select id="crewAgentSelect" class="crew-select">
      <option value="">— Choisir un agent —</option>
    </select>
  </div>
  <div id="crewAssignedList" style="display:none;">
    <div class="crew-assigned-header">
      <span id="crewAssignedTitle">Équipage</span>
      <span class="crew-count" id="crewCount">0 agent</span>
    </div>
    <div id="crewAssignedMembers"></div>
  </div>
  <div id="crewSummary"></div>
  <div style="height:90px;"></div>
  <div class="crew-bottom"><button class="btn-crew-save" id="btnSaveCrew">Valider les équipages</button></div>
</div>
`}function a(){document.getElementById("btnCloseCrew").addEventListener("click",()=>e("/")),document.getElementById("btnSaveCrew").addEventListener("click",()=>{i(),e("/registre")}),document.getElementById("crewVehicleSelect").addEventListener("change",c),document.getElementById("crewAgentSelect").addEventListener("change",n)}const v={title:"Équipages",mount(t){t.innerHTML=l(),a(),s()},unmount(){}};export{v as equipagesPage};
