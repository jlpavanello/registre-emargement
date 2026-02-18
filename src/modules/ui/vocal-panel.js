// UI module: Vocal mission report panel
// Uses Web Speech API (webkitSpeechRecognition) for voice-to-text

import { addReport, deleteReport, getReportsForToday, getAllReports } from '../domains/vocal-data.js';

let _callbacks = {};
export function bindVocalCallbacks(callbacks) {
  _callbacks = callbacks;
}

let recognition = null;
let isRecording = false;
let speechSupported = false;

// Check browser support
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    speechSupported = false;
    return;
  }
  speechSupported = true;
  recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const textarea = document.getElementById('vocalContenu');
    const interimEl = document.getElementById('vocalInterim');
    if (!textarea) return;

    let finalText = '';
    let interimText = '';

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalText += result[0].transcript + ' ';
      } else {
        interimText += result[0].transcript;
      }
    }

    // Append final text to existing content
    if (finalText) {
      const currentVal = textarea.dataset.baseText || '';
      textarea.value = currentVal + finalText;
      textarea.dataset.baseText = textarea.value;
    }

    // Show interim text
    if (interimEl) {
      interimEl.textContent = interimText ? '🎤 ' + interimText : '';
    }
  };

  recognition.onerror = (event) => {
    console.log('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      alert("L'accès au microphone a été refusé. Veuillez l'autoriser dans les paramètres de votre navigateur.");
    }
    stopRecording();
  };

  recognition.onend = () => {
    // Auto-restart if still in recording mode (browser may stop after silence)
    if (isRecording) {
      try {
        recognition.start();
      } catch (e) {
        stopRecording();
      }
    }
  };
}

export function openVocalPanel() {
  initSpeechRecognition();
  const panel = document.getElementById('vocalPanel');
  panel.classList.add('active');
  clearForm();
  renderReportsList();
  updateMicButton();
}

export function closeVocalPanel() {
  if (isRecording) stopRecording();
  document.getElementById('vocalPanel').classList.remove('active');
}

function updateMicButton() {
  const btn = document.getElementById('btnMic');
  if (!speechSupported) {
    btn.classList.add('unavailable');
    document.getElementById('vocalMicStatus').textContent = 'Saisie manuelle uniquement';
  } else {
    btn.classList.remove('unavailable');
  }
}

export function startRecording() {
  if (!speechSupported || !recognition) return;
  if (isRecording) {
    stopRecording();
    return;
  }

  const textarea = document.getElementById('vocalContenu');
  textarea.dataset.baseText = textarea.value;

  try {
    recognition.start();
    isRecording = true;
    document.getElementById('btnMic').classList.add('recording');
    document.getElementById('vocalMicStatus').classList.add('recording');
    document.getElementById('vocalMicStatus').textContent = 'Parlez maintenant...';
  } catch (e) {
    console.log('Cannot start recognition:', e);
  }
}

export function stopRecording() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {}
  }
  isRecording = false;
  const btn = document.getElementById('btnMic');
  const status = document.getElementById('vocalMicStatus');
  if (btn) btn.classList.remove('recording');
  if (status) {
    status.classList.remove('recording');
    status.textContent = 'Appuyez pour dicter';
  }
  const interim = document.getElementById('vocalInterim');
  if (interim) interim.textContent = '';
}

export function clearForm() {
  const lieu = document.getElementById('vocalLieu');
  const objet = document.getElementById('vocalObjet');
  const contenu = document.getElementById('vocalContenu');
  if (lieu) lieu.value = '';
  if (objet) objet.value = '';
  if (contenu) {
    contenu.value = '';
    contenu.dataset.baseText = '';
  }
  const interim = document.getElementById('vocalInterim');
  if (interim) interim.textContent = '';
  updateSaveButton();
}

export function updateSaveButton() {
  const contenu = document.getElementById('vocalContenu');
  const btn = document.getElementById('btnVocalSave');
  if (btn && contenu) {
    btn.disabled = !contenu.value.trim();
  }
}

export function saveCurrentReport() {
  const lieu = document.getElementById('vocalLieu').value.trim();
  const objet = document.getElementById('vocalObjet').value.trim();
  const contenu = document.getElementById('vocalContenu').value.trim();

  if (!contenu) {
    alert('Le contenu du rapport ne peut pas être vide.');
    return;
  }

  if (isRecording) stopRecording();

  addReport({ lieu, objet, contenu });
  clearForm();
  renderReportsList();
}

export function removeReport(id) {
  if (!confirm('Supprimer ce compte-rendu ?')) return;
  deleteReport(id);
  renderReportsList();
}

export function renderReportsList() {
  const container = document.getElementById('vocalReportsList');
  if (!container) return;

  const allReports = getAllReports();

  if (allReports.length === 0) {
    container.innerHTML = `
      <div class="vocal-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <p>Aucun compte-rendu enregistré.<br>Dictez ou saisissez votre premier rapport ci-dessus.</p>
      </div>`;
    return;
  }

  // Group by date, most recent first
  const byDate = {};
  allReports.forEach((r) => {
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push(r);
  });

  const sortedDates = Object.keys(byDate).sort().reverse();

  container.innerHTML = '';

  sortedDates.forEach((date) => {
    const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    container.innerHTML += `
      <div class="vocal-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${dateStr}
      </div>`;

    byDate[date]
      .sort((a, b) => b.id.localeCompare(a.id))
      .forEach((r) => {
        const contenuPreview = r.contenu.length > 200 ? r.contenu.substring(0, 200) + '...' : r.contenu;
        container.innerHTML += `
        <div class="vocal-report-card" data-id="${r.id}">
          <div class="vocal-report-header">
            <div class="vocal-report-meta">
              <strong>${r.heure}</strong> — ${r.agent || 'Agent'}${r.matricule ? ' (' + r.matricule + ')' : ''}
            </div>
            <div class="vocal-report-actions">
              <button class="btn-vocal-pdf" data-pdf-id="${r.id}">📄 PDF</button>
              <button class="btn-vocal-delete" data-del-id="${r.id}">🗑</button>
            </div>
          </div>
          ${r.lieu ? `<div class="vocal-report-lieu">📍 ${r.lieu}</div>` : ''}
          ${r.objet ? `<div class="vocal-report-objet">${r.objet}</div>` : ''}
          <div class="vocal-report-contenu">${contenuPreview}</div>
        </div>`;
      });
  });

  // Bind PDF and delete buttons
  container.querySelectorAll('[data-pdf-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (_callbacks.generateVocalPDF) {
        const report = allReports.find((r) => r.id === btn.dataset.pdfId);
        if (report) _callbacks.generateVocalPDF(report);
      }
    });
  });
  container.querySelectorAll('[data-del-id]').forEach((btn) => {
    btn.addEventListener('click', () => removeReport(btn.dataset.delId));
  });
}
