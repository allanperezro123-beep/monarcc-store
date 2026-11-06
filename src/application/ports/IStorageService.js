/**
 * Port: IStorageService
 * Dependency Inversion Interface for client-side persistence (localStorage/memory).
 */
export class IStorageService {
  getItem(key) {
    throw new Error('IStorageService#getItem must be implemented');
  }

  setItem(key, value) {
    throw new Error('IStorageService#setItem must be implemented');
  }

  removeItem(key) {
    throw new Error('IStorageService#removeItem must be implemented');
  }
}

