// Action module: PDF generation using jsPDF
import { jsPDF } from 'jspdf';
import { getState } from '../state.js';
import { hasUncoveredSignatures } from '../ui/visa.js';
import { getMachineName, getMachineCat } from '../domains/machines.js';
import { getCatEmoji } from '../domains/categories.js';
import { getActiveVehicles, getVehicleLabel } from '../domains/crews.js';

export function generatePDF() {
  const {
    team, dayData, presentToday, pageNumber,
    visaMatin, visaSoir, visaMatinSigner, visaSoirSigner,
  } = getState();

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

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = 297;
  const ph = 210;
  const ml = 10;
  const uw = pw - 2 * ml;

  const ent = document.getElementById('entreprise').value || '—';
  const dv = document.getElementById('dateJour').value;
  const ds = dv ? new Date(dv + 'T00:00:00').toLocaleDateString('fr-FR') : '—';
  const rc = document.getElementById('refChantier').value || '—';
  const rp = document.getElementById('responsable').value || '—';
  const ad = document.getElementById('adresseChantier').value || '—';
  const N = at.length;

  // --- Title bar ---
  doc.setFillColor(26, 58, 92);
  doc.rect(ml, 6, uw, 11, 'F');
  doc.setTextColor(255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text("REGISTRE D'ÉMARGEMENT QUOTIDIEN", pw / 2, 13, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Page n° ' + pageNumber, pw - ml - 1, 13, { align: 'right' });

  // --- Info block ---
  let y = 20;
  doc.setDrawColor(26, 58, 92);
  doc.setLineWidth(0.4);
  doc.rect(ml, y, uw, 16);
  doc.setTextColor(0);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Entreprise :', ml + 2, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(ent, ml + 22, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Date :', ml + uw * 0.35, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(ds, ml + uw * 0.35 + 11, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Responsable :', ml + uw * 0.62, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(rp, ml + uw * 0.62 + 25, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Réf. chantier :', ml + 2, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(rc, ml + 26, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse :', ml + uw * 0.35, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(ad, ml + uw * 0.35 + 16, y + 11);

  // --- Table layout ---
  y = 40;
  const cW = [7, 14, 36, 26, 12, 11, 26, 12, 11, 26];
  cW.push(uw - cW.reduce((a, b) => a + b, 0));
  const cX = [ml];
  for (let i = 0; i < cW.length; i++) cX.push(cX[i] + cW[i]);
  const hH = 8;
  const sH = 8;
  const rH = Math.min(11, Math.max(7, (ph - y - 28 - hH - sH) / N));
  const tH = hH + sH + N * rH;
  const mid = (a, b) => (a + b) / 2;

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
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  const hYc = y + (hH + sH) / 2 + 1;
  doc.text('N°', mid(cX[0], cX[1]), hYc, { align: 'center' });
  doc.text('Mat.', mid(cX[1], cX[2]), hYc, { align: 'center' });
  doc.text('Nom et Prénom', mid(cX[2], cX[3]), hYc, { align: 'center' });
  doc.text('Arme', mid(cX[3], cX[4]), hYc, { align: 'center' });
  doc.text('Obs.', mid(cX[10], cX[11]), hYc, { align: 'center' });

  doc.setFontSize(8);
  doc.text('SORTIE', mid(cX[4], cX[7]), y + hH / 2 + 1.5, { align: 'center' });
  doc.text('RETOUR', mid(cX[7], cX[10]), y + hH / 2 + 1.5, { align: 'center' });

  // --- Sub-header row ---
  const y2 = y + hH;
  doc.setFillColor(254, 243, 199);
  doc.rect(cX[4], y2, cW[4] + cW[5] + cW[6], sH, 'F');
  doc.setFillColor(219, 234, 254);
  doc.rect(cX[7], y2, cW[7] + cW[8] + cW[9], sH, 'F');

  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  const sYc = y2 + sH / 2;
  doc.setTextColor(146, 64, 14);
  doc.text('Mun.', mid(cX[4], cX[5]), sYc - 0.5, { align: 'center' });
  doc.text('sortie', mid(cX[4], cX[5]), sYc + 2.5, { align: 'center' });
  doc.text('Heure', mid(cX[5], cX[6]), sYc - 0.5, { align: 'center' });
  doc.text('arr.', mid(cX[5], cX[6]), sYc + 2.5, { align: 'center' });
  doc.text('Émargement', mid(cX[6], cX[7]), sYc + 1, { align: 'center' });
  doc.setTextColor(30, 64, 175);
  doc.text('Mun.', mid(cX[7], cX[8]), sYc - 0.5, { align: 'center' });
  doc.text('rentrée', mid(cX[7], cX[8]), sYc + 2.5, { align: 'center' });
  doc.text('Heure', mid(cX[8], cX[9]), sYc - 0.5, { align: 'center' });
  doc.text('dép.', mid(cX[8], cX[9]), sYc + 2.5, { align: 'center' });
  doc.text('Émargement', mid(cX[9], cX[10]), sYc + 1, { align: 'center' });

  // --- Data rows ---
  const dY = y2 + sH;
  at.forEach((t, row) => {
    const ry = dY + row * rH;
    if (row % 2 === 0) {
      doc.setFillColor(237, 242, 247);
      doc.rect(cX[0], ry, uw, rH, 'F');
    }
    doc.setFillColor(255, 251, 235);
    doc.rect(cX[4], ry, cW[4] + cW[5] + cW[6], rH, 'F');
    doc.setFillColor(239, 246, 255);
    doc.rect(cX[7], ry, cW[7] + cW[8] + cW[9], rH, 'F');
    if (row % 2 === 0) {
      doc.setFillColor(248, 245, 230);
      doc.rect(cX[4], ry, cW[4] + cW[5] + cW[6], rH, 'F');
      doc.setFillColor(235, 241, 250);
      doc.rect(cX[7], ry, cW[7] + cW[8] + cW[9], rH, 'F');
    }

    doc.setTextColor(26, 58, 92);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(String(row + 1), mid(cX[0], cX[1]), ry + rH / 2 + 1, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(6);
    if (t.matricule) doc.text(t.matricule, mid(cX[1], cX[2]), ry + rH / 2 + 1, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text(t.nom, cX[2] + 1, ry + rH / 2 + 1);

    const d = dayData[t.idx];
    if (d) {
      // Multi-machines empilées
      const mList = d.matin.machines || [];
      if (mList.length > 0) {
        const lineH = Math.min(3.5, (rH - 1) / mList.length);
        const startY = ry + (rH - mList.length * lineH) / 2 + lineH * 0.7;
        mList.forEach((m, mi) => {
          const name = getMachineName(m.machineIdx);
          const catE = getCatEmoji(getMachineCat(m.machineIdx));
          doc.setFontSize(Math.min(5, 4.5));
          doc.setTextColor(30, 64, 175);
          const label = (catE ? catE + ' ' : '') + name + (m.acc > 0 ? ' (' + m.acc + ' mun)' : '');
          doc.text(label, cX[3] + 0.5, startY + mi * lineH, { maxWidth: cW[3] - 1 });
        });
        doc.setTextColor(0);
      }

      // Total accessoires matin
      const totalAcc = mList.reduce((s, m) => s + m.acc, 0);
      if (totalAcc > 0) {
        doc.setFontSize(6);
        doc.setTextColor(146, 64, 14);
        doc.text(String(totalAcc), mid(cX[4], cX[5]), ry + rH / 2 + 1, { align: 'center' });
        doc.setTextColor(0);
      }
      doc.setFontSize(5.5);
      doc.setTextColor(0);
      if (d.matin.heure) doc.text(d.matin.heure, mid(cX[5], cX[6]), ry + rH / 2 + 1, { align: 'center' });
      if (d.matin.signature)
        try {
          doc.addImage(d.matin.signature, 'PNG', cX[6] + 0.3, ry + 0.3, cW[6] - 0.6, rH - 0.6);
        } catch (e) {}

      // Total accessoires retour
      const totalRet = mList.reduce((s, m) => {
        const r = d.soir.returns ? d.soir.returns[m.machineIdx] : null;
        return s + (r ? r.accRetour : 0);
      }, 0);
      if (totalRet > 0) {
        doc.setFontSize(6);
        doc.setTextColor(30, 64, 175);
        doc.text(String(totalRet), mid(cX[7], cX[8]), ry + rH / 2 + 1, { align: 'center' });
        doc.setTextColor(0);
      }
      doc.setFontSize(5.5);
      doc.setTextColor(0);
      if (d.soir.heure) doc.text(d.soir.heure, mid(cX[8], cX[9]), ry + rH / 2 + 1, { align: 'center' });
      if (d.soir.signature)
        try {
          doc.addImage(d.soir.signature, 'PNG', cX[9] + 0.3, ry + 0.3, cW[9] - 0.6, rH - 0.6);
        } catch (e) {}

      // Observations (motifs d'écart concaténés)
      const allMotifs = mList
        .map((m) => {
          const r = d.soir.returns ? d.soir.returns[m.machineIdx] : null;
          return r && r.motif ? getMachineName(m.machineIdx).split(' ')[0] + ': ' + r.motif : '';
        })
        .filter(Boolean)
        .join(' | ');
      if (allMotifs) {
        doc.setFontSize(4);
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        const obsLines = doc.splitTextToSize(allMotifs, cW[10] - 2);
        const maxLines = Math.floor(rH / 2.5);
        const lines = obsLines.slice(0, maxLines);
        const obsY = ry + (rH - lines.length * 2.5) / 2 + 2;
        lines.forEach((line, li) => {
          doc.text(line, cX[10] + 1, obsY + li * 2.5);
        });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
      }
    }
  });

  // --- Table border and grid ---
  doc.setDrawColor(26, 58, 92);
  doc.setLineWidth(0.3);
  doc.rect(cX[0], y, uw, tH);
  doc.line(cX[4], y + hH, cX[10], y + hH);
  doc.setLineWidth(0.5);
  doc.line(cX[0], dY, cX[11], dY);
  doc.setLineWidth(0.15);
  for (let i = 1; i < N; i++) doc.line(cX[0], dY + i * rH, cX[11], dY + i * rH);
  doc.setLineWidth(0.3);
  [1, 2, 3, 4, 10].forEach((i) => doc.line(cX[i], y, cX[i], y + tH));
  doc.setLineWidth(1.0);
  doc.setDrawColor(26, 58, 92);
  doc.line(cX[7], y, cX[7], y + tH);
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 160, 120);
  [5, 6].forEach((i) => doc.line(cX[i], y + hH, cX[i], y + tH));
  doc.setDrawColor(120, 160, 200);
  [8, 9].forEach((i) => doc.line(cX[i], y + hH, cX[i], y + tH));
  doc.setDrawColor(26, 58, 92);

  // --- Équipages section ---
  const { crewAssignments } = getState();
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
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      members.forEach((empIdx, mi) => {
        const emp = team.find((t, i) => i === empIdx);
        const empName = emp ? emp.nom : `Agent ${empIdx + 1}`;
        doc.text('• ' + empName, cx + 4, cy + 9 + mi * 3, { maxWidth: crewColW - 6 });
      });
    });

    const crewRows = Math.ceil(activeCrews.length / 3);
    fY += crewRows * 18 + 1;
  }

  doc.setFontSize(5);
  doc.setTextColor(136);
  doc.setFont('helvetica', 'italic');
  doc.text('Ce registre doit être conservé pendant 5 ans minimum.', ml, fY);

  // --- Visa matin ---
  const vmLabel = visaMatinSigner ? visaMatinSigner.label + ' — ' + visaMatinSigner.nom : 'Visa Matin';
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
    } catch (e) {}

  // --- Visa soir ---
  const vsLabel = visaSoirSigner ? visaSoirSigner.label + ' — ' + visaSoirSigner.nom : 'Visa Soir';
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
    } catch (e) {}

  // --- Page footer ---
  doc.setDrawColor(26, 58, 92);
  doc.setLineWidth(0.2);
  doc.line(ml, ph - 7, pw - ml, ph - 7);
  doc.setFontSize(4.5);
  doc.setTextColor(170);
  doc.setFont('helvetica', 'normal');
  doc.text("Registre d'émargement quotidien", ml, ph - 4);
  doc.text('Page n° ' + pageNumber + ' — ' + ds, pw - ml, ph - 4, { align: 'right' });

  doc.save(`registre_${dv || 'jour'}.pdf`);
}
