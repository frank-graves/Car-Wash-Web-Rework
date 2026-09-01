const { test } = require('node:test');
const assert = require('node:assert');
const { evaluarAcceso } = require('./auth-guard.js');

test('anónimo: bloquea historial y clientes, permite registrar lavado', () => {
  const r = evaluarAcceso(false);
  assert.strictEqual(r.puedeVerHistorial, false);
  assert.strictEqual(r.puedeVerClientes, false);
  assert.strictEqual(r.puedeRegistrarLavado, true);
});

test('autenticado: habilita historial y clientes', () => {
  const r = evaluarAcceso(true);
  assert.strictEqual(r.puedeVerHistorial, true);
  assert.strictEqual(r.puedeVerClientes, true);
  assert.strictEqual(r.puedeRegistrarLavado, true);
});