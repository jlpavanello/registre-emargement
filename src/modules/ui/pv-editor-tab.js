// PV — Editor tab (dynamic form for filling PV)
import { getDocumentById, updateDocumentValues, updateDocumentStatut, isDocumentComplete, getDocumentProgress } from '../domains/pv-documents.js';
import { generatePvPDF } from '../actions/pv-pdf.js';
import { switchPvTab } from './pv-panel.js';

let _expandedSections = {};
let _saveTimeout = null;
let _currentDocId = null;

export function renderEditorTab(container, docId) {
  _currentDocId = docId;
  const doc = getDocumentById(docId);
  if (!doc) {
    container.innerHTML = '<div class="pv-empty">Document introuvable</div>';
    return;
  }

  const progress = getDocumentProgress(docId);
  const sections = doc.templateSnapshot?.sections || [];

  let html = '';

  // Header bar
  html += `<div class="pv-editor-header">
    <div class="pv-editor-title">
      <div class="pv-editor-numero">${doc.numero}</div>
      <div class="pv-editor-type">${doc.templateRef} \u2014 ${doc.templateNom}</div>
    </div>
    <div class="pv-editor-statut">
      <span class="pv-statut-badge ${doc.statut}">${doc.statut === 'brouillon' ? 'Brouillon' : doc.statut === 'complet' ? 'Complet' : 'Imprim\u00e9'}</span>
    </div>
  </div>`;

  // Progress bar
  html += `<div class="pv-editor-progress">
    <div class="pv-progress-bar"><div class="pv-progress-fill" style="width:${progress.percent}%"></div></div>
    <span class="pv-progress-text">${progress.filled}/${progress.total} champs remplis (${progress.percent}%)</span>
  </div>`;

  // Sections as accordions
  sections.forEach((section) => {
    const isExpanded = _expandedSections[section.id] !== false;
    const sectionProgress = getSectionProgress(section, doc.values);

    html += `<div class="pv-section ${isExpanded ? 'expanded' : ''}">
      <div class="pv-section-header" data-section="${section.id}">
        <div class="pv-section-title">${section.label}</div>
        <div class="pv-section-meta">
          <span class="pv-section-count">${sectionProgress.filled}/${sectionProgress.total}</span>
          <span class="pv-section-chevron">${isExpanded ? '\u25BC' : '\u25B6'}</span>
        </div>
      </div>`;

    if (isExpanded) {
      html += `<div class="pv-section-body">`;
      section.fields.forEach(field => {
        html += renderField(field, doc.values[field.id]);
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  // Action buttons
  html += `<div class="pv-editor-actions">
    <button class="pv-btn-action pv-btn-back" id="pvBtnBack">\u2190 Retour</button>
    <button class="pv-btn-action pv-btn-complete" id="pvBtnComplete">${doc.statut === 'complet' ? 'Repasser en brouillon' : 'Marquer complet'}</button>
    <button class="pv-btn-action pv-btn-genpdf" id="pvBtnGenPDF">G\u00e9n\u00e9rer PDF</button>
  </div>`;

  container.innerHTML = html;

  // Event listeners

  // Accordion headers
  container.querySelectorAll('.pv-section-header').forEach(header => {
    header.addEventListener('click', () => {
      const sId = header.dataset.section;
      _expandedSections[sId] = !(_expandedSections[sId] !== false);
      renderEditorTab(container, docId);
    });
  });

  // Field inputs — auto-save with debounce
  container.querySelectorAll('.pv-field-input').forEach(input => {
    const handler = () => {
      const fieldId = input.dataset.fieldId;
      const value = input.type === 'checkbox' ? input.checked : input.value;
      scheduleAutoSave(docId, fieldId, value);
    };
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
  });

  // Signature fields
  container.querySelectorAll('.pv-sig-canvas').forEach(canvas => {
    initSignatureCanvas(canvas, docId);
  });

  // Back button
  const btnBack = container.querySelector('#pvBtnBack');
  if (btnBack) btnBack.addEventListener('click', () => switchPvTab('mespv'));

  // Complete button
  const btnComplete = container.querySelector('#pvBtnComplete');
  if (btnComplete) {
    btnComplete.addEventListener('click', () => {
      if (doc.statut === 'complet') {
        updateDocumentStatut(docId, 'brouillon');
      } else {
        if (isDocumentComplete(docId)) {
          updateDocumentStatut(docId, 'complet');
        } else {
          alert('Tous les champs obligatoires (*) doivent \u00eatre remplis pour marquer le PV comme complet.');
          return;
        }
      }
      renderEditorTab(container, docId);
    });
  }

  // Generate PDF
  const btnPDF = container.querySelector('#pvBtnGenPDF');
  if (btnPDF) {
    btnPDF.addEventListener('click', () => {
      generatePvPDF(docId);
      updateDocumentStatut(docId, 'imprime');
      renderEditorTab(container, docId);
    });
  }
}

function renderField(field, value) {
  if (field.type === 'fixed') {
    return `<div class="pv-field pv-field-fixed">
      <label>${field.label}</label>
      <div class="pv-fixed-text">${(field.fixedValue || '').replace(/\n/g, '<br>')}</div>
    </div>`;
  }

  const required = field.required ? ' *' : '';
  const reqAttr = field.required ? 'required' : '';
  const val = value !== undefined && value !== null ? value : '';

  let inputHtml = '';
  switch (field.type) {
    case 'text':
      inputHtml = `<input type="text" class="pv-field-input" data-field-id="${field.id}" value="${escapeAttr(val)}" placeholder="${field.placeholder || ''}" ${reqAttr}>`;
      break;
    case 'textarea':
      inputHtml = `<textarea class="pv-field-input" data-field-id="${field.id}" placeholder="${field.placeholder || ''}" ${reqAttr} rows="3">${escapeHtml(val)}</textarea>`;
      break;
    case 'date':
      inputHtml = `<input type="date" class="pv-field-input" data-field-id="${field.id}" value="${val}" ${reqAttr}>`;
      break;
    case 'time':
      inputHtml = `<input type="time" class="pv-field-input" data-field-id="${field.id}" value="${val}" ${reqAttr}>`;
      break;
    case 'select':
      inputHtml = `<select class="pv-field-input" data-field-id="${field.id}" ${reqAttr}>
        <option value="">\u2014 Choisir \u2014</option>
        ${(field.options || []).map(o => `<option value="${escapeAttr(o)}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
      </select>`;
      break;
    case 'signature':
      inputHtml = `<div class="pv-sig-container">
        <canvas class="pv-sig-canvas" data-field-id="${field.id}" width="300" height="120"></canvas>
        <button class="pv-sig-clear" data-field-id="${field.id}">Effacer</button>
      </div>`;
      if (val) {
        inputHtml += `<img class="pv-sig-preview" src="${val}" alt="Signature">`;
      }
      break;
    default:
      inputHtml = `<input type="text" class="pv-field-input" data-field-id="${field.id}" value="${escapeAttr(val)}" placeholder="${field.placeholder || ''}">`;
  }

  const filledClass = val ? 'filled' : '';
  return `<div class="pv-field ${filledClass}">
    <label>${field.label}${required}</label>
    ${inputHtml}
  </div>`;
}

function getSectionProgress(section, values) {
  let filled = 0, total = 0;
  section.fields.forEach(f => {
    if (f.type === 'fixed') return;
    total++;
    const val = values?.[f.id];
    if (val !== undefined && val !== null && val !== '') filled++;
  });
  return { filled, total };
}

function scheduleAutoSave(docId, fieldId, value) {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    updateDocumentValues(docId, { [fieldId]: value });
    const progressBar = document.querySelector('.pv-editor-progress .pv-progress-fill');
    const progressText = document.querySelector('.pv-editor-progress .pv-progress-text');
    if (progressBar && progressText) {
      const progress = getDocumentProgress(docId);
      progressBar.style.width = progress.percent + '%';
      progressText.textContent = `${progress.filled}/${progress.total} champs remplis (${progress.percent}%)`;
    }
  }, 500);
}

function initSignatureCanvas(canvas, docId) {
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  const fieldId = canvas.dataset.fieldId;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const doc = getDocumentById(docId);
  if (doc && doc.values[fieldId]) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = doc.values[fieldId];
  }

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('mousedown', (e) => { isDrawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
  canvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
  canvas.addEventListener('mouseup', () => { isDrawing = false; saveSignature(); });
  canvas.addEventListener('mouseleave', () => { if (isDrawing) { isDrawing = false; saveSignature(); } });

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, { passive: false });
  canvas.addEventListener('touchend', () => { isDrawing = false; saveSignature(); });

  function saveSignature() {
    const dataURL = canvas.toDataURL('image/png');
    scheduleAutoSave(docId, fieldId, dataURL);
  }

  const clearBtn = canvas.parentElement.querySelector('.pv-sig-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      scheduleAutoSave(docId, fieldId, '');
    });
  }
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
