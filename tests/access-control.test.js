const { test } = require('node:test');
const assert = require('node:assert');
const { evaluarAcceso, puedeVer } = require('../src/js/core/access-control.js');

test('anónimo: bloquea historial y clientes, permite registrar', () => {
  const r = evaluarAcceso(false);
  assert.strictEqual(r.puedeVerHistorial, false);
  assert.strictEqual(r.puedeVerClientes, false);
  assert.strictEqual(r.puedeRegistrarLavado, true);
  assert.strictEqual(puedeVer('historial', false), false);
  assert.strictEqual(puedeVer('clientes', false), false);
  assert.strictEqual(puedeVer('lavado', false), true);
});

test('autenticado: habilita historial y clientes', () => {
  const r = evaluarAcceso(true);
  assert.strictEqual(r.puedeVerHistorial, true);
  assert.strictEqual(r.puedeVerClientes, true);
  assert.strictEqual(puedeVer('historial', true), true);
  assert.strictEqual(puedeVer('clientes', true), true);
});