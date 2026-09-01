/** Dominio: catálogos de vehículos, tipos, precios y formateo. */

export const VEHICULOS_INFO = Object.freeze({
  auto: { label: "Auto" },
  camioneta_cerrada: { label: "Camioneta cerrada" },
  pickup: { label: "Camioneta Pick Up" },
  mototaxi: { label: "Mototaxi" },
  moto_lineal: { label: "Moto lineal" },
  moto: { label: "Moto" }
});

export const VEHICULOS_SELECCIONABLES = Object.freeze([
  "auto", "camioneta_cerrada", "pickup", "mototaxi", "moto_lineal"
]);

export const TIPOS_INFO = Object.freeze({
  basico: { label: "Básico" },
  intermedio: { label: "Intermedio" },
  premium: { label: "Premium" },
  deluxe: { label: "Deluxe" },
  full_deluxe: { label: "Full Deluxe Detailing" },
  completo: { label: "Completo" },
  full_moto: { label: "Full Moto" }
});

export const PRECIOS = Object.freeze({
  auto:              { basico: 30, intermedio: 40, premium: 55, deluxe: 90,  full_deluxe: 220 },
  camioneta_cerrada: { basico: 40, intermedio: 50, premium: 65, deluxe: 100, full_deluxe: 260 },
  pickup:            { basico: 45, intermedio: 65, premium: 80, deluxe: 110, full_deluxe: 260 },
  mototaxi:          { basico: 15, completo: 20, full_moto: 30 },
  moto_lineal:       { basico: 10, completo: 15, full_moto: 25 }
});

export function labelPago(pago) {
  if (!pago) return '—';
  return pago === 'yape' ? 'Yape' : pago === 'efectivo' ? 'Efectivo' : pago;
}

export function capitalizar(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '';
}

export function evaluarGratis(acumulados) {
  return Number.isFinite(acumulados) && acumulados >= 6;
}

export function normalizarBusqueda(texto) {
  if (typeof texto !== 'string') return '';
  return texto.trim().toLowerCase();
}

export function construirUpdateAcumulados(clienteData, nuevosAcumulados) {
  const update = { lavados_acumulados: nuevosAcumulados };
  if (typeof clienteData?.nombre_lower !== 'string') {
    update.nombre_lower = normalizarBusqueda(clienteData?.nombre || '');
  }
  return update;
}

export function formatearFecha(fecha) {
  if (!fecha) return '—';
  let base;
  if (fecha.seconds !== undefined && fecha.nanoseconds !== undefined) {
    base = new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000);
  } else if (fecha instanceof Date) {
    base = fecha;
  } else if (typeof fecha === 'string') {
    base = new Date(fecha);
  } else if (typeof fecha === 'object' && typeof fecha.toDate === 'function') {
    base = fecha.toDate();
  } else {
    return '—';
  }
  if (Number.isNaN(base.getTime())) return '—';
  return base.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
