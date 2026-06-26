import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

const templatePath = path.resolve(
  __dirname,
  'cotizador-template.html',
);

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
        value: () => ({})
      });
    },
  });

  await new Promise<void>((resolve) => {
    dom.window.addEventListener('DOMContentLoaded', () => setTimeout(resolve, 0));
  });

  return dom;
}

describe('cotizador template resetForm', () => {
  it('restores the default state and rows when clearing the form', async () => {
    const dom = await loadTemplateDom();
    const { document } = dom.window;

    document.getElementById('event-name')!.value = 'Evento grande';
    document.getElementById('event-date')!.value = '2026-12-31';
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
    dom.window.resetForm();

    expect(document.getElementById('event-name')!.value).toBe('');
    expect(document.getElementById('guests')!.value).toBe('30');
    expect(document.getElementById('margin')!.value).toBe('30');
    expect(document.getElementById('logistics-transport')!.value).toBe('0');
    expect(document.getElementById('contingency-percent')!.value).toBe('5');
    expect(document.getElementById('event-comments')!.value).toBe('');
    expect(document.getElementById('factor-carbon')!.value).toBe('1.2');
    expect(document.getElementById('factor-lena')!.value).toBe('1');

    expect(document.querySelectorAll('#proteins-table tbody tr')).toHaveLength(2);
    expect(document.querySelector<HTMLInputElement>('.protein-name')!.value).toBe('Lomo Vetado');
    expect(document.querySelector<HTMLInputElement>('.protein-net-grams')!.value).toBe('300');
    expect(document.querySelectorAll('#combustibles-table tbody tr')).toHaveLength(1);
    expect(document.querySelectorAll('#equipos-table tbody tr')).toHaveLength(4);
    expect(document.querySelectorAll('#insumos-table tbody tr')).toHaveLength(2);

    expect(document.getElementById('event-comments')!.value).toBe('');
  });
});
