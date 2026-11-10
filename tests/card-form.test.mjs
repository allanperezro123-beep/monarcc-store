import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CardBrand } from '../src/domain/value-objects/CardBrand.js';
import { CardValidator } from '../src/domain/services/CardValidator.js';
import { CardInputPresenter } from '../src/adapters/presenters/CardInputPresenter.js';
import { CardFormController } from '../src/adapters/controllers/CardFormController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// "Hoy" fijo para que las reglas de vencimiento sean deterministas.
const NOW = new Date(2026, 10, 10); // 10-nov-2026

const VISA = '4111111111111111';
const MASTERCARD = '5555555555554444';
const AMEX = '378282246310005';
const DINERS = '30569309025904';
const DISCOVER = '6011111111111117';

/* ------------------------------------------------------------------ */
/* DOMAIN: CardBrand + CardValidator                                  */
/* ------------------------------------------------------------------ */

test('CardBrand.detect identifica franquicias por prefijo', () => {
  assert.equal(CardBrand.detect(VISA).id, 'visa');
  assert.equal(CardBrand.detect(MASTERCARD).id, 'mastercard');
  assert.equal(CardBrand.detect('2221000000000009').id, 'mastercard');
  assert.equal(CardBrand.detect('2720990000000007').id, 'mastercard');
  assert.equal(CardBrand.detect(AMEX).id, 'amex');
  assert.equal(CardBrand.detect(DINERS).id, 'diners');
  assert.equal(CardBrand.detect(DISCOVER).id, 'discover');
  assert.equal(CardBrand.detect('9999').id, 'unknown');
  assert.equal(CardBrand.detect('').id, 'unknown');
});

test('CardBrand expone longitud máxima y CVV por franquicia', () => {
  assert.equal(CardBrand.detect(VISA).maxLength, 19);
  assert.equal(CardBrand.detect(AMEX).maxLength, 15);
  assert.equal(CardBrand.detect(AMEX).cvvLength, 4);
  assert.equal(CardBrand.detect(VISA).cvvLength, 3);
  assert.equal(CardBrand.detect('').cvvLength, null);
  assert.equal(CardBrand.detect('').maxLength, 19);
});

test('Luhn acepta números válidos y rechaza alterados', () => {
  for (const n of [VISA, MASTERCARD, AMEX, DINERS, DISCOVER]) {
    assert.equal(CardValidator.luhn(n), true, `${n} debería pasar Luhn`);
  }
  assert.equal(CardValidator.luhn('4111111111111112'), false);
  assert.equal(CardValidator.luhn(''), false);
  assert.equal(CardValidator.luhn('abcd'), false);
});

test('validateNumber devuelve códigos de error accionables', () => {
  assert.deepEqual(CardValidator.validateNumber(''), { valid: false, code: 'required' });
  assert.deepEqual(CardValidator.validateNumber('4111 1111'), { valid: false, code: 'incomplete' });
  assert.deepEqual(CardValidator.validateNumber('4111111111111112'), { valid: false, code: 'luhn' });
  assert.deepEqual(CardValidator.validateNumber('4111 1111 1111 1111'), { valid: true, code: null });
  assert.deepEqual(CardValidator.validateNumber(AMEX), { valid: true, code: null });
});

test('validateNumber: franquicia desconocida acepta 13–19 dígitos con Luhn válido', () => {
  assert.equal(CardValidator.validateNumber('9999999999999995').valid, CardValidator.luhn('9999999999999995'));
  assert.equal(CardValidator.validateNumber('99999').code, 'incomplete');
});

