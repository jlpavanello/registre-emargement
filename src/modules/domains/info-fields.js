import { storage } from '../storage/storage-interface.js';

export function saveInfoFields() {
  const el = document.getElementById('entreprise');
  if (!el) return; // null-guard: registre pas monté
  storage.set('reg_info', {
    entreprise: el.value,
    refChantier: document.getElementById('refChantier').value,
    responsable: document.getElementById('responsable').value,
    adresse: document.getElementById('adresseChantier').value,
  });
}

export function loadInfoFields() {
  const d = storage.get('reg_info');
  if (!d) return;
  const el = document.getElementById('entreprise');
  if (!el) return; // null-guard: registre pas monté
  el.value = d.entreprise || '';
  document.getElementById('refChantier').value = d.refChantier || '';
  document.getElementById('responsable').value = d.responsable || '';
  document.getElementById('adresseChantier').value = d.adresse || '';
}
