/** Manejadores de formularios: selección, login/logout y registro. */

import { toast } from './toast.js';
import { esStringValida } from '../utils/type-guards.js';

export function configurarSeleccionPago(contenedor, alElegir) {
  contenedor.querySelectorAll('.wash-type').forEach(elemento => {
    elemento.addEventListener('click', () => {
      contenedor.querySelectorAll('.wash-type').forEach(e => e.classList.remove('selected'));
      elemento.classList.add('selected');
      alElegir(elemento.dataset.pago);
    });
  });
}

export function configurarLogin({ auth, btnIngresar, btnCerrarLogin, btnLogout, overlay, traducirError }) {
  btnCerrarLogin.addEventListener('click', () => overlay.classList.remove('show'));
  btnIngresar.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) { toast('Escribe correo y contraseña'); return; }
    btnIngresar.disabled = true;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      overlay.classList.remove('show');
      toast('Sesión iniciada');
    } catch (error) {
      toast(traducirError(error.code));
    } finally {
      btnIngresar.disabled = false;
    }
  });
  btnLogout.addEventListener('click', async () => {
    try { await auth.signOut(); toast('Sesión cerrada'); }
    catch { toast('No se pudo cerrar sesión'); }
  });
}