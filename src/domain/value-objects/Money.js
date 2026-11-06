/**
 * Value Object: Money (COP Currency)
 * Encapsulates monetary values and arithmetic rules.
 * Strictly immutable - enterprise business rules.
 */
export class Money {
  constructor(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new TypeError(`Money amount must be a valid number, got ${amount}`);
    }
    this._amount = Math.max(0, Math.round(amount));
  }

  get amount() {
    return this._amount;
  }

  add(other) {
    const otherAmount = other instanceof Money ? other.amount : other;
    return new Money(this._amount + otherAmount);
  }

  subtract(other) {
    const otherAmount = other instanceof Money ? other.amount : other;
    return new Money(Math.max(0, this._amount - otherAmount));
  }

  multiply(factor) {
    return new Money(Math.round(this._amount * factor));
  }

  percentage(percent) {
    const pct = Math.max(0, Math.min(100, percent));
    return new Money(Math.round((this._amount * pct) / 100));
  }

  equals(other) {
    if (!(other instanceof Money)) return false;
    return this._amount === other.amount;
  }

  toString() {
    return `$${this._amount.toLocaleString('es-CO')} COP`;
  }
}

