// Action module: Export / Import — Config partielle + Backup complet
import { getState, setState } from '../state.js';
import { saveTeam } from '../domains/team.js';
import { saveMachines } from '../domains/machines.js';
import { saveCategories } from '../domains/categories.js';
import { saveResponsables, populateVisaSignerSelect } from '../domains/responsables.js';
import { syncDayData, saveDayData } from '../domains/day-data.js';
import { saveInfoFields } from '../domains/info-fields.js';
import { updatePresenceBadge } from '../domains/presence.js';
import { todayStr } from '../utils/date.js';
// Additional imports for full backup
import { saveVehicles } from '../domains/crews.js';
import { saveMunitionRefs } from '../domains/stock-munitions.js';
import { saveStockArmes } from '../domains/stock-armes.js';
import { saveStockMouvements } from '../domains/stock-mouvements.js';
import { savePrevisionsTir } from '../domains/previsions-tir.js';
import { saveFournisseurs } from '../domains/fournisseurs.js';
import { saveCommandes } from '../domains/commandes.js';
import { savePvTemplates } from '../domains/pv-templates.js';
import { savePvDocuments } from '../domains/pv-documents.js';
import { saveChatMessages } from '../domains/chat-data.js';
import { saveAuditLog } from '../domains/audit-log.js';
import { saveIncidents } from '../domains/incidents.js';
import { saveVocalReports } from '../domains/vocal-data.js';
import { savePageNumber } from '../domains/page-number.js';

let _callbacks = {};
export function bindExportImportCallbacks(callbacks) {
  _callbacks = callbacks;
}

// ============================================================
// EXPORT CONFIG PARTIELLE (ancien système — conservé)
// ============================================================

