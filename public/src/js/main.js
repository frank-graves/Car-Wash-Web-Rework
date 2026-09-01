/** Punto de entrada: orquesta Firebase, suscripciones, UI y flujo. */

import { inicializarFirebase } from './config/firebase-config.js';
import { puedeVer } from './core/access-control.js';
import {
  VEHICULOS_INFO, TIPOS_INFO, labelPago, capitalizar, formatearFecha, evaluarGratis
} from './core/domain.js';
import {
  suscribirseAClientesPaginado, suscribirseALavadosPaginado,
  cargarMasClientes, cargarMasLavados,
  suscribirseALavadores, crearLavador,
  crearClienteNuevo, registrarLavadoTransaccional,
  buscarClientes
} from './services/firestore-service.js';
import {
  validarNuevoCliente, validarLavador
} from './core/validators.js';
import { toast } from './ui/toast.js';
import {
  renderVehiculos, renderTiposLavado, renderSelectClientes,
  renderListaClientes, renderHistorial
} from './ui/render.js';
import { configurarSeleccionPago, configurarLogin } from './ui/forms.js';

const { db, auth } = inicializarFirebase();

/* Estado central de la sesión operativa */
const estado = {
  catalogoClientes: [],
  catalogoLavados: [],
  catalogoLavadores: [],
  paginaBaseClientes: [],
  paginasExtraClientes: [],
  paginaBaseLavados: [],
  paginasExtraLavados: [],
  ultimoClienteVisible: null,
  ultimoLavadoVisible: null,
  vehiculoSeleccionado: null,
  tipoSeleccionado: null,
  pagoSeleccionado: null,
  usuarioActual: null,
  dejarDeEscucharClientes: null,
  dejarDeEscucharLavados: null,
  dejarDeEscucharLavadores: null,
  timerBusqueda: null
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
  loginOverlay: $('loginOverlay'),
  btnCargarMasClientes: $('btnCargarMasClientes'),
  btnCargarMasHistorial: $('btnCargarMasHistorial')
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
  if (estado.dejarDeEscucharLavadores) { estado.dejarDeEscucharLavadores(); estado.dejarDeEscucharLavadores = null; }
  if (estado.timerBusqueda) {
    clearTimeout(estado.timerBusqueda);
    estado.timerBusqueda = null;
  }
}

function renderSelectLavadores() {
  const select = refs.selectLavador;
  select.innerHTML = '<option value="">— Selecciona o registra un lavador nuevo —</option>';
  estado.catalogoLavadores
    .slice()
    .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
    .forEach(lavador => {
      const opcion = document.createElement('option');
      opcion.value = lavador.id;
      opcion.textContent = lavador.nombre;
      select.appendChild(opcion);
    });
  const opcionNueva = document.createElement('option');
  opcionNueva.value = '__nuevo__';
  opcionNueva.textContent = '+ Nuevo lavador';
  select.appendChild(opcionNueva);
}

function iniciarSuscripciones() {
  if (!db) return;
  detenerSuscripciones();

  estado.dejarDeEscucharClientes = suscribirseAClientesPaginado(db, (docsBase, ultimoDoc) => {
    estado.paginaBaseClientes = docsBase;
    estado.paginasExtraClientes = [];
    estado.ultimoClienteVisible = ultimoDoc || null;
    estado.catalogoClientes = [...estado.paginaBaseClientes, ...estado.paginasExtraClientes];
    renderSelectClientes(refs.selectCliente, estado.catalogoClientes);
    renderListaClientes(refs.listaClientes, estado.catalogoClientes, refs.buscarCliente.value);
    renderHistorial(refs.tablaHistorial, refs.historialVacio, estado.catalogoLavados, estado.catalogoClientes);
    revisarSiGratis();
    refs.btnCargarMasClientes.style.display = (estado.paginaBaseClientes.length >= 50) ? 'inline-flex' : 'none';
  });

  estado.dejarDeEscucharLavados = suscribirseALavadosPaginado(db, (docsBase, ultimoDoc) => {
    estado.paginaBaseLavados = docsBase;
    estado.paginasExtraLavados = [];
    estado.ultimoLavadoVisible = ultimoDoc || null;
    estado.catalogoLavados = [...estado.paginaBaseLavados, ...estado.paginasExtraLavados];
    renderHistorial(refs.tablaHistorial, refs.historialVacio, estado.catalogoLavados, estado.catalogoClientes);
    refs.btnCargarMasHistorial.style.display = (estado.paginaBaseLavados.length >= 50) ? 'inline-flex' : 'none';
  });

  estado.dejarDeEscucharLavadores = suscribirseALavadores(db, catalogoLavadores => {
    estado.catalogoLavadores = catalogoLavadores;
    renderSelectLavadores();
  });
}

function revisarSiGratis() {
  const aviso = $('avisoGratis');
  const id = refs.selectCliente.value;
  if (!id || id === '__nuevo__') { aviso.style.display = 'none'; return; }
  const cliente = estado.catalogoClientes.find(c => c.id === id);
  aviso.style.display = (cliente && evaluarGratis(cliente.lavados_acumulados)) ? 'block' : 'none';
}

/* Configuración de navegación */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (!puedeVer(view, estaAutenticado())) { abrirLogin(); return; }
    activarTab(view);
  });
});

