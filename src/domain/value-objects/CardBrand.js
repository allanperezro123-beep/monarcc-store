/**
 * Value Object: CardBrand
 * Reglas de negocio por franquicia: prefijos (IIN/BIN), longitudes válidas,
 * agrupación visual y longitud del código de seguridad.
 * Dominio puro: sin DOM, sin frameworks.
 */

const GAPS_4_4_4_4 = Object.freeze([4, 8, 12, 16]);
const GAPS_4_6_5 = Object.freeze([4, 10]);

const BRANDS = Object.freeze([
  Object.freeze({ id: 'amex', name: 'AMEX', pattern: /^3[47]/, lengths: [15], gaps: GAPS_4_6_5, cvvLength: 4 }),
  Object.freeze({ id: 'diners', name: 'DINERS', pattern: /^(?:36|38|39|30[0-5])/, lengths: [14], gaps: GAPS_4_6_5, cvvLength: 3 }),
  Object.freeze({ id: 'visa', name: 'VISA', pattern: /^4/, lengths: [16, 19], gaps: GAPS_4_4_4_4, cvvLength: 3 }),
  Object.freeze({
    id: 'mastercard',
    name: 'MASTERCARD',
    // 51–55 y la serie 2221–2720
    pattern: /^(?:5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/,
    lengths: [16],
    gaps: GAPS_4_4_4_4,
    cvvLength: 3
  }),
  Object.freeze({ id: 'discover', name: 'DISCOVER', pattern: /^(?:6011|65|64[4-9])/, lengths: [16, 19], gaps: GAPS_4_4_4_4, cvvLength: 3 })
]);

const UNKNOWN = Object.freeze({
  id: 'unknown',
  name: '',
  pattern: null,
  lengths: [13, 14, 15, 16, 17, 18, 19],
  gaps: GAPS_4_4_4_4,
  cvvLength: null
});

export class CardBrand {
  /**
   * @param {string} digits Solo dígitos (puede ser un prefijo parcial).
   * @returns {{id:string,name:string,lengths:number[],gaps:readonly number[],cvvLength:number|null,maxLength:number}}
   */
  static detect(digits) {
    const value = String(digits ?? '');
    const found = BRANDS.find((brand) => brand.pattern.test(value)) || UNKNOWN;
    return { ...found, maxLength: Math.max(...found.lengths) };
  }
}
