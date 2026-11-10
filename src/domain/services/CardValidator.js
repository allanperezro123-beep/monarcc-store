import { CardBrand } from '../value-objects/CardBrand.js';

/**
 * Domain Service: CardValidator
 * Reglas de validación de tarjeta. Devuelve CÓDIGOS de error (no textos):
 * la presentación (idioma, tono) es responsabilidad de los adapters.
 *
 * Nota: la validación del cliente es solo UX. La autoridad es siempre el PSP.
 */

const MAX_YEARS_AHEAD = 20;
const MIN_HOLDER_LETTERS = 3;

const ok = () => ({ valid: true, code: null });
const fail = (code) => ({ valid: false, code });
const digitsOf = (value) => String(value ?? '').replace(/[^0-9]/g, '');

export class CardValidator {
  /** Algoritmo de Luhn (mod 10). */
  static luhn(digits) {
    const value = String(digits ?? '');
    if (!/^[0-9]+$/.test(value)) return false;

    let sum = 0;
    let double = false;
    for (let i = value.length - 1; i >= 0; i -= 1) {
      let d = value.charCodeAt(i) - 48;
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return sum % 10 === 0;
  }

  static validateNumber(raw) {
    const digits = digitsOf(raw);
    if (!digits) return fail('required');

    const brand = CardBrand.detect(digits);
    if (!brand.lengths.includes(digits.length)) return fail('incomplete');
    if (!CardValidator.luhn(digits)) return fail('luhn');
    return ok();
  }

  /**
   * @param {string} raw "MM/AA"
   * @param {Date} [now]
   */
  static validateExpiry(raw, now = new Date()) {
    const value = String(raw ?? '');
    if (!value) return fail('required');

    const match = /^(\d{2})\/(\d{2})$/.exec(value);
    if (!match) return fail('incomplete');

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) return fail('month');

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    // Una tarjeta es válida hasta el último día de su mes de vencimiento.
    if (year < currentYear || (year === currentYear && month < currentMonth)) return fail('expired');
    if (year > currentYear + MAX_YEARS_AHEAD) return fail('year');
    return ok();
  }

  /**
   * @param {string} raw
   * @param {{cvvLength:number|null}} brand Resultado de CardBrand.detect
   */
  static validateCvv(raw, brand) {
    const value = String(raw ?? '');
    if (!value) return fail('required');
    if (!/^[0-9]+$/.test(value)) return fail('incomplete');

    const expected = brand?.cvvLength ?? null;
    const valid = expected ? value.length === expected : value.length === 3 || value.length === 4;
    return valid ? ok() : fail('incomplete');
  }

  static validateHolder(raw) {
    const value = String(raw ?? '').trim();
    if (!value) return fail('required');

    const letters = value.replace(/[^\p{L}]/gu, '').length;
    return letters < MIN_HOLDER_LETTERS ? fail('short') : ok();
  }
}
