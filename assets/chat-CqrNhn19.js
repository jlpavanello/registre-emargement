const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/main-D023wjAX.js","assets/pdf-libs-B1B0vrY-.js","assets/storage-Dob3nYDb.js","assets/supabase-Dq-Jb853.js","assets/main-TUzHF8d7.css"])))=>i.map(i=>d[i]);
import{_ as i}from"./pdf-libs-B1B0vrY-.js";import{n as s}from"./main-D023wjAX.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";let a=null;async function n(){return a||(a=await i(()=>import("./main-D023wjAX.js").then(t=>t.aL),__vite__mapDeps([0,1,2,3,4]))),a}function o(){return`
<div class="chat-overlay" id="chatPanel">
  <div class="chat-widget">
    <div class="chat-header">
      <span class="chat-header-title">💬 Chat d'équipe</span>
      <button class="chat-notif-btn notif-default" id="btnChatNotif" title="Activer les notifications">🔔</button>
      <button class="chat-header-btn" id="btnCloseChat" title="Fermer">✕</button>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-bar">
      <input type="text" id="chatInput" placeholder="Message..." maxlength="500">
      <button id="btnSendChat">Envoyer</button>
    </div>
  </div>
</div>
`}function d(){document.getElementById("btnCloseChat").addEventListener("click",()=>s("/")),document.getElementById("btnSendChat").addEventListener("click",async()=>{(await n()).sendChatMessage()})}const r={title:"Chat",async mount(t){t.innerHTML=o(),d();const e=await n();e.openChat(),e.initChatKeyboard(),e.initNotifButton()},unmount(){}};export{r as chatPage};
