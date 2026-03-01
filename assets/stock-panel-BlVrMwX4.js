import{J as q,v as f,K as I,L as _,M as R,t as x,N as H,O as w,P as O,Q as B,R as U,T as V,z as M,U as F,V as Q,W,X as G,Y,Z as J,_ as K,$ as X,a0 as Z,a1 as tt,a2 as et,a3 as N,a4 as it,a5 as nt,a6 as st,a7 as z,a8 as at,a9 as ot,aa as lt,ab as dt,ac as ct,ad as rt,ae as ut}from"./main-D023wjAX.js";import{E as mt}from"./pdf-libs-B1B0vrY-.js";import"./storage-Dob3nYDb.js";import"./supabase-Dq-Jb853.js";function L(s){const{munitionRefs:n,machines:t}=x();let l=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
    <div class="stock-section-title" style="margin:0;">🔫 Références de munitions</div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnAddMunRef">+ Nouvelle référence</button>
  </div>`;l+='<div id="munRefCreateArea" style="display:none;"></div>',n.length===0&&(l+=`<div class="stock-empty">
      <div class="stock-empty-icon">🔫</div>
      <div>Aucune référence de munition créée.</div>
      <div style="margin-top:8px;">Créez une référence et affectez-la à une ou plusieurs armes.</div>
    </div>`),n.forEach(i=>{const o=q(i),e=i.seuilAlerte>0?Math.min(100,i.stockActuel/(i.seuilAlerte*2)*100):i.stockActuel>0?100:0,u=i.conditionnement||1,a=i.stockActuel*u,d=f(i.unite),r=a>1?d.endsWith("s")?d:d+"s":d;let c="";i.armeIdxList.length===0?c='<span style="font-size:11px;color:var(--text3);font-style:italic;">Aucune arme associée</span>':i.armeIdxList.forEach(v=>{const m=t[v];if(!m||!m.nom)return;const p=m.cat?I(m.cat):null,g=p?p.emoji+" ":"";c+=`<span class="mun-arme-chip">${g}${f(m.nom)}</span>`});const b=`<div class="mun-calc-block">
      <div class="mun-calc-row">
        <div class="mun-calc-item">
          <div class="mun-calc-value">${i.stockActuel}</div>
          <div class="mun-calc-label">${u>1?"boîtes":"quantité"}</div>
        </div>
        <div class="mun-calc-op">×</div>
        <div class="mun-calc-item">
          <div class="mun-calc-value">${u}</div>
          <div class="mun-calc-label">${u>1?"par boîte":"conditionnement"}</div>
        </div>
        <div class="mun-calc-op">=</div>
        <div class="mun-calc-item">
          <div class="mun-calc-value total ${o}">${a}</div>
          <div class="mun-calc-label">${r}</div>
        </div>
      </div>
    </div>`;l+=`<div class="stock-card" data-mun-ref-id="${i.id}">
      <div class="stock-card-header">
        <div>
          <div class="stock-card-title">📦 ${f(i.nom)}</div>
          <div class="stock-card-sub">${i.calibre?"Calibre : "+f(i.calibre):"Pas de calibre défini"}</div>
        </div>
      </div>
      ${b}
      <div style="margin:6px 0 4px;"><span style="font-size:11px;font-weight:600;color:var(--text2);">Armes associées :</span></div>
      <div class="mun-armes-row">${c}</div>
      <div class="stock-bar-container"><div class="stock-bar ${o}" style="width:${e}%;"></div></div>
      <div class="stock-info-row">
        <span>Seuil alerte : ${i.seuilAlerte}</span>
        <span>Seuil critique : ${i.seuilCritique}</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
        <button class="stock-btn stock-btn-primary stock-btn-sm btn-mref-appro" data-id="${i.id}">+ Approvisionner</button>
        <button class="stock-btn stock-btn-secondary stock-btn-sm btn-mref-adjust" data-id="${i.id}">🔧 Ajuster</button>
        <button class="stock-btn stock-btn-secondary stock-btn-sm btn-mref-edit" data-id="${i.id}">✏️ Modifier</button>
        <button class="stock-btn stock-btn-danger stock-btn-sm btn-mref-delete" data-id="${i.id}">Supprimer</button>
      </div>
      <div id="mrefAction_${i.id}" style="display:none;margin-top:10px;"></div>
    </div>`}),s.innerHTML=l,document.getElementById("btnAddMunRef").addEventListener("click",()=>pt(s)),s.querySelectorAll(".btn-mref-appro").forEach(i=>{i.addEventListener("click",()=>bt(s,i.dataset.id))}),s.querySelectorAll(".btn-mref-adjust").forEach(i=>{i.addEventListener("click",()=>ft(s,i.dataset.id))}),s.querySelectorAll(".btn-mref-edit").forEach(i=>{i.addEventListener("click",()=>vt(s,i.dataset.id))}),s.querySelectorAll(".btn-mref-delete").forEach(i=>{i.addEventListener("click",()=>{const o=_(i.dataset.id);o&&confirm("Supprimer la référence « "+o.nom+" » et son stock ?")&&(R(i.dataset.id),L(s))})})}function pt(s){const n=document.getElementById("munRefCreateArea");if(!n)return;const{machines:t}=x();n.style.display="block";let l="";t.forEach((i,o)=>{if(!i.nom)return;const e=i.cat?I(i.cat):null,u=e?e.emoji+" ":"";l+=`<label class="mun-arme-toggle"><input type="checkbox" value="${o}"> ${u}${f(i.nom)}</label>`}),n.innerHTML=`<div class="stock-card" style="border:2px dashed var(--accent);background:#f8fafc;">
    <div class="stock-card-title" style="margin-bottom:8px;">Nouvelle référence de munition</div>
    <div class="stock-field"><label>Nom *</label><input type="text" id="newMrefNom" placeholder="Ex: 9mm Parabellum" maxlength="80"></div>
    <div class="stock-field"><label>Calibre</label><input type="text" id="newMrefCalibre" placeholder="Ex: 9x19mm" maxlength="40"></div>
    <div class="stock-field"><label>Unité</label><input type="text" id="newMrefUnite" value="cartouche" maxlength="30"></div>
    <div class="stock-field"><label>Conditionnement (unités par boîte)</label><input type="number" id="newMrefCondit" value="1" min="1" inputmode="numeric"></div>
    <div class="stock-field"><label>Armes associées</label>
      <div class="mun-armes-select" id="newMrefArmes">${l||'<span style="color:var(--text3);font-size:11px;">Aucune arme configurée</span>'}</div>
    </div>
    <div style="display:flex;gap:8px;">
      <div class="stock-field" style="flex:1;"><label>Stock initial</label><input type="number" id="newMrefStock" value="0" min="0" inputmode="numeric"></div>
      <div class="stock-field" style="flex:1;"><label>Seuil alerte</label><input type="number" id="newMrefAlerte" value="100" min="0" inputmode="numeric"></div>
      <div class="stock-field" style="flex:1;"><label>Seuil critique</label><input type="number" id="newMrefCritique" value="30" min="0" inputmode="numeric"></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnConfirmMref">Créer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="btnCancelMref">Annuler</button>
    </div>
  </div>`,document.getElementById("btnConfirmMref").addEventListener("click",()=>{const i=document.getElementById("newMrefNom").value.trim();if(!i){alert("Le nom est obligatoire.");return}const o=document.getElementById("newMrefCalibre").value.trim(),e=document.getElementById("newMrefUnite").value.trim()||"cartouche",u=parseInt(document.getElementById("newMrefCondit").value)||1,a=parseInt(document.getElementById("newMrefStock").value)||0,d=parseInt(document.getElementById("newMrefAlerte").value)||100,r=parseInt(document.getElementById("newMrefCritique").value)||30,c=[];document.querySelectorAll("#newMrefArmes input:checked").forEach(b=>{c.push(+b.value)}),H({nom:i,calibre:o,unite:e,conditionnement:u,armeIdxList:c,stockActuel:a,seuilAlerte:d,seuilCritique:r}),L(s)}),document.getElementById("btnCancelMref").addEventListener("click",()=>{n.style.display="none",n.innerHTML=""})}function vt(s,n){const t=document.getElementById("mrefAction_"+n);if(!t)return;const l=_(n);if(!l)return;const{machines:i}=x();t.style.display="block";let o="";i.forEach((e,u)=>{if(!e.nom)return;const a=l.armeIdxList.includes(u)?"checked":"",d=e.cat?I(e.cat):null,r=d?d.emoji+" ":"";o+=`<label class="mun-arme-toggle"><input type="checkbox" value="${u}" ${a}> ${r}${f(e.nom)}</label>`}),t.innerHTML=`
    <div class="stock-field"><label>Nom</label><input type="text" id="editMrefNom_${n}" value="${f(l.nom)}" maxlength="80"></div>
    <div class="stock-field"><label>Calibre</label><input type="text" id="editMrefCalibre_${n}" value="${f(l.calibre)}" maxlength="40"></div>
    <div class="stock-field"><label>Unité</label><input type="text" id="editMrefUnite_${n}" value="${f(l.unite)}" maxlength="30"></div>
    <div class="stock-field"><label>Conditionnement (unités par boîte)</label><input type="number" id="editMrefCondit_${n}" value="${l.conditionnement||1}" min="1" inputmode="numeric"></div>
    <div class="stock-field"><label>Armes associées</label>
      <div class="mun-armes-select" id="editMrefArmes_${n}">${o}</div>
    </div>
    <div style="display:flex;gap:8px;">
      <div class="stock-field" style="flex:1;"><label>Seuil alerte</label><input type="number" id="editMrefAlerte_${n}" value="${l.seuilAlerte}" min="0" inputmode="numeric"></div>
      <div class="stock-field" style="flex:1;"><label>Seuil critique</label><input type="number" id="editMrefCritique_${n}" value="${l.seuilCritique}" min="0" inputmode="numeric"></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="editMrefConfirm_${n}">Enregistrer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="editMrefCancel_${n}">Annuler</button>
    </div>`,document.getElementById("editMrefConfirm_"+n).addEventListener("click",()=>{const e=document.getElementById("editMrefNom_"+n).value.trim();if(!e){alert("Le nom est obligatoire.");return}const u=document.getElementById("editMrefCalibre_"+n).value.trim(),a=document.getElementById("editMrefUnite_"+n).value.trim()||"cartouche",d=parseInt(document.getElementById("editMrefCondit_"+n).value)||1,r=parseInt(document.getElementById("editMrefAlerte_"+n).value)||100,c=parseInt(document.getElementById("editMrefCritique_"+n).value)||30,b=[];document.querySelectorAll("#editMrefArmes_"+n+" input:checked").forEach(v=>{b.push(+v.value)}),O(n,{nom:e,calibre:u,unite:a,conditionnement:d,armeIdxList:b,seuilAlerte:r,seuilCritique:c}),L(s)}),document.getElementById("editMrefCancel_"+n).addEventListener("click",()=>{t.style.display="none"})}function bt(s,n){const t=document.getElementById("mrefAction_"+n);t&&(t.style.display="block",t.innerHTML=`
    <div class="stock-field"><label>Quantité à ajouter</label><input type="number" id="approQty_${n}" min="1" value="50" inputmode="numeric"></div>
    <div class="stock-field"><label>Motif (optionnel)</label><input type="text" id="approMotif_${n}" placeholder="Ex: Livraison fournisseur"></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="approConfirm_${n}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="approCancel_${n}">Annuler</button>
    </div>`,document.getElementById("approConfirm_"+n).addEventListener("click",()=>{const l=parseInt(document.getElementById("approQty_"+n).value)||0;if(l<=0){alert("Quantité invalide");return}const i=document.getElementById("approMotif_"+n).value;w({type:"approvisionnement",munRefId:n,armeIdx:null,quantite:l,motif:i,source:"manuel"}),L(s)}),document.getElementById("approCancel_"+n).addEventListener("click",()=>{t.style.display="none"}))}function ft(s,n){const t=document.getElementById("mrefAction_"+n);t&&(t.style.display="block",t.innerHTML=`
    <div class="stock-field"><label>Ajustement (+/-)</label><input type="number" id="adjustQty_${n}" value="0" inputmode="numeric"></div>
    <div class="stock-field"><label>Motif</label><input type="text" id="adjustMotif_${n}" placeholder="Ex: Inventaire, correction erreur"></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="adjustConfirm_${n}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="adjustCancel_${n}">Annuler</button>
    </div>`,document.getElementById("adjustConfirm_"+n).addEventListener("click",()=>{const l=parseInt(document.getElementById("adjustQty_"+n).value)||0;if(l===0){alert("Quantité invalide");return}const i=document.getElementById("adjustMotif_"+n).value;w({type:"ajustement",munRefId:n,armeIdx:null,quantite:l,motif:i,source:"manuel"}),L(s)}),document.getElementById("adjustCancel_"+n).addEventListener("click",()=>{t.style.display="none"}))}function D(s){const{machines:n,stockArmes:t,categories:l}=x();let i='<div class="stock-section-title">🛡️ État des armes</div>';const o=n.map((d,r)=>({...d,idx:r})).filter(d=>d.nom);if(o.length===0){i=`<div class="stock-empty">
      <div class="stock-empty-icon">🛡️</div>
      <div>Aucune arme configurée.</div>
    </div>`,s.innerHTML=i;return}const e={},u="__none__";o.forEach(d=>{const r=d.cat||u;e[r]||(e[r]=[]),e[r].push(d)});const a=l.filter(d=>e[d.id]).map(d=>d.id);e[u]&&a.push(u),a.forEach(d=>{const r=e[d];if(d===u)i+=`<div class="stock-cat-header"><span class="stock-cat-emoji">📦</span> <span class="stock-cat-name">Sans catégorie</span> <span class="stock-cat-count">${r.length}</span></div>`;else{const c=I(d);i+=`<div class="stock-cat-header"><span class="stock-cat-emoji">${c?c.emoji:"📦"}</span> <span class="stock-cat-name">${c?c.nom:"Catégorie"}</span> <span class="stock-cat-count">${r.length}</span></div>`}r.forEach(c=>{const b=c.idx,v=t[b]||{etat:"operationnelle",dateRevision:"",notes:""},m=B[v.etat]||B.operationnelle;i+=`<div class="stock-card" data-arme-idx="${b}">
        <div class="stock-card-header">
          <div>
            <div class="stock-card-title">${c.nom}</div>
            <div class="stock-card-sub">${c.ref||"Pas de référence"}</div>
          </div>
          <span class="status-badge" style="background:${m.bg};color:${m.color};">${m.label}</span>
        </div>
        ${v.dateRevision?`<div style="font-size:11px;color:var(--text3);margin-top:4px;">📅 Prochaine révision: ${v.dateRevision}</div>`:""}
        ${v.notes?`<div style="font-size:11px;color:var(--text2);margin-top:2px;font-style:italic;">📝 ${v.notes}</div>`:""}
        <div style="display:flex;gap:6px;margin-top:10px;">
          <button class="stock-btn stock-btn-secondary stock-btn-sm btn-arme-edit" data-idx="${b}">✏️ Modifier</button>
        </div>
        <div id="armeAction_${b}" style="display:none;margin-top:10px;"></div>
      </div>`})}),s.innerHTML=i,s.querySelectorAll(".btn-arme-edit").forEach(d=>{d.addEventListener("click",()=>yt(s,+d.dataset.idx))})}function yt(s,n){const t=document.getElementById(`armeAction_${n}`);if(!t)return;const l=U(n);t.style.display="block";const i=Object.entries(B).map(([o,e])=>`<option value="${o}" ${l.etat===o?"selected":""}>${e.label}</option>`).join("");t.innerHTML=`
    <div class="stock-field"><label>État</label>
      <select id="armeEtat_${n}">${i}</select>
    </div>
    <div class="stock-field"><label>Date de prochaine révision</label>
      <input type="date" id="armeRevision_${n}" value="${l.dateRevision}">
    </div>
    <div class="stock-field"><label>Notes</label>
      <textarea id="armeNotes_${n}" rows="2" placeholder="Notes sur l'arme...">${l.notes}</textarea>
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="armeConfirm_${n}">Enregistrer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="armeCancel_${n}">Annuler</button>
    </div>`,document.getElementById(`armeConfirm_${n}`).addEventListener("click",()=>{const o=document.getElementById(`armeEtat_${n}`).value,e=document.getElementById(`armeRevision_${n}`).value,u=document.getElementById(`armeNotes_${n}`).value;V(n,o,e,u),D(s)}),document.getElementById(`armeCancel_${n}`).addEventListener("click",()=>{t.style.display="none"})}function A(s){var i;const{previsionsTir:n,team:t}=x();let l=`<div style="display:flex;align-items:center;justify-content:space-between;">
    <div class="stock-section-title">🎯 Exercices de tir</div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnAddPrevision">+ Planifier</button>
  </div>`;l+='<div id="previsionForm" style="display:none;margin-bottom:12px;"></div>',n.length===0?l+=`<div class="stock-empty">
      <div class="stock-empty-icon">🎯</div>
      <div>Aucun exercice de tir planifié.</div>
    </div>`:[...n].sort((e,u)=>{const a={planifie:0,realise:1,annule:2},d=(a[e.statut]||0)-(a[u.statut]||0);return d!==0?d:e.date.localeCompare(u.date)}).forEach(e=>{const u=M(e.armeIdx),a=e.participants.map(r=>{var c;return((c=t[r])==null?void 0:c.nom)||`Agent ${r+1}`}).join(", "),d=F(e.armeIdx,e.totalPrevu);l+=`<div class="prevision-card">
        <div class="prevision-header">
          <div>
            <div class="prevision-date">📅 ${e.date}${e.lieu?" — "+e.lieu:""}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">${u}</div>
          </div>
          <div class="prevision-status ${e.statut}">${e.statut==="planifie"?"Planifié":e.statut==="realise"?"Réalisé":"Annulé"}</div>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px;">
          ${e.participants.length} participant${e.participants.length>1?"s":""} · ${e.munitionsParAgent} mun./agent · <strong>Total: ${e.totalPrevu}</strong>
        </div>
        ${e.participants.length<=6?`<div style="font-size:10px;color:var(--text3);margin-top:2px;">${a}</div>`:""}
        ${e.statut==="planifie"?`
          <div class="stock-impact">
            <div class="stock-impact-row"><span>Stock actuel:</span><span>${d.stockActuel}</span></div>
            <div class="stock-impact-row"><span>Après exercice:</span><span${d.stockApres<0?' class="stock-impact-deficit"':""}>${d.stockApres}</span></div>
            ${d.deficit>0?`<div class="stock-impact-row stock-impact-deficit"><span>⚠️ Déficit:</span><span>-${d.deficit}</span></div>`:""}
          </div>
          <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
            <button class="stock-btn stock-btn-primary stock-btn-sm btn-prev-realise" data-id="${e.id}">✅ Marquer réalisé</button>
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-prev-edit" data-id="${e.id}">✏️ Modifier</button>
            <button class="stock-btn stock-btn-danger stock-btn-sm btn-prev-cancel" data-id="${e.id}">Annuler</button>
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-prev-delete" data-id="${e.id}">🗑️</button>
          </div>`:`
          ${e.realise?`<div style="font-size:11px;color:#166534;margin-top:6px;">✅ Réalisé le ${e.realise.dateRealisation} — ${e.realise.munitionsConsommees} munitions consommées</div>`:""}
          <div style="display:flex;gap:6px;margin-top:8px;">
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-prev-delete" data-id="${e.id}">🗑️ Supprimer</button>
          </div>`}
      </div>`}),s.innerHTML=l,(i=document.getElementById("btnAddPrevision"))==null||i.addEventListener("click",()=>{gt(s)}),s.querySelectorAll(".btn-prev-realise").forEach(o=>{o.addEventListener("click",()=>{const e=o.dataset.id,u=n.find(d=>d.id===e),a=prompt("Munitions réellement consommées:",u?String(u.totalPrevu):"0");a!==null&&(Q(e,parseInt(a)||0),A(s))})}),s.querySelectorAll(".btn-prev-cancel").forEach(o=>{o.addEventListener("click",()=>{confirm("Annuler cet exercice ?")&&(W(o.dataset.id),A(s))})}),s.querySelectorAll(".btn-prev-edit").forEach(o=>{o.addEventListener("click",()=>{kt(s,o.dataset.id)})}),s.querySelectorAll(".btn-prev-delete").forEach(o=>{o.addEventListener("click",()=>{confirm("Supprimer cette prévision ?")&&(G(o.dataset.id),A(s))})})}function gt(s){var r,c,b,v;const{team:n,machines:t,presentToday:l}=x(),i=document.getElementById("previsionForm");if(!i)return;const o=t.map((m,p)=>m.nom?`<option value="${p}">${m.nom}${m.ref?" ("+m.ref+")":""}</option>`:"").join(""),e=new Date().toISOString().split("T")[0],a=(l.length>0?l.filter(m=>{var p;return(p=n[m])==null?void 0:p.nom}):n.map((m,p)=>m.nom?p:-1).filter(m=>m>=0)).map(m=>`<div class="stock-chip selected" data-emp="${m}">${n[m].nom}</div>`).join("");i.style.display="block",i.innerHTML=`
    <div class="stock-card">
      <div class="stock-field"><label>Date</label><input type="date" id="prevDate" value="${e}"></div>
      <div class="stock-field"><label>Lieu</label><input type="text" id="prevLieu" placeholder="Ex: Stand de tir municipal"></div>
      <div class="stock-field"><label>Arme</label><select id="prevArme"><option value="">— Choisir —</option>${o}</select></div>
      <div class="stock-field"><label>Munitions par agent</label><input type="number" id="prevMunParAgent" value="50" min="1" inputmode="numeric"></div>
      <div class="stock-field"><label>Participants (cliquez pour dé/sélectionner)</label>
        <div class="stock-chip-list" id="prevParticipants">${a}</div>
      </div>
      <div id="prevImpact" style="margin-top:8px;"></div>
      <div style="display:flex;gap:6px;margin-top:12px;">
        <button class="stock-btn stock-btn-primary" id="prevConfirm">Créer l'exercice</button>
        <button class="stock-btn stock-btn-secondary" id="prevCancel">Annuler</button>
      </div>
    </div>`,i.querySelectorAll(".stock-chip").forEach(m=>{m.addEventListener("click",()=>{m.classList.toggle("selected"),d()})});const d=()=>{const m=parseInt(document.getElementById("prevArme").value),p=parseInt(document.getElementById("prevMunParAgent").value)||0,g=i.querySelectorAll(".stock-chip.selected").length,k=g*p;if(!isNaN(m)&&m>=0){const y=F(m,k);document.getElementById("prevImpact").innerHTML=`
        <div class="stock-impact">
          <div class="stock-impact-row"><span>Participants:</span><span>${g}</span></div>
          <div class="stock-impact-row"><span>Total munitions:</span><span><strong>${k}</strong></span></div>
          <div class="stock-impact-row"><span>Stock actuel:</span><span>${y.stockActuel}</span></div>
          <div class="stock-impact-row"><span>Stock après:</span><span${y.stockApres<0?' class="stock-impact-deficit"':""}>${y.stockApres}</span></div>
          ${y.deficit>0?`<div class="stock-impact-row stock-impact-deficit"><span>⚠️ Déficit à combler:</span><span>${y.deficit}</span></div>`:""}
        </div>`}};(r=document.getElementById("prevArme"))==null||r.addEventListener("change",d),(c=document.getElementById("prevMunParAgent"))==null||c.addEventListener("input",d),(b=document.getElementById("prevConfirm"))==null||b.addEventListener("click",()=>{const m=document.getElementById("prevDate").value,p=document.getElementById("prevLieu").value,g=parseInt(document.getElementById("prevArme").value),k=parseInt(document.getElementById("prevMunParAgent").value)||0,y=Array.from(i.querySelectorAll(".stock-chip.selected")).map($=>+$.dataset.emp);if(!m){alert("Veuillez saisir une date");return}if(isNaN(g)||g<0){alert("Veuillez choisir une arme");return}if(y.length===0){alert("Veuillez sélectionner au moins un participant");return}if(k<=0){alert("Veuillez saisir un nombre de munitions par agent");return}Y({date:m,lieu:p,participants:y,munitionsParAgent:k,armeIdx:g}),A(s)}),(v=document.getElementById("prevCancel"))==null||v.addEventListener("click",()=>{i.style.display="none"})}function kt(s,n){var c,b,v,m;const{previsionsTir:t,team:l,machines:i}=x(),o=t.find(p=>p.id===n);if(!o)return;const e=document.getElementById("previsionForm");if(!e)return;const u=i.map((p,g)=>{if(!p.nom)return"";const k=g===o.armeIdx?" selected":"";return`<option value="${g}"${k}>${p.nom}${p.ref?" ("+p.ref+")":""}</option>`}).join(""),d=l.map((p,g)=>p.nom?g:-1).filter(p=>p>=0).map(p=>`<div class="stock-chip${o.participants.includes(p)?" selected":""}" data-emp="${p}">${l[p].nom}</div>`).join("");e.style.display="block",e.innerHTML=`
    <div class="stock-card" style="border:2px solid var(--accent);">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px;">✏️ Modifier l'exercice</div>
      <div class="stock-field"><label>Date</label><input type="date" id="prevDate" value="${o.date}"></div>
      <div class="stock-field"><label>Lieu</label><input type="text" id="prevLieu" value="${o.lieu||""}" placeholder="Ex: Stand de tir municipal"></div>
      <div class="stock-field"><label>Arme</label><select id="prevArme"><option value="">— Choisir —</option>${u}</select></div>
      <div class="stock-field"><label>Munitions par agent</label><input type="number" id="prevMunParAgent" value="${o.munitionsParAgent}" min="1" inputmode="numeric"></div>
      <div class="stock-field"><label>Participants (cliquez pour dé/sélectionner)</label>
        <div class="stock-chip-list" id="prevParticipants">${d}</div>
      </div>
      <div id="prevImpact" style="margin-top:8px;"></div>
      <div style="display:flex;gap:6px;margin-top:12px;">
        <button class="stock-btn stock-btn-primary" id="prevConfirm">Enregistrer</button>
        <button class="stock-btn stock-btn-secondary" id="prevCancel">Annuler</button>
      </div>
    </div>`,e.querySelectorAll(".stock-chip").forEach(p=>{p.addEventListener("click",()=>{p.classList.toggle("selected"),r()})});const r=()=>{const p=parseInt(document.getElementById("prevArme").value),g=parseInt(document.getElementById("prevMunParAgent").value)||0,k=e.querySelectorAll(".stock-chip.selected").length,y=k*g;if(!isNaN(p)&&p>=0){const $=F(p,y);document.getElementById("prevImpact").innerHTML=`
        <div class="stock-impact">
          <div class="stock-impact-row"><span>Participants:</span><span>${k}</span></div>
          <div class="stock-impact-row"><span>Total munitions:</span><span><strong>${y}</strong></span></div>
          <div class="stock-impact-row"><span>Stock actuel:</span><span>${$.stockActuel}</span></div>
          <div class="stock-impact-row"><span>Stock après:</span><span${$.stockApres<0?' class="stock-impact-deficit"':""}>${$.stockApres}</span></div>
          ${$.deficit>0?`<div class="stock-impact-row stock-impact-deficit"><span>⚠️ Déficit à combler:</span><span>${$.deficit}</span></div>`:""}
        </div>`}};(c=document.getElementById("prevArme"))==null||c.addEventListener("change",r),(b=document.getElementById("prevMunParAgent"))==null||b.addEventListener("input",r),r(),(v=document.getElementById("prevConfirm"))==null||v.addEventListener("click",()=>{const p=document.getElementById("prevDate").value,g=document.getElementById("prevLieu").value,k=parseInt(document.getElementById("prevArme").value),y=parseInt(document.getElementById("prevMunParAgent").value)||0,$=Array.from(e.querySelectorAll(".stock-chip.selected")).map(j=>+j.dataset.emp);if(!p){alert("Veuillez saisir une date");return}if(isNaN(k)||k<0){alert("Veuillez choisir une arme");return}if($.length===0){alert("Veuillez sélectionner au moins un participant");return}if(y<=0){alert("Veuillez saisir un nombre de munitions par agent");return}J(n,{date:p,lieu:g,participants:$,munitionsParAgent:y,armeIdx:k}),A(s)}),(m=document.getElementById("prevCancel"))==null||m.addEventListener("click",()=>{e.style.display="none"}),e.scrollIntoView({behavior:"smooth",block:"start"})}function C(s){var l;const{fournisseurs:n}=x();let t=`<div style="display:flex;align-items:center;justify-content:space-between;">
    <div class="stock-section-title">🏪 Fournisseurs</div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnAddFournisseur">+ Ajouter</button>
  </div>`;t+='<div id="fournisseurForm" style="display:none;margin-bottom:12px;"></div>',n.length===0?t+=`<div class="stock-empty">
      <div class="stock-empty-icon">🏪</div>
      <div>Aucun fournisseur enregistré.</div>
      <div style="margin-top:8px;">Ajoutez vos fournisseurs pour gérer les devis et commandes.</div>
    </div>`:n.forEach(i=>{t+=`<div class="fournisseur-card" data-fournisseur-id="${i.id}">
        <div class="fournisseur-header">
          <div>
            <div class="fournisseur-nom">${i.nom}</div>
            <div class="fournisseur-contact">${[i.contact,i.telephone,i.email].filter(Boolean).join(" · ")||"Aucun contact"}</div>
            ${i.adresse?`<div style="font-size:10px;color:var(--text3);margin-top:2px;">📍 ${i.adresse}</div>`:""}
            ${i.notes?`<div style="font-size:10px;color:var(--text3);margin-top:2px;font-style:italic;">${i.notes}</div>`:""}
          </div>
          <div style="display:flex;gap:4px;">
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-four-edit" data-id="${i.id}">✏️</button>
            <button class="stock-btn stock-btn-danger stock-btn-sm btn-four-delete" data-id="${i.id}">🗑️</button>
          </div>
        </div>
        <div class="fournisseur-produits">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--text2);">Catalogue (${i.produits.length} produit${i.produits.length>1?"s":""})</span>
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-prod-add" data-fid="${i.id}" style="padding:4px 8px;font-size:10px;">+ Produit</button>
          </div>
          ${i.produits.length===0?'<div style="font-size:11px;color:var(--text3);font-style:italic;">Aucun produit dans le catalogue</div>':""}
          ${i.produits.map(o=>`
            <div class="produit-item">
              <div>
                <div class="produit-nom">${o.designation}</div>
                <div style="font-size:10px;color:var(--text3);">${o.conditionnement||""}${o.delaiJours?" · Délai: "+o.delaiJours+"j":""}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <div class="produit-prix">${o.prixUnitaire.toFixed(2)}€</div>
                <button class="stock-btn stock-btn-danger stock-btn-sm btn-prod-delete" data-fid="${i.id}" data-pid="${o.id}" style="padding:2px 6px;font-size:10px;">✕</button>
              </div>
            </div>
          `).join("")}
        </div>
        <div id="fourAction_${i.id}" style="display:none;margin-top:10px;"></div>
      </div>`}),s.innerHTML=t,(l=document.getElementById("btnAddFournisseur"))==null||l.addEventListener("click",()=>{xt(s)}),s.querySelectorAll(".btn-four-edit").forEach(i=>{i.addEventListener("click",()=>$t(s,i.dataset.id))}),s.querySelectorAll(".btn-four-delete").forEach(i=>{i.addEventListener("click",()=>{confirm("Supprimer ce fournisseur et son catalogue ?")&&(K(i.dataset.id),C(s))})}),s.querySelectorAll(".btn-prod-add").forEach(i=>{i.addEventListener("click",()=>Et(s,i.dataset.fid))}),s.querySelectorAll(".btn-prod-delete").forEach(i=>{i.addEventListener("click",()=>{X(i.dataset.fid,i.dataset.pid),C(s)})})}function xt(s){const n=document.getElementById("fournisseurForm");n&&(n.style.display="block",n.innerHTML=`
    <div class="stock-card">
      <div class="stock-field"><label>Nom</label><input type="text" id="fourNom" placeholder="Nom du fournisseur"></div>
      <div class="stock-field"><label>Contact</label><input type="text" id="fourContact" placeholder="Nom du contact"></div>
      <div class="stock-field"><label>Téléphone</label><input type="tel" id="fourTel" placeholder="06 12 34 56 78"></div>
      <div class="stock-field"><label>Email</label><input type="email" id="fourEmail" placeholder="contact@fournisseur.fr"></div>
      <div class="stock-field"><label>Adresse</label><input type="text" id="fourAdresse" placeholder="Adresse postale"></div>
      <div class="stock-field"><label>Notes</label><textarea id="fourNotes" rows="2" placeholder="Notes..."></textarea></div>
      <div style="display:flex;gap:6px;">
        <button class="stock-btn stock-btn-primary" id="fourConfirm">Ajouter</button>
        <button class="stock-btn stock-btn-secondary" id="fourCancel">Annuler</button>
      </div>
    </div>`,document.getElementById("fourConfirm").addEventListener("click",()=>{const t=document.getElementById("fourNom").value.trim();if(!t){alert("Veuillez saisir un nom");return}Z({nom:t,contact:document.getElementById("fourContact").value,telephone:document.getElementById("fourTel").value,email:document.getElementById("fourEmail").value,adresse:document.getElementById("fourAdresse").value,notes:document.getElementById("fourNotes").value}),C(s)}),document.getElementById("fourCancel").addEventListener("click",()=>{n.style.display="none"}))}function $t(s,n){const{fournisseurs:t}=x(),l=t.find(o=>o.id===n);if(!l)return;const i=document.getElementById(`fourAction_${n}`);i&&(i.style.display="block",i.innerHTML=`
    <div class="stock-field"><label>Nom</label><input type="text" id="fourEditNom_${n}" value="${l.nom}"></div>
    <div class="stock-field"><label>Contact</label><input type="text" id="fourEditContact_${n}" value="${l.contact||""}"></div>
    <div class="stock-field"><label>Téléphone</label><input type="tel" id="fourEditTel_${n}" value="${l.telephone||""}"></div>
    <div class="stock-field"><label>Email</label><input type="email" id="fourEditEmail_${n}" value="${l.email||""}"></div>
    <div class="stock-field"><label>Adresse</label><input type="text" id="fourEditAdresse_${n}" value="${l.adresse||""}"></div>
    <div class="stock-field"><label>Notes</label><textarea id="fourEditNotes_${n}" rows="2">${l.notes||""}</textarea></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="fourEditConfirm_${n}">Enregistrer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="fourEditCancel_${n}">Annuler</button>
    </div>`,document.getElementById(`fourEditConfirm_${n}`).addEventListener("click",()=>{tt(n,{nom:document.getElementById(`fourEditNom_${n}`).value,contact:document.getElementById(`fourEditContact_${n}`).value,telephone:document.getElementById(`fourEditTel_${n}`).value,email:document.getElementById(`fourEditEmail_${n}`).value,adresse:document.getElementById(`fourEditAdresse_${n}`).value,notes:document.getElementById(`fourEditNotes_${n}`).value}),C(s)}),document.getElementById(`fourEditCancel_${n}`).addEventListener("click",()=>{i.style.display="none"}))}function Et(s,n){const t=document.getElementById(`fourAction_${n}`);t&&(t.style.display="block",t.innerHTML=`
    <div class="stock-field"><label>Désignation</label><input type="text" id="prodDesign_${n}" placeholder="Ex: Cartouches 9mm"></div>
    <div class="stock-field"><label>Prix unitaire (€)</label><input type="number" id="prodPrix_${n}" value="0" step="0.01" min="0" inputmode="decimal"></div>
    <div class="stock-field"><label>Conditionnement</label><input type="text" id="prodCond_${n}" placeholder="Ex: Boîte de 50"></div>
    <div class="stock-field"><label>Prix boîte (€)</label><input type="number" id="prodPrixBoite_${n}" value="0" step="0.01" min="0" inputmode="decimal"></div>
    <div class="stock-field"><label>Délai livraison (jours)</label><input type="number" id="prodDelai_${n}" value="0" min="0" inputmode="numeric"></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="prodConfirm_${n}">Ajouter</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="prodCancel_${n}">Annuler</button>
    </div>`,document.getElementById(`prodConfirm_${n}`).addEventListener("click",()=>{const l=document.getElementById(`prodDesign_${n}`).value.trim();if(!l){alert("Veuillez saisir une désignation");return}et(n,{designation:l,prixUnitaire:parseFloat(document.getElementById(`prodPrix_${n}`).value)||0,conditionnement:document.getElementById(`prodCond_${n}`).value,prixBoite:parseFloat(document.getElementById(`prodPrixBoite_${n}`).value)||0,delaiJours:parseInt(document.getElementById(`prodDelai_${n}`).value)||0}),C(s)}),document.getElementById(`prodCancel_${n}`).addEventListener("click",()=>{t.style.display="none"}))}function ht(s){const n=s.type==="demande_devis",t=new mt({orientation:"portrait",unit:"mm",format:"a4"}),{responsables:l}=x(),i=t.internal.pageSize.getWidth(),o=15;let e=o;t.setFillColor(22,101,52),t.rect(0,0,i,35,"F"),t.setTextColor(255,255,255),t.setFontSize(18),t.setFont("helvetica","bold"),t.text(n?"DEMANDE DE DEVIS":"BON DE COMMANDE",o,16),t.setFontSize(11),t.setFont("helvetica","normal"),t.text(`N° ${s.numero}`,o,24),t.text(`Date: ${s.date}`,o,30);const u=n?{brouillon:"BROUILLON",envoyee:"ENVOYÉE",repondu:"RÉPONDU"}:{brouillon:"BROUILLON",envoye:"ENVOYÉ",accepte:"ACCEPTÉ",livre:"LIVRÉ"};t.setFontSize(10),t.text(u[s.statut]||s.statut.toUpperCase(),i-o,24,{align:"right"}),e=45,t.setTextColor(0,0,0),t.setFontSize(10),t.setFont("helvetica","bold"),t.text("ÉMETTEUR:",o,e),t.setFont("helvetica","normal"),t.setFontSize(9),t.text("Police Municipale",o,e+5),l.chef.nom&&t.text(`Responsable: ${l.chef.nom}`,o,e+10),s.fournisseurNom?(t.setFont("helvetica","bold"),t.setFontSize(10),t.text("DESTINATAIRE:",i/2,e),t.setFont("helvetica","normal"),t.setFontSize(9),t.text(s.fournisseurNom,i/2,e+5)):n&&(t.setFont("helvetica","bold"),t.setFontSize(10),t.text("DESTINATAIRE:",i/2,e),t.setFont("helvetica","normal"),t.setFontSize(9),t.text("(À compléter)",i/2,e+5)),e+=22,n&&(t.setFillColor(254,252,232),t.setDrawColor(250,204,21),t.roundedRect(o,e-2,i-o*2,14,2,2,"FD"),t.setFontSize(8),t.setFont("helvetica","bold"),t.setTextColor(113,63,18),t.text("Objet : Demande de devis",o+4,e+3),t.setFont("helvetica","normal"),t.text("Merci de nous faire parvenir votre meilleure offre de prix pour les articles ci-dessous.",o+4,e+8),t.setTextColor(0,0,0),e+=18),t.setDrawColor(200,200,200),t.line(o,e,i-o,e),e+=8,n?(t.setFillColor(241,245,249),t.rect(o,e-3,i-o*2,8,"F"),t.setFontSize(8),t.setFont("helvetica","bold"),t.setTextColor(100,116,139),t.text("DÉSIGNATION",o+2,e+2),t.text("QUANTITÉ DEMANDÉE",i-o-2,e+2,{align:"right"}),e+=10,t.setTextColor(0,0,0),t.setFont("helvetica","normal"),t.setFontSize(9),s.lignes.forEach((r,c)=>{e>250&&(t.addPage(),e=o),c%2===0&&(t.setFillColor(248,250,252),t.rect(o,e-3.5,i-o*2,7,"F")),t.text(r.designation,o+2,e),t.text(String(r.quantite),i-o-2,e,{align:"right"}),e+=7}),e+=5,t.line(o,e,i-o,e),e+=10,t.setFontSize(9),t.setFont("helvetica","bold"),t.setTextColor(100,116,139),t.text("Réponse du fournisseur (à compléter) :",o,e),e+=8,t.setFillColor(241,245,249),t.rect(o,e-3,i-o*2,8,"F"),t.setFontSize(8),t.text("DÉSIGNATION",o+2,e+2),t.text("P.U. HT",120,e+2,{align:"center"}),t.text("DÉLAI",150,e+2,{align:"center"}),t.text("TOTAL HT",i-o-2,e+2,{align:"right"}),e+=10,t.setTextColor(0,0,0),t.setFont("helvetica","normal"),s.lignes.forEach((r,c)=>{e>250&&(t.addPage(),e=o),c%2===0&&(t.setFillColor(248,250,252),t.rect(o,e-3.5,i-o*2,7,"F")),t.text(r.designation,o+2,e),t.setDrawColor(180,180,180),t.line(110,e+.5,130,e+.5),t.line(140,e+.5,160,e+.5),t.line(170,e+.5,i-o-2,e+.5),e+=7}),e+=5,t.line(o,e,i-o,e),e+=10,t.setFontSize(9),t.setFont("helvetica","normal"),t.text("Total HT :",130,e),t.setDrawColor(180,180,180),t.line(160,e+.5,i-o-2,e+.5),e+=6,t.text("TVA (%) :",130,e),t.line(160,e+.5,i-o-2,e+.5),e+=6,t.setFont("helvetica","bold"),t.text("Total TTC :",130,e),t.line(160,e+.5,i-o-2,e+.5),e+=10,t.setFontSize(8),t.setFont("helvetica","normal"),t.setTextColor(100,116,139),t.text("Date et signature du fournisseur :",o,e),t.setDrawColor(200,200,200),t.rect(o,e+3,80,25)):(t.setFillColor(241,245,249),t.rect(o,e-3,i-o*2,8,"F"),t.setFontSize(8),t.setFont("helvetica","bold"),t.setTextColor(100,116,139),t.text("DÉSIGNATION",o+2,e+2),t.text("QTÉ",115,e+2,{align:"center"}),t.text("P.U. HT",140,e+2,{align:"center"}),t.text("TOTAL HT",i-o-2,e+2,{align:"right"}),e+=10,t.setTextColor(0,0,0),t.setFont("helvetica","normal"),t.setFontSize(9),s.lignes.forEach((r,c)=>{e>250&&(t.addPage(),e=o),c%2===0&&(t.setFillColor(248,250,252),t.rect(o,e-3.5,i-o*2,7,"F")),t.text(r.designation,o+2,e),t.text(String(r.quantite),115,e,{align:"center"}),t.text(`${r.prixUnitaire.toFixed(2)} €`,140,e,{align:"center"}),t.text(`${r.total.toFixed(2)} €`,i-o-2,e,{align:"right"}),e+=7}),e+=5,t.line(o,e,i-o,e),e+=8,t.setFontSize(10),t.setFont("helvetica","normal"),t.text("Total HT:",130,e),t.text(`${s.totalHT.toFixed(2)} €`,i-o-2,e,{align:"right"}),e+=6,t.text(`TVA ${s.tva}%:`,130,e),t.text(`${(s.totalTTC-s.totalHT).toFixed(2)} €`,i-o-2,e,{align:"right"}),e+=7,t.setFont("helvetica","bold"),t.setFontSize(12),t.text("Total TTC:",130,e),t.text(`${s.totalTTC.toFixed(2)} €`,i-o-2,e,{align:"right"})),s.notes&&(e+=15,t.setFontSize(9),t.setFont("helvetica","italic"),t.setTextColor(100,116,139),t.text(`Notes: ${s.notes}`,o,e,{maxWidth:i-o*2}));const a=t.internal.pageSize.getHeight()-10;t.setFontSize(7),t.setFont("helvetica","normal"),t.setTextColor(148,163,184),t.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} — Gestion Opérationnelle PM`,i/2,a,{align:"center"});const d=`${s.numero}.pdf`;t.save(d)}let E="demande_devis";const At={brouillon:"Brouillon",envoye:"Envoyée",repondu:"Répondu",accepte:"Accepté",commande:"Commandé",livre:"Livré"};function h(s){var o,e,u;const{commandes:n}=x(),t=n.filter(a=>a.type===E),l=E==="demande_devis";let i=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
    <div style="display:flex;gap:4px;">
      <button class="stock-tab ${E==="demande_devis"?"active":""}" id="btnFilterDevis">Demandes de devis</button>
      <button class="stock-tab ${E==="commande"?"active":""}" id="btnFilterCommande">Commandes</button>
    </div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnNewCommande">+ ${l?"Nouvelle demande":"Nouvelle commande"}</button>
  </div>`;i+='<div id="commandeForm" style="display:none;margin-bottom:12px;"></div>',t.length===0?i+=`<div class="stock-empty">
      <div class="stock-empty-icon">${l?"📋":"📦"}</div>
      <div>Aucune ${l?"demande de devis":"commande"} pour le moment.</div>
    </div>`:t.forEach(a=>{i+=`<div class="commande-card" data-cmd-id="${a.id}">
        <div class="commande-header">
          <div>
            <div class="commande-numero">${a.numero}</div>
            <div style="font-size:11px;color:var(--text3);">${a.date}</div>
          </div>
          <div class="commande-status ${a.statut}">${At[a.statut]||a.statut}</div>
        </div>
        <div class="commande-fournisseur">${a.fournisseurNom||"Tous fournisseurs (à envoyer à plusieurs)"}</div>
        ${a.lignes.length>0?Ct(a,l):'<div style="font-size:11px;color:var(--text3);margin-top:6px;font-style:italic;">Aucun article</div>'}
        ${a.notes?`<div style="font-size:11px;color:var(--text3);margin-top:6px;font-style:italic;">📝 ${a.notes}</div>`:""}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button class="stock-btn stock-btn-secondary stock-btn-sm btn-cmd-edit" data-id="${a.id}">✏️ Articles</button>
          <button class="stock-btn stock-btn-primary stock-btn-sm btn-cmd-pdf" data-id="${a.id}">📄 PDF</button>
          ${Lt(a,l)}
          <button class="stock-btn stock-btn-danger stock-btn-sm btn-cmd-delete" data-id="${a.id}">🗑️</button>
        </div>
        <div id="cmdAction_${a.id}" style="display:none;margin-top:10px;"></div>
      </div>`}),s.innerHTML=i,(o=document.getElementById("btnFilterDevis"))==null||o.addEventListener("click",()=>{E="demande_devis",h(s)}),(e=document.getElementById("btnFilterCommande"))==null||e.addEventListener("click",()=>{E="commande",h(s)}),(u=document.getElementById("btnNewCommande"))==null||u.addEventListener("click",()=>Tt(s)),s.querySelectorAll(".btn-cmd-edit").forEach(a=>{a.addEventListener("click",()=>It(s,a.dataset.id))}),s.querySelectorAll(".btn-cmd-pdf").forEach(a=>{a.addEventListener("click",()=>{const d=N(a.dataset.id);d&&ht(d)})}),s.querySelectorAll(".btn-cmd-status").forEach(a=>{a.addEventListener("click",()=>{it(a.dataset.id,a.dataset.status),h(s)})}),s.querySelectorAll(".btn-cmd-delete").forEach(a=>{a.addEventListener("click",()=>{confirm("Supprimer ce document ?")&&(nt(a.dataset.id),h(s))})})}function Ct(s,n){return n?`
      <table class="ligne-table">
        <thead><tr><th>Désignation</th><th>Quantité demandée</th></tr></thead>
        <tbody>${s.lignes.map(t=>`<tr>
          <td>${t.designation}</td><td style="text-align:center;font-weight:700;">${t.quantite}</td>
        </tr>`).join("")}</tbody>
      </table>`:`
      <table class="ligne-table">
        <thead><tr><th>Désignation</th><th>Qté</th><th>P.U. HT</th><th>Total HT</th></tr></thead>
        <tbody>${s.lignes.map(t=>`<tr>
          <td>${t.designation}</td><td>${t.quantite}</td><td>${t.prixUnitaire.toFixed(2)}€</td><td>${t.total.toFixed(2)}€</td>
        </tr>`).join("")}</tbody>
      </table>
      <div class="ligne-total"><span>Total HT</span><span>${s.totalHT.toFixed(2)}€</span></div>
      <div class="ligne-total"><span>TVA ${s.tva}%</span><span>${(s.totalTTC-s.totalHT).toFixed(2)}€</span></div>
      <div class="ligne-total ttc"><span>Total TTC</span><span>${s.totalTTC.toFixed(2)}€</span></div>`}function Lt(s,n){return n?s.statut==="brouillon"?`<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${s.id}" data-status="envoye" style="background:#dbeafe;color:#1e40af;">→ Envoyée</button>`:s.statut==="envoye"?`<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${s.id}" data-status="repondu" style="background:#dcfce7;color:#166534;">→ Répondu</button>`:"":s.statut==="brouillon"?`<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${s.id}" data-status="envoye" style="background:#dbeafe;color:#1e40af;">→ Envoyée</button>`:s.statut==="envoye"?`<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${s.id}" data-status="accepte" style="background:#dcfce7;color:#166534;">→ Accepté</button>`:s.statut==="accepte"?`<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${s.id}" data-status="livre" style="background:#f0fdf4;color:#14532d;">→ Livré</button>`:""}function Tt(s){var a,d,r;const{fournisseurs:n}=x(),t=document.getElementById("commandeForm");if(!t)return;const l=E==="demande_devis",i=n.map(c=>`<option value="${c.id}" data-nom="${c.nom}">${c.nom}</option>`).join(""),o=st();t.style.display="block",t.innerHTML=`
    <div class="stock-card">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:10px;">${l?"📋 Nouvelle demande de devis":"📦 Nouvelle commande"}</div>
      ${l?`<div style="font-size:11px;color:var(--text2);margin-bottom:10px;line-height:1.5;background:#f0fdf4;padding:10px;border-radius:8px;border:1px solid #bbf7d0;">
        Ce document sera envoyé aux fournisseurs pour obtenir une offre de prix. Renseignez les armes et/ou munitions dont vous avez besoin.
      </div>`:""}
      <div class="stock-field"><label>Fournisseur ${l?"(optionnel si envoi à plusieurs)":""}</label>
        <select id="cmdFournisseur">
          <option value="">${l?"— Tous fournisseurs —":"— Choisir un fournisseur —"}</option>
          ${i}
        </select>
      </div>
      ${l&&o.length>0?`
        <div class="stock-section-title" style="padding-top:4px;">Ajout rapide depuis les armes configurées</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;" id="quickAddArmes">
          ${o.map(c=>{const b=z(c.idx),v=b?` (stock: ${b.stockActuel} ${b.unite}s)`:"";return`<button class="stock-chip" data-idx="${c.idx}" data-nom="${c.nom}" data-ref="${c.ref||""}">${c.nom}${v}</button>`}).join("")}
        </div>
        <div id="quickAddLines" style="margin-bottom:10px;"></div>
      `:""}
      <div class="stock-field"><label>Notes / Précisions</label>
        <textarea id="cmdNotes" rows="2" placeholder="${l?"Précisions sur le besoin, délai souhaité...":"Notes internes..."}"></textarea>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="stock-btn stock-btn-primary" id="cmdConfirm">Créer</button>
        <button class="stock-btn stock-btn-secondary" id="cmdCancel">Annuler</button>
      </div>
    </div>`;const e=[];(a=t.querySelectorAll("#quickAddArmes .stock-chip"))==null||a.forEach(c=>{c.addEventListener("click",()=>{c.classList.toggle("selected");const b=+c.dataset.idx,v=e.findIndex(m=>m.armeIdx===b);c.classList.contains("selected")?v===-1&&e.push({armeIdx:b,nom:c.dataset.nom,ref:c.dataset.ref,qty:0,type:"munitions"}):v>=0&&e.splice(v,1),u(e)})});function u(c){const b=document.getElementById("quickAddLines");if(b){if(c.length===0){b.innerHTML="";return}b.innerHTML=c.map((v,m)=>`
      <div style="display:flex;align-items:center;gap:6px;padding:8px;background:#f8fafc;border-radius:8px;margin-bottom:4px;">
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:600;">${v.nom}${v.ref?" ("+v.ref+")":""}</div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <select class="ql-type" data-i="${m}" style="font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;">
              <option value="munitions" ${v.type==="munitions"?"selected":""}>Munitions</option>
              <option value="arme" ${v.type==="arme"?"selected":""}>Arme (remplacement/achat)</option>
            </select>
            <input type="number" class="ql-qty" data-i="${m}" value="${v.qty}" min="0" placeholder="Qté" inputmode="numeric"
              style="width:70px;font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;text-align:center;">
          </div>
        </div>
      </div>`).join(""),b.querySelectorAll(".ql-type").forEach(v=>{v.addEventListener("change",()=>{c[+v.dataset.i].type=v.value})}),b.querySelectorAll(".ql-qty").forEach(v=>{v.addEventListener("input",()=>{c[+v.dataset.i].qty=parseInt(v.value)||0})})}}(d=document.getElementById("cmdConfirm"))==null||d.addEventListener("click",()=>{var g,k;const c=document.getElementById("cmdFournisseur"),b=c.value,v=((k=(g=c.selectedOptions[0])==null?void 0:g.dataset)==null?void 0:k.nom)||"",m=document.getElementById("cmdNotes").value,p=[];if(e.forEach(y=>{y.type==="munitions"?p.push({designation:`Munitions pour ${y.nom}${y.ref?" ("+y.ref+")":""}`,quantite:y.qty||0,prixUnitaire:0,total:0}):p.push({designation:`Arme: ${y.nom}${y.ref?" ("+y.ref+")":""} (remplacement/achat)`,quantite:y.qty||1,prixUnitaire:0,total:0})}),l&&p.length===0){alert("Veuillez sélectionner au moins une arme ou munition.");return}at({type:E,fournisseurId:b,fournisseurNom:v,lignes:p,notes:m}),h(s)}),(r=document.getElementById("cmdCancel"))==null||r.addEventListener("click",()=>{t.style.display="none"})}function It(s,n){const t=N(n);if(!t)return;const l=document.getElementById(`cmdAction_${n}`);if(!l)return;const i=t.type==="demande_devis";l.style.display="block",l.innerHTML=`
    <div class="stock-section-title" style="padding-top:0;">Ajouter un article</div>
    <div class="stock-field"><label>Désignation</label><input type="text" id="ligneDesign_${n}" placeholder="${i?"Ex: Munitions 9mm, Pistolet SIG SP2022...":"Ex: Cartouches 9mm"}"></div>
    <div style="display:flex;gap:8px;">
      <div class="stock-field" style="flex:1;"><label>Quantité</label><input type="number" id="ligneQty_${n}" value="1" min="1" inputmode="numeric"></div>
      ${i?"":`<div class="stock-field" style="flex:1;"><label>Prix unitaire (€)</label><input type="number" id="lignePrix_${n}" value="0" step="0.01" min="0" inputmode="decimal"></div>`}
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="ligneAdd_${n}">Ajouter</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="ligneClose_${n}">Fermer</button>
    </div>`,document.getElementById(`ligneAdd_${n}`).addEventListener("click",()=>{const o=document.getElementById(`ligneDesign_${n}`).value.trim();if(!o){alert("Veuillez saisir une désignation");return}const e=parseInt(document.getElementById(`ligneQty_${n}`).value)||1,u=document.getElementById(`lignePrix_${n}`),a=u&&parseFloat(u.value)||0;ot(n,{designation:o,quantite:e,prixUnitaire:a}),h(s)}),document.getElementById(`ligneClose_${n}`).addEventListener("click",()=>{l.style.display="none"})}let T="munitions";function Pt(){document.getElementById("stockPanel").classList.add("active"),T="munitions",S(),P()}function qt(){document.getElementById("stockPanel").classList.remove("active")}function wt(s){T=s,S(),P()}function S(){document.querySelectorAll("#stockPanel .stock-tab").forEach(n=>{n.classList.toggle("active",n.dataset.tab===T)})}function P(){const s=document.getElementById("stockTabContent");if(s)switch(T){case"dashboard":Bt(s);break;case"munitions":L(s);break;case"armes":D(s);break;case"previsions":A(s);break;case"fournisseurs":C(s);break;case"commandes":h(s);break}}function Bt(s){var u;const n=lt(),t=dt(),l=ct(8),i=rt(),{munitionRefs:o}=x();let e="";if(n.length>0&&(e+='<div class="stock-section-title">⚠️ Alertes de stock</div>',n.forEach(a=>{e+=`<div class="alert-card ${a.level}">
        <div class="alert-icon">${a.level==="critique"?"🔴":"🟡"}</div>
        <div class="alert-info">
          <div class="alert-name">${f(a.nom)}${a.calibre?" ("+f(a.calibre)+")":""}</div>
          <div class="alert-detail">${a.stockActuel} ${f(a.unite)}${a.stockActuel>1?"s":""} restante${a.stockActuel>1?"s":""} — seuil ${a.level==="critique"?"critique":"d'alerte"}: ${a.level==="critique"?a.seuilCritique:a.seuilAlerte}</div>
        </div>
      </div>`})),t.length>0&&(e+='<div class="stock-section-title" style="margin-top:10px;">🔧 Armes nécessitant attention</div>',t.forEach(a=>{e+=`<div class="alert-card alerte">
        <div class="alert-icon">🔧</div>
        <div class="alert-info">
          <div class="alert-name">${f(a.nom)}${a.ref?" ("+f(a.ref)+")":""}</div>
          <div class="alert-detail">${a.etat==="en_revision"?"En révision":"Hors service"}${a.dateRevision?" — Révision: "+f(a.dateRevision):""}${a.notes?" — "+f(a.notes):""}</div>
        </div>
      </div>`})),o.length>0&&(e+='<div class="stock-section-title" style="margin-top:10px;">📊 Niveaux de stock</div>',o.forEach(a=>{const d=q(a),r=a.seuilAlerte>0?Math.min(100,a.stockActuel/(a.seuilAlerte*2)*100):a.stockActuel>0?100:0;e+=`<div class="stock-card" style="padding:10px 14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div><div class="stock-card-title" style="font-size:13px;">${f(a.nom)}</div><div class="stock-card-sub">${a.calibre?f(a.calibre):""} · ${a.armeIdxList.length} arme${a.armeIdxList.length>1?"s":""}</div></div>
          <div class="stock-value ${d}" style="font-size:14px;text-align:right;line-height:1.3;">
            ${(a.conditionnement||1)>1?`${a.stockActuel} x ${a.conditionnement} ${f(a.unite)}s<br><span style="font-size:15px;font-weight:800;">= ${a.stockActuel*a.conditionnement}</span>`:`${a.stockActuel}<span style="font-size:10px;font-weight:500;color:var(--text3);margin-left:2px;">${f(a.unite)}s</span>`}
          </div>
        </div>
        <div class="stock-bar-container"><div class="stock-bar ${d}" style="width:${r}%;"></div></div>
        <div class="stock-info-row"><span>Alerte: ${a.seuilAlerte}</span><span>Critique: ${a.seuilCritique}</span></div>
      </div>`})),i){const a=i.armeIdx!==void 0?z(i.armeIdx):null,d=a?a.unite+"s":"cartouches";e+='<div class="stock-section-title" style="margin-top:10px;">🎯 Prochaine séance de tir</div>',e+=`<div class="prevision-card">
      <div class="prevision-header">
        <div class="prevision-date">${i.date} — ${i.lieu||"Lieu non défini"}</div>
        <div class="prevision-status planifie">Planifié</div>
      </div>
      <div style="font-size:12px;color:var(--text2);">${i.participants.length} participant${i.participants.length>1?"s":""} · <strong>${i.munitionsParAgent} x ${i.participants.length} ${f(d)} = ${i.totalPrevu}</strong></div>
      <div style="margin-top:8px;">
        <button class="stock-btn stock-btn-secondary stock-btn-sm" id="btnDashEditPrev" data-id="${i.id}">✏️ Modifier</button>
      </div>
    </div>`}l.length>0&&(e+='<div class="stock-section-title" style="margin-top:10px;">📋 Derniers mouvements</div>',e+='<div class="stock-card">',l.forEach(a=>{const d=ut[a.type]||{label:a.type,icon:"📦",color:"#64748b"},r=a.type==="retour"||a.type==="approvisionnement"||a.type==="ajustement"&&a.quantite>0;let c="";if(a.munRefId){const b=_(a.munRefId);c=b?b.nom:M(a.armeIdx)}else c=M(a.armeIdx);e+=`<div class="mouvement-item">
        <div class="mouvement-icon">${d.icon}</div>
        <div class="mouvement-info">
          <div class="mouvement-type" style="color:${d.color};">${d.label}</div>
          <div class="mouvement-detail">${f(c)} · ${f(a.date)} ${f(a.heure)}${a.motif?" · "+f(a.motif):""}</div>
        </div>
        <div class="mouvement-qty ${r?"positive":"negative"}">${r?"+":""}${a.quantite}</div>
      </div>`}),e+="</div>"),!n.length&&!t.length&&!l.length&&!i&&o.length===0&&(e=`<div class="stock-empty">
      <div class="stock-empty-icon">📦</div>
      <div>Aucune donnée de stock pour le moment.</div>
      <div style="margin-top:8px;">Commencez par configurer le stock dans l'onglet <strong>Munitions</strong>.</div>
    </div>`),s.innerHTML=e,(u=document.getElementById("btnDashEditPrev"))==null||u.addEventListener("click",a=>{const d=a.currentTarget.dataset.id;T="previsions",S(),A(s),setTimeout(()=>{const r=s.querySelector(`.btn-prev-edit[data-id="${d}"]`);r&&r.click()},50)})}function Nt(s){}function zt(){var s;(s=document.getElementById("stockPanel"))!=null&&s.classList.contains("active")&&P()}export{Nt as bindStockCallbacks,qt as closeStock,Pt as openStock,zt as refreshStockPanel,wt as switchStockTab};
