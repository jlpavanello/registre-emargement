import{o as t,n as e,s,a as c,b as r}from"./main-D023wjAX.js";import"./pdf-libs-B1B0vrY-.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";function i(){return`
<div class="presence-overlay" id="presencePanel">
  <div class="presence-header">
    <h2>Présents du jour</h2>
    <button class="header-btn" id="btnClosePresence" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="presence-info">Cochez les agents de service aujourd'hui. Seuls les agents sélectionnés pourront signer et prendre du matériel.</div>
  <div class="presence-actions">
    <button class="btn-all" id="btnPresenceAll">Tous</button>
    <button class="btn-none" id="btnPresenceNone">Aucun</button>
  </div>
  <div class="presence-count" id="presenceCount">0 sélectionnés</div>
  <div id="presenceList"></div>
  <div style="height:90px;"></div>
  <div class="presence-bottom"><button class="btn-presence-save" id="btnPresenceSave">Valider la sélection</button></div>
</div>
`}function d(){document.getElementById("btnClosePresence").addEventListener("click",()=>e("/")),document.getElementById("btnPresenceAll").addEventListener("click",s),document.getElementById("btnPresenceNone").addEventListener("click",c),document.getElementById("btnPresenceSave").addEventListener("click",()=>{r(),e("/registre")})}const v={title:"Présence",mount(n){n.innerHTML=i(),d(),t()},unmount(){}};export{v as presencePage};
