/** Funciones de validación defensiva para datos de Firestore y DOM. */

export function esStringValida(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
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