export function exportConfig() {
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
      if (config.team) { setState('team', config.team); saveTeam(); }
      if (config.machines) { setState('machines', config.machines); saveMachines(); }
      if (config.categories) { setState('categories', config.categories); saveCategories(); }
      if (config.responsables) { setState('responsables', config.responsables); saveResponsables(); }
      if (config.infoFields) {
        const inf = config.infoFields;
        if (inf.entreprise) document.getElementById('entreprise').value = inf.entreprise;
        if (inf.refChantier) document.getElementById('refChantier').value = inf.refChantier;
        if (inf.responsable) document.getElementById('responsable').value = inf.responsable;
        if (inf.adresseChantier) document.getElementById('adresseChantier').value = inf.adresseChantier;
        saveInfoFields();
      }
      syncDayData();
      saveDayData();
      if (_callbacks.renderConfig) _callbacks.renderConfig();
      populateVisaSignerSelect();
      if (_callbacks.renderEmployees) _callbacks.renderEmployees();
      if (_callbacks.updateCounts) _callbacks.updateCounts();
      updatePresenceBadge();
      alert(
        'Configuration importée avec succès !\n\n' +
          getState().team.filter((t) => t.nom).length + ' agents, ' +
          getState().machines.filter((m) => m.nom).length + ' machines, ' +
          getState().categories.length + ' catégories.'
      );
    } catch (err) {
      alert('Erreur lors de la lecture du fichier : ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ============================================================
// EXPORT / IMPORT COMPLET (toutes les données)
// ============================================================

export function exportAllData() {
  // Sauvegarder la config d'abord
  if (_callbacks.saveConfig) _callbacks.saveConfig();

  const state = getState();

  const backup = {
    _type: 'registre_emargement_full_backup',
    _version: 1,
    _date: new Date().toISOString(),
    // Config
    team: state.team,
    machines: state.machines,
    categories: state.categories,
    responsables: state.responsables,
    vehicles: state.vehicles,
    pageNumber: state.pageNumber,
    infoFields: {
      entreprise: document.getElementById('entreprise')?.value || '',
      refChantier: document.getElementById('refChantier')?.value || '',
      responsable: document.getElementById('responsable')?.value || '',
      adresseChantier: document.getElementById('adresseChantier')?.value || '',
    },
    // Données du jour
    dayData: state.dayData,
    presentToday: state.presentToday,
    visaMatin: state.visaMatin,
    visaSoir: state.visaSoir,
    visaMatinSigner: state.visaMatinSigner,
    visaSoirSigner: state.visaSoirSigner,
    lockedMatinPresents: state.lockedMatinPresents,
    lockedSoirPresents: state.lockedSoirPresents,
    crewAssignments: state.crewAssignments,
    crewDrivers: state.crewDrivers,
    // Stock & Logistique
    munitionRefs: state.munitionRefs,
    stockArmes: state.stockArmes,
    stockMouvements: state.stockMouvements,
    previsionsTir: state.previsionsTir,
    fournisseurs: state.fournisseurs,
    commandes: state.commandes,
    // PV
    pvTemplates: state.pvTemplates,
    pvDocuments: state.pvDocuments,
    // Autres
    vocalReports: state.vocalReports,
    chatMessages: state.chatMessages,
    auditLog: state.auditLog,
    incidents: state.incidents,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup_complet_' + todayStr() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Résumé
  const nbAgents = (state.team || []).filter(t => t.nom).length;
  const nbArmes = (state.machines || []).filter(m => m.nom).length;
  const nbMunRefs = (state.munitionRefs || []).length;
  const nbPrev = (state.previsionsTir || []).length;
  const nbFourn = (state.fournisseurs || []).length;
  const nbPV = (state.pvDocuments || []).length;
  alert(
    'Backup complet exporté !\n\n' +
    '• ' + nbAgents + ' agents\n' +
    '• ' + nbArmes + ' armes\n' +
    '• ' + nbMunRefs + ' références munitions\n' +
    '• ' + nbPrev + ' exercices de tir\n' +
    '• ' + nbFourn + ' fournisseurs\n' +
    '• ' + nbPV + ' documents PV'
  );
}

export function importAllData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const backup = JSON.parse(e.target.result);

      // Accepter les deux formats
      if (backup._type !== 'registre_emargement_full_backup' && backup._type !== 'registre_emargement_config') {
        alert("Ce fichier n'est pas un backup valide.");
        return;
      }

      const isFullBackup = backup._type === 'registre_emargement_full_backup';

      // Résumé
      const nbAgents = (backup.team || []).filter(t => t.nom).length;
      const nbArmes = (backup.machines || []).filter(m => m.nom).length;
      const nbMunRefs = (backup.munitionRefs || []).length;
      const nbFourn = (backup.fournisseurs || []).length;
      const nbPV = (backup.pvDocuments || []).length;

      let msg = 'Importer ce backup ?\n\nCela remplacera TOUTES vos données :\n';
      msg += '• ' + nbAgents + ' agents\n';
      msg += '• ' + nbArmes + ' armes\n';
      if (isFullBackup) {
        msg += '• ' + nbMunRefs + ' références munitions\n';
        msg += '• ' + nbFourn + ' fournisseurs\n';
        msg += '• ' + nbPV + ' documents PV\n';
      }
      msg += '\nCette action est irréversible.';

      if (!confirm(msg)) return;

      // --- Restauration config ---
      if (backup.team) { setState('team', backup.team); saveTeam(); }
      if (backup.machines) { setState('machines', backup.machines); saveMachines(); }
      if (backup.categories) { setState('categories', backup.categories); saveCategories(); }
      if (backup.responsables) { setState('responsables', backup.responsables); saveResponsables(); }
      if (backup.vehicles) { setState('vehicles', backup.vehicles); saveVehicles(); }
      if (backup.pageNumber !== undefined) { setState('pageNumber', backup.pageNumber); savePageNumber(); }
      if (backup.infoFields) {
        const inf = backup.infoFields;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        setVal('entreprise', inf.entreprise);
        setVal('refChantier', inf.refChantier);
        setVal('responsable', inf.responsable);
        setVal('adresseChantier', inf.adresseChantier);
        saveInfoFields();
      }

      if (isFullBackup) {
        // --- Restauration données du jour ---
        if (backup.dayData) setState('dayData', backup.dayData);
        if (backup.presentToday) setState('presentToday', backup.presentToday);
        if (backup.visaMatin !== undefined) setState('visaMatin', backup.visaMatin);
        if (backup.visaSoir !== undefined) setState('visaSoir', backup.visaSoir);
        if (backup.visaMatinSigner !== undefined) setState('visaMatinSigner', backup.visaMatinSigner);
        if (backup.visaSoirSigner !== undefined) setState('visaSoirSigner', backup.visaSoirSigner);
        if (backup.lockedMatinPresents) setState('lockedMatinPresents', backup.lockedMatinPresents);
        if (backup.lockedSoirPresents) setState('lockedSoirPresents', backup.lockedSoirPresents);
        if (backup.crewAssignments) setState('crewAssignments', backup.crewAssignments);
        if (backup.crewDrivers) setState('crewDrivers', backup.crewDrivers);
        syncDayData();
        saveDayData();

        // --- Restauration Stock & Logistique ---
        if (backup.munitionRefs) { setState('munitionRefs', backup.munitionRefs); saveMunitionRefs(); }
        if (backup.stockArmes) { setState('stockArmes', backup.stockArmes); saveStockArmes(); }
        if (backup.stockMouvements) { setState('stockMouvements', backup.stockMouvements); saveStockMouvements(); }
        if (backup.previsionsTir) { setState('previsionsTir', backup.previsionsTir); savePrevisionsTir(); }
        if (backup.fournisseurs) { setState('fournisseurs', backup.fournisseurs); saveFournisseurs(); }
        if (backup.commandes) { setState('commandes', backup.commandes); saveCommandes(); }

        // --- Restauration PV ---
        if (backup.pvTemplates) { setState('pvTemplates', backup.pvTemplates); savePvTemplates(); }
        if (backup.pvDocuments) { setState('pvDocuments', backup.pvDocuments); savePvDocuments(); }

        // --- Restauration Autres ---
        if (backup.vocalReports) { setState('vocalReports', backup.vocalReports); saveVocalReports(); }
        if (backup.chatMessages) { setState('chatMessages', backup.chatMessages); saveChatMessages(); }
        if (backup.auditLog) { setState('auditLog', backup.auditLog); saveAuditLog(); }
        if (backup.incidents) { setState('incidents', backup.incidents); saveIncidents(); }
      }

      // --- Re-render UI ---
      if (_callbacks.renderConfig) _callbacks.renderConfig();
      populateVisaSignerSelect();
      if (_callbacks.renderEmployees) _callbacks.renderEmployees();
      if (_callbacks.updateCounts) _callbacks.updateCounts();
      updatePresenceBadge();

      alert(
        'Données importées avec succès !\n\n' +
        nbAgents + ' agents, ' + nbArmes + ' armes' +
        (isFullBackup ? ', ' + nbMunRefs + ' réf. munitions, ' + nbPV + ' PV' : '') +
        '.\n\nL\'application va se recharger.'
      );

      // Recharger pour être sûr que tout est appliqué
      setTimeout(() => window.location.reload(), 500);

    } catch (err) {
      alert('Erreur lors de la lecture du fichier : ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
