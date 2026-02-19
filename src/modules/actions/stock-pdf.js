// Stock — PDF generation for orders and quotes
import { jsPDF } from 'jspdf';
import { getState } from '../state.js';

/**
 * Generate a PDF for an order or quote
 * @param {object} commande - The commande/devis object
 */
export function generateOrderPDF(commande) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { responsables } = getState();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Header
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, pageW, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(commande.type === 'devis' ? 'DEVIS' : 'BON DE COMMANDE', margin, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${commande.numero}`, margin, 24);
  doc.text(`Date: ${commande.date}`, margin, 30);

  // Status badge
  const statusLabels = { brouillon: 'BROUILLON', envoye: 'ENVOYÉ', accepte: 'ACCEPTÉ', livre: 'LIVRÉ' };
  doc.setFontSize(10);
  doc.text(statusLabels[commande.statut] || commande.statut.toUpperCase(), pageW - margin, 24, { align: 'right' });

  y = 45;

  // Info section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Police Municipale', margin, y + 5);
  if (responsables.chef.nom) doc.text(`Responsable: ${responsables.chef.nom}`, margin, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FOURNISSEUR:', pageW / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(commande.fournisseurNom || '(Non défini)', pageW / 2, y + 5);

  y += 22;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 3, pageW - margin * 2, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DÉSIGNATION', margin + 2, y + 2);
  doc.text('QTÉ', 115, y + 2, { align: 'center' });
  doc.text('P.U. HT', 140, y + 2, { align: 'center' });
  doc.text('TOTAL HT', pageW - margin - 2, y + 2, { align: 'right' });
  y += 10;

  // Lines
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  commande.lignes.forEach((l, i) => {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3.5, pageW - margin * 2, 7, 'F');
    }
    doc.text(l.designation, margin + 2, y);
    doc.text(String(l.quantite), 115, y, { align: 'center' });
    doc.text(`${l.prixUnitaire.toFixed(2)} €`, 140, y, { align: 'center' });
    doc.text(`${l.total.toFixed(2)} €`, pageW - margin - 2, y, { align: 'right' });
    y += 7;
  });

  y += 5;
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Totals
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT:', 130, y);
  doc.text(`${commande.totalHT.toFixed(2)} €`, pageW - margin - 2, y, { align: 'right' });
  y += 6;
  doc.text(`TVA ${commande.tva}%:`, 130, y);
  doc.text(`${(commande.totalTTC - commande.totalHT).toFixed(2)} €`, pageW - margin - 2, y, { align: 'right' });
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total TTC:', 130, y);
  doc.text(`${commande.totalTTC.toFixed(2)} €`, pageW - margin - 2, y, { align: 'right' });

  // Notes
  if (commande.notes) {
    y += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Notes: ${commande.notes}`, margin, y, { maxWidth: pageW - margin * 2 });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — Registre d'émargement digital`, pageW / 2, footerY, { align: 'center' });

  // Save
  const filename = `${commande.numero}.pdf`;
  doc.save(filename);
}
