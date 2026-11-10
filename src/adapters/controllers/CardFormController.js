import { CardBrand } from '../../domain/value-objects/CardBrand.js';
import { CardValidator } from '../../domain/services/CardValidator.js';
import { CardInputPresenter } from '../presenters/CardInputPresenter.js';

/**
 * Controller: CardFormController
 * Estado y reglas de interacción del formulario de tarjeta, SIN DOM.
 *
 *  - Aplica máscaras (vía CardInputPresenter) y valida (vía CardValidator).
 *  - Política de errores "recompensa temprana, castiga tarde": mientras el
 *    usuario escribe NO se muestran errores de campo incompleto; sí se muestran
 *    al salir del campo (blur) y de inmediato los errores definitivos
 *    (Luhn, tarjeta vencida, mes inválido).
 *  - Candado anti doble cobro: la fase pasa a 'inflight' de forma SÍNCRONA en
 *    submit(), antes de cualquier await.
 *
 * El puerto `submitPayment` recibe solo datos mínimos (marca, últimos 4,
 * titular y vencimiento). El PAN completo y el CVV nunca salen de este objeto:
 * una integración real debe tokenizarlos con el SDK/campos alojados del PSP.
 */

export const CARD_FIELDS = Object.freeze(['number', 'holder', 'expiry', 'cvv']);

// Errores que no se arreglan "escribiendo más": se informan de inmediato.
const DEFINITIVE_CODES = new Set(['luhn', 'expired', 'month', 'year']);

const GENERIC_PAYMENT_ERROR = 'No se pudo procesar el pago. Intenta de nuevo.';

const emptyValues = () => ({ number: '', holder: '', expiry: '', cvv: '' });
const emptyErrors = () => ({ number: '', holder: '', expiry: '', cvv: '' });

export class CardFormController {
  #submitPayment;
  #now;
  #values = emptyValues();
  #errors = emptyErrors();
  #touched = new Set();
  /** 'idle' | 'inflight' | 'paid' */
  #phase = 'idle';

  /**
   * @param {{submitPayment: (details:{brand:string,last4:string,holder:string,expiry:string}) => Promise<{success:boolean,error?:string}>,
   *          now?: () => Date}} deps
   */
  constructor({ submitPayment, now = () => new Date() }) {
    this.#submitPayment = submitPayment;
    this.#now = now;
  }

  get #brand() {
    return CardBrand.detect(this.#values.number.replace(/\s/g, ''));
  }

  get #cvvMaxLength() {
    return this.#brand.cvvLength ?? 4;
  }

  view() {
    const brand = this.#brand;
    return {
      values: { ...this.#values },
      errors: { ...this.#errors },
      brand: { id: brand.id, name: brand.name },
      cvvMaxLength: this.#cvvMaxLength,
      submitting: this.#phase !== 'idle'
    };
  }

  input(field, raw, { deleting = false } = {}) {
    if (!CARD_FIELDS.includes(field) || this.#phase !== 'idle') return this.view();

    switch (field) {
      case 'number':
        this.#values.number = CardInputPresenter.formatNumber(raw);
        // La marca puede cambiar el largo del CVV.
        this.#values.cvv = CardInputPresenter.sanitizeCvv(this.#values.cvv, this.#cvvMaxLength);
        if (this.#touched.has('cvv')) this.#refresh('cvv');
        break;
      case 'holder':
        this.#values.holder = CardInputPresenter.sanitizeHolder(raw);
        break;
      case 'expiry':
        this.#values.expiry = CardInputPresenter.formatExpiry(raw, { deleting });
        break;
      case 'cvv':
        this.#values.cvv = CardInputPresenter.sanitizeCvv(raw, this.#cvvMaxLength);
        break;
    }

    this.#refresh(field);
    return this.view();
  }

  blur(field) {
    if (!CARD_FIELDS.includes(field) || this.#phase !== 'idle') return this.view();

    if (field === 'holder') this.#values.holder = this.#values.holder.trim();
    this.#touched.add(field);
    this.#refresh(field);
    return this.view();
  }

  /**
   * @returns {Promise<{status:'invalid',field:string}|{status:'busy'}|{status:'success',result:object}|{status:'failed',error:string}>}
   */
  async submit() {
    if (this.#phase !== 'idle') return { status: 'busy' };

    for (const field of CARD_FIELDS) {
      this.#touched.add(field);
      this.#refresh(field);
    }
    const firstInvalid = CARD_FIELDS.find((field) => !this.#evaluate(field).valid);
    if (firstInvalid) return { status: 'invalid', field: firstInvalid };

    // Candado SÍNCRONO: ningún segundo submit puede colarse durante el await.
    this.#phase = 'inflight';
    const digits = this.#values.number.replace(/\s/g, '');
    const details = {
      brand: this.#brand.id,
      last4: digits.slice(-4),
      holder: this.#values.holder.trim(),
      expiry: this.#values.expiry
    };

    try {
      const result = await this.#submitPayment(details);
      if (result && result.success) {
        this.#phase = 'paid'; // sigue bloqueado hasta reset()
        return { status: 'success', result };
      }
      this.#phase = 'idle';
      return { status: 'failed', error: result?.error || GENERIC_PAYMENT_ERROR };
    } catch {
      this.#phase = 'idle';
      return { status: 'failed', error: GENERIC_PAYMENT_ERROR };
    }
  }

  /** Borra datos sensibles. Se ignora mientras hay un pago en vuelo. */
  reset() {
    if (this.#phase === 'inflight') return;
    this.#values = emptyValues();
    this.#errors = emptyErrors();
    this.#touched = new Set();
    this.#phase = 'idle';
  }

  #evaluate(field) {
    switch (field) {
      case 'number':
        return CardValidator.validateNumber(this.#values.number);
      case 'holder':
        return CardValidator.validateHolder(this.#values.holder);
      case 'expiry':
        return CardValidator.validateExpiry(this.#values.expiry, this.#now());
      default:
        return CardValidator.validateCvv(this.#values.cvv, this.#brand);
    }
  }

  #refresh(field) {
    const { valid, code } = this.#evaluate(field);
    const visible = !valid && (this.#touched.has(field) || DEFINITIVE_CODES.has(code));
    this.#errors[field] = visible ? CardInputPresenter.errorMessage(field, code) : '';
  }
}
