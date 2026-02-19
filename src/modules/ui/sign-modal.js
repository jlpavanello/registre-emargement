import { getState, setState } from '../state.js';
import { nowTime } from '../utils/date.js';
import { getMachineName, getMachineCat, getMachineCatLabel, getAvailableMachines, getActiveMachines } from '../domains/machines.js';
import { getCatEmoji } from '../domains/categories.js';
import { getSignerInfo } from '../domains/responsables.js';
import { saveDayData } from '../domains/day-data.js';
import { logMouvement } from '../domains/stock-mouvements.js';
import { ensureStockForWeapon } from '../domains/stock-munitions.js';
import { initCanvas, clearCanvas } from './canvas.js';
import { isMatinLocked, isSoirLocked, hasUncoveredSignatures } from './visa.js';

let _afterConfirm = {};
export function bindSignModalCallbacks(callbacks) {
  _afterConfirm = callbacks;
}

export function closeModal() {
  document.getElementById('sigModal').classList.remove('active');
  setState('currentSignTarget', null);
}

export function updateStepIndicator(step) {
  setState('currentStep', step);
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('step' + i + 'dot');
    dot.classList.remove('active', 'done');
    if (i < step) dot.classList.add('done');
    else if (i === step) dot.classList.add('active');
  }
  document.getElementById('step1line').classList.toggle('done', step >= 2);
  document.getElementById('step2line').classList.toggle('done', step >= 3);
}

export function resetMachineSelects() {
  const { categories } = getState();
  const catSel = document.getElementById('catSelect');
  catSel.innerHTML = '<option value="">— Choisir une catégorie —</option>';
  categories.forEach((c) => { catSel.innerHTML += `<option value="${c.id}">${c.emoji} ${c.nom || '(sans nom)'}</option>`; });
  catSel.innerHTML += '<option value="__none__">\uD83D\uDCE6 Sans catégorie</option>';
  catSel.value = '';
  document.getElementById('machSelectSub').style.display = 'none';
  document.getElementById('machineSelect').innerHTML = '<option value="">— Choisir —</option>';
  document.getElementById('btnAddMachine').disabled = true;
  setState('accQty', 0);
  document.getElementById('qtyValue').value = '0';
}

export function onCatChange() {
  const catSel = document.getElementById('catSelect');
  const machSub = document.getElementById('machSelectSub');
  const machSel = document.getElementById('machineSelect');
  const cat = catSel.value;
  if (!cat) { machSub.style.display = 'none'; machSel.innerHTML = '<option value="">— Choisir —</option>'; document.getElementById('btnAddMachine').disabled = true; return; }
  const { currentSignTarget } = getState();
  const empIdx = currentSignTarget ? currentSignTarget.index : -1;
  const avail = getAvailableMachines(empIdx).filter((m) => cat === '__none__' ? !(m.cat) : (m.cat || '') === cat);
  machSel.innerHTML = '<option value="">— Choisir —</option>';
  if (avail.length === 0) {
    machSel.innerHTML = '<option value="" disabled>Aucune arme disponible dans cette catégorie</option>';
    machSub.style.display = 'block';
    document.getElementById('btnAddMachine').disabled = true;
    return;
  }
  avail.forEach((m) => { const o = document.createElement('option'); o.value = m.idx; o.textContent = m.nom + (m.ref ? ` (${m.ref})` : ''); machSel.appendChild(o); });
  machSub.style.display = 'block';
  document.getElementById('btnAddMachine').disabled = true;
}

export function onMachineChange() {
  document.getElementById('btnAddMachine').disabled = !document.getElementById('machineSelect').value;
}

export function changeQty(delta) {
  const qty = Math.max(0, getState().accQty + delta);
  setState('accQty', qty);
  document.getElementById('qtyValue').value = qty;
}

export function onQtyInput(el) {
  let v = parseInt(el.value);
  if (isNaN(v) || v < 0) v = 0;
  setState('accQty', v);
  el.value = v;
}

