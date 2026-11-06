/**
 * Port: IProductRepository
 * Dependency Inversion Interface: Inner circle defines the contract,
 * outer adapters implement it.
 */
export class IProductRepository {
  async getAll() {
    throw new Error('IProductRepository#getAll must be implemented');
  }

  async getById(id) {
    throw new Error('IProductRepository#getById must be implemented');
  }

  async getVipProduct() {
    throw new Error('IProductRepository#getVipProduct must be implemented');
  }

  async getReviews() {
    throw new Error('IProductRepository#getReviews must be implemented');
  }

  async getShippingConfig() {
    throw new Error('IProductRepository#getShippingConfig must be implemented');
  }
}

