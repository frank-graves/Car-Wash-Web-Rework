/** Acceso a Firestore: lecturas y escrituras con suscripciones. */

import { esStringValida, esNumeroPositivo } from '../utils/type-guards.js';
import {
  evaluarGratis, normalizarBusqueda, construirUpdateAcumulados
} from '../core/domain.js';

/* Suscripciones con paginación (primera página vía onSnapshot, siguientes vía getDocs) */

export function suscribirseAClientesPaginado(db, alCambiar, limite = 50) {
  return db.collection('clientes')
    .orderBy('nombre')
    .limit(limite)
    .onSnapshot(snapshot => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const ultimoDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      alCambiar(docs, ultimoDoc);
    });
}

export function suscribirseALavadosPaginado(db, alCambiar, limite = 50) {
  return db.collection('lavados')
    .orderBy('fecha', 'desc')
    .limit(limite)
    .onSnapshot(snapshot => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const ultimoDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      alCambiar(docs, ultimoDoc);
    });
}

export async function cargarMasClientes(db, ultimoDoc, limite = 50) {
  const snapshot = await db.collection('clientes')
    .orderBy('nombre')
    .startAfter(ultimoDoc)
    .limit(limite)
    .get();
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const ultimo = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { docs, ultimoDoc: ultimo };
}

export async function cargarMasLavados(db, ultimoDoc, limite = 50) {
  const snapshot = await db.collection('lavados')
    .orderBy('fecha', 'desc')
    .startAfter(ultimoDoc)
    .limit(limite)
    .get();
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const ultimo = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  return { docs, ultimoDoc: ultimo };
}

/* Búsqueda de clientes server-side, insensible a mayúsculas vía nombre_lower */

export async function buscarClientes(db, termino, limite = 20) {
  const terminoLower = normalizarBusqueda(termino);
  if (!terminoLower) return [];
  const snapshot = await db.collection('clientes')
    .where('nombre_lower', '>=', terminoLower)
    .where('nombre_lower', '<=', terminoLower + '\uf8ff')
    .limit(limite)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/* Lavadores como catálogo */

export function suscribirseALavadores(db, alCambiar) {
  return db.collection('lavadores')
    .orderBy('nombre')
    .onSnapshot(snapshot => {
      const lavadores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      alCambiar(lavadores);
    });
}

export async function crearLavador(db, { nombre }) {
  if (!esStringValida(nombre, 80)) throw new Error('El nombre del lavador es obligatorio (máx 80 caracteres)');
  const ref = await db.collection('lavadores').add({ nombre: nombre.trim() });
  return ref.id;
}

/* Clientes y lavados */

export async function crearClienteNuevo(db, { nombre, placa, telefono }) {
  if (!esStringValida(nombre, 80)) throw new Error('El nombre del cliente es obligatorio (máx 80 caracteres)');
  const ref = await db.collection('clientes').add({
    nombre: nombre.trim(),
    nombre_lower: normalizarBusqueda(nombre),
    placa: placa.trim(),
    telefono: telefono.trim(),
    lavados_acumulados: 0,
    fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

export async function registrarLavadoTransaccional(db, despachadorLavado) {
  const {
    clienteId, tipoVehiculo, tipo, costo, nombreLavador, lavadorId, metodoPago
  } = despachadorLavado;

  if (!esStringValida(clienteId)) throw new Error('clienteId inválido');
  if (!esStringValida(tipoVehiculo) || !esStringValida(tipo)) throw new Error('Datos de lavado incompletos');

  const clienteRef = db.collection('clientes').doc(clienteId);
  const lavadoRef = db.collection('lavados').doc();
  let fueGratisResultado = false;

  await db.runTransaction(async (transaction) => {
    const clienteSnap = await transaction.get(clienteRef);
    if (!clienteSnap.exists) throw new Error('Cliente no encontrado');
    const clienteData = clienteSnap.data();
    const acumulados = esNumeroPositivo(clienteData.lavados_acumulados)
      ? clienteData.lavados_acumulados
      : 0;
    const esGratis = evaluarGratis(acumulados);
    const costoFinal = esGratis ? 0 : costo;
    const nuevosAcumulados = esGratis ? 0 : acumulados + 1;

    fueGratisResultado = esGratis;

    const nuevoLavado = {
      cliente_id: clienteId,
      tipo_vehiculo: tipoVehiculo,
      tipo,
      costo: costoFinal,
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      fue_gratis: esGratis,
      nombre_lavador: nombreLavador || '',
      metodo_pago: metodoPago || ''
    };
    if (lavadorId) nuevoLavado.lavador_id = lavadorId;

    const datosUpdate = construirUpdateAcumulados(clienteData, nuevosAcumulados);

    transaction.update(clienteRef, datosUpdate);
    transaction.set(lavadoRef, nuevoLavado);
  });

  return { id: lavadoRef.id, fueGratis: fueGratisResultado };
}