export function addMachineToList() {
  const sel = document.getElementById('machineSelect');
  if (!sel.value) { alert('Veuillez choisir une arme.'); return; }
  const machIdx = parseInt(sel.value);
  const { selectedMachines, accQty } = getState();
  if (selectedMachines.some((m) => m.machineIdx === machIdx)) { alert('Cette arme est déjà ajoutée.'); return; }
  selectedMachines.push({ machineIdx: machIdx, acc: accQty });
  setState('selectedMachines', selectedMachines);
  document.getElementById('machSelectArea').style.display = 'none';
  document.getElementById('machineListArea').style.display = 'block';
  renderMachineList();
  updateStepIndicator(2);
}

export function removeMachineFromList(machIdx) {
  setState('selectedMachines', getState().selectedMachines.filter((m) => m.machineIdx !== machIdx));
  renderMachineList();
  if (getState().selectedMachines.length === 0) { goToAddAnotherMachine(); updateStepIndicator(1); }
}

export function renderMachineList() {
  const { selectedMachines } = getState();
  const c = document.getElementById('machineListContent');
  c.innerHTML = '';
  selectedMachines.forEach((m) => {
    const name = getMachineName(m.machineIdx);
    const catLabel = getMachineCatLabel(getMachineCat(m.machineIdx));
    const item = document.createElement('div');
    item.className = 'machine-list-item';
    item.innerHTML = `<div class="mli-info"><div class="mli-name">${name}</div><div class="mli-detail">${catLabel ? catLabel + ' \u2014 ' : ''}${m.acc} munition${m.acc > 1 ? 's' : ''}</div></div>`;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'mli-remove';
    removeBtn.textContent = '\u2715';
    removeBtn.addEventListener('click', () => removeMachineFromList(m.machineIdx));
    item.appendChild(removeBtn);
    c.appendChild(item);
  });
  document.getElementById('btnGoToSign').disabled = selectedMachines.length === 0;
}

export function goToAddAnotherMachine() {
  document.getElementById('machineListArea').style.display = 'none';
  document.getElementById('machSelectArea').style.display = 'block';
  resetMachineSelects();
  updateStepIndicator(1);
}

export function goToSignStep() {
  if (getState().selectedMachines.length === 0) { alert('Ajoutez au moins une arme.'); return; }
  document.getElementById('machineListArea').style.display = 'none';
  document.getElementById('sigCanvasArea').style.display = 'block';
  document.getElementById('btnClear').style.display = '';
  document.querySelector('.modal-btn.confirm').style.display = '';
  updateStepIndicator(3);
  initCanvas();
}

export function getEcartText(sorti, rentre) {
  const diff = sorti - rentre;
  if (diff > 0) return `\u26A0\uFE0F ${diff} munition${diff > 1 ? 's' : ''} manquante${diff > 1 ? 's' : ''}`;
  return `\u26A0\uFE0F ${Math.abs(diff)} munition${Math.abs(diff) > 1 ? 's' : ''} en plus`;
}

export function changeSoirQty(machIdx, delta) {
  const el = document.getElementById('soirQty_' + machIdx);
  let v = Math.max(0, parseInt(el.value || 0) + delta);
  el.value = v;
  checkSoirEcart(machIdx);
}

export function onSoirQtyInput(el, machIdx) {
  let v = parseInt(el.value);
  if (isNaN(v) || v < 0) v = 0;
  el.value = v;
  checkSoirEcart(machIdx);
}

export function checkSoirEcart(machIdx) {
  const { currentSignTarget, dayData } = getState();
  const d = dayData[currentSignTarget.index];
  const m = d.matin.machines.find((x) => x.machineIdx === machIdx);
  if (!m) return;
  const retQty = parseInt(document.getElementById('soirQty_' + machIdx).value) || 0;
  const alertEl = document.getElementById('soirAlert_' + machIdx);
  if (m.acc > 0 && retQty !== m.acc) {
    alertEl.style.display = '';
    alertEl.querySelector('div').textContent = getEcartText(m.acc, retQty);
  } else {
    alertEl.style.display = 'none';
  }
}

