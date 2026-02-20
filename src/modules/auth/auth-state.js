// Phase 5: Authentication state management
// Manages user session, role-based access, and auth persistence

import { getSupabase, isSupabaseEnabled } from '../supabase/client.js';

let _currentUser = null;
let _currentProfile = null;
let _onAuthChange = null;

/**
 * Roles hierarchy (higher = more permissions)
 */
const ROLE_LEVELS = {
  agent: 1,
  armurier: 2,
  chef: 3,
  responsable: 4,
  admin: 5,
};

/**
 * Register a callback for auth state changes
 * @param {function} fn - (user, profile) => void
 */
export function onAuthStateChange(fn) {
  _onAuthChange = fn;
}

function emitAuthChange() {
  if (_onAuthChange) _onAuthChange(_currentUser, _currentProfile);
}

const DEVICE_ROLE_KEY = 'reg_device_role';

/**
 * Get device role from localStorage
 * @returns {'responsable'|'agent'|null}
 */
export function getDeviceRole() {
  return localStorage.getItem(DEVICE_ROLE_KEY);
}

/**
 * Set device role in localStorage and reinit auth
 */
export function setDeviceRole(role) {
  localStorage.setItem(DEVICE_ROLE_KEY, role);
  initAuth();
}

/**
 * Initialize auth: read local device role
 */
export async function initAuth() {
  const deviceRole = getDeviceRole();
  _currentUser = { id: 'local', email: 'local' };
  _currentProfile = {
    id: 'local',
    nom: deviceRole === 'responsable' ? 'Responsable' : 'Agent',
    role: deviceRole === 'responsable' ? 'admin' : 'agent',
    matricule: '',
    is_asvp: false,
  };
  emitAuthChange();
}

/**
 * Load user profile from Supabase
 */
async function loadProfile(userId) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      _currentProfile = data;
    }
  } catch (e) {
    console.warn('Failed to load profile:', e);
  }
  emitAuthChange();
}

/**
 * Login with email and password (for chef/responsable/admin)
 */
export async function loginWithEmail(email, password) {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase non configuré' };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  _currentUser = data.user;
  await loadProfile(data.user.id);
  return { user: data.user };
}

/**
 * Login with PIN (for agents)
 * PIN verification is done server-side via a Supabase Edge Function
 */
export async function loginWithPin(matricule, pin) {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase non configuré' };

  try {
    // Call custom RPC function for PIN auth
    const { data, error } = await supabase.rpc('verify_agent_pin', {
      p_matricule: matricule,
      p_pin: pin,
    });

    if (error) return { error: error.message };
    if (!data || !data.token) return { error: 'Matricule ou PIN incorrect' };

    // Sign in with the returned token
    const { data: session, error: sessError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.temp_password,
    });

    if (sessError) return { error: sessError.message };

    _currentUser = session.user;
    await loadProfile(session.user.id);
    return { user: session.user };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Logout
 */
export async function logout() {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  _currentUser = null;
  _currentProfile = null;
  emitAuthChange();
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return _currentUser;
}

/**
 * Get current profile
 */
export function getCurrentProfile() {
  return _currentProfile;
}

/**
 * Get current role
 */
export function getCurrentRole() {
  return _currentProfile?.role || 'agent';
}

/**
 * Check if current user has at least a given role level
 */
export function hasMinRole(requiredRole) {
  const currentLevel = ROLE_LEVELS[getCurrentRole()] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  return currentLevel >= requiredLevel;
}

/**
 * Role-based feature access matrix
 */
export const ACCESS = {
  canSign: () => true, // All roles
  canViewConfig: () => hasMinRole('armurier'),
  canEditConfig: () => hasMinRole('chef'),
  canSignVisa: () => hasMinRole('armurier'),
  canResetDay: () => hasMinRole('chef'),
  canFullReset: () => hasMinRole('responsable'),
  canExportImport: () => hasMinRole('chef'),
  canManageTeam: () => hasMinRole('chef'),
  canCreateVocalReport: () => true, // All roles
  canDeleteVocalReport: () => hasMinRole('chef'),
  canViewAllReports: () => hasMinRole('armurier'),
  canViewStock: () => hasMinRole('chef'),
  canViewPV: () => hasMinRole('chef'),
};