test('validateExpiry: formato, mes, vencida y rango máximo', () => {
  assert.deepEqual(CardValidator.validateExpiry('', NOW), { valid: false, code: 'required' });
  assert.deepEqual(CardValidator.validateExpiry('1', NOW), { valid: false, code: 'incomplete' });
  assert.deepEqual(CardValidator.validateExpiry('12/2', NOW), { valid: false, code: 'incomplete' });
  assert.deepEqual(CardValidator.validateExpiry('13/27', NOW), { valid: false, code: 'month' });
  assert.deepEqual(CardValidator.validateExpiry('00/27', NOW), { valid: false, code: 'month' });
  assert.deepEqual(CardValidator.validateExpiry('10/26', NOW), { valid: false, code: 'expired' });
  assert.deepEqual(CardValidator.validateExpiry('12/25', NOW), { valid: false, code: 'expired' });
  assert.deepEqual(CardValidator.validateExpiry('11/26', NOW), { valid: true, code: null }, 'el mes en curso sigue vigente');
  assert.deepEqual(CardValidator.validateExpiry('12/26', NOW), { valid: true, code: null });
  assert.deepEqual(CardValidator.validateExpiry('01/46', NOW), { valid: true, code: null });
  assert.deepEqual(CardValidator.validateExpiry('01/47', NOW), { valid: false, code: 'year' });
});

test('validateCvv: longitud exacta según franquicia, 3 o 4 si aún no hay tarjeta', () => {
  const visa = CardBrand.detect(VISA);
  const amex = CardBrand.detect(AMEX);
  const none = CardBrand.detect('');
  assert.deepEqual(CardValidator.validateCvv('', visa), { valid: false, code: 'required' });
  assert.deepEqual(CardValidator.validateCvv('12', visa), { valid: false, code: 'incomplete' });
  assert.deepEqual(CardValidator.validateCvv('123', visa), { valid: true, code: null });
  assert.deepEqual(CardValidator.validateCvv('1234', visa), { valid: false, code: 'incomplete' });
  assert.deepEqual(CardValidator.validateCvv('123', amex), { valid: false, code: 'incomplete' });
  assert.deepEqual(CardValidator.validateCvv('1234', amex), { valid: true, code: null });
  assert.equal(CardValidator.validateCvv('123', none).valid, true);
  assert.equal(CardValidator.validateCvv('1234', none).valid, true);
  assert.equal(CardValidator.validateCvv('12', none).valid, false);
});

test('validateHolder: requerido y mínimo de letras', () => {
  assert.deepEqual(CardValidator.validateHolder(''), { valid: false, code: 'required' });
  assert.deepEqual(CardValidator.validateHolder('   '), { valid: false, code: 'required' });
  assert.deepEqual(CardValidator.validateHolder('AB'), { valid: false, code: 'short' });
  assert.deepEqual(CardValidator.validateHolder('ANA PÉREZ'), { valid: true, code: null });
});

/* ------------------------------------------------------------------ */
/* ADAPTER: CardInputPresenter (máscaras y filtros)                   */
/* ------------------------------------------------------------------ */

test('formatNumber: solo dígitos, agrupa 4-4-4-4 y respeta máximo 19', () => {
  assert.equal(CardInputPresenter.formatNumber('4111abcd-1111.1111 1111'), '4111 1111 1111 1111');
  assert.equal(CardInputPresenter.formatNumber('41111'), '4111 1');
  assert.equal(CardInputPresenter.formatNumber(''), '');
  assert.equal(CardInputPresenter.formatNumber('4'.repeat(30)), '4444 4444 4444 4444 444');
  assert.equal(CardInputPresenter.formatNumber('٤١٢٣'), '', 'dígitos no ASCII se bloquean');
});

test('formatNumber: Amex agrupa 4-6-5 y limita a 15; Diners 4-6-4', () => {
  assert.equal(CardInputPresenter.formatNumber('378282246310005999'), '3782 822463 10005');
  assert.equal(CardInputPresenter.formatNumber('30569309025904111'), '3056 930902 5904');
});