export function renderSoirReturnArea(empIdx) {
  const { dayData } = getState();
  const d = dayData[empIdx];
  if (!d) return;
  const mList = d.matin.machines || [];
  const area = document.getElementById('soirReturnArea');
  if (mList.length === 0) { area.style.display = 'none'; return; }
  area.style.display = 'block';
  let html = '<label>Armes \u00E0 rendre</label>';
  mList.forEach((m) => {
    const name = getMachineName(m.machineIdx);
    const catLabel = getMachineCatLabel(getMachineCat(m.machineIdx));
    const ret = d.soir.returns[m.machineIdx] || {};
    const retQty = ret.accRetour !== undefined ? ret.accRetour : m.acc;
    const motif = ret.motif || '';
    const hasEcart = m.acc > 0 && retQty !== m.acc;
    html += `<div class="soir-machine-card" data-midx="${m.machineIdx}">
      <div class="smc-header"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="1"/></svg>${name}${catLabel ? ' \u2014 ' + catLabel : ''}</div>
      ${m.acc > 0 ? `<div class="smc-acc-info">${m.acc} munition${m.acc > 1 ? 's' : ''} sortie${m.acc > 1 ? 's' : ''} ce matin</div>
      <div class="qty-selector" style="margin-bottom:4px;">
        <button class="qty-minus" data-machidx="${m.machineIdx}" data-delta="-1">\u2212</button>
        <input type="number" class="qty-value" id="soirQty_${m.machineIdx}" value="${retQty}" min="0" inputmode="numeric">
        <button class="qty-plus" data-machidx="${m.machineIdx}" data-delta="1">+</button>
      </div>
      <div class="smc-alert" id="soirAlert_${m.machineIdx}" style="${hasEcart ? '' : 'display:none;'}">
        <div>${hasEcart ? getEcartText(m.acc, retQty) : ''}</div>
        <textarea id="soirMotif_${m.machineIdx}" placeholder="Raison de l'\u00E9cart (obligatoire)...">${motif}</textarea>
      </div>` : '<div class="smc-acc-info" style="color:#10b981;">Aucune munition \u2014 restitution simple</div>'}
    </div>`;
  });
  area.innerHTML = html;
  // Bind qty buttons
  area.querySelectorAll('.qty-minus, .qty-plus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const machIdx = parseInt(btn.dataset.machidx);
      const delta = parseInt(btn.dataset.delta);
      changeSoirQty(machIdx, delta);
    });
  });
  area.querySelectorAll('.qty-value').forEach((inp) => {
    const machIdx = parseInt(inp.id.replace('soirQty_', ''));
    inp.addEventListener('input', () => onSoirQtyInput(inp, machIdx));
    inp.addEventListener('change', () => onSoirQtyInput(inp, machIdx));
  });
}

