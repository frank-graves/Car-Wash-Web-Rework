/** Renderizado de vistas: clientes, historial, opciones de formulario. */

import {
  VEHICULOS_INFO, VEHICULOS_SELECCIONABLES,
  TIPOS_INFO, PRECIOS, labelPago, formatearFecha, capitalizar
} from '../core/domain.js';
import { esDocumentoConId, esNumeroPositivo } from '../utils/type-guards.js';

export function renderVehiculos(contenedor, alElegir) {
  contenedor.innerHTML = VEHICULOS_SELECCIONABLES.map(clave => `
    <div class="wash-type" data-vehiculo="${clave}"><strong>${VEHICULOS_INFO[clave].label}</strong></div>
  `).join('');
  contenedor.querySelectorAll('.wash-type').forEach(elemento => {
    elemento.addEventListener('click', () => {
      contenedor.querySelectorAll('.wash-type').forEach(e => e.classList.remove('selected'));
      elemento.classList.add('selected');
      alElegir(elemento.dataset.vehiculo);
    });
  });
}

export function renderTiposLavado(contenedor, vehiculoSeleccionado, alElegir) {
  if (!vehiculoSeleccionado) {
    contenedor.innerHTML = '<div class="empty" style="padding:10px 4px;">Elige primero el tipo de vehículo.</div>';
    return;
  }
  const tabla = PRECIOS[vehiculoSeleccionado] || {};
  contenedor.innerHTML = Object.keys(tabla).map(tipo => `
    <div class="wash-type" data-tipo="${tipo}" data-precio="${tabla[tipo]}">
      <strong>${TIPOS_INFO[tipo].label}</strong><span>S/ ${tabla[tipo]}</span>
    </div>
  `).join('');
  contenedor.querySelectorAll('.wash-type').forEach(elemento => {
    elemento.addEventListener('click', () => {
      contenedor.querySelectorAll('.wash-type').forEach(e => e.classList.remove('selected'));
      elemento.classList.add('selected');
      alElegir(elemento.dataset.tipo, elemento.dataset.precio);
    });
  });
}

export function renderSelectClientes(select, catalogoClientes) {
  select.innerHTML = '<option value="">— Selecciona o registra un cliente nuevo —</option>';
  catalogoClientes.slice().sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')).forEach(cliente => {
    const opcion = document.createElement('option');
    opcion.value = cliente.id;
    opcion.textContent = `${cliente.nombre} — ${cliente.placa || 's/placa'}`;
    select.appendChild(opcion);
  });
  const opcionNueva = document.createElement('option');
  opcionNueva.value = '__nuevo__';
  opcionNueva.textContent = '+ Nuevo cliente';
  select.appendChild(opcionNueva);
}

export function renderListaClientes(contenedor, catalogoClientes, filtro = '') {
  const termino = filtro.trim().toLowerCase();
  const lista = catalogoClientes
    .filter(c => !termino || (c.nombre || '').toLowerCase().includes(termino) || (c.placa || '').toLowerCase().includes(termino))
    .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

  if (lista.length === 0) {
    contenedor.innerHTML = '<div class="empty">No hay clientes que coincidan.</div>';
    return;
  }

  contenedor.innerHTML = lista.map(cliente => {
    const acumulados = esNumeroPositivo(cliente.lavados_acumulados) ? cliente.lavados_acumulados : 0;
    let sellos = '';
    for (let i = 1; i <= 7; i++) {
      let clase = 'stamp';
      let etiqueta = i;
      if (i === 7) { clase += acumulados >= 6 ? ' free' : ''; etiqueta = 'GRATIS'; }
      else if (i <= acumulados) { clase += ' filled'; }
      sellos += `<div class="${clase}">${i === 7 ? '★' : etiqueta}</div>`;
    }
    return `
      <div class="cliente-card">
        <div class="top"><div>
          <h3>${cliente.nombre}</h3>
          <div class="meta">Placa: ${cliente.placa || '—'} · Tel: ${cliente.telefono || '—'}</div>
        </div></div>
        <div class="stamps">${sellos}</div>
      </div>`;
  }).join('');
}

export function renderHistorial(tbody, vacio, catalogoLavados, catalogoClientes) {
  const lista = catalogoLavados.slice().sort((a, b) =>
    (b.fecha?.seconds || b.fecha || 0) - (a.fecha?.seconds || a.fecha || 0)
  );

  if (lista.length === 0) {
    tbody.innerHTML = '';
    vacio.style.display = 'block';
    return;
  }
  vacio.style.display = 'none';

  tbody.innerHTML = lista.map(lavado => {
    const cliente = catalogoClientes.find(c => esDocumentoConId(c) && c.id === lavado.cliente_id);
    return `
      <tr>
        <td>${formatearFecha(lavado.fecha)}</td>
        <td>${cliente ? cliente.nombre : '—'}</td>
        <td>${cliente ? (cliente.placa || '—') : '—'}</td>
        <td>${VEHICULOS_INFO[lavado.tipo_vehiculo] ? VEHICULOS_INFO[lavado.tipo_vehiculo].label : '—'}</td>
        <td>${TIPOS_INFO[lavado.tipo] ? TIPOS_INFO[lavado.tipo].label : capitalizar(lavado.tipo)}</td>
        <td>${lavado.nombre_lavador || '—'}</td>
        <td>${labelPago(lavado.metodo_pago)}</td>
        <td>${lavado.fue_gratis ? '<span class="free-tag">GRATIS</span>' : 'S/ ' + Number(lavado.costo).toFixed(2)}</td>
      </tr>`;
  }).join('');
}