test('formatExpiry: máscara MM/AA, mes 01–12 forzado y borrado sin trabarse', () => {
  const f = CardInputPresenter.formatExpiry;
  assert.equal(f(''), '');
  assert.equal(f('1'), '1');
  assert.equal(f('0'), '0');
  assert.equal(f('2'), '02/', 'un primer dígito 2–9 se completa como 02–09');
  assert.equal(f('9'), '09/');
  assert.equal(f('13'), '1', 'mes 13 se bloquea');
  assert.equal(f('00'), '0', 'mes 00 se bloquea');
  assert.equal(f('12'), '12/');
  assert.equal(f('12', { deleting: true }), '12', 'al borrar no reinserta la barra');
  assert.equal(f('122'), '12/2');
  assert.equal(f('1225'), '12/25');
  assert.equal(f('12/25999'), '12/25');
  assert.equal(f('ab1c2/d2e5'), '12/25');
  assert.equal(f('/'), '');
});

test('sanitizeHolder: permite apóstrofo y guion (O\'BRIEN, ANA-MARIA) y normaliza ’ a \'', () => {
  const s = CardInputPresenter.sanitizeHolder;
  assert.equal(s("o'brien"), "O'BRIEN");
  assert.equal(s('ana-maría lópez'), 'ANA-MARÍA LÓPEZ');
  assert.equal(s('d’angelo'), "D'ANGELO", 'apóstrofo tipográfico de teclados móviles');
  assert.equal(s('a_b.c,d;e"f'), 'ABCDEF', 'el resto de símbolos sigue bloqueado');
});

test('sanitizeHolder: solo letras y espacios, mayúsculas, máx 26', () => {
  const s = CardInputPresenter.sanitizeHolder;
  assert.equal(s('ana pérez'), 'ANA PÉREZ');
  assert.equal(s('Ana123 <b>Pérez</b>!'), 'ANA BPÉREZB');
  assert.equal(s('  juan   nuñez '), 'JUAN NUÑEZ ', 'colapsa espacios y quita los iniciales');
  assert.equal(s('a'.repeat(40)).length, 26);
  assert.equal(s('😀🔥'), '');
});

test('sanitizeCvv: solo dígitos y longitud máxima', () => {
  assert.equal(CardInputPresenter.sanitizeCvv('1a2b3c4d5', 4), '1234');
  assert.equal(CardInputPresenter.sanitizeCvv('12345', 3), '123');
  assert.equal(CardInputPresenter.sanitizeCvv('abc', 4), '');
});

test('errorMessage: mensajes cortos en español por campo y código', () => {
  for (const [field, code] of [
    ['number', 'required'], ['number', 'incomplete'], ['number', 'luhn'],
    ['holder', 'required'], ['holder', 'short'],
    ['expiry', 'required'], ['expiry', 'incomplete'], ['expiry', 'month'], ['expiry', 'expired'], ['expiry', 'year'],
    ['cvv', 'required'], ['cvv', 'incomplete']
  ]) {
    const msg = CardInputPresenter.errorMessage(field, code);
    assert.ok(typeof msg === 'string' && msg.length > 0 && msg.length <= 48, `${field}:${code} → "${msg}"`);
  }
  assert.equal(CardInputPresenter.errorMessage('number', null), '');
});

/* ------------------------------------------------------------------ */
/* ADAPTER: CardFormController (estado, errores, anti doble cobro)     */
/* ------------------------------------------------------------------ */

function makeController(overrides = {}) {
  const calls = [];
  const controller = new CardFormController({
    now: () => NOW,
    submitPayment: async (details) => {
      calls.push(details);
      return { success: true, orderNumber: '#MNC-1234', guideNumber: '982041000000' };
    },
    ...overrides
  });
  return { controller, calls };
}

function fillValid(controller) {
  controller.input('number', VISA);
  controller.input('holder', 'ana perez');
  controller.input('expiry', '1228');
  controller.input('cvv', '123');
}

test('controller: input aplica máscaras y expone el snapshot', () => {
  const { controller } = makeController();
  const v = controller.input('number', '4111-1111 abcd 1111 1111');
  assert.equal(v.values.number, '4111 1111 1111 1111');
  assert.equal(v.brand.id, 'visa');
  assert.equal(controller.input('holder', 'ana ñ 9').values.holder, 'ANA Ñ ');
  assert.equal(controller.input('expiry', '1228').values.expiry, '12/28');
  assert.equal(controller.input('cvv', '12a3').values.cvv, '123');
});