export function openSignModal(index, period) {
  setState('currentSignTarget', { index, period });
  setState('accQty', 0);
  setState('currentStep', 1);
  setState('selectedMachines', []);

  const title = document.getElementById('modalTitle');
  const sub = document.getElementById('modalSubtitle');
  const machArea = document.getElementById('machSelectArea');
  const machListArea = document.getElementById('machineListArea');
  const soirReturnArea = document.getElementById('soirReturnArea');
  const sigArea = document.getElementById('sigCanvasArea');
  const stepInd = document.getElementById('stepIndicator');
  machArea.style.display = 'none';
  machListArea.style.display = 'none';
  soirReturnArea.style.display = 'none';
  sigArea.style.display = 'none';
  stepInd.style.display = 'none';
  document.getElementById('btnClear').style.display = 'none';
  document.querySelector('.modal-btn.confirm').style.display = 'none';
  let hasMachineStep = false;
  const { team, dayData, lockedMatinPresents, lockedSoirPresents } = getState();

  if (index === -1) {
    const signer = getSignerInfo();
    const signerName = signer ? signer.nom : 'Responsable';
    const signerLabel = signer ? signer.label : '';
    if (period === 'visaMatin') {
      if (isMatinLocked() && !hasUncoveredSignatures('matin')) { alert('La sortie est déjà verrouillée par le responsable. Tous les agents sont couverts.'); closeModal(); return; }
      if (hasUncoveredSignatures('matin')) {
        title.textContent = '\u26A0\uFE0F Re-Visa ' + signerLabel + ' \u2014 SORTIE';
        sub.textContent = signerName + ' \u2014 Nouveaux agents \u00E0 couvrir';
      } else {
        title.textContent = 'Visa ' + signerLabel + ' \u2014 SORTIE';
        sub.textContent = signerName + ' \u2014 Validation des sorties d\'armes';
      }
    } else {
      if (isSoirLocked() && !hasUncoveredSignatures('soir')) { alert('Le retour est déjà verrouillé par le responsable. Tous les agents sont couverts.'); closeModal(); return; }
      if (hasUncoveredSignatures('soir')) {
        title.textContent = '\u26A0\uFE0F Re-Visa ' + signerLabel + ' \u2014 RETOUR';
        sub.textContent = signerName + ' \u2014 Nouveaux agents \u00E0 couvrir';
      } else {
        title.textContent = 'Visa ' + signerLabel + ' \u2014 RETOUR';
        sub.textContent = signerName + ' \u2014 Validation des retours d\'armes';
      }
    }
    sigArea.style.display = 'block';
    document.getElementById('btnClear').style.display = '';
    document.querySelector('.modal-btn.confirm').style.display = '';
  } else {
    if (period === 'matin' && isMatinLocked() && lockedMatinPresents.includes(index)) { alert('La sortie est verrouillée pour cet agent.'); return; }
    if (period === 'soir' && isSoirLocked() && lockedSoirPresents.includes(index)) { alert('Le retour est verrouillé pour cet agent.'); return; }
    title.textContent = team[index].nom || `Agent n\u00B0${index + 1}`;
    if (period === 'matin') {
      sub.textContent = 'Sortie des armes';
      const avail = getAvailableMachines(index);
      if (avail.length > 0 || (dayData[index] && dayData[index].matin.machines.length > 0)) {
        hasMachineStep = true;
        stepInd.style.display = 'flex';
        updateStepIndicator(1);
        const existing = dayData[index] ? dayData[index].matin.machines : [];
        if (existing.length > 0) {
          setState('selectedMachines', JSON.parse(JSON.stringify(existing)));
          machListArea.style.display = 'block';
          machArea.style.display = 'none';
          renderMachineList();
          updateStepIndicator(2);
        } else {
          machArea.style.display = 'block';
          resetMachineSelects();
        }
      } else {
        sigArea.style.display = 'block';
        document.getElementById('btnClear').style.display = '';
        document.querySelector('.modal-btn.confirm').style.display = '';
      }
    } else {
      sub.textContent = 'Retour des armes';
      const d = dayData[index];
      if (!d || !d.matin.machines || d.matin.machines.length === 0) {
        alert('Cet agent n\'a pas de sortie d\'arme.');
        closeModal();
        return;
      }
      renderSoirReturnArea(index);
      sigArea.style.display = 'block';
      document.getElementById('btnClear').style.display = '';
      document.querySelector('.modal-btn.confirm').style.display = '';
    }
  }
  document.getElementById('sigModal').classList.add('active');
  if (!hasMachineStep || period !== 'matin') { initCanvas(); }
}

