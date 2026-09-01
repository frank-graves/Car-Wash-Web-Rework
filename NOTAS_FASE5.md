# NOTAS FASE 5 — Car-Wash-Web-Rework

## Resumen de cambios

### Modificados
| Archivo | Cambio |
|---|---|
| `public/src/js/main.js` | F5-00: separación `paginaBase`/`paginasExtra` para clientes y lavados. F5-03: búsqueda server-side con debounce 300 ms. F5-04: hoja `Lavadores` en exportación Excel. |
| `public/src/js/services/firestore-service.js` | F5-02: eliminadas `obtenerCliente`, `actualizarAcumulados` y `registrarLavado` (no transaccional). F5-03: añadida `buscarClientes`. |
| `firestore.rules` | F5-01: validación `hasOnly` en `clientes`, `lavados` y `lavadores`. |
| `AUDIT_AND_ADR.md` | Añadido ADR-005 sobre separación de paginación. |

### Creados
| Archivo | Cambio |
|---|---|
| `NOTAS_FASE5.md` | Este documento. |

---

## Tareas completadas

- **F5-00 — Regresión de paginación corregida:** la base live ya no pisa las páginas extra. Se limpian las extra cuando cambia la base y reaparece "Cargar más".
- **F5-01 — Reglas endurecidas:** `hasOnly` impide campos desconocidos en escrituras.
- **F5-02 — Código muerto eliminado:** `obtenerCliente`, `actualizarAcumulados`, `registrarLavado` no transaccional fuera del servicio.
- **F5-03 — Búsqueda server-side:** `buscarClientes` con `where` y debounce; no filtra en cliente.
- **F5-04 — Exportación:** el `.xlsx` incluye hoja `Lavadores` además de `Lavados` y `Clientes`.
- **F5-05 — ADR-005 documentado.**

---

## Comandos de test

```bash
node --test tests/
```

Resultado esperado: 20/20 pass (access-control, domain, type-guards, validators).
Sin cambios en tests; no se añadieron nuevas suites.

---

## Pendientes manuales (consolidado)

### F1-02 — Rotar API key

Sin acceso a Firebase Console. La key sigue expuesta en `public/src/js/config/firebase-config.js`.

### F1-05 — Assets vendor

Faltan en `public/assets/vendor/`:

- `firebase-app-compat.js` (v10.12.2)
- `firebase-auth-compat.js` (v10.12.2)
- `firebase-firestore-compat.js` (v10.12.2)
- `firebase-app-check-compat.js` (v10.12.2)
- `xlsx.full.min.js`

### F3-04 — App Check

Reemplazar `SITE_KEY_RECAPTCHA_V3` en `public/src/js/config/firebase-config.js` por la site key real y activar en Firebase Console.

### F3-05/F2-06 — Eliminar duplicados

```
rm auth-guard.js auth-guard.test.js tests/access-control.test.js
```

### F4-02/F4-04 — Desplegar reglas e índices

```
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## Hallazgos fuera de alcance (para Fase 6)

1. **`buscarClientes` es case-sensitive:** Firestore `where` compara exacto. Para búsqueda insensible a mayúsculas se requiere un campo `nombre_lower` y normalización en escritura.
2. **Validación `hasOnly` de `clientes` en `update`:** si en el futuro se actualiza solo `lavados_acumulados`, `hasOnly` exige que `nombre`, `placa`, `telefono` y `fecha_registro` también estén presentes en `request.resource.data`. La operación actual solo crea; no hay update. Documentar si se reintroduce.
3. **Debounce sin cancelación al desmontar:** el timer de búsqueda no se limpia al cerrar sesión. No es crítico, pero evaluar `clearTimeout` en sign-out.
4. **Paginación con `startAfter` y `onSnapshot`:** la base live puede cambiar el orden y hacer que `ultimoClienteVisible` apunte a un documento inexistente en la siguiente query. Mitigado limpiando extras, pero revisar bajo alta concurrencia.

---

## Riesgos pendientes

- **API key expuesta** hasta rotarse manualmente.
- **App Check sin site key real:** protección no activa.
- **Assets vendor faltantes:** la app no carga sin binarios.
- **Duplicados en raíz** si no se eliminan manualmente.
- **Despliegue no realizado:** los cambios locales no están en hosting.

