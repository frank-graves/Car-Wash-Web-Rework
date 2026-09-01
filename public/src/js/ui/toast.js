/** Feedback efímero para el usuario. */

export function toast(mensaje) {
  const elemento = document.getElementById('toast');
  if (!elemento) return;
  elemento.textContent = mensaje;
  elemento.classList.add('show');
  setTimeout(() => elemento.classList.remove('show'), 2200);
}
