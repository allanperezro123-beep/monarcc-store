import { ProductPresenter } from '../presenters/ProductPresenter.js';

/**
 * Controller: CatalogController
 * Manages catalog state, filtering, option selections (size/color), and quick-view modals.
 */
export class CatalogController {
  constructor({
    productRepository,
    filterCatalogUseCase,
    domRenderer,
    cardOptionsMap
  }) {
    this.productRepo = productRepository;
    this.filterCatalogUseCase = filterCatalogUseCase;
    this.domRenderer = domRenderer;
    this.cardOptions = cardOptionsMap;

    this.category = 'TODOS';
    this.searchQuery = '';
    this.selectedSize = null;
    this.selectedColor = null;
    this.maxPrice = 220000;
    this.onlySeasonal = false;
    this.vipUnlocked = false;
  }

  async filterAndRender() {
    const allProducts = await this.productRepo.getAll();
    const vipProduct = await this.productRepo.getVipProduct();

    const { filteredProducts } = this.filterCatalogUseCase.execute({
      products: allProducts,
      category: this.category,
      searchQuery: this.searchQuery,
      size: this.selectedSize,
      color: this.selectedColor,
      maxPrice: this.maxPrice,
      onlySeasonal: this.onlySeasonal,
      vipUnlocked: this.vipUnlocked,
      vipProduct
    });

    const vms = filteredProducts.map(p => {
      const opts = this.cardOptions.get(p.id) || { size: p.sizes[0], colorIdx: 0, slideIdx: 0 };
      return ProductPresenter.toCardViewModel(p, opts);
    });

    if (this.domRenderer) {
      this.domRenderer.renderCatalog(vms, {
        isFiltered: this.category !== 'TODOS' || Boolean(this.searchQuery) || Boolean(this.selectedSize) || Boolean(this.selectedColor) || this.onlySeasonal,
        activeCategory: this.category
      });
    }

    return vms;
  }

  setCategory(cat) {
    this.category = cat;
    this.onlySeasonal = false;
    return this.filterAndRender();
  }

  setSeasonalOnly(isSeasonal = true) {
    this.onlySeasonal = isSeasonal;
    if (isSeasonal) this.category = 'TODOS';
    return this.filterAndRender();
  }

  setSearchQuery(query) {
    this.searchQuery = query;
    return this.filterAndRender();
  }

  setSize(size) {
    this.selectedSize = this.selectedSize === size ? null : size;
    return this.filterAndRender();
  }

  setColor(color) {
    this.selectedColor = this.selectedColor === color ? null : color;
    return this.filterAndRender();
  }

  setMaxPrice(price) {
    this.maxPrice = Number(price);
    return this.filterAndRender();
  }

  resetFilters() {
    this.category = 'TODOS';
    this.searchQuery = '';
    this.selectedSize = null;
    this.selectedColor = null;
    this.maxPrice = 220000;
    this.onlySeasonal = false;
    return this.filterAndRender();
  }

  selectCardSize(productId, size) {
    const current = this.cardOptions.get(productId) || { size, colorIdx: 0, slideIdx: 0 };
    current.size = size;
    this.cardOptions.set(productId, current);
  }

  selectCardColor(productId, colorIdx) {
    const current = this.cardOptions.get(productId) || { size: null, colorIdx, slideIdx: 0 };
    current.colorIdx = colorIdx;
    current.slideIdx = 0;
    this.cardOptions.set(productId, current);
    return this.filterAndRender();
  }

  async getQuickViewModel(productId) {
    const product = await this.productRepo.getById(productId);
    if (!product) return null;
    const opts = this.cardOptions.get(productId) || { size: product.sizes[0], colorIdx: 0, slideIdx: 0 };
    return ProductPresenter.toQuickViewViewModel(product, opts);
  }
}

