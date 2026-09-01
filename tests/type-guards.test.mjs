import { test } from 'node:test';
import assert from 'node:assert';
import {
  esStringValida, esNumeroPositivo, esObjetoFirestore, esDocumentoConId
} from '../public/src/js/utils/type-guards.js';

test('esStringValida: rechaza vacíos y no strings', () => {
  assert.strictEqual(esStringValida('hola'), true);
  assert.strictEqual(esStringValida('  '), false);
  assert.strictEqual(esStringValida(''), false);
  assert.strictEqual(esStringValida(123), false);
  assert.strictEqual(esStringValida(null), false);
  assert.strictEqual(esStringValida(undefined), false);
});

test('esStringValida: respeta maxLongitud', () => {
  assert.strictEqual(esStringValida('abc', 3), true);
  assert.strictEqual(esStringValida('abcd', 3), false);
});

test('esStringValida: rechaza < y >', () => {
  assert.strictEqual(esStringValida('<script>'), false);
  assert.strictEqual(esStringValida('a>b'), false);
  assert.strictEqual(esStringValida('a < b'), false);
});

test('esNumeroPositivo: solo números finitos >= 0', () => {
  assert.strictEqual(esNumeroPositivo(0), true);
  assert.strictEqual(esNumeroPositivo(10), true);
  assert.strictEqual(esNumeroPositivo(-1), false);
  assert.strictEqual(esNumeroPositivo(NaN), false);
  assert.strictEqual(esNumeroPositivo(Infinity), false);
  assert.strictEqual(esNumeroPositivo('10'), false);
});

test('esObjetoFirestore: objeto no array no null', () => {
  assert.strictEqual(esObjetoFirestore({ a: 1 }), true);
  assert.strictEqual(esObjetoFirestore([]), false);
  assert.strictEqual(esObjetoFirestore(null), false);
  assert.strictEqual(esObjetoFirestore('str'), false);
});

test('esDocumentoConId: objeto con id string', () => {
  assert.strictEqual(esDocumentoConId({ id: 'abc' }), true);
  assert.strictEqual(esDocumentoConId({ id: 123 }), false);
  assert.strictEqual(esDocumentoConId({}), false);
  assert.strictEqual(esDocumentoConId(null), false);
});
