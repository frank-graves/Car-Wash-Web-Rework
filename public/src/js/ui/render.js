/** Renderizado de vistas: clientes, historial, opciones de formulario.
 *  F3-03: Datos dinámicos de Firestore se inyectan con textContent, nunca innerHTML. */

import {
  VEHICULOS_INFO, VEHICULOS_SELECCIONABLES,
  TIPOS_INFO, PRECIOS, labelPago, formatearFecha, capitalizar, evaluarGratis
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

  contenedor.innerHTML = '';

  if (lista.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No hay clientes que coincidan.';
    contenedor.appendChild(empty);
    return;
  }

  lista.forEach(cliente => {
    const card = document.createElement('div');
    card.className = 'cliente-card';

    const top = document.createElement('div');
    top.className = 'top';

    const infoDiv = document.createElement('div');

    const h3 = document.createElement('h3');
    h3.textContent = cliente.nombre || '';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `Placa: ${cliente.placa || '—'} · Tel: ${cliente.telefono || '—'}`;

    infoDiv.appendChild(h3);
    infoDiv.appendChild(meta);
    top.appendChild(infoDiv);
    card.appendChild(top);

    const stamps = document.createElement('div');
    stamps.className = 'stamps';

    const acumulados = esNumeroPositivo(cliente.lavados_acumulados)
      ? cliente.lavados_acumulados
      : 0;

    for (let i = 1; i <= 7; i++) {
      const stamp = document.createElement('div');
      let clase = 'stamp';
      if (i === 7) {
        clase += evaluarGratis(acumulados) ? ' free' : '';
        stamp.textContent = '★';
      } else {
        if (i <= acumulados) clase += ' filled';
        stamp.textContent = String(i);
      }
      stamp.className = clase;
      stamps.appendChild(stamp);
    }

    card.appendChild(stamps);
    contenedor.appendChild(card);
  });
}

export function renderHistorial(tbody, vacio, catalogoLavados, catalogoClientes) {
  const lista = catalogoLavados.slice().sort((a, b) =>
    (b.fecha?.seconds || b.fecha || 0) - (a.fecha?.seconds || a.fecha || 0)
  );

  tbody.innerHTML = '';

  if (lista.length === 0) {
    vacio.style.display = 'block';
    return;
  }
  vacio.style.display = 'none';

  lista.forEach(lavado => {
    const cliente = catalogoClientes.find(c => esDocumentoConId(c) && c.id === lavado.cliente_id);

    const tr = document.createElement('tr');

    const tdFecha = document.createElement('td');
    tdFecha.textContent = formatearFecha(lavado.fecha);
    tr.appendChild(tdFecha);

    const tdNombre = document.createElement('td');
    tdNombre.textContent = cliente ? cliente.nombre : '—';
    tr.appendChild(tdNombre);

    const tdPlaca = document.createElement('td');
    tdPlaca.textContent = cliente ? (cliente.placa || '—') : '—';
    tr.appendChild(tdPlaca);

    const tdVehiculo = document.createElement('td');
    tdVehiculo.textContent = VEHICULOS_INFO[lavado.tipo_vehiculo]
      ? VEHICULOS_INFO[lavado.tipo_vehiculo].label
      : '—';
    tr.appendChild(tdVehiculo);

    const tdTipo = document.createElement('td');
    tdTipo.textContent = TIPOS_INFO[lavado.tipo]
      ? TIPOS_INFO[lavado.tipo].label
      : capitalizar(lavado.tipo || '—');
    tr.appendChild(tdTipo);

    const tdLavador = document.createElement('td');
    tdLavador.textContent = lavado.nombre_lavador || '—';
    tr.appendChild(tdLavador);

    const tdPago = document.createElement('td');
    tdPago.textContent = labelPago(lavado.metodo_pago);
    tr.appendChild(tdPago);

    const tdCosto = document.createElement('td');
    if (lavado.fue_gratis) {
      const span = document.createElement('span');
      span.className = 'free-tag';
      span.textContent = 'GRATIS';
      tdCosto.appendChild(span);
    } else {
      tdCosto.textContent = 'S/ ' + Number(lavado.costo).toFixed(2);
    }
    tr.appendChild(tdCosto);

    tbody.appendChild(tr);
  });
}
