import { CurrencyPresenter } from './CurrencyPresenter.js';

/**
 * Presenter: ProductPresenter
 * Converts Domain Product entities into formatted View Models.
 */
export class ProductPresenter {
  static toCardViewModel(product, options = {}) {
    const colorIdx = options.colorIdx || 0;
    const activeColor = product.getColor(colorIdx);
    const activeSize = options.size || product.sizes[0];
    const discountPct = product.getDiscountPercentage();

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      priceFormatted: CurrencyPresenter.formatWithCurrency(product.price),
      realPriceFormatted: CurrencyPresenter.format(product.realPrice),
      hasDiscount: discountPct > 0,
      discountPct: `-${discountPct}%`,
      isSeasonal: product.isSeasonal(),
      fabric: product.fabric,
      description: product.description,
      isVip: product.isVip,
      activeColor,
      activeSize,
      allSizes: product.sizes,
      allColors: product.colors.map((c, i) => ({
        ...c,
        isActive: i === colorIdx
      })),
      stockFormatted: activeColor.stock === 1 ? '1 UNIDAD DISPONIBLE' : `${activeColor.stock} UDS EN STOCK`,
      isLowStock: activeColor.stock <= 2
    };
  }

  static toQuickViewViewModel(product, options = {}) {
    const cardVm = ProductPresenter.toCardViewModel(product, options);
    const slides = [
      { pos: product.main.pos, zoom: product.main.zoom, label: 'Plano General' },
      ...product.views
    ];

    return {
      ...cardVm,
      slides,
      activeSlideIdx: options.slideIdx || 0
    };
  }
}

