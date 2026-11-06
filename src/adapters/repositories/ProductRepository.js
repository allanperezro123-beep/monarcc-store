import { IProductRepository } from '../../application/ports/IProductRepository.js';
import { Product } from '../../domain/entities/Product.js';

/**
 * Adapter: ProductRepository
 * Implements IProductRepository using static catalog data.
 * Transforms raw catalog data into pure Domain Entities.
 */
export class ProductRepository extends IProductRepository {
  constructor(initialData = null) {
    super();
    this._data = initialData || (typeof window !== 'undefined' && window.MONARCC ? window.MONARCC : null);
    this._products = null;
    this._vip = null;
  }

  _init() {
    if (this._products !== null) return;

    const raw = this._data || (typeof window !== 'undefined' && window.MONARCC ? window.MONARCC : { products: [], vip: null });
    const rawProducts = raw.products || [];

    this._products = rawProducts.map(p => new Product(p));
    this._vip = raw.vip ? new Product(raw.vip) : null;
    this._reviews = raw.reviews || [];
    this._shipping = raw.shipping || {};
  }

  async getAll() {
    this._init();
    return [...this._products];
  }

  async getById(id) {
    this._init();
    if (id === 'vip') return this._vip;
    return this._products.find(p => p.id === id) || (this._vip && this._vip.id === id ? this._vip : null);
  }

  async getVipProduct() {
    this._init();
    return this._vip;
  }

  async getReviews() {
    this._init();
    return [...this._reviews];
  }

  async getShippingConfig() {
    this._init();
    return { ...this._shipping };
  }
}

