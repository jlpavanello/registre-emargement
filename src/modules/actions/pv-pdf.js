// PV — PDF generation for Procès-Verbaux
import { jsPDF } from 'jspdf';
import { getDocumentById, updateDocumentStatut } from '../domains/pv-documents.js';

/**
 * Generate a PDF for a filled PV document
 * @param {string} docId - The document ID
 */
export function generatePvPDF(docId) {
  const doc = getDocumentById(docId);
  if (!doc || !doc.templateSnapshot) {
    alert('Document introuvable');
    return;
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Header band ──
  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.rect(0, 0, pageW, 38, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROC\u00c8S-VERBAL DE CONTRAVENTION', margin, 14);

  // Subtitle
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${doc.templateRef} — ${doc.templateNom}`, margin, 22);

  // PV number + date
  pdf.setFontSize(9);
  pdf.text(`N\u00b0 ${doc.numero}`, margin, 30);
  pdf.text(`Date: ${doc.dateCreation}`, margin, 35);

  // Article badge (right)
  if (doc.templateSnapshot.article) {
    pdf.setFontSize(9);
    pdf.text(`Art. ${doc.templateSnapshot.article}`, pageW - margin, 22, { align: 'right' });
    pdf.text(`Contravention ${doc.templateSnapshot.classeContravention || ''} classe`, pageW - margin, 28, { align: 'right' });
  }

  y = 45;

  // ── Sections ──
  const sections = doc.templateSnapshot.sections || [];

  sections.forEach(section => {
    // Check page break
    if (y > pageH - 40) {
      pdf.addPage();
      y = margin;
    }

    // Section header
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.roundedRect(margin, y - 2, contentW, 8, 1, 1, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text(section.label.toUpperCase(), margin + 3, y + 3);
    y += 10;

    // Fields
    section.fields.forEach(field => {
      if (y > pageH - 25) {
        pdf.addPage();
        y = margin;
      }

      if (field.type === 'fixed') {
        // Fixed legal text — grey italic
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 116, 139);
        const lines = pdf.splitTextToSize(field.fixedValue || '', contentW - 6);

        // Light yellow background for legal text blocks
        if (lines.length > 2) {
          const blockH = lines.length * 3.5 + 4;
          if (y + blockH > pageH - 25) {
            pdf.addPage();
            y = margin;
          }
          pdf.setFillColor(254, 252, 232); // amber-50
          pdf.setDrawColor(250, 204, 21);
          pdf.roundedRect(margin + 2, y - 1, contentW - 4, blockH, 1, 1, 'FD');
        }

        lines.forEach(line => {
          if (y > pageH - 15) { pdf.addPage(); y = margin; }
          pdf.text(line, margin + 5, y + 2);
          y += 3.5;
        });
        y += 2;
      } else if (field.type === 'signature') {
        // Signature field
        const val = doc.values[field.id];
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text(field.label + ' :', margin + 2, y + 2);
        y += 4;

        if (val && val.startsWith('data:image')) {
          try {
            pdf.addImage(val, 'PNG', margin + 2, y, 50, 20);
            y += 22;
          } catch (e) {
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin + 2, y, 50, 20);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(150, 150, 150);
            pdf.text('(signature non valide)', margin + 10, y + 12);
            y += 22;
          }
        } else {
          // Empty signature box
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(margin + 2, y, 60, 20);
          y += 22;
        }
      } else {
        // Regular field — label: value
        const val = doc.values[field.id] || '';

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(71, 85, 105); // slate-600
        const labelText = field.label + (field.required ? ' *' : '') + ' :';
        pdf.text(labelText, margin + 2, y + 2);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(15, 23, 42); // slate-900

        if (val) {
          const labelW = pdf.getTextWidth(labelText) + 3;
          const maxValW = contentW - labelW - 6;

          if (maxValW > 30 && pdf.getTextWidth(val) <= maxValW) {
            // Value on same line
            pdf.text(val, margin + 2 + labelW, y + 2);
            y += 5;
          } else {
            // Value on next line (long text)
            y += 5;
            const valLines = pdf.splitTextToSize(val, contentW - 8);
            valLines.forEach(line => {
              if (y > pageH - 15) { pdf.addPage(); y = margin; }
              pdf.text(line, margin + 4, y + 1);
              y += 3.8;
            });
            y += 1;
          }
        } else {
          // Empty value — show dotted line
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineDashPattern([1, 1], 0);
          const labelW = pdf.getTextWidth(labelText) + 3;
          pdf.line(margin + 2 + labelW, y + 3, margin + contentW - 4, y + 3);
          pdf.setLineDashPattern([], 0);
          y += 5;
        }
      }
    });

    y += 3; // gap between sections
  });

  // ── Footer ──
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const footerY = pageH - 8;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Police Municipale — Biblioth\u00e8que PV OMP 2026 — Page ${i}/${totalPages}`,
      pageW / 2, footerY, { align: 'center' }
    );
  }

  // Save
  const filename = `${doc.numero}_${doc.templateRef.replace(/\./g, '-')}.pdf`;
  pdf.save(filename);
}
