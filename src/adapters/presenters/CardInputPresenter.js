import { CardBrand } from '../../domain/value-objects/CardBrand.js';

/**
 * Presenter: CardInputPresenter
 * Máscaras, filtros de entrada y mensajes de error del formulario de tarjeta.
 * Funciones puras: reciben texto crudo del usuario y devuelven texto listo
 * para mostrar. No tocan el DOM.
 */

const HOLDER_MAX_LENGTH = 26; // límite físico de embozado en tarjetas ISO/IEC 7811

const MESSAGES = Object.freeze({
  number: {
    required: 'Ingresa el número de tu tarjeta.',
    incomplete: 'El número está incompleto.',
    luhn: 'Número de tarjeta no válido.'
  },
  holder: {
    required: 'Ingresa el nombre del titular.',
    short: 'Escribe el nombre completo.'
  },
  expiry: {
    required: 'Ingresa el vencimiento.',
    incomplete: 'Usa el formato MM/AA.',
    month: 'El mes debe estar entre 01 y 12.',
    expired: 'La tarjeta está vencida.',
    year: 'El año no es válido.'
  },
  cvv: {
    required: 'Ingresa el código CVV.',
    incomplete: 'CVV incompleto.'
  }
});

const onlyDigits = (value) => String(value ?? '').replace(/[^0-9]/g, '');

export class CardInputPresenter {
  /** "4111-abc1111…" → "4111 1111 1111 1111" (4-4-4-4, o 4-6-5 en Amex). */
  static formatNumber(raw) {
    const all = onlyDigits(raw);
    const brand = CardBrand.detect(all);
    const digits = all.slice(0, brand.maxLength);

    let out = '';
    for (let i = 0; i < digits.length; i += 1) {
      if (brand.gaps.includes(i)) out += ' ';
      out += digits[i];
    }
    return out;
  }

  /**
   * Máscara MM/AA que impide meses fuera de 01–12.
   * @param {string} raw
   * @param {{deleting?: boolean}} [opts] Con deleting=true no reinserta la barra
   *        (si no, borrar "12/" volvería a "12/" y el usuario quedaría atrapado).
   */
  static formatExpiry(raw, { deleting = false } = {}) {
    let month = '';
    let rest = '';

    for (const ch of onlyDigits(raw)) {
      if (month.length === 0) {
        month = ch > '1' ? `0${ch}` : ch; // 2–9 → 02–09
      } else if (month.length === 1) {
        const candidate = month + ch;
        if (candidate >= '01' && candidate <= '12') month = candidate; // si no, se descarta el dígito
      } else {
        rest += ch;
      }
    }

    const year = rest.slice(0, 2);
    if (year) return `${month}/${year}`;
    return month.length === 2 && !deleting ? `${month}/` : month;
  }

  /** Letras (con tildes/ñ), espacios, apóstrofo y guion, en mayúsculas. */
  static sanitizeHolder(raw) {
    return String(raw ?? '')
      .normalize('NFC')
      .replace(/[’ʼ]/g, "'") // apóstrofo tipográfico de teclados móviles
      .replace(/\s+/g, ' ')
      .replace(/[^\p{L} '-]/gu, '')
      .replace(/ {2,}/g, ' ')
      .replace(/^ /, '')
      .toUpperCase()
      .slice(0, HOLDER_MAX_LENGTH);
  }

  static sanitizeCvv(raw, maxLength = 4) {
    return onlyDigits(raw).slice(0, maxLength);
  }

  /** @returns {string} Mensaje en español, o '' si no hay error. */
  static errorMessage(field, code) {
    if (!code) return '';
    return MESSAGES[field]?.[code] ?? 'Revisa este campo.';
  }
}
