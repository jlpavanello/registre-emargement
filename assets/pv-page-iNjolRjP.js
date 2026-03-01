const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/pv-panel-pV6LGLZz.js","assets/main-D023wjAX.js","assets/pdf-libs-B1B0vrY-.js","assets/storage-Dob3nYDb.js","assets/supabase-Dq-Jb853.js","assets/main-TUzHF8d7.css"])))=>i.map(i=>d[i]);
import{_ as n}from"./pdf-libs-B1B0vrY-.js";import{n as i}from"./main-D023wjAX.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";let e=null;async function a(){return e||(e=await n(()=>import("./pv-panel-pV6LGLZz.js"),__vite__mapDeps([0,1,2,3,4,5]))),e}function o(){return`
<div class="pv-overlay" id="pvPanel">
  <div class="pv-header">
    <h2>📋 Procès-Verbaux</h2>
    <button class="header-btn" id="btnClosePV" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="pv-tabs">
    <button class="pv-tab active" data-tab="templates">Modèles</button>
    <button class="pv-tab" data-tab="mespv">Mes PV</button>
    <button class="pv-tab" data-tab="editor" style="display:none;">Éditeur</button>
  </div>
  <div id="pvTabContent"></div>
  <div style="height:20px;"></div>
</div>
`}function s(){document.getElementById("btnClosePV").addEventListener("click",()=>i("/")),document.querySelectorAll("#pvPanel .pv-tab").forEach(t=>{t.addEventListener("click",async()=>{(await a()).switchPvTab(t.dataset.tab)})})}const u={title:"Procès-Verbaux",async mount(t){t.innerHTML=o(),s(),(await a()).openPV()},unmount(){}};export{u as pvPage};
