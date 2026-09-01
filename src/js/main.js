/** Punto de entrada: orquesta Firebase, suscripciones, UI y flujo. */

import { inicializarFirebase } from './config/firebase-config.js';
import { puedeVer } from './core/access-control.js';
import {
  VEHICULOS_INFO, TIPOS_INFO, labelPago, capitalizar, formatearFecha
} from './core/domain.js';
import {
  suscribirseAClientes, suscribirseALavados,
  crearClienteNuevo, obtenerCliente, actualizarAcumulados, registrarLavado
} from './services/firestore-service.js';
import { toast } from './ui/toast.js';
import {
  renderVehiculos, renderTiposLavado, renderSelectClientes,
  renderListaClientes, renderHistorial
} from './ui/render.js';
import { configurarSeleccionPago, configurarLogin } from './ui/forms.js';
import { esStringValida, esNumeroPositivo } from './utils/type-guards.js';

const { db, auth } = inicializarFirebase();

/* Estado central de la sesión operativa */
const estado = {
  catalogoClientes: [],
  catalogoLavados: [],
  vehiculoSeleccionado: null,
  tipoSeleccionado: null,
  pagoSeleccionado: null,
  usuarioActual: null,
  dejarDeEscucharClientes: null,
  dejarDeEscucharLavados: null
};

/* Referencias DOM de alta frecuencia */
const $ = (id) => document.getElementById(id);
const refs = {
  btnRegistrar: $('btnRegistrarLavado'),
  selectCliente: $('selectCliente'),
  selectLavador: $('selectLavador'),
  vehiculoTypes: $('vehiculoTypes'),
  washTypes: $('washTypes'),
  pagoTypes: $('pagoTypes'),
  listaClientes: $('listaClientes'),
  tablaHistorial: $('tablaHistorial'),
  historialVacio: $('historialVacio'),
  buscarCliente: $('buscarCliente'),
  btnExportar: $('btnExportar'),
  btnLogout: $('btnLogout'),
  loginOverlay: $('loginOverlay')
};

function abrirLogin() { refs.loginOverlay.classList.add('show'); }

function activarTab(view) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelector(`.tab-btn[data-view="${view}"]`).classList.add('active');
  document.getElementById('view-' + view).classList.add('active');
}

function estaAutenticado() { return estado.usuarioActual !== null; }

function actualizarEstadoAuth() {
  refs.btnLogout.classList.toggle('show', estaAutenticado());
  refs.btnExportar.disabled = !estaAutenticado();
}

function detenerSuscripciones() {
  if (estado.dejarDeEscucharClientes) { estado.dejarDeEscucharClientes(); estado.dejarDeEscucharClientes = null; }
  if (estado.dejarDeEscucharLavados) { estado.dejarDeEscucharLavados(); estado.dejarDeEscucharLavados = null; }
}

function iniciarSuscripciones() {
  if (!db) return;
  detenerSuscripciones();
  estado.dejarDeEscucharClientes = suscribirseAClientes(db, catalogoClientes => {
    estado.catalogoClientes = catalogoClientes;
    renderSelectClientes(refs.selectCliente, catalogoClientes);
    renderListaClientes(refs.listaClientes, catalogoClientes, refs.buscarCliente.value);
    renderHistorial(refs.tablaHistorial, refs.historialVacio, estado.catalogoLavados, catalogoClientes);
    revisarSiGratis();
  });
  estado.dejarDeEscucharLavados = suscribirseALavados(db, catalogoLavados => {
    estado.catalogoLavados = catalogoLavados;
    renderHistorial(refs.tablaHistorial, refs.historialVacio, catalogoLavados, estado.catalogoClientes);
  });
}

function revisarSiGratis() {
  const aviso = $('avisoGratis');
  const id = refs.selectCliente.value;
  if (!id || id === '__nuevo__') { aviso.style.display = 'none'; return; }
  const cliente = estado.catalogoClientes.find(c => c.id === id);
  aviso.style.display = (cliente && cliente.lavados_acumulados === 6) ? 'block' : 'none';
}

/* Configuración de navegación */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (!puedeVer(view, estaAutenticado())) { abrirLogin(); return; }
    activarTab(view);
  });
});

/* Configuración de formulario */
renderVehiculos(refs.vehiculoTypes, vehiculo => {
  estado.vehiculoSeleccionado = vehiculo;
  estado.tipoSeleccionado = null;
  $('costoLavado').value = '';
  renderTiposLavado(refs.washTypes, vehiculo, (tipo, precio) => {
    estado.tipoSeleccionado = tipo;
    $('costoLavado').value = precio;
    revisarSiGratis();
  });
});
renderTiposLavado(refs.washTypes, null, () => {});

refs.selectCliente.addEventListener('change', () => {
  $('clienteNuevoBox').style.display = refs.selectCliente.value === '__nuevo__' ? 'block' : 'none';
  revisarSiGratis();
});

refs.selectLavador.addEventListener('change', () => {
  $('lavadorNuevoBox').style.display = refs.selectLavador.value === '__nuevo__' ? 'block' : 'none';
});

configurarSeleccionPago(refs.pagoTypes, pago => { estado.pagoSeleccionado = pago; });

refs.buscarCliente.addEventListener('input', e => {
  renderListaClientes(refs.listaClientes, estado.catalogoClientes, e.target.value);
});

/* Login */
const traducirErrorAuth = (codigo) => {
  const mapa = {
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/invalid-email': 'Correo inválido',
    'auth/invalid-credential': 'Credenciales inválidas',
    'auth/too-many-requests': 'Demasiados intentos, espera un momento'
  };
  return mapa[codigo] || 'Error de acceso';
};

