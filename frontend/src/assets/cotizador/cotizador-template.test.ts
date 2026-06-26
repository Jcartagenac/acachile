import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

const templatePath = path.resolve(__dirname, 'cotizador-template.html');

async function loadTemplateDom() {
  const html = fs.readFileSync(templatePath, 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://example.com',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => true;
      Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value: () => ({}),
      });
    },
  });

  await new Promise<void>((resolve) => {
    dom.window.addEventListener('DOMContentLoaded', () => setTimeout(resolve, 0));
  });

  return dom;
}

describe('cotizador template resetForm', () => {
  it('loads with blank fields and starter rows', async () => {
    const dom = await loadTemplateDom();
    const { document } = dom.window;

    expect(document.getElementById('event-name')!.value).toBe('');
    expect(document.getElementById('event-date')!.value).toBe('');
    expect(document.getElementById('quote-number')!.value).toBe('');
    expect(document.getElementById('guests')!.value).toBe('');
    expect(document.getElementById('margin')!.value).toBe('');
    expect(document.getElementById('factor-carbon')!.value).toBe('');
    expect(document.getElementById('factor-lena')!.value).toBe('');

    expect(document.querySelectorAll('#proteins-table tbody tr')).toHaveLength(1);
    expect(document.querySelector<HTMLInputElement>('.protein-name')!.value).toBe('');
    expect(document.querySelectorAll('#combustibles-table tbody tr')).toHaveLength(1);
    expect(document.querySelectorAll('#equipos-table tbody tr')).toHaveLength(1);
    expect(document.querySelectorAll('#insumos-table tbody tr')).toHaveLength(1);
  });

  it('clears the form when clicking the reset button', async () => {
    const dom = await loadTemplateDom();
    const { document } = dom.window;

    document.getElementById('event-name')!.value = 'Evento grande';
    document.getElementById('event-date')!.value = '2026-12-31';
    document.getElementById('quote-number')!.value = '1234';
    document.getElementById('guests')!.value = '88';
    document.getElementById('margin')!.value = '42';
    document.getElementById('logistics-transport')!.value = '123456';
    document.getElementById('contingency-percent')!.value = '11';
    document.getElementById('event-comments')!.value = 'Observaciones';
    document.getElementById('factor-carbon')!.value = '9.9';
    document.getElementById('factor-lena')!.value = '7.7';
    document.querySelector<HTMLInputElement>('.protein-name')!.value = 'Corte X';
    document.querySelector<HTMLInputElement>('.protein-net-grams')!.value = '999';

    dom.window.updateCalculations();
    document.getElementById('reset-form-btn')!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

    expect(document.getElementById('event-name')!.value).toBe('');
    expect(document.getElementById('event-date')!.value).toBe('');
    expect(document.getElementById('quote-number')!.value).toBe('');
    expect(document.getElementById('guests')!.value).toBe('');
    expect(document.getElementById('margin')!.value).toBe('');
    expect(document.getElementById('logistics-transport')!.value).toBe('');
    expect(document.getElementById('contingency-percent')!.value).toBe('');
    expect(document.getElementById('event-comments')!.value).toBe('');
    expect(document.getElementById('factor-carbon')!.value).toBe('');
    expect(document.getElementById('factor-lena')!.value).toBe('');

    expect(document.querySelectorAll('#proteins-table tbody tr')).toHaveLength(1);
    expect(document.querySelector<HTMLInputElement>('.protein-name')!.value).toBe('');
    expect(document.querySelectorAll('#combustibles-table tbody tr')).toHaveLength(1);
    expect(document.querySelectorAll('#equipos-table tbody tr')).toHaveLength(1);
    expect(document.querySelectorAll('#insumos-table tbody tr')).toHaveLength(1);
  });
});
