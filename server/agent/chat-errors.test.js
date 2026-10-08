import assert from 'node:assert/strict';
import test from 'node:test';
import { chatErrorMessage } from './chat-errors.js';

test('provider errors explain the actionable cause without exposing raw diagnostics', () => {
  assert.match(chatErrorMessage({ statusCode: 404 }), /CHAT_MODEL/);
  assert.match(chatErrorMessage({ lastError: { statusCode: 429 } }), /cuota/);
  assert.match(chatErrorMessage({ statusCode: 403 }), /GEMINI_API_KEY/);
  assert.match(chatErrorMessage({ message: 'API key not valid: secret' }), /GEMINI_API_KEY/);
  assert.match(chatErrorMessage({ lastError: { message: 'Cannot connect to API: EACCES' } }), /internet/);
  assert.equal(chatErrorMessage({ message: 'internal secret' }), 'No se pudo completar la respuesta. Intenta nuevamente.');
});
