import test from 'node:test';
import assert from 'node:assert/strict';

async function scenario() {
  const values = new Map([['miguel_session', JSON.stringify({access_token:'test-token'})]]);
  const events = [];
  globalThis.sessionStorage = {getItem:key => values.get(key) ?? null, setItem:(key,value) => values.set(key,value), removeItem:key => values.delete(key)};
  globalThis.window = {location:{reload:() => events.push('reload'), replace:path => events.push(path)}};
  const helper = await import(`./sessionRecovery.js?test=${Math.random()}`);
  return {values, events, ...helper};
}
const expired = {status:401,message:'Token inválido o vencido',accessToken:'test-token'};

test('recarga una sola vez aunque fallen varias consultas simultáneas', async () => {
  const s = await scenario();
  assert.equal(s.recoverExpiredSession(expired),true);
  assert.equal(s.recoverExpiredSession(expired),true);
  assert.deepEqual(s.events,['reload']);
  assert.ok(s.values.has('miguel_session'));
});

test('si el token sigue rechazado tras recargar, vuelve al login sin bucle', async () => {
  const s = await scenario();
  s.values.set('miguel_token_reload_attempted','1');
  assert.equal(s.recoverExpiredSession(expired),true);
  assert.deepEqual(s.events,['/login']);
  assert.equal(s.values.has('miguel_session'),false);
  assert.equal(s.values.get(s.SESSION_RECOVERY_NOTICE_KEY),'1');
});

test('ignora errores ajenos al token, peticiones anónimas y respuestas de sesiones antiguas', async () => {
  const s = await scenario();
  for (const value of [{...expired,status:403},{...expired,status:500},{...expired,message:'Credenciales incorrectas'},{...expired,accessToken:undefined},{...expired,accessToken:'old-token'}]) assert.equal(s.recoverExpiredSession(value),false);
  assert.deepEqual(s.events,[]);
});

test('una nueva autenticación restablece la recuperación y admite mensajes en inglés', async () => {
  const s = await scenario();
  s.values.set('miguel_token_reload_attempted','1');
  s.values.set(s.SESSION_RECOVERY_NOTICE_KEY,'1');
  s.resetSessionRecovery();
  assert.equal(s.values.has(s.SESSION_RECOVERY_NOTICE_KEY),false);
  assert.equal(s.recoverExpiredSession({...expired,message:'JWT expired'}),true);
  assert.deepEqual(s.events,['reload']);
});