test('controller: no molesta con errores "incompletos" hasta el blur', () => {
  const { controller } = makeController();
  let v = controller.input('number', '4111');
  assert.equal(v.errors.number, '', 'incompleto mientras escribe → sin error');
  v = controller.blur('number');
  assert.notEqual(v.errors.number, '', 'tras blur sí se informa');
  v = controller.input('number', '41111111');
  assert.notEqual(v.errors.number, '', 'ya tocado: sigue validando en vivo');
});

test('controller: errores definitivos aparecen de inmediato (Luhn, vencida)', () => {
  const { controller } = makeController();
  assert.notEqual(controller.input('number', '4111111111111112').errors.number, '');
  assert.equal(controller.input('number', VISA).errors.number, '', 'se limpia al corregir');
  assert.notEqual(controller.input('expiry', '1025').errors.expiry, '', 'vencida de inmediato');
  assert.equal(controller.input('expiry', '1228').errors.expiry, '');
});

test('controller: CVV se ajusta a la franquicia (Amex 4, Visa 3)', () => {
  const { controller } = makeController();
  controller.input('number', AMEX);
  assert.equal(controller.view().cvvMaxLength, 4);
  controller.input('cvv', '1234');
  assert.equal(controller.view().values.cvv, '1234');
  const v = controller.input('number', VISA);
  assert.equal(v.cvvMaxLength, 3);
  assert.equal(v.values.cvv, '123', 'recorta el CVV sobrante al cambiar de franquicia');
});

test('controller: submit inválido no llama al gateway y señala el primer campo', async () => {
  const { controller, calls } = makeController();
  const res = await controller.submit();
  assert.equal(res.status, 'invalid');
  assert.equal(res.field, 'number');
  assert.equal(calls.length, 0);
  assert.equal(controller.view().submitting, false);
  assert.notEqual(controller.view().errors.number, '');
  assert.notEqual(controller.view().errors.cvv, '');
});

test('controller: submit válido envía datos mínimos (sin PAN ni CVV) y bloquea', async () => {
  const { controller, calls } = makeController();
  fillValid(controller);
  const res = await controller.submit();
  assert.equal(res.status, 'success');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { brand: 'visa', last4: '1111', holder: 'ANA PEREZ', expiry: '12/28' });
  assert.equal(controller.view().submitting, true, 'tras éxito sigue bloqueado hasta reset()');
  assert.equal((await controller.submit()).status, 'busy');
  assert.equal(calls.length, 1);
});

test('controller: doble clic simultáneo cobra una sola vez', async () => {
  let release;
  const gate = new Promise((r) => { release = r; });
  const calls = [];
  const { controller } = makeController({
    submitPayment: async (d) => { calls.push(d); await gate; return { success: true }; }
  });
  fillValid(controller);
  const first = controller.submit();
  const second = controller.submit();
  assert.equal(controller.view().submitting, true, 'bloqueo síncrono antes de resolver');
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a.status, 'success');
  assert.equal(b.status, 'busy');
  assert.equal(calls.length, 1);
});

test('controller: si el pago falla (o lanza) se desbloquea para reintentar', async () => {
  let n = 0;
  const { controller } = makeController({
    submitPayment: async () => {
      n += 1;
      if (n === 1) return { success: false, error: 'Fondos insuficientes' };
      if (n === 2) throw new Error('network');
      return { success: true };
    }
  });
  fillValid(controller);
  const r1 = await controller.submit();
  assert.deepEqual([r1.status, r1.error], ['failed', 'Fondos insuficientes']);
  assert.equal(controller.view().submitting, false);
  const r2 = await controller.submit();
  assert.equal(r2.status, 'failed');
  assert.ok(r2.error.length > 0);
  assert.equal((await controller.submit()).status, 'success');
});

