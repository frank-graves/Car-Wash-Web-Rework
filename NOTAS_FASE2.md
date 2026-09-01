# NOTAS FASE 2 — Car-Wash-Web-Rework

## Resumen de cambios

### Creados
| Archivo | Cambio |
|---|---|
| `public/src/js/services/firestore-service.js` | Añadida `registrarLavadoTransaccional` con `runTransaction`. Actualizados `crearClienteNuevo` y `registrarLavado` a `serverTimestamp()`. |
| `public/src/js/main.js` | Usa `registrarLavadoTransaccional`, errores genéricos, validación con máximos, `evaluarGratis`. |
| `public/src/js/core/domain.js` | Añadida `evaluarGratis`. `formatearFecha` soporta Timestamp, Date, string ISO. |
| `public/src/js/utils/type-guards.js` | `esStringValida` acepta `maxLongitud` y rechaza `<` `>`. |
| `public/src/js/ui/render.js` | Usa `evaluarGratis` para sello 7. |
| `tests/access-control.test.mjs` | Actualizado (ya apuntaba a `public/`). |
| `AUDIT_AND_ADR.md` | Rutas actualizadas y añadido ADR-004. |

### Eliminados (acción manual requerida)
| Archivo | Motivo |
|---|---|
| `auth-guard.js` (raíz) | Duplicaba `public/src/js/core/access-control.js`. |
| `auth-guard.test.js` (raíz) | Ídem. |

**Nota:** La eliminación debe hacerse manualmente con:
```bash
rm auth-guard.js auth-guard.test.js
```

No se incluye en el ZIP porque no se pueden eliminar archivos vía `create_file`.

---

## Tareas completadas

- **F2-01 — Atomicidad:** `registrarLavadoTransaccional` usa `runTransaction` para actualizar acumulados y crear lavado en el mismo lote. `main.js` lo consume.
- **F2-02 — Mensajes de error:** El `catch` del registro muestra toast genérico y loguea el detalle con `console.error`.
- **F2-03 — Validación:** `esStringValida` limita longitud y rechaza `<`/`>`. Aplicada a nombre, placa, teléfono y lavador en `main.js`.
- **F2-04 — Coherencia tarjeta gratuita:** `evaluarGratis` centraliza la condición `>= 6`. Usada en `revisarSiGratis`, transacción y render.
- **F2-05 — Timestamps de servidor:** `crearClienteNuevo` y `registrarLavado` usan `FieldValue.serverTimestamp()`. `formatearFecha` soporta ambos formatos.
- **F2-06 — Saneamiento:** Se documenta eliminación de duplicados; tests actualizados; ADR-004 registrado.

---

## Comandos de test

```
node --test tests/access-control.test.mjs
```

Resultado esperado: **2/2 pass**.

---

## Hallazgos fuera de alcance (para Fase 3)

1. **Reglas Firestore aún amplias:** `allow read, write` para cualquier autenticado permite editar/borrar documentos ajenos. Separar `read` de `write`, validar campos con `request.resource.data`, considerar roles.
2. **`lavador` como texto libre:** No existe colección `lavadores`; no hay reutilización ni validación de duplicados.
3. **Cobertura de tests insuficiente:** Solo `access-control` está cubierto. Falta `domain.js`, `firestore-service.js`, `type-guards.js`, `escape.js`.
4. **Sin CI/CD:** El deploy es manual. Evaluar GitHub Actions para tests y deploy de reglas.
5. **Rotación de API key aún pendiente (F1-02):** Sigue sin ejecutarse por falta de acceso a consola.

---

## Riesgos pendientes

- **API key expuesta** hasta rotarse manualmente.
- **`auth-guard.js` y `auth-guard.test.js`** siguen en raíz si no se eliminan manualmente.
- **Despliegue no realizado:** Los cambios locales no están en hosting hasta ejecutar `firebase deploy`.

