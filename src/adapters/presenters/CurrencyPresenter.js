import { Money } from '../../domain/value-objects/Money.js';

/**
 * Presenter: CurrencyPresenter
 * Formats monetary amounts into Colombian Peso strings.
 */
export class CurrencyPresenter {
  static format(val) {
    const amount = val instanceof Money ? val.amount : (Number(val) || 0);
    return `$${amount.toLocaleString('es-CO')}`;
  }

  static formatWithCurrency(val) {
    return `${CurrencyPresenter.format(val)} COP`;
  }
}

