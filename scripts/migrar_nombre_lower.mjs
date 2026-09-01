/**
 * Migración proactiva de clientes legacy:
 * añade `nombre_lower` a documentos que no lo tienen.
 *
 * Requisitos:
 * - Node 20+
 * - Cuenta de servicio con permisos de Firestore
 * - `firebase-admin` instalado localmente (npm install firebase-admin)
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/serviceAccount.json \
 *   node scripts/migrar_nombre_lower.mjs
 */

import { readFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error('Falta GOOGLE_APPLICATION_CREDENTIALS. Define la ruta a la cuenta de servicio.');
  process.exit(1);
}

const cred = JSON.parse(await readFile(credPath, 'utf8'));
initializeApp({ credential: cert(cred) });
const db = getFirestore();

const LIMITE_CONCURRENCIA = 10;

function migrarUno(doc) {
  const data = doc.data();
  if (typeof data.nombre_lower === 'string') return { id: doc.id, migrado: false };
  const nombreLower = (data.nombre || '').trim().toLowerCase();
  return doc.ref.update({ nombre_lower: nombreLower }).then(() => ({ id: doc.id, migrado: true }));
}

async function migrarTodos() {
  const snapshot = await db.collection('clientes').get();
  const docs = snapshot.docs;
  let indice = 0;
  let migrados = 0;
  let omitidos = 0;

  async function worker() {
    while (indice < docs.length) {
      const doc = docs[indice++];
      try {
        const resultado = await migrarUno(doc);
        if (resultado.migrado) migrados++;
        else omitidos++;
      } catch (error) {
        console.error(`Error en ${doc.id}:`, error.message);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(LIMITE_CONCURRENCIA, docs.length) },
    () => worker()
  );
  await Promise.all(workers);

  console.log(`Total: ${docs.length}`);
  console.log(`Migrados: ${migrados}`);
  console.log(`Omitidos (ya tenían nombre_lower): ${omitidos}`);
}

migrarTodos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fallo la migración:', error);
    process.exit(1);
  });
