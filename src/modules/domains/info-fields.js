import { storage } from '../storage/storage-interface.js';

export function saveInfoFields() {
  storage.set('reg_info', {
    entreprise: document.getElementById('entreprise').value,
    refChantier: document.getElementById('refChantier').value,
    responsable: document.getElementById('responsable').value,
    adresse: document.getElementById('adresseChantier').value,
  });
}

export function loadInfoFields() {
  const d = storage.get('reg_info');
  if (!d) return;
  document.getElementById('entreprise').value = d.entreprise || '';
  document.getElementById('refChantier').value = d.refChantier || '';
  document.getElementById('responsable').value = d.responsable || '';
  document.getElementById('adresseChantier').value = d.adresse || '';
}
