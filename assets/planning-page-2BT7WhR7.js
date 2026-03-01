const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/planning-panel-DH7nvyGX.js","assets/main-D023wjAX.js","assets/pdf-libs-B1B0vrY-.js","assets/storage-Dob3nYDb.js","assets/supabase-Dq-Jb853.js","assets/main-TUzHF8d7.css"])))=>i.map(i=>d[i]);
import{_ as e}from"./pdf-libs-B1B0vrY-.js";import{n as i}from"./main-D023wjAX.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";let t=null;async function a(){return t||(t=await e(()=>import("./planning-panel-DH7nvyGX.js"),__vite__mapDeps([0,1,2,3,4,5]))),t}function l(){return`
<div class="planning-overlay" id="planningPanel">
  <div class="planning-header">
    <h2>📅 Planning</h2>
    <button class="header-btn" id="btnClosePlanning" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="planning-tabs">
    <button class="planning-tab active" data-tab="month">📆 Mois</button>
    <button class="planning-tab" data-tab="week">📋 Semaine</button>
    <button class="planning-tab" data-tab="cycles">🔄 Cycles</button>
    <button class="planning-tab" data-tab="leaves">🌴 Congés</button>
    <button class="planning-tab" data-tab="counters">📊 Compteurs</button>
  </div>
  <div id="planningTabContent"></div>
  <div style="height:20px;"></div>
</div>
`}function o(){document.getElementById("btnClosePlanning").addEventListener("click",()=>i("/")),document.querySelectorAll("#planningPanel .planning-tab").forEach(n=>{n.addEventListener("click",async()=>{(await a()).switchPlanningTab(n.dataset.tab)})})}const c={title:"Planning",async mount(n){n.innerHTML=l(),o(),(await a()).openPlanning()},unmount(){}};export{c as planningPage};
