/** Acceso a Firestore: lecturas y escrituras con suscripciones. */

import { esStringValida, esNumeroPositivo } from '../utils/type-guards.js';

export function suscribirseAClientes(db, alCambiar) {
  return db.collection('clientes').onSnapshot(snapshot => {
    const catalogoClientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    alCambiar(catalogoClientes);
  });
}

export function suscribirseALavados(db, alCambiar) {
  return db.collection('lavados').onSnapshot(snapshot => {
    const catalogoLavados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    alCambiar(catalogoLavados);
  });
}

export async function crearClienteNuevo(db, { nombre, placa, telefono }) {
  if (!esStringValida(nombre)) throw new Error('El nombre del cliente es obligatorio');
  const ref = await db.collection('clientes').add({
    nombre: nombre.trim(),
    placa: placa.trim(),
    telefono: telefono.trim(),
    lavados_acumulados: 0,
    fecha_registro: new Date()
  });
  return ref.id;
}

export async function obtenerCliente(db, clienteId) {
  const snapshot = await db.collection('clientes').doc(clienteId).get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function actualizarAcumulados(db, clienteId, acumulados) {
  if (!esStringValida(clienteId)) throw new Error('clienteId inválido');
  if (!esNumeroPositivo(acumulados)) throw new Error('acumulados inválido');
  await db.collection('clientes').doc(clienteId).update({ lavados_acumulados: acumulados });
}

export async function registrarLavado(db, despachadorLavado) {
  const {
    clienteId, tipoVehiculo, tipo, costo, fueGratis, nombreLavador, metodoPago
  } = despachadorLavado;

  if (!esStringValida(clienteId)) throw new Error('clienteId inválido');
  if (!esStringValida(tipoVehiculo) || !esStringValida(tipo)) throw new Error('Datos de lavado incompletos');

  await db.collection('lavados').add({
    cliente_id: clienteId,
    tipo_vehiculo: tipoVehiculo,
    tipo,
    costo,
    fecha: new Date(),
    fue_gratis: fueGratis === true,
    nombre_lavador: nombreLavador || '',
    metodo_pago: metodoPago || ''
  });
}