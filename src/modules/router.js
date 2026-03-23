// =============================================
// router.js — Routeur hash minimal pour SPA
// Navigation entre pages via #/route
// =============================================

import { updateSidebarActive } from './ui/sidebar.js';

const routes = new Map();
let currentRoute = null;
let currentPath = null;
let appContainer = null;
const _afterRouteHooks = [];

/**
 * Enregistre une route avec son handler
 * @param {string} path - Chemin hash (ex: '/', '/registre')
 * @param {{ mount: Function, unmount?: Function, title?: string, guard?: Function }} handler
 */
export function registerRoute(path, handler) {
  routes.set(path, handler);
}

/**
 * Navigue vers une route
 * @param {string} path
 */
export function navigate(path) {
  window.location.hash = '#' + path;
}

/**
 * Retour à la page d'accueil
 */
export function goHome() {
  navigate('/');
}

/**
 * Initialise le routeur
 * @param {HTMLElement} container - L'élément #app où les pages sont montées
 */
export function initRouter(container) {
  appContainer = container;
  window.addEventListener('hashchange', () => handleRoute());
  // Route initiale
  handleRoute();
}

/**
 * Retourne le chemin actuel
 */
export function getCurrentPath() {
  return window.location.hash.slice(1) || '/';
}

/**
 * Enregistre un hook appelé après chaque changement de route
 * @param {function} fn - () => void
 */
export function onAfterRoute(fn) {
  _afterRouteHooks.push(fn);
}

/**
 * Gère le changement de route
 */
async function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';

  // Ne rien faire si on est déjà sur cette route
  if (hash === currentPath && currentRoute) return;

  const route = routes.get(hash) || routes.get('/');
  if (!route) return;

  // Guard : vérifier les permissions
  if (route.guard && !route.guard()) {
    navigate('/');
    return;
  }

  // Animation de sortie (seulement si le conteneur a du contenu visible)
  const hasVisibleContent = appContainer && currentRoute && appContainer.children.length > 0;
  if (hasVisibleContent) {
    appContainer.classList.add('page-exit');
    await new Promise(r => setTimeout(r, 120));
  }

  // Unmount la page actuelle
  if (currentRoute && currentRoute.unmount) {
    try {
      await currentRoute.unmount(appContainer);
    } catch (e) {
      console.warn('Route unmount error:', e);
    }
  }

  // Mount la nouvelle page
  currentRoute = route;
  currentPath = hash;

  if (appContainer) {
    appContainer.innerHTML = '';
    appContainer.classList.remove('page-exit');
  }

  try {
    await route.mount(appContainer);
  } catch (e) {
    console.error('Route mount error:', e);
    appContainer.innerHTML = `<div style="padding:40px;text-align:center;color:#991b1b;">
      <h2>Erreur de chargement</h2>
      <p>${e.message}</p>
      <button onclick="location.hash='#/'" style="margin-top:16px;padding:10px 20px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;">Retour à l'accueil</button>
    </div>`;
  }

  // Mettre à jour le titre
  if (route.title) {
    document.title = route.title + ' — Gestion PM';
  } else {
    document.title = 'Gestion Opérationnelle PM';
  }

  // Mettre à jour la sidebar active
  updateSidebarActive();

  // Hooks post-route
  for (const fn of _afterRouteHooks) {
    try { fn(); } catch (e) { console.warn('afterRoute hook error:', e); }
  }

  // Scroll en haut
  window.scrollTo(0, 0);
}
