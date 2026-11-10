import { CARD_FIELDS } from '../../adapters/controllers/CardFormController.js';
import { CardInputPresenter } from '../../adapters/presenters/CardInputPresenter.js';

/**
 * Infrastructure (DOM): CardFormView
 * Enlaza el formulario #card-form con CardFormController. No contiene reglas de
 * negocio: captura eventos, delega, y PINTA el snapshot que devuelve el controlador.
 *
 * Responsabilidades propias del DOM:
 *  - Preservar el cursor cuando la máscara reescribe el valor (insertar/borrar en medio).
 *  - Respetar IME / teclas muertas (no sanitizar mientras `isComposing`).
 *  - Foco: entra al abrir, vuelve al disparador al cerrar, Escape cierra.
 *  - Limpiar datos sensibles al cerrar el modal por cualquier vía.
 */

const FIELD_IDS = Object.freeze({
  number: 'card-number',
  holder: 'card-holder',
  expiry: 'card-expiry',
  cvv: 'card-cvv'
});

const LABEL_IDLE = 'CONFIRMAR PAGO SEGURO';
const LABEL_BUSY = 'PROCESANDO PAGO…';

const countDigits = (text) => (text.match(/\d/g) || []).length;

/** Índice justo después del n-ésimo dígito de `value` (0 si n = 0). */
function indexAfterDigit(value, n) {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (/\d/.test(value[i])) {
      seen += 1;
      if (seen === n) return i + 1;
    }
  }
  return value.length;
}

export class CardFormView {
  #modal;
  #form;
  #controller;
  #onPaid;
  #onFailed;
  #inputs = {};
  #errorEls = {};
  #brandEl;
  #statusEl;
  #submitBtn;
  #submitLabel;
  #revealBtn;
  #observer = null;
  #wasOpen = false;
  #returnFocusTo = null;

  /**
   * @param {{modal: HTMLElement, form: HTMLFormElement, controller: import('../../adapters/controllers/CardFormController.js').CardFormController,
   *          onPaid: (result: object) => void, onFailed?: (message: string, ctx: {modalOpen: boolean}) => void}} deps
   */
  constructor({ modal, form, controller, onPaid, onFailed }) {
    this.#modal = modal;
    this.#form = form;
    this.#controller = controller;
    this.#onPaid = onPaid;
    this.#onFailed = onFailed;
  }

