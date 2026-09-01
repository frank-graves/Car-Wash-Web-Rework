import { test } from 'node:test';
import assert from 'node:assert';
import {
  evaluarGratis, formatearFecha, labelPago, capitalizar,
  normalizarBusqueda, construirUpdateAcumulados
} from '../public/src/js/core/domain.js';

test('evaluarGratis: 6 o más es gratis', () => {
  assert.strictEqual(evaluarGratis(6), true);
  assert.strictEqual(evaluarGratis(10), true);
  assert.strictEqual(evaluarGratis(5), false);
  assert.strictEqual(evaluarGratis(0), false);
});

test('evaluarGratis: no numérico es falso', () => {
  assert.strictEqual(evaluarGratis(undefined), false);
  assert.strictEqual(evaluarGratis(null), false);
  assert.strictEqual(evaluarGratis('6'), false);
  assert.strictEqual(evaluarGratis(NaN), false);
});

test('formatearFecha: Timestamp de Firestore', () => {
  const ts = { seconds: 1710000000, nanoseconds: 0 };
  const resultado = formatearFecha(ts);
  assert.match(resultado, /\d{2}\/\d{2}\/\d{4}/);
});

test('formatearFecha: Date de JS', () => {
  const fecha = new Date(2026, 0, 15);
  const resultado = formatearFecha(fecha);
  assert.match(resultado, /\d{2}\/\d{2}\/\d{4}/);
});

test('formatearFecha: string ISO', () => {
  const resultado = formatearFecha('2026-01-15T12:00:00.000Z');
  assert.match(resultado, /\d{2}\/\d{2}\/\d{4}/);
});

test('formatearFecha: inválido devuelve em dash', () => {
  assert.strictEqual(formatearFecha(null), '—');
  assert.strictEqual(formatearFecha('no es fecha'), '—');
});

test('labelPago: mapea yape y efectivo', () => {
  assert.strictEqual(labelPago('yape'), 'Yape');
  assert.strictEqual(labelPago('efectivo'), 'Efectivo');
  assert.strictEqual(labelPago(undefined), '—');
  assert.strictEqual(labelPago('otro'), 'otro');
});

test('capitalizar: primera letra mayúscula', () => {
  assert.strictEqual(capitalizar('hola'), 'Hola');
  assert.strictEqual(capitalizar(''), '');
  assert.strictEqual(capitalizar(null), '');
});

test('normalizarBusqueda: trim y lowercase', () => {
  assert.strictEqual(normalizarBusqueda('  Juan Pérez  '), 'juan pérez');
});

test('normalizarBusqueda: no string devuelve vacío', () => {
  assert.strictEqual(normalizarBusqueda(null), '');
  assert.strictEqual(normalizarBusqueda(123), '');
  assert.strictEqual(normalizarBusqueda(undefined), '');
});

test('construirUpdateAcumulados: añade nombre_lower si falta', () => {
  const clienteData = { nombre: 'Juan Pérez', lavados_acumulados: 3 };
  const resultado = construirUpdateAcumulados(clienteData, 4);
  assert.deepStrictEqual(resultado, {
    lavados_acumulados: 4,
    nombre_lower: 'juan pérez'
  });
});

test('construirUpdateAcumulados: no añade nombre_lower si ya existe', () => {
  const clienteData = { nombre: 'Ana', nombre_lower: 'ana', lavados_acumulados: 2 };
  const resultado = construirUpdateAcumulados(clienteData, 3);
  assert.deepStrictEqual(resultado, { lavados_acumulados: 3 });
});
