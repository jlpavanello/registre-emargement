export class LocalStorageAdapter {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // silently fail (storage full, etc.)
    }
  }

  remove(key) {
    localStorage.removeItem(key);
  }

  keys() {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  }
}
