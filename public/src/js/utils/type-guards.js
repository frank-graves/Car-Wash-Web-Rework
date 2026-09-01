/** Funciones de validación defensiva para datos de Firestore y DOM. */

export function esStringValida(valor, maxLongitud = 100) {
  if (typeof valor !== 'string') return false;
  const trimmed = valor.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > maxLongitud) return false;
  if (/[<>]/.test(trimmed)) return false;
  return true;
}

export function esNumeroPositivo(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
}

export function esObjetoFirestore(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

export function esDocumentoConId(doc) {
  return esObjetoFirestore(doc) && typeof doc.id === 'string';
}
