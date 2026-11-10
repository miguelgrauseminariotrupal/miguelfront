import test from 'node:test';
import assert from 'node:assert/strict';
import { withAgentRequestContext, withoutAgentRequestContext } from './agentRequestContext.js';
const message = { id: 'user-1', role: 'user', parts: [{ type:'text', text:'Genera el promedio de asistencias en Excel' }] };
const selection = { anio:'4', nivel:'4', grado:'5', seccion:'5', year:2026, label:'2026 · Primaria · Quinto · Única' };

test('envía el año y la sección asignada sin modificar la consulta visible ni su id', () => {
  const sent = withAgentRequestContext(message,selection);
  assert.equal(sent.id,message.id);
  assert.equal(message.parts.length,1);
  const text = sent.parts.at(-1).text;
  assert.match(text,/"id_anio_lectivo":"4"/);
  assert.match(text,/"id_seccion":"5"/);
  assert.match(text,/sin volver a preguntar/);
  assert.match(text,/no concede permisos/);
  assert.match(text,/no lo sustituyas silenciosamente/);
  assert.deepEqual(withoutAgentRequestContext(sent),message);
});

test('pide ejecución directa de órdenes claras y ayuda solo cuando corresponde, sin inventar asignaciones', () => {
  const sent = withAgentRequestContext(message);
  assert.match(sent.parts.at(-1).text,/orden clara, atiéndela directamente/);
  assert.match(sent.parts.at(-1).text,/únicamente si el usuario pide ayuda/);
  assert.doesNotMatch(sent.parts.at(-1).text,/id_seccion/);
  assert.doesNotMatch(withAgentRequestContext(message,{seccion:'5'}).parts.at(-1).text,/id_seccion/);
});

test('oculta el contexto recuperado incluso si el backend concatena las partes de texto', () => {
  const sent = withAgentRequestContext(message,selection);
  const joined = {...sent,parts:[{type:'text',text:sent.parts.map(p=>p.text).join('\n\n')}]};
  assert.deepEqual(withoutAgentRequestContext(joined),message);
  const assistant = {role:'assistant',parts:[{type:'text',text:'Respuesta'}]};
  assert.equal(withoutAgentRequestContext(assistant),assistant);
});
