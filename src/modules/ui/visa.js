import { getState } from '../state.js';

let _openSignModal = null;
export function bindVisaCallbacks({ openSignModal }) {
  _openSignModal = openSignModal;
}

export function isMatinLocked() {
  return !!getState().visaMatin;
}

export function isSoirLocked() {
  return !!getState().visaSoir;
}

export function hasUncoveredSignatures(period) {
  const { team, presentToday, dayData, lockedMatinPresents, lockedSoirPresents } = getState();
  if (period === 'matin' && !isMatinLocked()) return false;
  if (period === 'soir' && !isSoirLocked()) return false;
  const lockedList = period === 'matin' ? lockedMatinPresents : lockedSoirPresents;
  for (let i = 0; i < team.length; i++) {
    if (!presentToday.includes(i)) continue;
    if (lockedList.includes(i)) continue;
    const d = dayData[i];
    if (!d) continue;
    if (period === 'matin' && d.matin && d.matin.signature) return true;
    if (period === 'soir' && d.soir && d.soir.signature) return true;
  }
  return false;
}

export function updateVisaButtonState() {
  const { visaMatin, visaSoir } = getState();
  const bm = document.getElementById('visaMatinBtn');
  const bs = document.getElementById('visaSoirBtn');
  if (isMatinLocked() && hasUncoveredSignatures('matin')) {
    bm.innerHTML = '\u26A0\uFE0F Re-signer';
    bm.classList.remove('signed');
    bm.classList.add('needs-resign');
  } else if (isMatinLocked()) {
    if (!bm.classList.contains('signed')) {
      bm.innerHTML = `<img src="${visaMatin}" alt="v">`;
      bm.classList.add('signed');
    }
    bm.classList.remove('needs-resign');
  }
  if (isSoirLocked() && hasUncoveredSignatures('soir')) {
    bs.innerHTML = '\u26A0\uFE0F Re-signer';
    bs.classList.remove('signed');
    bs.classList.add('needs-resign');
  } else if (isSoirLocked()) {
    if (!bs.classList.contains('signed')) {
      bs.innerHTML = `<img src="${visaSoir}" alt="v">`;
      bs.classList.add('signed');
    }
    bs.classList.remove('needs-resign');
  }
}

export function openVisaSign(period) {
  const sel = document.getElementById('visaSignerSelect');
  if (!sel.value) {
    alert("Veuillez d'abord choisir qui signe le registre (Chef d'unité ou Armurier).");
    return;
  }
  if (_openSignModal) _openSignModal(-1, period);
}

export function onVisaSignerChange() {
  // Placeholder
}
