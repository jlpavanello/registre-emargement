// Phase 5: Login screen UI
// Provides email/password login for responsables and PIN pad for agents

import { loginWithEmail, loginWithPin, onAuthStateChange } from './auth-state.js';
import { applyRoleGuards } from './auth-guard.js';
import { isSupabaseEnabled } from '../supabase/client.js';

let _loginMode = 'email'; // 'email' or 'pin'

/**
 * Create and inject the login screen into the DOM
 * Only active when Supabase is configured
 */
export function createLoginScreen() {
  // Auth désactivé pour le moment — sync sans authentification
  // Réactiver quand l'auth sera mise en place
  return;

  const screen = document.createElement('div');
  screen.id = 'loginScreen';
  screen.style.cssText = `
    display: flex;
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Inter', sans-serif;
  `;

  screen.innerHTML = `
    <div style="text-align:center; margin-bottom: 30px;">
      <div style="font-size: 40px; margin-bottom: 8px;">🛡️</div>
      <h1 style="color: white; font-size: 18px; font-weight: 800; margin: 0;">REGISTRE D'ÉMARGEMENT</h1>
      <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">Police Municipale</p>
    </div>

    <div id="loginCard" style="
      background: white;
      border-radius: 16px;
      padding: 24px;
      width: 100%;
      max-width: 340px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    ">
      <!-- Mode toggle -->
      <div id="loginToggle" style="
        display: flex;
        background: #f1f5f9;
        border-radius: 10px;
        padding: 3px;
        margin-bottom: 20px;
      ">
        <button id="loginTabEmail" type="button" style="
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          background: #3b82f6;
          color: white;
        ">Email</button>
        <button id="loginTabPin" type="button" style="
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          background: transparent;
          color: #64748b;
        ">Code PIN</button>
      </div>

      <!-- Email form -->
      <div id="loginEmailForm">
        <label style="display:block; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Email</label>
        <input type="email" id="loginEmail" placeholder="votre@email.fr" style="
          width:100%; padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:10px;
          font-size:14px; font-family:inherit; background:#f8fafc; box-sizing:border-box; margin-bottom:12px;
        ">
        <label style="display:block; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Mot de passe</label>
        <input type="password" id="loginPassword" placeholder="••••••••" style="
          width:100%; padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:10px;
          font-size:14px; font-family:inherit; background:#f8fafc; box-sizing:border-box; margin-bottom:16px;
        ">
        <button id="loginSubmitEmail" type="button" style="
          width:100%; padding:12px; background:linear-gradient(135deg,#3b82f6,#2563eb);
          color:white; border:none; border-radius:10px; font-size:14px; font-weight:700;
          cursor:pointer; font-family:inherit; box-shadow:0 4px 12px rgba(59,130,246,0.3);
        ">Se connecter</button>
      </div>

      <!-- PIN form -->
      <div id="loginPinForm" style="display:none;">
        <label style="display:block; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Matricule</label>
        <input type="text" id="loginMatricule" placeholder="Votre matricule" style="
          width:100%; padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:10px;
          font-size:14px; font-family:inherit; background:#f8fafc; box-sizing:border-box; margin-bottom:12px;
        ">
        <label style="display:block; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Code PIN</label>
        <div id="pinDisplay" style="
          text-align:center; font-size:28px; letter-spacing:12px; font-weight:700;
          color:#0f172a; padding:10px; margin-bottom:12px; min-height:40px;
        ">____</div>
        <div id="pinPad" style="
          display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:16px;
        "></div>
        <button id="loginSubmitPin" type="button" style="
          width:100%; padding:12px; background:linear-gradient(135deg,#059669,#047857);
          color:white; border:none; border-radius:10px; font-size:14px; font-weight:700;
          cursor:pointer; font-family:inherit; box-shadow:0 4px 12px rgba(5,150,105,0.3);
        ">Valider</button>
      </div>

      <!-- Error message -->
      <div id="loginError" style="
        display:none; margin-top:12px; padding:10px; background:#fee2e2;
        color:#dc2626; border-radius:8px; font-size:12px; font-weight:600; text-align:center;
      "></div>
    </div>
  `;

  document.body.prepend(screen);
  bindLoginEvents();
  createPinPad();
}

