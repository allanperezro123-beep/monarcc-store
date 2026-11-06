import { CurrencyPresenter } from './CurrencyPresenter.js';

/**
 * Presenter: CartPresenter
 * Converts Cart aggregate & OrderTotals DTO into ready-to-render View Models.
 */
export class CartPresenter {
  static toDrawerViewModel(cart, orderTotals, appliedCouponsMap) {
    const items = cart.getItems().map(it => ({
      key: it.key,
      productId: it.productId,
      name: it.name,
      size: it.size,
      colorName: it.colorName,
      img: it.img,
      qty: it.qty,
      maxStock: it.maxStock,
      unitPriceFormatted: CurrencyPresenter.format(it.price),
      realPriceFormatted: CurrencyPresenter.format(it.realPrice),
      subtotalFormatted: CurrencyPresenter.formatWithCurrency(it.getSubtotal()),
      savingsFormatted: CurrencyPresenter.format(it.getSavings()),
      hasSavings: it.getSavings().amount > 0
    }));

    const coupons = Array.from(appliedCouponsMap.values()).map(c => ({
      code: c.code,
      label: c.label,
      percent: c.percent
    }));

    return {
      totalQty: cart.getTotalQty(),
      isEmpty: cart.isEmpty(),
      items,
      coupons,
      subtotalFormatted: CurrencyPresenter.formatWithCurrency(orderTotals.subtotal),
      savingsFormatted: CurrencyPresenter.formatWithCurrency(orderTotals.savings),
      discountFormatted: `-${CurrencyPresenter.formatWithCurrency(orderTotals.discountAmount)}`,
      hasDiscount: orderTotals.discountAmount.amount > 0,
      shippingCostFormatted: orderTotals.isFreeShipping
        ? 'GRATIS'
        : CurrencyPresenter.formatWithCurrency(orderTotals.shippingCost),
      isFreeShipping: orderTotals.isFreeShipping,
      freeShippingRemainingFormatted: CurrencyPresenter.formatWithCurrency(orderTotals.freeShippingRemaining),
      shippingZone: orderTotals.shippingZone,
      shippingDays: orderTotals.shippingDays,
      grandTotalFormatted: CurrencyPresenter.formatWithCurrency(orderTotals.grandTotal),
      grandTotalAmount: orderTotals.grandTotal.amount
    };
  }
}

