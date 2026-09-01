import { test } from 'node:test';
import assert from 'node:assert';
import { validarNuevoCliente, validarLavador, calcularCostoFinal } from '../public/src/js/core/validators.js';

test('cliente sin nombre → error', () => {
  const r = validarNuevoCliente({ nombre: '', placa: '', telefono: '' });
  assert.strictEqual(r.ok, false);
  assert.ok(r.error);
});

test('placa con <> → error', () => {
  const r = validarNuevoCliente({ nombre: 'Juan', placa: '<script>', telefono: '' });
  assert.strictEqual(r.ok, false);
});

test('cliente con 6 lavados → gratis', () => {
  const r = calcularCostoFinal(30, 6);
  assert.strictEqual(r.esGratis, true);
  assert.strictEqual(r.costoFinal, 0);
  assert.strictEqual(r.nuevosAcumulados, 0);
});

test('cliente con 3 lavados → no gratis, acumula 4', () => {
  const r = calcularCostoFinal(30, 3);
  assert.strictEqual(r.esGratis, false);
  assert.strictEqual(r.costoFinal, 30);
  assert.strictEqual(r.nuevosAcumulados, 4);
});