test('controller: reset limpia datos sensibles y desbloquea (salvo pago en vuelo)', async () => {
  const { controller } = makeController();
  fillValid(controller);
  await controller.submit();
  controller.reset();
  const v = controller.view();
  assert.deepEqual(v.values, { number: '', holder: '', expiry: '', cvv: '' });
  assert.equal(v.submitting, false);

  let release;
  const gate = new Promise((r) => { release = r; });
  const slow = makeController({ submitPayment: async () => { await gate; return { success: true }; } });
  fillValid(slow.controller);
  const pending = slow.controller.submit();
  slow.controller.reset();
  assert.equal(slow.controller.view().submitting, true, 'reset no libera un pago en vuelo');
  assert.equal(slow.controller.view().values.number, VISA.replace(/(\d{4})(?=\d)/g, '$1 '));
  release();
  await pending;
});

/* ------------------------------------------------------------------ */
/* UI contract: markup + CSS del modal                                */
/* ------------------------------------------------------------------ */

function cardModalHtml() {
  const html = read('index.html');
  const start = html.indexOf('<div class="modal" id="card-modal">');
  const end = html.indexOf('<!-- Checkout Success Modal -->');
  assert.ok(start > -1 && end > start, 'card-modal presente en index.html');
  return html.slice(start, end);
}

test('markup: atributos de teclado/autofill y labels asociados', () => {
  const m = cardModalHtml();
  const input = (id) => m.match(new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`))?.[0] ?? '';

  const number = input('card-number');
  assert.match(number, /inputmode="numeric"/);
  assert.match(number, /autocomplete="cc-number"/);

  const holder = input('card-holder');
  assert.match(holder, /autocomplete="cc-name"/);
  assert.match(holder, /autocapitalize="characters"/);

  const expiry = input('card-expiry');
  assert.match(expiry, /inputmode="numeric"/);
  assert.match(expiry, /autocomplete="cc-exp"/);

  const cvv = input('card-cvv');
  assert.match(cvv, /inputmode="numeric"/);
  assert.match(cvv, /autocomplete="cc-csc"/);
  assert.match(cvv, /type="password"/);

  for (const id of ['card-number', 'card-holder', 'card-expiry', 'card-cvv']) {
    assert.match(m, new RegExp(`<label[^>]*\\bfor="${id}"`), `label for=${id}`);
    assert.match(input(id), /aria-describedby="[^"]*"/, `${id} enlaza su helper/error`);
    assert.match(m, new RegExp(`id="${id}-error"`), `${id}-error existe`);
  }
});

test('markup: sin handler inline ni estilos fijos; diálogo accesible; botón con spinner', () => {
  const m = cardModalHtml();
  assert.doesNotMatch(m, /onsubmit=/, 'el submit lo gestiona CardFormView');
  assert.doesNotMatch(m, /\bwidth:\s*\d+px/i);
  assert.match(m, /role="dialog"/);
  assert.match(m, /aria-modal="true"/);
  assert.match(m, /aria-labelledby="card-modal-title"/);
  assert.match(m, /id="card-modal-title"/);
  assert.match(m, /<form[^>]*\bid="card-form"[^>]*\bnovalidate/);
  assert.match(m, /<button[^>]*type="submit"[^>]*>[\s\S]*pay-spinner[\s\S]*CONFIRMAR PAGO SEGURO/);
});

test('CSS: layout fluido sin anchos fijos y colapso a una columna', () => {
  const css = read('style.css');
  const start = css.indexOf('/* ---------- Card payment modal');
  assert.ok(start > -1, 'sección "Card payment modal" en style.css');
  const section = css.slice(start);

  assert.doesNotMatch(section, /(?<![-\w])(?:min-|max-)?width:\s*\d+px/, 'ningún width fijo en px en la sección');
  assert.match(section, /clamp\(/);
  assert.match(section, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,/);
  assert.match(section, /white-space:\s*normal/);
  assert.match(section, /overflow-wrap:\s*anywhere|word-break:\s*break-word/);
  assert.match(section, /\.pay-head/);
  assert.match(section, /prefers-reduced-motion/);
});
