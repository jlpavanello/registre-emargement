// Écran de sélection du rôle (Responsable / Agent)
// Affiché au premier lancement, enregistré en localStorage

import { setDeviceRole, getDeviceRole } from './auth-state.js';
import { applyRoleGuards } from './auth-guard.js';

/**
 * Create and inject the role selection screen into the DOM
 * Only shown when no device role is set (first launch)
 */
export function createLoginScreen() {
  const screen = document.createElement('div');
  screen.id = 'roleSelectScreen';
  screen.style.cssText = `
    display: ${getDeviceRole() ? 'none' : 'flex'};
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Inter', sans-serif;
  `;

  screen.innerHTML = `
    <div style="text-align:center; margin-bottom: 30px;">
      <div style="font-size: 48px; margin-bottom: 12px;">🛡️</div>
      <h1 style="color: white; font-size: 18px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">GESTION OPÉRATIONNELLE PM</h1>
      <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0; font-weight: 500;">Police Municipale</p>
    </div>

    <p style="color: #cbd5e1; font-size: 13px; font-weight: 600; margin-bottom: 20px; text-align: center;">
      Sélectionnez le profil de cet appareil&nbsp;:
    </p>

    <div style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:340px;">
      <button id="btnRoleResponsable" type="button" style="
        width:100%;
        padding: 20px 18px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border: 2px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        cursor: pointer;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 24px rgba(59,130,246,0.35);
        transition: all 0.2s ease;
      ">
        <div style="font-size: 36px; flex-shrink:0;">🛡️</div>
        <div>
          <div style="color:white; font-size:16px; font-weight:800; letter-spacing:0.3px;">RESPONSABLE</div>
          <div style="color:rgba(255,255,255,0.75); font-size:11px; font-weight:500; margin-top:4px; line-height:1.4;">Accès complet : configuration, génération PDF, remise à zéro</div>
        </div>
      </button>

      <button id="btnRoleAgent" type="button" style="
        width:100%;
        padding: 20px 18px;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        border: 2px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        cursor: pointer;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 24px rgba(5,150,105,0.35);
        transition: all 0.2s ease;
      ">
        <div style="font-size: 36px; flex-shrink:0;">👮</div>
        <div>
          <div style="color:white; font-size:16px; font-weight:800; letter-spacing:0.3px;">AGENT</div>
          <div style="color:rgba(255,255,255,0.75); font-size:11px; font-weight:500; margin-top:4px; line-height:1.4;">Consultation et signature uniquement</div>
        </div>
      </button>
    </div>
  `;

  document.body.prepend(screen);

  // Bind role selection buttons
  document.getElementById('btnRoleResponsable').addEventListener('click', () => selectRole('responsable'));
  document.getElementById('btnRoleAgent').addEventListener('click', () => selectRole('agent'));
}

/**
 * Handle role selection
 */
function selectRole(role) {
  setDeviceRole(role);
  applyRoleGuards();
}

/**
 * Show the role selection screen again (for changing role).
 * L'overlay z-index: 2000 couvre toute l'app — pas besoin
 * de cacher les éléments individuels.
 */
export function showRoleScreen() {
  const screen = document.getElementById('roleSelectScreen');
  if (screen) screen.style.display = 'flex';
}
