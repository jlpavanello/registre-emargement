import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { todayStr } from '../utils/date.js';

export function loadPageNumber() {
  try {
    const r = storage.get('reg_page');
    if (r && typeof r.num === 'number' && !isNaN(r.num)) {
      if (r.date === todayStr()) {
        setState('pageNumber', r.num);
      } else {
        setState('pageNumber', r.num + 1);
        savePageNumber();
      }
    } else {
      setState('pageNumber', 1);
      savePageNumber();
    }
  } catch (e) {
    setState('pageNumber', 1);
  }
}

export function savePageNumber() {
  storage.set('reg_page', { date: todayStr(), num: getState().pageNumber });
}

export function updatePageNumberDisplay() {
  const dateEl = document.getElementById('dateJour');
  const textEl = document.getElementById('pageNumberText');
  if (!dateEl || !textEl) return; // null-guard: registre pas monté
  const ds = dateEl.value;
  const dateStr = ds ? new Date(ds + 'T00:00:00').toLocaleDateString('fr-FR') : '\u2014';
  textEl.textContent = 'Folio n\u00B0 ' + getState().pageNumber + ' \u2014 ' + dateStr;
}
