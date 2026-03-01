const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/stock-panel-BlVrMwX4.js","assets/main-D023wjAX.js","assets/pdf-libs-B1B0vrY-.js","assets/storage-Dob3nYDb.js","assets/supabase-Dq-Jb853.js","assets/main-TUzHF8d7.css"])))=>i.map(i=>d[i]);
import{_ as s}from"./pdf-libs-B1B0vrY-.js";import{n as e}from"./main-D023wjAX.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";let a=null;async function o(){return a||(a=await s(()=>import("./stock-panel-BlVrMwX4.js"),__vite__mapDeps([0,1,2,3,4,5]))),a}function n(){return`
<div class="stock-overlay" id="stockPanel">
  <div class="stock-header">
    <h2>📦 Stock & Logistique</h2>
    <button class="header-btn" id="btnCloseStock" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="stock-tabs">
    <button class="stock-tab active" data-tab="munitions">Configuration des Munitions</button>
    <button class="stock-tab" data-tab="armes">État des Armes</button>
    <button class="stock-tab" data-tab="previsions">Programmation des exercices de tir</button>
    <button class="stock-tab" data-tab="fournisseurs">Création des fournisseurs</button>
    <button class="stock-tab" data-tab="commandes">Devis Commande</button>
  </div>
  <div class="stock-tabs stock-tabs-center">
    <button class="stock-tab" data-tab="dashboard">Dashboard</button>
  </div>
  <div id="stockTabContent"></div>
  <div style="height:20px;"></div>
</div>
`}function c(){document.getElementById("btnCloseStock").addEventListener("click",()=>e("/")),document.querySelectorAll("#stockPanel .stock-tab").forEach(t=>{t.addEventListener("click",async()=>{(await o()).switchStockTab(t.dataset.tab)})})}const b={title:"Stock & Armement",async mount(t){t.innerHTML=n(),c(),(await o()).openStock()},unmount(){}};export{b as stockPage};