  init() {
    if (!this.#form || !this.#modal) return this;

    for (const field of CARD_FIELDS) {
      const input = this.#form.querySelector(`#${FIELD_IDS[field]}`);
      this.#inputs[field] = input;
      this.#errorEls[field] = this.#form.querySelector(`#${FIELD_IDS[field]}-error`);
      if (!input) continue;

      input.addEventListener('input', (e) => this.#handleInput(field, e));
      input.addEventListener('compositionend', (e) => this.#handleInput(field, e));
      input.addEventListener('blur', () => this.render(this.#controller.blur(field)));
    }

    this.#brandEl = this.#form.querySelector('#card-brand');
    this.#statusEl = this.#form.querySelector('#card-form-status');
    this.#submitBtn = this.#form.querySelector('#card-submit');
    this.#submitLabel = this.#submitBtn?.querySelector('.pay-submit-label') ?? null;
    this.#revealBtn = this.#form.querySelector('#card-cvv-reveal');

    this.#form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.#handleSubmit();
    });
    this.#revealBtn?.addEventListener('click', () => this.#toggleReveal());
    this.#modal.addEventListener('keydown', (e) => this.#handleKeydown(e));

    // El modal se abre/cierra por varias vías (X, backdrop, éxito): observar la
    // clase es la única fuente de verdad que las cubre todas.
    this.#wasOpen = this.#modal.classList.contains('is-open');
    this.#observer = new MutationObserver(() => this.#syncOpenState());
    this.#observer.observe(this.#modal, { attributes: true, attributeFilter: ['class'] });

    this.render(this.#controller.view());
    return this;
  }

  destroy() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  /** Pinta el snapshot del controlador. Solo toca el DOM cuando algo cambió. */
  render(view) {
    for (const field of CARD_FIELDS) {
      const input = this.#inputs[field];
      if (!input) continue;

      if (input.value !== view.values[field]) input.value = view.values[field];

      const message = view.errors[field];
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (this.#errorEls[field] && this.#errorEls[field].textContent !== message) {
        this.#errorEls[field].textContent = message;
      }
    }

    if (this.#inputs.cvv) this.#inputs.cvv.maxLength = view.cvvMaxLength;
    if (this.#brandEl) this.#brandEl.textContent = view.brand.name;

    if (this.#submitBtn) {
      this.#submitBtn.disabled = view.submitting;
      this.#submitBtn.setAttribute('aria-busy', String(view.submitting));
    }
    if (this.#submitLabel) this.#submitLabel.textContent = view.submitting ? LABEL_BUSY : LABEL_IDLE;
    this.#form.setAttribute('aria-busy', String(view.submitting));
  }

  /** Limpia datos sensibles del DOM y del controlador (si no hay pago en vuelo). */
  reset() {
    this.#controller.reset();
    this.#setStatus('');
    this.#setReveal(false);
    this.render(this.#controller.view());
  }

  #handleInput(field, event) {
    if (event.isComposing) return;
    const input = this.#inputs[field];
    const previous = input.value;
    const caret = input.selectionStart;
    const deleting = typeof event.inputType === 'string' && event.inputType.startsWith('delete');

    this.render(this.#controller.input(field, previous, { deleting }));

    // La máscara reescribió el valor con el cursor en medio → recolocarlo.
    const rewritten = input.value !== previous;
    const caretInMiddle = caret !== null && caret < previous.length;
    if (rewritten && caretInMiddle && document.activeElement === input) {
      const position =
        field === 'holder'
          ? CardInputPresenter.sanitizeHolder(previous.slice(0, caret)).length
          : indexAfterDigit(input.value, countDigits(previous.slice(0, caret)));
      input.setSelectionRange(position, position);
    }
  }

  async #handleSubmit() {
    // submit() fija el candado de forma síncrona; pintar ANTES del await
    // deshabilita el botón y muestra el spinner en el mismo frame.
    const pending = this.#controller.submit();
    this.render(this.#controller.view());
    this.#setStatus('');

    const result = await pending;
    this.render(this.#controller.view());

    switch (result.status) {
      case 'invalid':
        this.#setStatus('Revisa los campos marcados.', 'error');
        this.#inputs[result.field]?.focus();
        break;
      case 'failed':
        this.#setStatus(result.error, 'error');
        this.#onFailed?.(result.error, { modalOpen: this.#modal.classList.contains('is-open') });
        break;
      case 'success':
        this.#onPaid?.(result.result);
        break;
      default:
        break; // 'busy': otro envío ya está en curso
    }
  }

  #handleKeydown(event) {
    if (event.key !== 'Escape' || this.#controller.view().submitting) return;
    this.#modal.querySelector('.pay-close')?.click();
  }

  #syncOpenState() {
    const open = this.#modal.classList.contains('is-open');
    if (open === this.#wasOpen) return;
    this.#wasOpen = open;

    if (open) {
      this.#returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      requestAnimationFrame(() => this.#inputs.number?.focus({ preventScroll: true }));
      return;
    }

    this.reset();
    this.#returnFocusTo?.focus?.({ preventScroll: true });
    this.#returnFocusTo = null;
  }

  #toggleReveal() {
    this.#setReveal(this.#inputs.cvv?.type === 'password');
  }

  #setReveal(visible) {
    if (!this.#inputs.cvv || !this.#revealBtn) return;
    this.#inputs.cvv.type = visible ? 'text' : 'password';
    this.#revealBtn.setAttribute('aria-pressed', String(visible));
    this.#revealBtn.setAttribute('aria-label', visible ? 'Ocultar CVV' : 'Mostrar CVV');
  }

  #setStatus(message, tone = 'info') {
    if (!this.#statusEl) return;
    this.#statusEl.textContent = message;
    this.#statusEl.hidden = !message;
    this.#statusEl.dataset.tone = tone;
  }
}
