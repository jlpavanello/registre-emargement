// Action module: PDF generation using jsPDF
import { jsPDF } from 'jspdf';
import { getState } from '../state.js';
import { hasUncoveredSignatures } from '../ui/visa.js';
import { getMachineName, getMachineRawData } from '../domains/machines.js';
import { getActiveVehicles, getVehicleLabel } from '../domains/crews.js';
import { showToast } from '../ui/toast.js';

export function generatePDF() {
  const {
    team, dayData, presentToday, pageNumber: rawPN,
    visaMatin, visaSoir, visaMatinSigner, visaSoirSigner,
  } = getState();
  const pageNumber = (typeof rawPN === 'number' && !isNaN(rawPN)) ? rawPN : 1;

  // Vérifier que les deux visas sont signés
  if (!visaMatin || !visaSoir) {
    let msg = 'Impossible de générer le PDF :\n';
    if (!visaMatin) msg += "• Le visa SORTIE n'a pas été signé par le responsable.\n";
    if (!visaSoir) msg += "• Le visa RETOUR n'a pas été signé par le responsable.\n";
    msg += '\nLes deux visas du responsable sont obligatoires avant de finaliser le registre.';
    alert(msg);
    return;
  }

  // Vérifier que tous les agents signés sont couverts par le visa
  if (hasUncoveredSignatures('matin') || hasUncoveredSignatures('soir')) {
    let msg = 'Impossible de générer le PDF :\n';
    if (hasUncoveredSignatures('matin')) msg += '• Des agents ont signé après le visa SORTIE. Le responsable doit re-signer.\n';
    if (hasUncoveredSignatures('soir')) msg += '• Des agents ont signé après le visa RETOUR. Le responsable doit re-signer.\n';
    alert(msg);
    return;
  }

  // Ne garder que les présents du jour
  const at = team.map((t, i) => ({ ...t, idx: i })).filter((t) => t.nom && presentToday.includes(t.idx));
  if (!at.length) {
    alert('Aucun agent présent sélectionné.');
    return;
  }

  // Vérifier que toutes les armes sorties ont été rendues
  const agentsNonRendus = at.filter(t => {
    const d = dayData[t.idx];
    return d && d.matin.machines && d.matin.machines.length > 0 && !d.soir.signature;
  });
  if (agentsNonRendus.length > 0) {
    const noms = agentsNonRendus.map(t => t.nom).join(', ');
    alert('Impossible de générer le PDF :\n\n• Les armes n\'ont pas été rendues par : ' + noms + '\n\nTous les agents doivent signer le retour des armes avant la génération du PDF.');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = 297;
  const ph = 210;
  const ml = 10;
  const uw = pw - 2 * ml;

  const ent = document.getElementById('entreprise').value || '';
  const dv = document.getElementById('dateJour').value;
  const ds = dv ? new Date(dv + 'T00:00:00').toLocaleDateString('fr-FR') : '';
  const rc = document.getElementById('refChantier').value || '';
  const rp = document.getElementById('responsable').value || '';
  const ad = document.getElementById('adresseChantier').value || '';
  const N = at.length;

  // --- Title bar ---
  doc.setFillColor(26, 58, 92);
  doc.rect(ml, 6, uw, 11, 'F');
  doc.setTextColor(255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text("GESTION OPERATIONNELLE PM — REGISTRE QUOTIDIEN", pw / 2, 13, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Page n\u00b0 ' + pageNumber, pw - ml - 1, 13, { align: 'right' });

  // --- Info block (no border — bold labels for clarity) ---
  let y = 20;
  const totalTeam = team.filter((t) => t.nom).length;
  const presentCount = presentToday.length;
  doc.setTextColor(26, 58, 92);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Police Municipale :', ml + 2, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(ent, ml + 34, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 58, 92);
  doc.text('Date :', ml + uw * 0.35, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(ds, ml + uw * 0.35 + 11, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 58, 92);
  doc.text('Responsable :', ml + uw * 0.62, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(rp, ml + uw * 0.62 + 25, y + 4);
  // Second row: effectifs
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 58, 92);
  doc.text('Effectif de l\'APM :', ml + 2, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(String(totalTeam), ml + 34, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 58, 92);
  doc.text('Effectif présent :', ml + uw * 0.35, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text(String(presentCount), ml + uw * 0.35 + 28, y + 10);

  // --- Table layout ---
  y = 40;
  // Nouvelles largeurs: N° | Mat. | Nom | Arme | MunS | HeS | EmS | MunR | HeR | EmR | Obs
  const cW = [7, 14, 42, 42, 10, 10, 26, 10, 10, 26];
  cW.push(uw - cW.reduce((a, b) => a + b, 0)); // Obs = 80mm
  const cX = [ml];
  for (let i = 0; i < cW.length; i++) cX.push(cX[i] + cW[i]);
  const hH = 8;
  const sH = 8;
  const mid = (a, b) => (a + b) / 2;

  // --- Dynamic row heights based on weapon count ---
  const baseRowH = 9;
  const perWeaponH = 6;
  const maxRowH = 24;

  const rowHeights = at.map((t) => {
    const d = dayData[t.idx];
    const wc = d ? (d.matin.machines || []).length : 0;
    const needed = baseRowH + Math.max(0, wc - 1) * perWeaponH;
    return Math.min(maxRowH, needed);
  });

  const totalDataH = rowHeights.reduce((s, h) => s + h, 0);
  const availableH = ph - y - 28 - hH - sH;
  const scaleFactor = totalDataH > availableH ? availableH / totalDataH : 1;
  const finalRowHeights = rowHeights.map((h) => Math.max(7, h * scaleFactor));

  const rowYOffsets = [0];
  for (let i = 0; i < finalRowHeights.length; i++) {
    rowYOffsets.push(rowYOffsets[i] + finalRowHeights[i]);
  }
  const tH = hH + sH + rowYOffsets[N];

  // --- Header row backgrounds ---
  doc.setFillColor(26, 58, 92);
  doc.rect(cX[0], y, cW[0] + cW[1] + cW[2] + cW[3], hH + sH, 'F');
  doc.setFillColor(194, 120, 35);
  doc.rect(cX[4], y, cW[4] + cW[5] + cW[6], hH, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(cX[7], y, cW[7] + cW[8] + cW[9], hH, 'F');
  doc.setFillColor(26, 58, 92);
  doc.rect(cX[10], y, cW[10], hH + sH, 'F');

  // --- Header text ---
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const hYc = y + (hH + sH) / 2 + 1;
  doc.text('N\u00b0', mid(cX[0], cX[1]), hYc, { align: 'center' });
  doc.text('Mat.', mid(cX[1], cX[2]), hYc, { align: 'center' });
  doc.text('Nom et Prenom', mid(cX[2], cX[3]), hYc, { align: 'center' });
  doc.text('Arme', mid(cX[3], cX[4]), hYc, { align: 'center' });
  doc.text('Obs.', mid(cX[10], cX[11]), hYc, { align: 'center' });

  doc.setFontSize(9);
  doc.text('SORTIE', mid(cX[4], cX[7]), y + hH / 2 + 1.5, { align: 'center' });
  doc.text('RETOUR', mid(cX[7], cX[10]), y + hH / 2 + 1.5, { align: 'center' });

  // --- Sub-header row ---
  const y2 = y + hH;
  doc.setFillColor(254, 243, 199);
  doc.rect(cX[4], y2, cW[4] + cW[5] + cW[6], sH, 'F');
  doc.setFillColor(219, 234, 254);
  doc.rect(cX[7], y2, cW[7] + cW[8] + cW[9], sH, 'F');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  const sYc = y2 + sH / 2;
  doc.setTextColor(146, 64, 14);
  doc.text('Mun.', mid(cX[4], cX[5]), sYc - 0.5, { align: 'center' });
  doc.text('sortie', mid(cX[4], cX[5]), sYc + 2.5, { align: 'center' });
  doc.text('Heure', mid(cX[5], cX[6]), sYc - 0.5, { align: 'center' });
  doc.text('arr.', mid(cX[5], cX[6]), sYc + 2.5, { align: 'center' });
  doc.text('Emargement', mid(cX[6], cX[7]), sYc + 1, { align: 'center' });
  doc.setTextColor(30, 64, 175);
  doc.text('Mun.', mid(cX[7], cX[8]), sYc - 0.5, { align: 'center' });
  doc.text('munition', mid(cX[7], cX[8]), sYc + 2.5, { align: 'center' });
  doc.text('Heure', mid(cX[8], cX[9]), sYc - 0.5, { align: 'center' });
  doc.text('dep.', mid(cX[8], cX[9]), sYc + 2.5, { align: 'center' });
  doc.text('Emargement', mid(cX[9], cX[10]), sYc + 1, { align: 'center' });

  // --- Data rows ---
  const dY = y2 + sH;
  at.forEach((t, row) => {
    const ry = dY + rowYOffsets[row];
    const rH = finalRowHeights[row];

    // Alternating row backgrounds
    if (row % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(cX[0], ry, cW[0] + cW[1] + cW[2] + cW[3], rH, 'F');
      doc.setFillColor(253, 249, 237);
      doc.rect(cX[4], ry, cW[4] + cW[5] + cW[6], rH, 'F');
      doc.setFillColor(241, 245, 252);
      doc.rect(cX[7], ry, cW[7] + cW[8] + cW[9], rH, 'F');
      doc.setFillColor(248, 249, 250);
      doc.rect(cX[10], ry, cW[10], rH, 'F');
    } else {
      doc.setFillColor(255, 251, 240);
      doc.rect(cX[4], ry, cW[4] + cW[5] + cW[6], rH, 'F');
      doc.setFillColor(243, 247, 253);
      doc.rect(cX[7], ry, cW[7] + cW[8] + cW[9], rH, 'F');
    }

    // N° (numéro de ligne)
    doc.setTextColor(26, 58, 92);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(String(row + 1), mid(cX[0], cX[1]), ry + rH / 2 + 1, { align: 'center' });

    // Matricule
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(6.5);
    if (t.matricule) doc.text(t.matricule, mid(cX[1], cX[2]), ry + rH / 2 + 1, { align: 'center' });

    // Nom et Prénom — bold navy, 7.5pt
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(26, 58, 92);
    doc.text(t.nom, cX[2] + 1.5, ry + rH / 2 + 1, { maxWidth: cW[2] - 2 });

    const d = dayData[t.idx];
    if (d) {
      const mList = d.matin.machines || [];

      // ── Colonne ARME : nom gras + ref italique ──
      if (mList.length > 0) {
        const weaponBlockH = 5.5;
        const totalWeaponsH = mList.length * weaponBlockH;
        const weaponStartY = ry + (rH - totalWeaponsH) / 2 + 2.5;

        mList.forEach((m, mi) => {
          const raw = getMachineRawData(m.machineIdx);
          const blockY = weaponStartY + mi * weaponBlockH;

          // Séparateur entre armes multiples
          if (mi > 0) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.line(cX[3] + 1, blockY - 1, cX[4] - 1, blockY - 1);
          }

          // Nom de l'arme — bold navy 6.5pt
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(26, 58, 92);
          doc.text(raw.nom, cX[3] + 1, blockY, { maxWidth: cW[3] - 2 });

          // Référence — italic gris 5pt
          if (raw.ref) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(5);
            doc.setTextColor(120, 120, 120);
            doc.text('Ref: ' + raw.ref, cX[3] + 1, blockY + 2.8);
          }
        });

        // ── Munitions SORTIE (colonne 4) ──
        if (mList.length === 1) {
          const totalAcc = mList[0].acc;
          if (totalAcc > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(146, 64, 14);
            doc.text(String(totalAcc), mid(cX[4], cX[5]), ry + rH / 2 + 1, { align: 'center' });
          }
        } else {
          mList.forEach((m, mi) => {
            if (m.acc > 0) {
              const blockY = weaponStartY + mi * weaponBlockH;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6);
              doc.setTextColor(146, 64, 14);
              doc.text(String(m.acc), mid(cX[4], cX[5]), blockY, { align: 'center' });
            }
          });
        }

        // ── Munitions RETOUR (colonne 7) ──
        if (mList.length === 1) {
          const r = d.soir.returns ? d.soir.returns[mList[0].machineIdx] : null;
          const totalRet = r ? r.accRetour : 0;
          if (totalRet > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(30, 64, 175);
            doc.text(String(totalRet), mid(cX[7], cX[8]), ry + rH / 2 + 1, { align: 'center' });
          }
        } else {
          mList.forEach((m, mi) => {
            const r = d.soir.returns ? d.soir.returns[m.machineIdx] : null;
            const retVal = r ? r.accRetour : 0;
            if (retVal > 0) {
              const blockY = weaponStartY + mi * weaponBlockH;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6);
              doc.setTextColor(30, 64, 175);
              doc.text(String(retVal), mid(cX[7], cX[8]), blockY, { align: 'center' });
            }
          });
        }
      }

      // ── Heure sortie (colonne 5) ──
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      if (d.matin.heure) doc.text(d.matin.heure, mid(cX[5], cX[6]), ry + rH / 2 + 1, { align: 'center' });

      // ── Signature sortie (colonne 6) ──
      if (d.matin.signature)
        try {
          doc.addImage(d.matin.signature, 'PNG', cX[6] + 0.3, ry + 0.3, cW[6] - 0.6, rH - 0.6);
        } catch (e) { /* ignore */ }

      // ── Heure retour (colonne 8) ──
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      if (d.soir.heure) doc.text(d.soir.heure, mid(cX[8], cX[9]), ry + rH / 2 + 1, { align: 'center' });

      // ── Signature retour (colonne 9) ──
      if (d.soir.signature)
        try {
          doc.addImage(d.soir.signature, 'PNG', cX[9] + 0.3, ry + 0.3, cW[9] - 0.6, rH - 0.6);
        } catch (e) { /* ignore */ }

      // ── Observations — motifs d'écart (colonne 10) ──
      const allMotifs = mList
        .map((m) => {
          const r = d.soir.returns ? d.soir.returns[m.machineIdx] : null;
          if (!r || !r.motif) return '';
          const raw = getMachineRawData(m.machineIdx);
          return raw.nom.split(' ')[0] + ': ' + r.motif;
        })
        .filter(Boolean)
        .join(' | ');
      if (allMotifs) {
        doc.setFontSize(5.5);
        doc.setTextColor(180, 30, 30);
        doc.setFont('helvetica', 'bold');
        const obsLines = doc.splitTextToSize(allMotifs, cW[10] - 3);
        const maxLines = Math.floor(rH / 3.2);
        const lines = obsLines.slice(0, maxLines);
        const obsY = ry + (rH - lines.length * 3.2) / 2 + 2.5;
        lines.forEach((line, li) => {
          doc.text(line, cX[10] + 1.5, obsY + li * 3.2);
        });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
      }
    }
  });

  // --- Table grid (no outer border — lighter design) ---
  doc.setDrawColor(26, 58, 92);

  // Header separator
  doc.setLineWidth(0.3);
  doc.line(cX[4], y + hH, cX[10], y + hH);

  // Data start separator (thick)
  doc.setLineWidth(0.5);
  doc.line(cX[0], dY, cX[11], dY);

  // Internal row lines — light blue-grey
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 190, 200);
  for (let i = 1; i < N; i++) {
    const rowLine = dY + rowYOffsets[i];
    doc.line(cX[0], rowLine, cX[11], rowLine);
  }

  // Vertical column separators — main columns
  doc.setDrawColor(26, 58, 92);
  doc.setLineWidth(0.3);
  [1, 2, 3, 4, 10].forEach((i) => doc.line(cX[i], y, cX[i], y + tH));

  // SORTIE / RETOUR divider — thick
  doc.setLineWidth(0.8);
  doc.setDrawColor(26, 58, 92);
  doc.line(cX[7], y, cX[7], y + tH);

  // Internal SORTIE sub-columns — light amber
  doc.setLineWidth(0.15);
  doc.setDrawColor(210, 180, 130);
  [5, 6].forEach((i) => doc.line(cX[i], y + hH, cX[i], y + tH));

  // Internal RETOUR sub-columns — light blue
  doc.setDrawColor(150, 180, 220);
  [8, 9].forEach((i) => doc.line(cX[i], y + hH, cX[i], y + tH));

  doc.setDrawColor(26, 58, 92);

  // --- Equipages section ---
  const { crewAssignments, crewDrivers } = getState();
  const vehicles = getActiveVehicles();
  const activeCrews = vehicles.filter((v) => {
    const members = crewAssignments[v.idx] || [];
    return members.length > 0;
  });

  let fY = y + tH + 3;

  if (activeCrews.length > 0) {
    // Crew header
    doc.setFillColor(139, 92, 246);
    doc.rect(ml, fY, uw, 6, 'F');
    doc.setTextColor(255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPAGES', pw / 2, fY + 4, { align: 'center' });
    fY += 7;

    // Render each crew
    const crewColW = uw / Math.min(activeCrews.length, 3);
    activeCrews.forEach((v, ci) => {
      const col = ci % 3;
      const row = Math.floor(ci / 3);
      const cx = ml + col * crewColW;
      const cy = fY + row * 18;

      // Vehicle name
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(109, 40, 217);
      const vLabel = getVehicleLabel(v.idx);
      doc.text(vLabel, cx + 2, cy + 3);

      if (v.equipement) {
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120);
        doc.text(v.equipement, cx + 2, cy + 6, { maxWidth: crewColW - 4 });
      }

      // Crew members
      const members = crewAssignments[v.idx] || [];
      const driverIdx = crewDrivers[v.idx];
      doc.setFontSize(5.5);
      doc.setTextColor(0);
      members.forEach((empIdx, mi) => {
        const emp = team.find((t, i) => i === empIdx);
        const empName = emp ? emp.nom : 'Agent ' + (empIdx + 1);
        const isDriver = empIdx === driverIdx;
        doc.setFont('helvetica', isDriver ? 'bold' : 'normal');
        const label = isDriver ? '> ' + empName + ' (Conducteur)' : '- ' + empName;
        doc.text(label, cx + 4, cy + 9 + mi * 3, { maxWidth: crewColW - 6 });
      });
    });

    const crewRows = Math.ceil(activeCrews.length / 3);
    fY += crewRows * 18 + 1;
  }

  doc.setFontSize(5);
  doc.setTextColor(136);
  doc.setFont('helvetica', 'italic');
  doc.text('Ce registre doit etre conserve pendant 5 ans minimum.', ml, fY);

  // --- Visa matin ---
  const vmLabel = visaMatinSigner ? visaMatinSigner.label + ' - ' + visaMatinSigner.nom : 'Visa Matin';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(194, 120, 35);
  doc.text(vmLabel + ' (sortie) :', ml, fY + 6);
  doc.setDrawColor(194, 120, 35);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 1], 0);
  doc.rect(ml + 38, fY + 1, 50, 12);
  doc.setLineDashPattern([], 0);
  if (visaMatin)
    try {
      doc.addImage(visaMatin, 'PNG', ml + 38.3, fY + 1.3, 49.4, 11.4);
    } catch (e) { /* ignore */ }

  // --- Visa soir ---
  const vsLabel = visaSoirSigner ? visaSoirSigner.label + ' - ' + visaSoirSigner.nom : 'Visa Soir';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(37, 99, 235);
  doc.text(vsLabel + ' (retour) :', pw / 2 + 10, fY + 6);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 1], 0);
  doc.rect(pw / 2 + 46, fY + 1, 50, 12);
  doc.setLineDashPattern([], 0);
  if (visaSoir)
    try {
      doc.addImage(visaSoir, 'PNG', pw / 2 + 46.3, fY + 1.3, 49.4, 11.4);
    } catch (e) { /* ignore */ }

  // --- Page footer ---
  doc.setDrawColor(26, 58, 92);
  doc.setLineWidth(0.2);
  doc.line(ml, ph - 7, pw - ml, ph - 7);
  doc.setFontSize(4.5);
  doc.setTextColor(170);
  doc.setFont('helvetica', 'normal');
  doc.text("Gestion Operationnelle PM", ml, ph - 4);
  doc.text('Page n\u00b0 ' + pageNumber + ' - ' + ds, pw - ml, ph - 4, { align: 'right' });

  doc.save('gestion_pm_' + (dv || 'jour') + '.pdf');
  showToast('PDF g\u00e9n\u00e9r\u00e9 avec succ\u00e8s', 'success');
}
