// =============================================
// login-screen.js — Authentification + Sélection du rôle
// Écran de login, puis sélection Responsable / Agent
// =============================================

import { setDeviceRole, getDeviceRole } from './auth-state.js';
import { applyRoleGuards } from './auth-guard.js';

// --- Session keys ---
const SESSION_KEY = 'reg_auth_session';
const CREDENTIALS_KEY = 'reg_auth_credentials';

// --- Default credentials (hashed) ---
// Default: admin / PM43120!
// SHA-256 hash computed at init time
const DEFAULT_USER = 'admin';
const DEFAULT_PASS_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8_pm43120'; // placeholder, computed below

/**
 * SHA-256 hash using SubtleCrypto
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Initialize default credentials — always ensure the hash is correct
 */
async function ensureCredentials() {
  const hash = await sha256('PM43120!');
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (stored) {
    try {
      const creds = JSON.parse(stored);
      // If hash matches, nothing to do
      if (creds.username === DEFAULT_USER && creds.passwordHash === hash) return;
    } catch { /* corrupt data, will be overwritten */ }
  }
  const creds = { username: DEFAULT_USER, passwordHash: hash };
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
}

// Pre-computed credentials ready flag
let _credentialsReady = null;

/**
 * Verify login credentials
 */
async function verifyCredentials(username, password) {
  // Wait for credentials to be initialized
  if (_credentialsReady) await _credentialsReady;
  const stored = localStorage.getItem(CREDENTIALS_KEY);
  if (!stored) return false;

  const creds = JSON.parse(stored);
  const inputHash = await sha256(password);
  return username === creds.username && inputHash === creds.passwordHash;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return false;
  try {
    const data = JSON.parse(session);
    // Session expires after 30 days
    if (Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Set authenticated session
 */
function setSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    username,
    timestamp: Date.now(),
  }));
}

/**
 * Clear session (logout)
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// =============================================
// Login Screen UI
// =============================================

function getLoginHTML() {
  return `
    <div style="text-align:center; margin-bottom: 32px;">
      <div style="font-size: 52px; margin-bottom: 14px;">🛡️</div>
      <h1 style="color: white; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">GESTION PM</h1>
      <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0; font-weight: 500; line-height: 1.4;">
        Police Municipale de Monistrol-sur-Loire
      </p>
    </div>

    <form id="loginForm" style="width: 100%; max-width: 340px;" autocomplete="off">
      <div style="margin-bottom: 14px;">
        <label for="loginUser" style="display:block; color: #cbd5e1; font-size: 12px; font-weight: 600; margin-bottom: 6px; letter-spacing: 0.3px;">IDENTIFIANT</label>
        <input
          type="text"
          id="loginUser"
          autocomplete="username"
          placeholder="Identifiant"
          style="
            width: 100%;
            padding: 14px 16px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.15);
            border-radius: 12px;
            color: white;
            font-size: 15px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
            outline: none;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
          "
          onfocus="this.style.borderColor='rgba(255,255,255,0.4)'"
          onblur="this.style.borderColor='rgba(255,255,255,0.15)'"
        >
      </div>

      <div style="margin-bottom: 20px;">
        <label for="loginPass" style="display:block; color: #cbd5e1; font-size: 12px; font-weight: 600; margin-bottom: 6px; letter-spacing: 0.3px;">MOT DE PASSE</label>
        <input
          type="password"
          id="loginPass"
          autocomplete="current-password"
          placeholder="Mot de passe"
          style="
            width: 100%;
            padding: 14px 16px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.15);
            border-radius: 12px;
            color: white;
            font-size: 15px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
            outline: none;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
          "
          onfocus="this.style.borderColor='rgba(255,255,255,0.4)'"
          onblur="this.style.borderColor='rgba(255,255,255,0.15)'"
        >
      </div>

      <div id="loginError" style="
        display: none;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 10px;
        padding: 10px 14px;
        margin-bottom: 16px;
        color: #fca5a5;
        font-size: 13px;
        font-weight: 500;
        text-align: center;
      ">
        Identifiant ou mot de passe incorrect
      </div>

      <button type="submit" id="loginSubmit" style="
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border: 2px solid rgba(255,255,255,0.15);
        border-radius: 14px;
        color: white;
        font-size: 15px;
        font-weight: 700;
        font-family: 'Inter', sans-serif;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 8px 24px rgba(59,130,246,0.35);
        transition: all 0.2s ease;
        letter-spacing: 0.3px;
      ">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Se connecter
      </button>
    </form>
  `;
}

function getRoleSelectionHTML() {
  return `
    <div style="text-align:center; margin-bottom: 30px;">
      <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
      <h1 style="color: white; font-size: 18px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">Connexion réussie</h1>
      <p style="color: #94a3b8; font-size: 12px; margin: 6px 0 0; font-weight: 500;">Sélectionnez le profil de cet appareil</p>
    </div>

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
}

// =============================================
// Main entry point
// =============================================

/**
 * Create and inject the login / role selection screen into the DOM
 */
