const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/audit-panel-BKbWJR95.js","assets/main-D023wjAX.js","assets/pdf-libs-B1B0vrY-.js","assets/storage-Dob3nYDb.js","assets/supabase-Dq-Jb853.js","assets/main-TUzHF8d7.css"])))=>i.map(i=>d[i]);
import{_ as e}from"./pdf-libs-B1B0vrY-.js";import{n as d}from"./main-D023wjAX.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";let i=null;async function a(){return i||(i=await e(()=>import("./audit-panel-BKbWJR95.js"),__vite__mapDeps([0,1,2,3,4,5]))),i}function n(){return`
<div class="audit-overlay" id="auditPanel">
  <div class="audit-header">
    <h2>🛡️ Audit & Incidents</h2>
    <button class="header-btn" id="btnCloseAudit" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="audit-tabs">
    <button class="audit-tab active" data-tab="audit">📋 Journal</button>
    <button class="audit-tab" data-tab="incidents">🚨 Incidents</button>
  </div>
  <div id="auditTabContent"></div>
  <div style="height:20px;"></div>
</div>
`}function u(){document.getElementById("btnCloseAudit").addEventListener("click",()=>d("/")),document.querySelectorAll("#auditPanel .audit-tab").forEach(t=>{t.addEventListener("click",async()=>{(await a()).switchAuditTab(t.dataset.tab)})})}const r={title:"Audit & Incidents",async mount(t){t.innerHTML=n(),u(),(await a()).openAuditPanel()},unmount(){}};export{r as auditPage};
