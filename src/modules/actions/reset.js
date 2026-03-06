// Action module: Reset signatures and full reset
import { getState, setState } from '../state.js';
import { isMatinLocked, isSoirLocked } from '../ui/visa.js';
import { saveDayData } from '../domains/day-data.js';
import { savePageNumber, updatePageNumberDisplay } from '../domains/page-number.js';
import { updatePresenceBadge } from '../domains/presence.js';
import { logAudit } from '../domains/audit-log.js';
import { showToast } from '../ui/toast.js';

let _callbacks = {};
export function bindResetCallbacks(callbacks) {
  _callbacks = callbacks;
}

export function resetSignatures() {
  if (isMatinLocked() || isSoirLocked()) {
    let msg = "Impossible d'effacer :\n";
    if (isMatinLocked()) msg += '• Le visa SORTIE a été signé par le responsable.\n';
    if (isSoirLocked()) msg += '• Le visa RETOUR a été signé par le responsable.\n';
    msg += '\nUtilisez « Remise à zéro complète » dans la Configuration si le registre est finalisé.';
    showToast(msg.replace(/\n/g, ' '), 'error', 5000);
    return;
  }
  const { dayData } = getState();
  dayData.forEach((d) => {
    d.matin = { signature: null, heure: null, machines: [] };
    d.soir = { signature: null, heure: null, returns: {} };
  });
  setState('visaMatin', null);
  setState('visaSoir', null);
  setState('visaMatinSigner', null);
  setState('visaSoirSigner', null);

  const bm = document.getElementById('visaMatinBtn');
  bm.innerHTML = 'Signer';
  bm.classList.remove('signed');
  const bs = document.getElementById('visaSoirBtn');
  bs.innerHTML = 'Signer';
  bs.classList.remove('signed');
  document.getElementById('visaMatinSignedBy').style.display = 'none';
  document.getElementById('visaSoirSignedBy').style.display = 'none';

  saveDayData();
  logAudit('RESET_SIGNATURES', { description: 'Effacement des signatures du jour' });
  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  if (_callbacks.updateSoirTabState) _callbacks.updateSoirTabState();
  showToast('Signatures effac\u00e9es avec succ\u00e8s', 'success');
}

export function fullReset() {
  const msg =
    '⚠ REMISE À ZÉRO COMPLÈTE ⚠\n\n' +
    'Cette action va :\n' +
    '• Effacer TOUTES les signatures (y compris les visas verrouillés)\n' +
    '• Réinitialiser la sélection des présents\n' +
    '• Remettre le compteur de page à zéro\n\n' +
    "Assurez-vous d'avoir généré le PDF avant de continuer.\n\n" +
    'Êtes-vous sûr ?';
  if (!confirm(msg)) return;
  if (!confirm('Dernière confirmation : tout sera effacé définitivement.')) return;

  const { dayData } = getState();
  dayData.forEach((d) => {
    d.matin = { signature: null, heure: null, machines: [] };
    d.soir = { signature: null, heure: null, returns: {} };
  });
  setState('visaMatin', null);
  setState('visaSoir', null);
  setState('visaMatinSigner', null);
  setState('visaSoirSigner', null);
  setState('presentToday', []);
  setState('lockedMatinPresents', []);
  setState('lockedSoirPresents', []);
  setState('pageNumber', 0);
  savePageNumber();

  const bm = document.getElementById('visaMatinBtn');
  bm.innerHTML = 'Signer';
  bm.classList.remove('signed');
  const bs = document.getElementById('visaSoirBtn');
  bs.innerHTML = 'Signer';
  bs.classList.remove('signed');
  document.getElementById('visaMatinSignedBy').style.display = 'none';
  document.getElementById('visaSoirSignedBy').style.display = 'none';

  saveDayData();
  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  updatePresenceBadge();
  updatePageNumberDisplay();
  if (_callbacks.updateSoirTabState) _callbacks.updateSoirTabState();
  if (_callbacks.closeConfig) _callbacks.closeConfig();

  logAudit('FULL_RESET', { description: 'Remise à zéro complète — signatures, présents, compteur de page' });
  showToast('Remise \u00e0 z\u00e9ro compl\u00e8te effectu\u00e9e', 'success', 4000);
}
