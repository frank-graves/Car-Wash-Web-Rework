# NOTAS FASE 4 — Car-Wash-Web-Rework

## Resumen de cambios

### Creados
| Archivo | Cambio |
|---|---|
| `firestore.indexes.json` | Índices simples para `clientes.nombre`, `lavados.fecha`, `lavadores.nombre`. |
| `tests/domain.test.mjs` | Tests de `evaluarGratis`, `formatearFecha`, `labelPago`, `capitalizar`. |
| `tests/type-guards.test.mjs` | Tests de validaciones y type
```

Resultado esperado:

```

```

---

## Pendientes manuales (consolidado)

### F1-02 — Rotar API key

Sin acceso a Firebase Console. La key sigue en `public/src/js/config/firebase-config.js`.

### F1-05 — Assets vendor

Faltan en `public/assets/vendor/`:

- `firebase-app-compat.js` (v10.12.2)
- `firebase-auth-compat.js` (v10.12.2)
- `firebase-firestore-compat.js` (v10.12.2)
- `firebase-app-check-compat.js` (v10.12.2)
- `xlsx.full.min.js`

### F3-04 — App Check

Reemplazar `SITE_KEY_RECAPTCHA_V3` en `public/src/js/config/firebase-config.js` por la site key real y activar en Firebase Console.

### F3-05 / F2-06 — Eliminar duplicados

```
rm auth-guard.js auth
```

### F4-02 / F4-04 — Desplegar reglas e índices

```
firebase
```

---

## Hallazgos fuera de alcance (para Fase 5)

1. **`actualizarAcumulados` y `obtenerCliente` sin uso directo:** quedan como utilidades legacy; evaluar eliminación.
2. **Paginación con `onSnapshot`:** la primera página reacciona a cambios en vivo; las páginas adicionales son estáticas (`getDocs`). Un nuevo documento puede no aparecer si el usuario ya cargó más páginas. Evaluar cursor por documento en lugar de snapshot.
3. **Regla `update` de `clientes`:** valida solo `nombre` y `lavados_acumulados`, pero no `placa`/`telefono`. Endurecer con `request.resource.data.keys().hasOnly([...])`.
4. **`lavadores` sin `delete`/`update`:** aceptado en F4 por falta de UI de edición. Evaluar gestión de catálogo en Fase 5.
5. **Índices simples:** Firestore puede autogestionar estos índices; `firestore.indexes.json` es preventivo. Verificar si el deploy lo requiere.

---

## Riesgos pendientes

- **API key expuesta** hasta rotarse manualmente.
- **App Check sin site key real:** protección no activa.
- **Assets vendor faltantes:** la app no carga sin binarios.
- **Duplicados en raíz** si no se eliminan manualmente.
- **Despliegue no realizado:** los cambios locales no están en hosting.

```

</BDS:create
