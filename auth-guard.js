/**
 * Lógica pura de control de acceso (testeable sin DOM ni Firebase).
 * Extraída del monolito para validar el guardián con node:test.
 * @param {boolean} autenticado
 */
function evaluarAcceso(autenticado) {
  return {
    puedeVerHistorial: autenticado === true,
    puedeVerClientes: autenticado === true,
    puedeRegistrarLavado: true // flujo operativo no exige sesión
  };
}

if (typeof module !== 'undefined') {
  module.exports = { evaluarAcceso };
}