# NOTAS FASE 6 — Car-Wash-Web-Rework

## Resumen de cambios

### Modificados
| Archivo | Cambio |
|---|---|
| `public/src/js/core/domain.js` | Añadida `normalizarBusqueda`. |
| `public/src/js/services/firestore-service.js` | `buscarClientes` usa `nombre_lower`; `crearClienteNuevo` añade `nombre_lower`. |
| `public/src/js/main.js` | `timerBusqueda` movido a `estado` y limpiado en `detenerSuscripciones`. |
| `firestore.rules` | `clientes` incluye `nombre_lower` en `hasOnly` y valida string. |
| `tests/domain.test.mjs` | Añadidos tests de `normalizarBusqueda`. |
| `AUDIT_AND_ADR.md` | Añadido ADR-006 con advertencia sobre `hasOnly` en `update`. |

### Creados
| Archivo | Cambio |
|---|---|
| `CHECKLIST_DESPLEGUE.md` | Guía completa pre-despliegue, despliegue y post-despliegue. |
| `NOTAS_FASE6.md` | Este documento. |

---

## Tareas completadas

- **F6-00 — Búsqueda case-insensitive:** `nombre_lower` añadido; `buscarClientes` usa rango sobre ese campo.
- **F6-01 — Limpieza de debounce:** `estado.timerBusqueda` se limpia en `detenerSuscripciones`.
- **F6-02 — Documentación de `hasOnly`:** ADR-006 advierte sobre updates futuros.
- **F6-03 — Índices:** Confirmado que la búsqueda por prefijo sobre `nombre_lower` no requiere índice compuesto adicional.
- **F6-04 — Tests:** `normalizarBusqueda` cubierta en `domain.test.mjs`.
- **F6-05 — Checklist de despliegue:** creado.
- **F6-06 — Notas finales:** este documento.

---

## Comandos de test

```bash
node --test tests/
```

Resultado esperado:

```
✔ access-control: 2 tests
✔ domain: 10 tests (incluye normalizarBusqueda)
✔ type-guards: 6 tests
✔ validators: 4 tests
tests 22
pass 22
fail 0
```

---

## Pendientes manuales consolidados (bloqueantes)

| Tarea ↕▾ | Acción ↕▾ |
|---|---|
| −F1-02 — Rotar API key | Firebase Console → Claves de API → rotar y restringir por dominio. |
| −F1-05 — Assets vendor | Descargar 5 binarios a `public/assets/vendor/` (ver CHECKLIST). |
| −F3-04 — App Check | Activar reCAPTCHA v3, reemplazar site key, registrar dominios. |
| −F3-05/F2-06 — Eliminar duplicados | `rm auth-guard.js auth-guard.test.js tests/access-control.test.js`. |
| −F4-02/F4-04 — Desplegar reglas e índices | `firebase deploy --only firestore:rules` y `--only firestore:indexes`. |
| −F6-00 — Migrar clientes legacy | Añadir `nombre_lower` a clientes existentes (ver CHECKLIST). |
⚙

---

## Hallazgos fuera de alcance (para Fase 7)

1. **Migración automática de `nombre_lower`:** Un script con Admin SDK sería más robusto que edición manual.
2. **Búsqueda por prefijo limitada:** `where` con rango solo encuentra coincidencias de prefijo, no subcadenas. Para búsqueda completa se necesita Algolia/Typesense (fuera de alcance).
3. **`hasOnly` y updates de `clientes`:** Cualquier edición futura debe enviar documento completo o ajustar la regla.
4. **Paginación con cambios en vivo:** las páginas extra se invalidan; aceptado, pero bajo alta concurrencia puede ser confuso.
5. **Tests de `firestore-service.js`:** requieren emulador; pendiente.

---

## Riesgos pendientes

- **API key expuesta** hasta rotarse manualmente.
- **App Check sin site key real:** protección no activa.
- **Assets vendor faltantes:** la app no carga sin binarios.
- **Clientes legacy sin `nombre_lower`:** no aparecen en búsqueda hasta migrar.
- **Despliegue no realizado:** cambios locales no están en hosting.

