// Stock — PDF generation for orders and quote requests
import { jsPDF } from 'jspdf';
import { getState } from '../state.js';

/**
 * Generate a PDF for an order or quote request
 * @param {object} commande - The commande/demande_devis object
 */
export function generateOrderPDF(commande) {
  const isDemandeDevis = commande.type === 'demande_devis';
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { responsables } = getState();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // ── Header ──
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, pageW, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(isDemandeDevis ? 'DEMANDE DE DEVIS' : 'BON DE COMMANDE', margin, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${commande.numero}`, margin, 24);
  doc.text(`Date: ${commande.date}`, margin, 30);

  // Status badge
  const statusLabels = isDemandeDevis
    ? { brouillon: 'BROUILLON', envoyee: 'ENVOYÉE', repondu: 'RÉPONDU' }
    : { brouillon: 'BROUILLON', envoye: 'ENVOYÉ', accepte: 'ACCEPTÉ', livre: 'LIVRÉ' };
  doc.setFontSize(10);
  doc.text(statusLabels[commande.statut] || commande.statut.toUpperCase(), pageW - margin, 24, { align: 'right' });

  y = 45;

  // ── Info section ──
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Police Municipale', margin, y + 5);
  if (responsables.chef.nom) doc.text(`Responsable: ${responsables.chef.nom}`, margin, y + 10);

  if (commande.fournisseurNom) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DESTINATAIRE:', pageW / 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(commande.fournisseurNom, pageW / 2, y + 5);
  } else if (isDemandeDevis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DESTINATAIRE:', pageW / 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('(À compléter)', pageW / 2, y + 5);
  }

  y += 22;

  // ── Purpose note for demande de devis ──
  if (isDemandeDevis) {
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(250, 204, 21);
    doc.roundedRect(margin, y - 2, pageW - margin * 2, 14, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(113, 63, 18);
    doc.text('Objet : Demande de devis', margin + 4, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.text('Merci de nous faire parvenir votre meilleure offre de prix pour les articles ci-dessous.', margin + 4, y + 8);
    doc.setTextColor(0, 0, 0);
    y += 18;
  }

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Table ──
  if (isDemandeDevis) {
    // === DEMANDE DE DEVIS: 2 colonnes (Désignation + Quantité) ===
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 3, pageW - margin * 2, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DÉSIGNATION', margin + 2, y + 2);
    doc.text('QUANTITÉ DEMANDÉE', pageW - margin - 2, y + 2, { align: 'right' });
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
      doc.text(String(l.quantite), pageW - margin - 2, y, { align: 'right' });
      y += 7;
    });

    y += 5;
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // Colonnes réponse fournisseur (à remplir)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Réponse du fournisseur (à compléter) :', margin, y);
    y += 8;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 3, pageW - margin * 2, 8, 'F');
    doc.setFontSize(8);
    doc.text('DÉSIGNATION', margin + 2, y + 2);
    doc.text('P.U. HT', 120, y + 2, { align: 'center' });
    doc.text('DÉLAI', 150, y + 2, { align: 'center' });
    doc.text('TOTAL HT', pageW - margin - 2, y + 2, { align: 'right' });
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

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
      // Lignes vides à remplir par le fournisseur
      doc.setDrawColor(180, 180, 180);
      doc.line(110, y + 0.5, 130, y + 0.5); // P.U. HT
      doc.line(140, y + 0.5, 160, y + 0.5); // Délai
      doc.line(170, y + 0.5, pageW - margin - 2, y + 0.5); // Total HT
      y += 7;
    });

    y += 5;
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // Zone totaux à remplir
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Total HT :', 130, y);
    doc.setDrawColor(180, 180, 180);
    doc.line(160, y + 0.5, pageW - margin - 2, y + 0.5);
    y += 6;
    doc.text('TVA (%) :', 130, y);
    doc.line(160, y + 0.5, pageW - margin - 2, y + 0.5);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total TTC :', 130, y);
    doc.line(160, y + 0.5, pageW - margin - 2, y + 0.5);
    y += 10;

    // Zone signature
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Date et signature du fournisseur :', margin, y);
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, y + 3, 80, 25);

  } else {
    // === BON DE COMMANDE: 4 colonnes (Désignation + Qté + P.U. HT + Total HT) ===
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
  }

  // ── Notes ──
  if (commande.notes) {
    y += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Notes: ${commande.notes}`, margin, y, { maxWidth: pageW - margin * 2 });
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — Gestion Opérationnelle PM`, pageW / 2, footerY, { align: 'center' });

  // Save
  const filename = `${commande.numero}.pdf`;
  doc.save(filename);
}