let _pinValue = '';

function createPinPad() {
  const pad = document.getElementById('pinPad');
  if (!pad) return;

  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'];
  buttons.forEach(val => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = val;
    btn.style.cssText = `
      padding: 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 18px; font-weight: 600; cursor: pointer; font-family: inherit;
      background: white; color: #0f172a;
    `;
    if (val === 'C') btn.style.color = '#dc2626';
    if (val === '⌫') btn.style.color = '#f59e0b';

    btn.addEventListener('click', () => onPinInput(val));
    pad.appendChild(btn);
  });
}

function onPinInput(val) {
  if (val === 'C') {
    _pinValue = '';
  } else if (val === '⌫') {
    _pinValue = _pinValue.slice(0, -1);
  } else if (_pinValue.length < 6) {
    _pinValue += val;
  }

  const display = document.getElementById('pinDisplay');
  if (display) {
    const dots = '●'.repeat(_pinValue.length) + '○'.repeat(Math.max(0, 4 - _pinValue.length));
    display.textContent = dots;
  }
}

function bindLoginEvents() {
  // Mode toggle
  const tabEmail = document.getElementById('loginTabEmail');
  const tabPin = document.getElementById('loginTabPin');

  if (tabEmail) tabEmail.addEventListener('click', () => switchLoginMode('email'));
  if (tabPin) tabPin.addEventListener('click', () => switchLoginMode('pin'));

  // Email submit
  const submitEmail = document.getElementById('loginSubmitEmail');
  if (submitEmail) submitEmail.addEventListener('click', handleEmailLogin);

  // PIN submit
  const submitPin = document.getElementById('loginSubmitPin');
  if (submitPin) submitPin.addEventListener('click', handlePinLogin);

  // Enter key for email form
  const passwordInput = document.getElementById('loginPassword');
  if (passwordInput) {
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleEmailLogin();
    });
  }
}

function switchLoginMode(mode) {
  _loginMode = mode;
  const emailForm = document.getElementById('loginEmailForm');
  const pinForm = document.getElementById('loginPinForm');
  const tabEmail = document.getElementById('loginTabEmail');
  const tabPin = document.getElementById('loginTabPin');

  if (mode === 'email') {
    emailForm.style.display = 'block';
    pinForm.style.display = 'none';
    tabEmail.style.background = '#3b82f6';
    tabEmail.style.color = 'white';
    tabPin.style.background = 'transparent';
    tabPin.style.color = '#64748b';
  } else {
    emailForm.style.display = 'none';
    pinForm.style.display = 'block';
    tabPin.style.background = '#059669';
    tabPin.style.color = 'white';
    tabEmail.style.background = 'transparent';
    tabEmail.style.color = '#64748b';
  }
  hideError();
}

async function handleEmailLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showError('Veuillez remplir tous les champs.');
    return;
  }

  const btn = document.getElementById('loginSubmitEmail');
  btn.textContent = 'Connexion...';
  btn.disabled = true;

  const result = await loginWithEmail(email, password);

  btn.textContent = 'Se connecter';
  btn.disabled = false;

  if (result.error) {
    showError(result.error);
  }
  // On success, onAuthStateChange will handle the rest
}

async function handlePinLogin() {
  const matricule = document.getElementById('loginMatricule').value.trim();

  if (!matricule || _pinValue.length < 4) {
    showError('Entrez votre matricule et un code PIN à 4-6 chiffres.');
    return;
  }

  const btn = document.getElementById('loginSubmitPin');
  btn.textContent = 'Vérification...';
  btn.disabled = true;

  const result = await loginWithPin(matricule, _pinValue);

  btn.textContent = 'Valider';
  btn.disabled = false;

  if (result.error) {
    showError(result.error);
    _pinValue = '';
    const display = document.getElementById('pinDisplay');
    if (display) display.textContent = '○○○○';
  }
}

function showError(msg) {
  const el = document.getElementById('loginError');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function hideError() {
  const el = document.getElementById('loginError');
  if (el) el.style.display = 'none';
}