/* Botones de paginación */
refs.btnCargarMasClientes.addEventListener('click', async () => {
  if (!estado.ultimoClienteVisible) return;
  const btn = refs.btnCargarMasClientes;
  btn.disabled = true;
  try {
    const { docs, ultimoDoc } = await cargarMasClientes(db, estado.ultimoClienteVisible, 50);
    estado.paginasExtraClientes = estado.paginasExtraClientes.concat(docs);
    estado.catalogoClientes = [...estado.paginaBaseClientes, ...estado.paginasExtraClientes];
    estado.ultimoClienteVisible = ultimoDoc || estado.ultimoClienteVisible;
    renderSelectClientes(refs.selectCliente, estado.catalogoClientes);
    renderListaClientes(refs.listaClientes, estado.catalogoClientes, refs.buscarCliente.value);
    renderHistorial(refs.tablaHistorial, refs.historialVacio, estado.catalogoLavados, estado.catalogoClientes);
    btn.style.display = (docs.length < 50) ? 'none' : 'inline-flex';
  } catch (error) {
    console.error('[CargarMasClientes]', error);
    toast('No se pudieron cargar más clientes.');
  } finally {
    btn.disabled = false;
  }
});

refs.btnCargarMasHistorial.addEventListener('click', async () => {
  if (!estado.ultimoLavadoVisible) return;
  const btn = refs.btnCargarMasHistorial;
  btn.disabled = true;
  try {
    const { docs, ultimoDoc } = await cargarMasLavados(db, estado.ultimoLavadoVisible, 50);
    estado.paginasExtraLavados = estado.paginasExtraLavados.concat(docs);
    estado.catalogoLavados = [...estado.paginaBaseLavados, ...estado.paginasExtraLavados];
    estado.ultimoLavadoVisible = ultimoDoc || estado.ultimoLavadoVisible;
    renderHistorial(refs.tablaHistorial, refs.historialVacio, estado.catalogoLavados, estado.catalogoClientes);
    btn.style.display = (docs.length < 50) ? 'none' : 'inline-flex';
  } catch (error) {
    console.error('[CargarMasHistorial]', error);
    toast('No se pudieron cargar más lavados.');
  } finally {
    btn.disabled = false;
  }
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
  const termino = e.target.value.trim();
  clearTimeout(estado.timerBusqueda);
  if (!termino) {
    renderListaClientes(refs.listaClientes, estado.catalogoClientes, '');
    return;
  }
  estado.timerBusqueda = setTimeout(async () => {
    try {
      if (!db) return;
      const resultados = await buscarClientes(db, termino, 20);
      renderListaClientes(refs.listaClientes, resultados, '');
    } catch (error) {
      console.error('[BuscarClientes]', error);
      toast('No se pudo buscar clientes.');
    }
  }, 300);
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
      estado.catalogoLavadores = [];
      estado.paginaBaseClientes = [];
      estado.paginasExtraClientes = [];
      estado.paginaBaseLavados = [];
      estado.paginasExtraLavados = [];
      estado.ultimoClienteVisible = null;
      estado.ultimoLavadoVisible = null;
      renderSelectClientes(refs.selectCliente, []);
      renderListaClientes(refs.listaClientes, []);
      renderHistorial(refs.tablaHistorial, refs.historialVacio, [], []);
      renderSelectLavadores();
      if (document.querySelector('.view.active')?.id !== 'view-lavado') activarTab('lavado');
    }
  });
} else {
  actualizarEstadoAuth();
}

/* Registro de lavado idempotente y transaccional */
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
    let nombreLavador = esNuevoLavador
      ? $('nombreLavadorNuevo').value.trim()
      : '';
    let lavadorId = esNuevoLavador ? null : refs.selectLavador.value;

    if (esNuevoLavador) {
      const resultadoLavador = validarLavador(nombreLavador);
      if (!resultadoLavador.ok) { toast(resultadoLavador.error); return; }
      lavadorId = await crearLavador(db, { nombre: nombreLavador });
    } else if (lavadorId) {
      const lavador = estado.catalogoLavadores.find(l => l.id === lavadorId);
      nombreLavador = lavador ? lavador.nombre : '';
      if (!nombreLavador) { toast('Selecciona un lavador válido'); return; }
    } else {
      toast('Selecciona o registra un lavador');
      return;
    }

    if (clienteId === '__nuevo__' || !clienteId) {
      const nombre = $('nombreNuevo').value.trim();
      const placa = $('placaNueva').value.trim();
      const telefono = $('telefonoNuevo').value.trim();

      const resultadoCliente = validarNuevoCliente({ nombre, placa, telefono });
      if (!resultadoCliente.ok) { toast(resultadoCliente.error); return; }

      clienteId = await crearClienteNuevo(db, { nombre, placa, telefono });
    }

    const resultado = await registrarLavadoTransaccional(db, {
      clienteId,
      tipoVehiculo: estado.vehiculoSeleccionado,
      tipo: estado.tipoSeleccionado,
      costo,
      nombreLavador,
      lavadorId,
      metodoPago: estado.pagoSeleccionado
    });

    toast(resultado.fueGratis ? '¡Lavado GRATIS registrado! 🎉' : 'Lavado registrado correctamente');
    reiniciarFormularioLavado();
  } catch (error) {
    console.error('[RegistroLavado]', error);
    toast('No se pudo registrar el lavado. Intenta de nuevo.');
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

  const filasLavadores = estado.catalogoLavadores.map(l => ({
    Lavador: l.nombre || ''
  }));
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasLavadores), "Lavadores");

  XLSX.writeFile(libro, "ExclusivoDetailing_Reporte.xlsx");
  toast('Excel descargado ✅');
});