configurarLogin({
  auth,
  btnIngresar: $('btnIngresar'),
  btnCerrarLogin: $('btnCerrarLogin'),
  btnLogout: refs.btnLogout,
  overlay: refs.loginOverlay,
  traducirError: traducirErrorAuth
});

/* Auth state */
if (auth) {
  auth.onAuthStateChanged(user => {
    estado.usuarioActual = user;
    actualizarEstadoAuth();
    if (user) {
      iniciarSuscripciones();
    } else {
      detenerSuscripciones();
      estado.catalogoClientes = [];
      estado.catalogoLavados = [];
      renderSelectClientes(refs.selectCliente, []);
      renderListaClientes(refs.listaClientes, []);
      renderHistorial(refs.tablaHistorial, refs.historialVacio, [], []);
      if (document.querySelector('.view.active')?.id !== 'view-lavado') activarTab('lavado');
    }
  });
} else {
  actualizarEstadoAuth();
}

/* Registro de lavado idempotente */
refs.btnRegistrar.addEventListener('click', async () => {
  const btn = refs.btnRegistrar;
  if (btn.disabled) return;
  const textoOriginal = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  try {
    if (!db) { toast('Falta conectar Firebase'); return; }
    if (!estado.vehiculoSeleccionado) { toast('Elige el tipo de vehículo'); return; }
    if (!estado.tipoSeleccionado) { toast('Elige un tipo de lavado'); return; }
    if (!estado.pagoSeleccionado) { toast('Elige el método de pago'); return; }

    const costo = parseFloat($('costoLavado').value || '0');
    let clienteId = refs.selectCliente.value;

    const esNuevoLavador = refs.selectLavador.value === '__nuevo__';
    const nombreLavador = esNuevoLavador
      ? $('nombreLavadorNuevo').value.trim()
      : refs.selectLavador.value.trim();
    if (esNuevoLavador && !esStringValida(nombreLavador)) { toast('Escribe el nombre del lavador nuevo'); return; }

    if (clienteId === '__nuevo__' || !clienteId) {
      const nombre = $('nombreNuevo').value.trim();
      if (!esStringValida(nombre)) { toast('Escribe el nombre del cliente nuevo'); return; }
      clienteId = await crearClienteNuevo(db, {
        nombre,
        placa: $('placaNueva').value.trim(),
        telefono: $('telefonoNuevo').value.trim()
      });
    }

    const clienteData = await obtenerCliente(db, clienteId);
    const acumulados = esNumeroPositivo(clienteData?.lavados_acumulados) ? clienteData.lavados_acumulados : 0;
    const esGratis = acumulados >= 6;
    const costoFinal = esGratis ? 0 : costo;
    const nuevosAcumulados = esGratis ? 0 : acumulados + 1;

    await registrarLavado(db, {
      clienteId,
      tipoVehiculo: estado.vehiculoSeleccionado,
      tipo: estado.tipoSeleccionado,
      costo: costoFinal,
      fueGratis: esGratis,
      nombreLavador,
      metodoPago: estado.pagoSeleccionado
    });
    await actualizarAcumulados(db, clienteId, nuevosAcumulados);

    toast(esGratis ? '¡Lavado GRATIS registrado! 🎉' : 'Lavado registrado correctamente');
    reiniciarFormularioLavado();
  } catch (error) {
    toast('Ocurrió un error: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
});

function reiniciarFormularioLavado() {
  $('nombreNuevo').value = '';
  $('placaNueva').value = '';
  $('telefonoNuevo').value = '';
  $('costoLavado').value = '';
  refs.vehiculoTypes.querySelectorAll('.wash-type').forEach(e => e.classList.remove('selected'));
  estado.vehiculoSeleccionado = null;
  estado.tipoSeleccionado = null;
  renderTiposLavado(refs.washTypes, null, () => {});
  $('clienteNuevoBox').style.display = 'none';
  refs.selectCliente.value = '';
  $('avisoGratis').style.display = 'none';
  refs.pagoTypes.querySelectorAll('.wash-type').forEach(e => e.classList.remove('selected'));
  estado.pagoSeleccionado = null;
  refs.selectLavador.value = '';
  $('lavadorNuevoBox').style.display = 'none';
  $('nombreLavadorNuevo').value = '';
}

/* Exportar a Excel */
refs.btnExportar.addEventListener('click', () => {
  if (!estaAutenticado()) { abrirLogin(); return; }
  if (estado.catalogoLavados.length === 0) { toast('No hay lavados para exportar todavía'); return; }

  const filas = estado.catalogoLavados.map(l => {
    const cliente = estado.catalogoClientes.find(c => c.id === l.cliente_id) || {};
    return {
      Fecha: formatearFecha(l.fecha),
      Cliente: cliente.nombre || '',
      Placa: cliente.placa || '',
      Telefono: cliente.telefono || '',
      Vehiculo: VEHICULOS_INFO[l.tipo_vehiculo]?.label || '',
      "Tipo de lavado": TIPOS_INFO[l.tipo]?.label || capitalizar(l.tipo),
      Lavador: l.nombre_lavador || '',
      Pago: labelPago(l.metodo_pago),
      Costo: l.fue_gratis ? 0 : Number(l.costo),
      Gratis: l.fue_gratis ? 'Sí' : 'No'
    };
  });

  const hojaLavados = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hojaLavados, "Lavados");

  const filasClientes = estado.catalogoClientes.map(c => ({
    Cliente: c.nombre,
    Placa: c.placa || '',
    Telefono: c.telefono || '',
    "Lavados acumulados (tarjeta)": c.lavados_acumulados || 0
  }));
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasClientes), "Clientes");
  XLSX.writeFile(libro, "ExclusivoDetailing_Reporte.xlsx");
  toast('Excel descargado ✅');
});