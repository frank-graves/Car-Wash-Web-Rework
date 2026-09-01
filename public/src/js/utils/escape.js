/** Neutraliza HTML en datos de Firestore antes de interpolar en innerHTML. */

export function escaparHTML(valor) {
  const div = document.createElement('div');
  div.textContent = valor ?? '';
  return div.innerHTML;
}
