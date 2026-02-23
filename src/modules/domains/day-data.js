import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { todayStr } from '../utils/date.js';

export function loadDayData() {
  try {
    const r = storage.get('reg_day');
    if (r) {
      const p = r;
      if (p.date === todayStr()) {
        setState('dayData', p.data);
        setState('visaMatin', p.visaMatin || p.visa || null);
        setState('visaSoir', p.visaSoir || null);
        setState('visaMatinSigner', p.visaMatinSigner || null);
        setState('visaSoirSigner', p.visaSoirSigner || null);
        setState('presentToday', p.presentToday || []);
        setState('lockedMatinPresents', p.lockedMatinPresents || []);
        setState('lockedSoirPresents', p.lockedSoirPresents || []);
        setState('crewAssignments', p.crewAssignments || {});
        setState('crewDrivers', p.crewDrivers || {});
        // Restore visa UI
        const { visaMatin, visaSoir, visaMatinSigner, visaSoirSigner } = getState();
        if (visaMatin) {
          const b = document.getElementById('visaMatinBtn');
          b.innerHTML = `<img src="${visaMatin}" alt="v">`;
          b.classList.add('signed');
          if (visaMatinSigner) {
            const info = document.getElementById('visaMatinSignedBy');
            info.textContent = visaMatinSigner.label + ' \u2014 ' + visaMatinSigner.nom;
            info.style.display = 'block';
          }
        }
        if (visaSoir) {
          const b = document.getElementById('visaSoirBtn');
          b.innerHTML = `<img src="${visaSoir}" alt="v">`;
          b.classList.add('signed');
          if (visaSoirSigner) {
            const info = document.getElementById('visaSoirSignedBy');
            info.textContent = visaSoirSigner.label + ' \u2014 ' + visaSoirSigner.nom;
            info.style.display = 'block';
          }
        }
        return;
      }
    }
  } catch (e) { /* ignore */ }
  setState('dayData', []);
  setState('visaMatin', null);
  setState('visaSoir', null);
  setState('visaMatinSigner', null);
  setState('visaSoirSigner', null);
  setState('presentToday', []);
  setState('lockedMatinPresents', []);
  setState('lockedSoirPresents', []);
  setState('crewAssignments', {});
  setState('crewDrivers', {});
}

export function syncDayData() {
  const { team, dayData } = getState();
  while (dayData.length < team.length) {
    dayData.push({ matin: { signature: null, heure: null, machines: [] }, soir: { signature: null, heure: null, returns: {} } });
  }
  dayData.forEach((d) => {
    if (!d.matin.machines) {
      d.matin.machines = [];
      if (d.matin.machine !== null && d.matin.machine !== undefined) {
        d.matin.machines.push({ machineIdx: d.matin.machine, acc: d.matin.acc || 0 });
      }
      delete d.matin.machine;
      delete d.matin.acc;
    }
    if (!d.soir.returns) {
      d.soir.returns = {};
      if (d.matin.machines.length > 0 && d.soir.accRetour !== undefined) {
        const mIdx = d.matin.machines[0] ? d.matin.machines[0].machineIdx : null;
        if (mIdx !== null) d.soir.returns[mIdx] = { accRetour: d.soir.accRetour || 0, motif: d.obs || '' };
      }
      delete d.soir.accRetour;
      delete d.obs;
    }
  });
  setState('dayData', dayData);
}

export function saveDayData() {
  const s = getState();
  storage.set('reg_day', {
    date: todayStr(),
    data: s.dayData,
    visaMatin: s.visaMatin,
    visaSoir: s.visaSoir,
    visaMatinSigner: s.visaMatinSigner,
    visaSoirSigner: s.visaSoirSigner,
    presentToday: s.presentToday,
    lockedMatinPresents: s.lockedMatinPresents,
    lockedSoirPresents: s.lockedSoirPresents,
    crewAssignments: s.crewAssignments,
    crewDrivers: s.crewDrivers,
  });
}
