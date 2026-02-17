import { getState, setState } from '../state.js';
import { saveTeam } from '../domains/team.js';
import { saveMachines } from '../domains/machines.js';
import { saveCategories, renderCatList } from '../domains/categories.js';
import { saveResponsables, populateVisaSignerSelect, populateArmurierSelect, onArmurierSelectChange } from '../domains/responsables.js';
import { syncDayData, saveDayData } from '../domains/day-data.js';

let _afterSave = {};
export function bindConfigCallbacks(callbacks) {
  _afterSave = callbacks;
}

export function openConfig() {
  document.getElementById('configPanel').classList.add('active');
  renderConfig();
}

export function closeConfig() {
  document.getElementById('configPanel').classList.remove('active');
}

export function renderConfig() {
  const { team, machines, categories, responsables } = getState();
  document.getElementById('configChefUnite').value = responsables.chef.nom;
  document.getElementById('configChefMat').value = responsables.chef.matricule;
  document.getElementById('configChefUnite').oninput = function () { responsables.chef.nom = this.value; };
  document.getElementById('configChefMat').oninput = function () { responsables.chef.matricule = this.value; };
  populateArmurierSelect();
  renderCatList();

  const ec = document.getElementById('configEmpList');
  ec.innerHTML = '';
  team.forEach((t, i) => {
    if (t.telephone === undefined) t.telephone = '';
    if (t.asvp === undefined) t.asvp = false;
    ec.innerHTML += `<div class="config-card"><div class="cnum emp-bg">${i + 1}</div><div class="fields">
    <input class="name-input" type="text" placeholder="Nom et Prénom" value="${t.nom}" data-t="emp" data-i="${i}" data-f="nom">
    <input class="sub-input" type="text" placeholder="Matricule" value="${t.matricule}" data-t="emp" data-i="${i}" data-f="matricule">
    <input class="sub-input" type="tel" placeholder="Téléphone" value="${t.telephone}" data-t="emp" data-i="${i}" data-f="telephone" style="font-size:12px;">
    <label class="asvp-check" style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--text2);cursor:pointer;padding:2px 0;">
      <input type="checkbox" ${t.asvp ? 'checked' : ''} data-t="emp" data-i="${i}" data-f="asvp" style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;"> ASVP
    </label>
  </div></div>`;
  });

  const mc = document.getElementById('configMachList');
  mc.innerHTML = '';
  machines.forEach((m, i) => {
    const catOpts = ['<option value="">— Catégorie —</option>'].concat(
      categories.map((c) => `<option value="${c.id}" ${(m.cat || '') === c.id ? 'selected' : ''}>${c.emoji} ${c.nom || '(sans nom)'}</option>`)
    ).join('');
    mc.innerHTML += `<div class="config-card"><div class="cnum mach-bg">${i + 1}</div><div class="fields">
    <input class="name-input" type="text" placeholder="Nom de la machine" value="${m.nom}" data-t="mach" data-i="${i}" data-f="nom">
    <input class="sub-input" type="text" placeholder="Réf. / N° série" value="${m.ref}" data-t="mach" data-i="${i}" data-f="ref">
    <select class="cat-select" data-t="mach" data-i="${i}" data-f="cat">${catOpts}</select>
  </div></div>`;
  });

  document.querySelectorAll('#configEmpList input,#configMachList input,#configMachList select').forEach((inp) => {
    const evtType = inp.type === 'checkbox' ? 'change' : (inp.tagName === 'SELECT' ? 'change' : 'input');
    inp.addEventListener(evtType, function () {
      const idx = +this.dataset.i;
      if (this.dataset.t === 'emp') {
        if (this.dataset.f === 'asvp') team[idx].asvp = this.checked;
        else { team[idx][this.dataset.f] = this.value; populateArmurierSelect(); }
      } else {
        machines[idx][this.dataset.f] = this.value;
      }
    });
  });

  // Bind armurier select change
  const armSel = document.getElementById('configArmurierSelect');
  armSel.addEventListener('change', onArmurierSelectChange);
}

export function addItem(t) {
  const { team, machines } = getState();
  if (t === 'emp') team.push({ nom: '', matricule: '', telephone: '', asvp: false });
  else machines.push({ nom: '', ref: '', cat: '' });
  renderConfig();
  document.getElementById('configPanel').scrollTop = 99999;
}

export function removeItem(t) {
  const { team, machines } = getState();
  if (t === 'emp' && team.length > 1) {
    if (confirm('Retirer le dernier salarié ?')) team.pop();
  } else if (t === 'mach' && machines.length > 1) {
    if (confirm('Retirer la dernière machine ?')) machines.pop();
  }
  renderConfig();
}

export function saveConfig() {
  saveTeam();
  saveMachines();
  saveCategories();
  saveResponsables();
  populateVisaSignerSelect();
  syncDayData();
  saveDayData();
  closeConfig();
  if (_afterSave.renderEmployees) _afterSave.renderEmployees();
  if (_afterSave.updateCounts) _afterSave.updateCounts();
}
