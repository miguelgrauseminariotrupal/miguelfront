import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import Markdown from 'react-markdown';
import { formatAgentMessage } from './formatAgentMessage.js';

test('separa áreas y opciones conservando la numeración visible del catálogo', () => {
  const input = 'Competencias disponibles: Arte y Cultura\n\n1. Aprecia manifestaciones\n2. Crea proyectos\n\nCiencia y Tecnología 3. Indaga mediante métodos científicos 4. Explica el mundo físico\n\nComunicación 6. Se comunica oralmente 7. Lee textos\n\nElige hasta 3 competencias.';
  const result = formatAgentMessage(input);
  const html = renderToStaticMarkup(createElement(Markdown, null, result));
  assert.match(html, /<h3>Arte y Cultura<\/h3>/);
  assert.match(html, /<h3>Ciencia y Tecnología<\/h3>/);
  assert.match(html, /<ol start="3">/);
  assert.match(html, /<ol start="6">/);
  assert.equal((html.match(/<li>/g) || []).length, 6);
  assert.match(html, /Elige hasta 3 competencias/);
  assert.equal(formatAgentMessage(result), result);
});

test('respeta Markdown existente, código y respuestas ajenas al catálogo', () => {
  for (const text of ['Promedio: 14.5. Hay 3 alumnos.', '## Competencias disponibles\n\n### Matemática\n\n21. Resuelve problemas\n22. Modela cambios', 'Competencias disponibles\n\n```\nMatemática 21. Cantidad 22. Cambio\n```']) {
    assert.equal(formatAgentMessage(text), text);
  }
});
