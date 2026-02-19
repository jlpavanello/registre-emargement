// Action module: Export / Import configuration
import { getState, setState } from '../state.js';
import { saveTeam } from '../domains/team.js';
import { saveMachines } from '../domains/machines.js';
import { saveCategories } from '../domains/categories.js';
import { saveResponsables, populateVisaSignerSelect } from '../domains/responsables.js';
import { syncDayData, saveDayData } from '../domains/day-data.js';
import { saveInfoFields } from '../domains/info-fields.js';
import { updatePresenceBadge } from '../domains/presence.js';
import { todayStr } from '../utils/date.js';

let _callbacks = {};
export function bindExportImportCallbacks(callbacks) {
  _callbacks = callbacks;
}

export function exportConfig() {
  // Sauvegarder d'abord la config actuelle
  if (_callbacks.saveConfig) _callbacks.saveConfig();

  const { team, machines, categories, responsables } = getState();
  const config = {
    _type: 'registre_emargement_config',
    _version: 2,
    _date: new Date().toISOString(),
    team: team,
    machines: machines,
    categories: categories,
    responsables: responsables,
    infoFields: {
      entreprise: document.getElementById('entreprise').value,
      refChantier: document.getElementById('refChantier').value,
      responsable: document.getElementById('responsable').value,
      adresseChantier: document.getElementById('adresseChantier').value,
    },
  };
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'config_emargement_' + todayStr() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('Configuration exportée avec succès !');
}

export function importConfig(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const config = JSON.parse(e.target.result);
      if (config._type !== 'registre_emargement_config') {
        alert("Ce fichier n'est pas une configuration valide.");
        return;
      }
      if (
        !confirm(
          'Importer cette configuration ?\n\nCela remplacera :\n• ' +
            (config.team ? config.team.filter((t) => t.nom).length : 0) +
            ' agents\n• ' +
            (config.machines ? config.machines.filter((m) => m.nom).length : 0) +
            ' machines\n• ' +
            (config.categories ? config.categories.length : 0) +
            ' catégories\n\nLes données du jour (signatures, présences) ne seront pas affectées.'
        )
      ) {
        return;
      }
      // Importer les données
      if (config.team) {
        setState('team', config.team);
        saveTeam();
      }
      if (config.machines) {
        setState('machines', config.machines);
        saveMachines();
      }
      if (config.categories) {
        setState('categories', config.categories);
        saveCategories();
      }
      if (config.responsables) {
        setState('responsables', config.responsables);
        saveResponsables();
      }
      if (config.infoFields) {
        const inf = config.infoFields;
        if (inf.entreprise) document.getElementById('entreprise').value = inf.entreprise;
        if (inf.refChantier) document.getElementById('refChantier').value = inf.refChantier;
        if (inf.responsable) document.getElementById('responsable').value = inf.responsable;
        if (inf.adresseChantier) document.getElementById('adresseChantier').value = inf.adresseChantier;
        saveInfoFields();
      }
      // Re-sync et re-render
      syncDayData();
      saveDayData();
      if (_callbacks.renderConfig) _callbacks.renderConfig();
      populateVisaSignerSelect();
      if (_callbacks.renderEmployees) _callbacks.renderEmployees();
      if (_callbacks.updateCounts) _callbacks.updateCounts();
      updatePresenceBadge();
      alert(
        'Configuration importée avec succès !\n\n' +
          getState().team.filter((t) => t.nom).length +
          ' agents, ' +
          getState().machines.filter((m) => m.nom).length +
          ' machines, ' +
          getState().categories.length +
          ' catégories.'
      );
    } catch (err) {
      alert('Erreur lors de la lecture du fichier : ' + err.message);
    }
  };
  reader.readAsText(file);
  // Reset le input pour pouvoir réimporter le même fichier
  event.target.value = '';
}
