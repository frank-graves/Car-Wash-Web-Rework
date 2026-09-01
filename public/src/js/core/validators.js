/** Funciones puras de validación y cálculo de dominio. Sin I/O ni DOM. */

import { esStringValida } from '../utils/type-guards.js';
import { evaluarGratis } from './domain.js';

export function validarNuevoCliente({ nombre, placa, telefono }) {
  if (!esStringValida(nombre, 80)) {
    return { ok: false, error: 'Escribe el nombre del cliente (máx 80 caracteres)' };
  }
  if (placa && !esStringValida(placa, 20)) {
    return { ok: false, error: 'Placa inválida (máx 20 caracteres, sin < >)' };
  }
  if (telefono && !esStringValida(telefono, 15)) {
    return { ok: false, error: 'Teléfono inválido (máx 15 caracteres, sin < >)' };
  }
  return { ok: true };
}

export function validarLavador(nombreLavador) {
  if (!esStringValida(nombreLavador, 80)) {
    return { ok: false, error: 'Escribe el nombre del lavador (máx 80 caracteres)' };
  }
  return { ok: true };
}

export function calcularCostoFinal(costo, acumulados) {
  const esGratis = evaluarGratis(acumulados);
  const costoFinal = esGratis ? 0 : costo;
  const nuevosAcumulados = esGratis ? 0 : acumulados + 1;
  return { costoFinal, esGratis, nuevosAcumulados };
}
