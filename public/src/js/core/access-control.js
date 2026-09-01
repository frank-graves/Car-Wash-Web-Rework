/** Control de acceso puro. Sin dependencias de Firebase ni DOM. */

export function evaluarAcceso(autenticado) {
  return {
    puedeVerHistorial: autenticado === true,
    puedeVerClientes: autenticado === true,
    puedeRegistrarLavado: true
  };
}

export function puedeVer(view, autenticado) {
  const acceso = evaluarAcceso(autenticado);
  if (view === 'historial') return acceso.puedeVerHistorial;
  if (view === 'clientes') return acceso.puedeVerClientes;
  return acceso.puedeRegistrarLavado;
}
