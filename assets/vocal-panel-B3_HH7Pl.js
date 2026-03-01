import{u as h,v as c,w as x,x as E}from"./main-D023wjAX.js";import"./pdf-libs-B1B0vrY-.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";let p={};function R(n){p=n}let r=null,u=!1,m=!1,v=0;function b(){if(r)return;const n=window.SpeechRecognition||window.webkitSpeechRecognition;if(!n){m=!1;return}m=!0,r=new n,r.lang="fr-FR",r.continuous=!0,r.interimResults=!0,r.onresult=t=>{const i=document.getElementById("vocalContenu"),l=document.getElementById("vocalInterim");if(!i)return;let o="",a="";for(let e=v;e<t.results.length;e++){const s=t.results[e];s.isFinal?(o+=s[0].transcript+" ",v=e+1):a+=s[0].transcript}o&&(i.value=i.value+o,i.dataset.baseText=i.value,f()),l&&(l.textContent=a?"🎤 "+a:"")},r.onerror=t=>{if(console.log("Speech recognition error:",t.error),t.error==="not-allowed")alert(`L'accès au microphone a été refusé.

Pour l'autoriser :
1. Ouvrez les Réglages du navigateur
2. Allez dans Autorisations > Microphone
3. Autorisez ce site`);else if(t.error==="network")alert("Erreur réseau. La reconnaissance vocale nécessite une connexion internet.");else if(t.error==="no-speech")return;d()},r.onend=()=>{if(u)try{r.start()}catch{d()}}}function S(){b(),document.getElementById("vocalPanel").classList.add("active"),y(),g(),I()}function $(){u&&d(),document.getElementById("vocalPanel").classList.remove("active")}function I(){const n=document.getElementById("btnMic"),t=document.getElementById("vocalMicStatus");m?(n.classList.remove("unavailable"),t&&(t.textContent="Appuyez pour dicter",t.style.color="")):(n.classList.add("unavailable"),t&&(t.textContent="Saisie manuelle uniquement (votre navigateur ne supporte pas la dictée)",t.style.color="#ef4444"))}function z(){if(!m||!r){alert(`La reconnaissance vocale n'est pas supportée par votre navigateur.

Navigateurs compatibles :
✅ Chrome (Android et Desktop)
✅ Edge
❌ Safari (support limité)
❌ Firefox

Vous pouvez taper votre rapport manuellement dans la zone de texte.`);return}if(u){d();return}const n=document.getElementById("vocalContenu");n.dataset.baseText=n.value,v=0;try{r.start(),u=!0,document.getElementById("btnMic").classList.add("recording"),document.getElementById("vocalMicStatus").classList.add("recording"),document.getElementById("vocalMicStatus").textContent="Parlez maintenant... (appuyez à nouveau pour arrêter)"}catch(t){console.log("Cannot start recognition:",t),alert(`Impossible de démarrer la reconnaissance vocale.

Vérifiez que :
1. Vous avez autorisé le microphone
2. Vous êtes connecté à Internet
3. Vous utilisez Chrome`)}}function d(){if(u=!1,r)try{r.stop()}catch{}v=0;const n=document.getElementById("btnMic"),t=document.getElementById("vocalMicStatus");n&&n.classList.remove("recording"),t&&(t.classList.remove("recording"),t.textContent="Appuyez pour dicter");const i=document.getElementById("vocalInterim");i&&(i.textContent=""),f()}function y(){const n=document.getElementById("vocalLieu"),t=document.getElementById("vocalObjet"),i=document.getElementById("vocalFamille"),l=document.getElementById("vocalHeureMission"),o=document.getElementById("vocalDuree"),a=document.getElementById("vocalContenu");n&&(n.value=""),t&&(t.value=""),i&&(i.value=""),l&&(l.value=""),o&&(o.value=""),a&&(a.value="",a.dataset.baseText="");const e=document.getElementById("vocalInterim");e&&(e.textContent=""),f()}function f(){const n=document.getElementById("vocalContenu"),t=document.getElementById("btnVocalSave");t&&n&&(t.disabled=!n.value.trim())}function k(){const n=document.getElementById("vocalLieu").value.trim(),t=document.getElementById("vocalObjet").value.trim(),i=document.getElementById("vocalFamille").value,l=document.getElementById("vocalHeureMission").value.trim(),o=document.getElementById("vocalDuree").value.trim(),a=document.getElementById("vocalContenu").value.trim();if(!a){alert("Le contenu du rapport ne peut pas être vide.");return}u&&d(),x({lieu:n,objet:t,contenu:a,heureMission:l,duree:o,famille:i}),y(),g()}function B(n){confirm("Supprimer ce compte-rendu ?")&&(h(n),g())}function g(){const n=document.getElementById("vocalReportsList");if(!n)return;const t=E();if(t.length===0){n.innerHTML=`
      <div class="vocal-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <p>Aucun compte-rendu enregistré.<br>Dictez ou saisissez votre premier rapport ci-dessus.</p>
      </div>`;return}const i={};t.forEach(o=>{i[o.date]||(i[o.date]=[]),i[o.date].push(o)});const l=Object.keys(i).sort().reverse();n.innerHTML="",l.forEach(o=>{const a=new Date(o+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});n.innerHTML+=`
      <div class="vocal-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${a}
      </div>`,i[o].sort((e,s)=>s.id.localeCompare(e.id)).forEach(e=>{const s=e.contenu.length>200?e.contenu.substring(0,200)+"...":e.contenu;n.innerHTML+=`
        <div class="vocal-report-card" data-id="${c(e.id)}">
          <div class="vocal-report-header">
            <div class="vocal-report-meta">
              <strong>${c(e.heure)}</strong> — ${c(e.agent||"Agent")}${e.matricule?" ("+c(e.matricule)+")":""}
              ${e.famille?`<span style="display:inline-block;margin-left:6px;padding:1px 8px;background:var(--accent);color:white;border-radius:10px;font-size:10px;font-weight:600;">${c(e.famille)}</span>`:""}
            </div>
            <div class="vocal-report-actions">
              <button class="btn-vocal-pdf" data-pdf-id="${c(e.id)}">📄 PDF</button>
              <button class="btn-vocal-delete" data-del-id="${c(e.id)}">🗑</button>
            </div>
          </div>
          ${e.lieu?`<div class="vocal-report-lieu">📍 ${c(e.lieu)}</div>`:""}
          ${e.heureMission||e.duree?`<div style="font-size:11px;color:var(--text3);margin-top:2px;">${e.heureMission?"🕐 "+c(e.heureMission):""}${e.heureMission&&e.duree?" · ":""}${e.duree?"⏱ "+c(e.duree):""}</div>`:""}
          ${e.objet?`<div class="vocal-report-objet">${c(e.objet)}</div>`:""}
          <div class="vocal-report-contenu">${c(s)}</div>
        </div>`})}),n.querySelectorAll("[data-pdf-id]").forEach(o=>{o.addEventListener("click",()=>{if(p.generateVocalPDF){const a=t.find(e=>e.id===o.dataset.pdfId);a&&p.generateVocalPDF(a)}})}),n.querySelectorAll("[data-del-id]").forEach(o=>{o.addEventListener("click",()=>B(o.dataset.delId))})}export{R as bindVocalCallbacks,y as clearForm,$ as closeVocalPanel,S as openVocalPanel,B as removeReport,g as renderReportsList,k as saveCurrentReport,z as startRecording,d as stopRecording,f as updateSaveButton};
