import { getState, setState } from '../state.js';
import { getActiveTeam } from '../domains/team.js';
import { getMachineName } from '../domains/machines.js';
import { getVehicleLabel } from '../domains/crews.js';
import { getCrewForEmployee } from '../domains/crew-assignment.js';
import { isMatinLocked, isSoirLocked } from './visa.js';
import { escapeHtml } from '../utils/sanitize.js';

let _callbacks = {};
export function bindRendererCallbacks(callbacks) {
  _callbacks = callbacks;
}

export function renderEmployees() {
  const { team, currentPeriod, presentToday, dayData, lockedMatinPresents, lockedSoirPresents } = getState();
  const c = document.getElementById('employeesList');
  if (!c) return; // null-guard: registre pas monte

  if (team.every((t) => !t.nom)) {
    c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">\uD83D\uDC65</div><div class="empty-state-title">Aucun agent configur\u00e9</div><p>Ajoutez vos agents dans la configuration pour commencer \u00e0 utiliser le registre.</p><button id="emptyConfigBtn">Ouvrir la configuration</button></div>';
    const btn = document.getElementById('emptyConfigBtn');
    if (btn) btn.addEventListener('click', () => { if (_callbacks.openConfig) _callbacks.openConfig(); });
    return;
  }
  c.innerHTML = '';
  const activeTeam = getActiveTeam();
  if (presentToday.length === 0 && activeTeam.length > 0) {
    c.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">\u2705</div>
      <div class="empty-state-title">Aucun agent pr\u00e9sent s\u00e9lectionn\u00e9</div>
      <p>S\u00e9lectionnez les agents de service aujourd'hui pour afficher la feuille d'\u00e9margement.</p>
      <button id="selectPresenceBtn">Choisir les pr\u00e9sents</button>
    </div>`;
    const btn = document.getElementById('selectPresenceBtn');
    if (btn) btn.addEventListener('click', () => { if (_callbacks.openPresenceSelector) _callbacks.openPresenceSelector(); });
    return;
  }

  const periodLocked = (currentPeriod === 'matin' && isMatinLocked()) || (currentPeriod === 'soir' && isSoirLocked());
  const lockedList = currentPeriod === 'matin' ? lockedMatinPresents : lockedSoirPresents;
  const banner = document.getElementById('lockedBanner');
  if (periodLocked) {
    banner.style.display = 'flex';
    document.getElementById('lockedText').textContent = currentPeriod === 'matin'
      ? 'Sortie verrouillée \u2014 Le responsable a validé les sorties d\'armes'
      : 'Retour verrouillé \u2014 Le responsable a validé les retours d\'armes';
  } else {
    banner.style.display = 'none';
  }

  let cardIdx = 0;
  for (let i = 0; i < team.length; i++) {
    const t = team[i];
    if (!t.nom) continue;
    if (!presentToday.includes(i)) continue;
    const d = dayData[i];
    const sig = d ? d[currentPeriod] : { signature: null, heure: null };
    const isSigned = !!sig.signature;
    const empLocked = periodLocked && lockedList.includes(i);
    const mList = d ? (d.matin.machines || []) : [];
    const totalAcc = mList.reduce((s, m) => s + m.acc, 0);
    const totalRet = d && d.soir.returns ? mList.reduce((s, m) => s + (d.soir.returns[m.machineIdx] ? d.soir.returns[m.machineIdx].accRetour : 0), 0) : 0;
    const showInfo = mList.length > 0 && d && d.matin.signature && (currentPeriod === 'matin' ? isSigned : true);
    const hasEcart = d && d.soir.returns && mList.some((m) => { const r = d.soir.returns[m.machineIdx]; return r && r.motif; });
    const hasCheckout = mList.length > 0 && d && !!d.matin.signature;
    const needsMatinVisa = currentPeriod === 'soir' && hasCheckout && !isSigned && !lockedMatinPresents.includes(i);

    let machBadges = '';
    if (showInfo) {
      if (mList.length <= 2) {
        machBadges = mList.map((m) => `<span class="badge badge-machine"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="1"/></svg>${getMachineName(m.machineIdx)}</span>`).join('');
      } else {
        machBadges = `<span class="badge badge-machine"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="1"/></svg>${getMachineName(mList[0].machineIdx)} + ${mList.length - 1} autre${mList.length - 1 > 1 ? 's' : ''}</span>`;
      }
    }

    // Crew badge
    const crewVehicle = getCrewForEmployee(i);
    const crewBadgeHtml = crewVehicle !== null ? `<span class="badge badge-crew">🚗 ${getVehicleLabel(crewVehicle)}</span>` : '';

    const card = document.createElement('div');
    card.className = 'emp-card' + (isSigned ? ' signed-card' : '') + (empLocked ? ' locked' : '');
    card.style.animationDelay = (cardIdx * 0.04) + 's';
    cardIdx++;
    card.innerHTML = `
      ${!empLocked ? '<button class="btn-remove-present" title="Retirer des présents">Supprimer</button>' : ''}
      <div class="emp-num">${i + 1}</div>
      <div class="emp-info">
        <div class="emp-name">${escapeHtml(t.nom)}</div>
        <div class="emp-detail">${t.matricule ? 'Mat. ' + escapeHtml(t.matricule) : ''}${isSigned ? ' \u2713 Signé' : ''}${empLocked && isSigned ? ' \uD83D\uDD12' : ''}</div>
        ${crewBadgeHtml || showInfo ? `<div class="emp-badges">
          ${crewBadgeHtml}
          ${machBadges}
          ${totalAcc > 0 ? `<span class="badge badge-acc">${currentPeriod === 'matin' ? totalAcc + ' munition' + (totalAcc > 1 ? 's' : '') : totalRet + ' munition' + (totalRet > 1 ? 's' : '')}</span>` : ''}
          ${currentPeriod === 'soir' && hasEcart ? '<span class="badge badge-warning">\u26A0 Écart</span>' : ''}
        </div>` : ''}
      </div>
      <div class="emp-sign-area">
        ${sig.heure ? `<span class="emp-time">${sig.heure}</span>` : ''}
        <div class="sign-btn ${isSigned ? 'signed' : ''} ${empLocked ? 'locked-btn' : ''} ${needsMatinVisa ? 'needs-visa' : ''} ${currentPeriod === 'soir' && !hasCheckout && !isSigned ? 'no-checkout' : ''}">
          ${isSigned ? `<img src="${sig.signature}" alt="s">` : (empLocked ? '\uD83D\uDD12' : (needsMatinVisa ? '⚠️ Visa' : (currentPeriod === 'soir' ? (hasCheckout ? 'Rendre' : '—') : 'Choisir')))}
        </div>
      </div>`;

    if (!empLocked) {
      const signBtn = card.querySelector('.sign-btn');
      const empIdx = i;
      const period = currentPeriod;
      if (!(period === 'soir' && !hasCheckout)) {
        signBtn.addEventListener('click', () => {
          if (_callbacks.openSignModal) _callbacks.openSignModal(empIdx, period);
        });
      }
      const removeBtn = card.querySelector('.btn-remove-present');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (_callbacks.removeFromPresent) _callbacks.removeFromPresent(empIdx);
        });
      }
    }
    c.appendChild(card);
  }
}

export function switchPeriod(p) {
  if (p === 'soir' && !isMatinLocked()) {
    alert("Le responsable doit d'abord signer le visa de sortie des armes avant de passer aux retours.");
    return;
  }
  setState('currentPeriod', p);
  document.querySelectorAll('.period-tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.period-tab')[p === 'matin' ? 0 : 1].classList.add('active');
  renderEmployees();
  updateSoirTabState();
}

export function updateCounts() {
  const el = document.getElementById('countMatin');
  if (!el) return; // null-guard: registre pas monte
  const { team, presentToday, dayData } = getState();
  const a = presentToday.filter((i) => team[i] && team[i].nom).length;
  const mc = dayData.filter((d, i) => team[i] && team[i].nom && presentToday.includes(i) && d.matin.signature).length;
  const sc = dayData.filter((d, i) => team[i] && team[i].nom && presentToday.includes(i) && d.soir.signature).length;
  el.textContent = `${mc} / ${a} signés`;
  document.getElementById('countSoir').textContent = `${sc} / ${a} signés`;
}

export function updateSoirTabState() {
  const soirTab = document.querySelectorAll('.period-tab')[1];
  if (!soirTab) return; // null-guard: registre pas monte
  if (!isMatinLocked()) {
    soirTab.style.opacity = '0.4';
    soirTab.style.cursor = 'not-allowed';
  } else {
    soirTab.style.opacity = '1';
    soirTab.style.cursor = 'pointer';
  }
}