export function confirmSignature() {
  const { sigCanvas, sigCtx, currentSignTarget, selectedMachines, dayData, presentToday } = getState();
  if (!sigCanvas || !currentSignTarget) return;
  const img = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height);
  if (!img.data.some((v, i) => i % 4 === 3 && v > 0)) { alert('Veuillez signer.'); return; }
  const url = sigCanvas.toDataURL('image/png');
  const { index, period } = currentSignTarget;

  if (index === -1) {
    const signer = getSignerInfo();
    if (period === 'visaMatin') {
      setState('visaMatin', url);
      setState('visaMatinSigner', signer);
      setState('lockedMatinPresents', presentToday.filter((i) => dayData[i] && dayData[i].matin.signature));
      const b = document.getElementById('visaMatinBtn');
      b.innerHTML = `<img src="${url}" alt="v">`;
      b.classList.add('signed');
      if (signer) { const info = document.getElementById('visaMatinSignedBy'); info.textContent = signer.label + ' \u2014 ' + signer.nom; info.style.display = 'block'; }
    } else {
      setState('visaSoir', url);
      setState('visaSoirSigner', signer);
      setState('lockedSoirPresents', presentToday.filter((i) => dayData[i] && dayData[i].soir.signature));
      const b = document.getElementById('visaSoirBtn');
      b.innerHTML = `<img src="${url}" alt="v">`;
      b.classList.add('signed');
      if (signer) { const info = document.getElementById('visaSoirSignedBy'); info.textContent = signer.label + ' \u2014 ' + signer.nom; info.style.display = 'block'; }
    }
  } else if (period === 'matin') {
    if (selectedMachines.length > 0) {
      dayData[index].matin.machines = [...selectedMachines];
    }
    dayData[index].matin.signature = url;
    dayData[index].matin.heure = nowTime();
  } else {
    // SOIR
    const d = dayData[index];
    const mList = d.matin.machines || [];
    const returns = {};
    let hasError = false;
    mList.forEach((m) => {
      const qtyEl = document.getElementById('soirQty_' + m.machineIdx);
      const retQty = qtyEl ? parseInt(qtyEl.value) || 0 : 0;
      const motifEl = document.getElementById('soirMotif_' + m.machineIdx);
      const motif = motifEl ? motifEl.value.trim() : '';
      if (m.acc > 0 && retQty !== m.acc && !motif) {
        hasError = true;
        alert('\u00C9cart détecté pour ' + getMachineName(m.machineIdx) + ' ! Veuillez renseigner le motif.');
      }
      returns[m.machineIdx] = { accRetour: retQty, motif: motif };
    });
    if (hasError) return;
    dayData[index].soir.returns = returns;
    dayData[index].soir.signature = url;
    dayData[index].soir.heure = nowTime();
  }
  setState('dayData', dayData);
  closeModal();
  saveDayData();

  // Stock: log mouvements automatiques
  if (index !== -1 && period === 'matin' && selectedMachines.length > 0) {
    selectedMachines.forEach(m => {
      if (m.acc > 0) {
        ensureStockForWeapon(m.machineIdx);
        logMouvement({ type: 'sortie', armeIdx: m.machineIdx, quantite: m.acc, agentIdx: index, source: 'emargement' });
      }
    });
  } else if (index !== -1 && period === 'soir') {
    const d = dayData[index];
    const mList = d.matin.machines || [];
    mList.forEach(m => {
      const ret = d.soir.returns[m.machineIdx];
      if (!ret) return;
      const accRetour = ret.accRetour || 0;
      if (accRetour > 0) {
        ensureStockForWeapon(m.machineIdx);
        logMouvement({ type: 'retour', armeIdx: m.machineIdx, quantite: accRetour, agentIdx: index, source: 'emargement' });
      }
      // Log perte si écart
      const ecart = m.acc - accRetour;
      if (ecart > 0) {
        logMouvement({ type: 'perte', armeIdx: m.machineIdx, quantite: ecart, agentIdx: index, motif: ret.motif || 'Écart non justifié', source: 'emargement' });
      }
    });
  }

  if (_afterConfirm.renderEmployees) _afterConfirm.renderEmployees();
  if (_afterConfirm.updateCounts) _afterConfirm.updateCounts();
  if (_afterConfirm.updateSoirTabState) _afterConfirm.updateSoirTabState();
  if (_afterConfirm.updateVisaButtonState) _afterConfirm.updateVisaButtonState();
}
