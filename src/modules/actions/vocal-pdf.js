// Action module: Generate PDF for a vocal mission report
import { jsPDF } from 'jspdf';

export function generateVocalPDF(report) {
  if (!report) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = 210;
  const ph = 297;
  const ml = 15;
  const mr = 15;
  const uw = pw - ml - mr;

  // ===== EN-TÊTE =====
  doc.setFillColor(26, 58, 92);
  doc.rect(ml, 12, uw, 14, 'F');
  doc.setTextColor(255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPTE-RENDU DE MISSION', pw / 2, 21, { align: 'center' });

  // ===== SOUS-TITRE =====
  doc.setFillColor(5, 150, 105);
  doc.rect(ml, 26, uw, 8, 'F');
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Police Municipale — Document officiel', pw / 2, 31.5, { align: 'center' });

  // ===== BLOC INFORMATIONS =====
  let y = 40;
  doc.setDrawColor(26, 58, 92);
  doc.setLineWidth(0.4);
  doc.rect(ml, y, uw, 42);

  doc.setTextColor(0);
  doc.setFontSize(9);

  const infoFields = [
    { label: 'Date :', value: formatDate(report.date) },
    { label: 'Heure rapport :', value: report.heure || '—' },
    { label: 'Agent :', value: report.agent || '—' },
    { label: 'Matricule :', value: report.matricule || '—' },
    { label: 'Lieu :', value: report.lieu || '—' },
    { label: 'Objet :', value: report.objet || '—' },
    { label: 'Heure mission :', value: report.heureMission || '—' },
    { label: 'Durée :', value: report.duree || '—' },
  ];

  const col1X = ml + 4;
  const col2X = ml + uw / 2 + 4;
  const lineH = 5;
  let row = 0;

  infoFields.forEach((f, i) => {
    const isRight = i % 2 === 1;
    const x = isRight ? col2X : col1X;
    const fy = y + 6 + row * lineH;

    doc.setFont('helvetica', 'bold');
    doc.text(f.label, x, fy);
    const labelWidth = doc.getTextWidth(f.label);
    doc.setFont('helvetica', 'normal');
    doc.text(f.value, x + labelWidth + 2, fy);

    if (isRight) row++;
  });

  // ===== CONTENU DU RAPPORT =====
  y = 88;
  doc.setFillColor(240, 245, 250);
  doc.rect(ml, y, uw, 8, 'F');
  doc.setDrawColor(26, 58, 92);
  doc.setLineWidth(0.3);
  doc.rect(ml, y, uw, 8);
  doc.setTextColor(26, 58, 92);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTENU DU COMPTE-RENDU', ml + 4, y + 5.5);

  y = 100;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const contenu = report.contenu || '';
  const lines = doc.splitTextToSize(contenu, uw - 8);
  const maxY = ph - 40; // Leave space for footer

  let lineY = y;
  lines.forEach((line) => {
    if (lineY > maxY) {
      // Add new page if needed
      doc.addPage();
      lineY = 20;
    }
    doc.text(line, ml + 4, lineY);
    lineY += 5;
  });

  // ===== ENCADREMENT DU CONTENU =====
  const contentHeight = Math.min(lineY - 100 + 6, maxY - 96);
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.2);
  doc.rect(ml, 96, uw, contentHeight);

  // ===== PIED DE PAGE =====
  doc.setDrawColor(26, 58, 92);
  doc.setLineWidth(0.2);
  doc.line(ml, ph - 18, pw - mr, ph - 18);
  doc.setFontSize(7);
  doc.setTextColor(160);
  doc.setFont('helvetica', 'italic');
  doc.text("Document généré par Gestion Opérationnelle PM", ml, ph - 14);
  doc.text(formatDate(report.date) + ' à ' + (report.heure || ''), pw - mr, ph - 14, { align: 'right' });

  // ===== SAUVEGARDE =====
  const filename = `CR_mission_${report.date}_${report.heure ? report.heure.replace(':', 'h') : 'rapport'}.pdf`;
  doc.save(filename);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
}