export async function createLoginScreen() {
  // Ensure default credentials exist — AWAIT so hash is ready before login
  _credentialsReady = ensureCredentials();
  await _credentialsReady;

  const screen = document.createElement('div');
  screen.id = 'roleSelectScreen';
  screen.style.cssText = `
    display: ${isAuthenticated() && getDeviceRole() ? 'none' : 'flex'};
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

  // If already authenticated but no role → show role selection
  // If not authenticated → show login
  if (isAuthenticated()) {
    screen.innerHTML = getRoleSelectionHTML();
  } else {
    screen.innerHTML = getLoginHTML();
  }

  document.body.prepend(screen);
  bindScreenEvents(screen);
}

function bindScreenEvents(screen) {
  // Login form
  const form = screen.querySelector('#loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUser').value.trim();
      const password = document.getElementById('loginPass').value;
      const errorEl = document.getElementById('loginError');
      const submitBtn = document.getElementById('loginSubmit');

      // Disable button during check
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.6';

      const valid = await verifyCredentials(username, password);

      if (valid) {
        setSession(username);
        errorEl.style.display = 'none';

        // If role already set, go directly to app
        if (getDeviceRole()) {
          screen.style.display = 'none';
        } else {
          // Transition to role selection
          screen.innerHTML = getRoleSelectionHTML();
          bindScreenEvents(screen);
        }
      } else {
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';

        // Shake animation
        form.style.animation = 'loginShake 0.4s ease';
        setTimeout(() => { form.style.animation = ''; }, 400);
      }
    });

    // Add shake keyframes
    if (!document.getElementById('loginShakeStyle')) {
      const style = document.createElement('style');
      style.id = 'loginShakeStyle';
      style.textContent = `
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Role selection buttons
  const btnResp = screen.querySelector('#btnRoleResponsable');
  const btnAgent = screen.querySelector('#btnRoleAgent');
  if (btnResp) btnResp.addEventListener('click', () => selectRole('responsable'));
  if (btnAgent) btnAgent.addEventListener('click', () => selectRole('agent'));
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
 */
export function showRoleScreen() {
  const screen = document.getElementById('roleSelectScreen');
  if (!screen) return;

  // If not authenticated, show login first
  if (!isAuthenticated()) {
    screen.innerHTML = getLoginHTML();
  } else {
    screen.innerHTML = getRoleSelectionHTML();
  }
  screen.style.display = 'flex';
  bindScreenEvents(screen);
}

/**
 * Show the login screen (for logout)
 */
export function showLoginScreen() {
  clearSession();
  // Also clear the device role so they must re-select after login
  localStorage.removeItem('reg_device_role');
  const screen = document.getElementById('roleSelectScreen');
  if (!screen) return;
  screen.innerHTML = getLoginHTML();
  screen.style.display = 'flex';
  bindScreenEvents(screen);
}
