# Scripts

## `migrar_nombre_lower.mjs`

Migración opcional y proactiva de clientes legacy.

### Requisitos
- Node 20+
- `firebase-admin` instalado localmente:
  ```bash
  npm install firebase-admin
```

- Cuenta de servicio con permisos de Firestore:

- Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.
- Guardar el JSON como `serviceAccount.json` (no commitear).

### Uso

```
GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/serviceAccount.json \
node scripts/migrar_nombre_lower.mjs
```

### Comportamiento

- Lee todos los documentos de `clientes`.
- Para cada uno sin `nombre_lower`, lo añade con `nombre.trim().toLowerCase()`.
- Usa concurrencia limitada a 10 para no saturar Firestore.
- Imprime total, migrados y omitidos.

### Nota

Esta migración **no es obligatoria**. La auto-migración implementada en F7
(`construirUpdateAcumulados`) añade `nombre_lower` al primer lavado de cada
cliente legacy. Este script es solo para migrar todo de una vez y que la
búsqueda funcione de inmediato para todos los clientes existentes.

