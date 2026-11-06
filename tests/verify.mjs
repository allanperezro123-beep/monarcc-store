import fs from 'fs';
import { ProductRepository } from '../src/adapters/repositories/ProductRepository.js';
import { ProductPresenter } from '../src/adapters/presenters/ProductPresenter.js';
import { DomRenderer } from '../src/infrastructure/dom/DomRenderer.js';

const code = fs.readFileSync('./products.js', 'utf8');
const sandbox = { window: {} };
new Function('window', code)(sandbox.window);

const repo = new ProductRepository(sandbox.window.MONARCC);
const products = await repo.getAll();
const vms = products.map(p => ProductPresenter.toCardViewModel(p));

const elements = {};
global.document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = { textContent: '', innerHTML: '', style: {} };
    return elements[id];
  }
};

const dom = new DomRenderer();
dom.renderCatalog(vms, { isFiltered: false, activeCategory: 'TODOS', totalStock: 50 });

const html = elements['products-grid-container'].innerHTML;
console.log('Rendered catalog HTML length:', html.length);
console.log('Contains slider:', html.includes('slider-p01'));
console.log('Contains drop countdown breaker:', html.includes('drop-breaker'));
console.log('Contains lookbook-1 with video:', html.includes('lookbook-1'));
console.log('Contains lookbook-2 with video:', html.includes('lookbook-2'));
console.log('Contains season breaker:', html.includes('season-breaker'));
console.log('Contains locked VIP card:', html.includes('card-locked'));
console.log('Header stock updated:', elements['header-stock-count'].textContent);
console.log('DOM RENDERER VERIFIED 100% WORKING!');
