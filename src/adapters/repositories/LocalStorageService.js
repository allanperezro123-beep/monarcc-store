import { IStorageService } from '../../application/ports/IStorageService.js';

/**
 * Adapter: LocalStorageService
 * Implements IStorageService with graceful memory fallback.
 */
export class LocalStorageService extends IStorageService {
  constructor() {
    super();
    this._memory = new Map();
    this._isAvailable = this._checkStorage();
  }

  _checkStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const test = '__monarcc_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key) {
    if (this._isAvailable) {
      return window.localStorage.getItem(key);
    }
    return this._memory.get(key) || null;
  }

  setItem(key, value) {
    const val = String(value);
    if (this._isAvailable) {
      window.localStorage.setItem(key, val);
    } else {
      this._memory.set(key, val);
    }
  }

  removeItem(key) {
    if (this._isAvailable) {
      window.localStorage.removeItem(key);
    } else {
      this._memory.delete(key);
    }
  }
}

