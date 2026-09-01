# NOTAS FASE 8 — Car-Wash-Web-Rework

## Resumen de cambios

### Creados
| Archivo | Cambio |
|---|---|
| `SMOKE_TEST.md` | Suite de smoke tests manuales con escenarios PASS/FAIL. |
| `scripts/migrar_nombre_lower.mjs` | Migración opcional y proactiva de `nombre_lower` con Admin SDK. |
| `scripts/README.md` | Instrucciones del script de migración. |
| `NOTAS_FASE8.md` | Este documento. |

### Modificados
| Archivo | Cambio |
|---|---|
| `CHECKLIST_DESPLEGUE.md` | Integrada la ejecución de `SMOKE_TEST.md` y el script opcional de migración. |

---

## Tareas completadas

- **F8-00 — Smoke tests manuales:** `SMOKE_TEST.md` con 8 áreas y escenarios detallados.
- **F8-01 — Migración proactiva:** `scripts/migrar_nombre_lower.mjs` con concurrencia limitada y resumen.
- **F8-02 — Revisión de índices y reglas:** sin cambios necesarios. Los índices simples de `clientes.nombre`, `lavados.fecha` y `lavadores.nombre` son suficientes; no se requieren compuestos para las queries actuales. Las reglas cubren `clientes`, `lavados` y `lavadores`.
- **F8-03 — Checklist actualizado:** referencia a smoke tests y migración opcional.
- **F8-04 — Notas:** este documento.

---

## Estado de pendientes manuales (bloqueantes)

| Tarea | Estado |
|---|---|
| F1-02 — Rotar API key | Pendiente. Sin acceso a Firebase Console. |
| F1-05 — Assets vendor | Pendiente. Descargar 5 binarios a `public/assets/vendor/`. |
| F3-04 — App Check | Pendiente. Activar reCAPTCHA v3 y reemplazar site key. |
| F3-05/F2-06 — Eliminar duplicados | Pendiente. `rm auth-guard.js auth-guard.test.js tests/access-control.test.js`. |
| F4-02/F4-04 — Desplegar reglas e índices | Pendiente. `firebase deploy --only firestore:rules` y `--only firestore:indexes`. |

---

## Resultado esperado de smoke tests

**A completar por el operador tras el despliegue.**  
Si todos los escenarios en `SMOKE_TEST.md` son PASS, el despliegue queda validado.

---

## Riesgos residuales aceptados

1. **API key expuesta** hasta rotarse manualmente. Mitigación parcial: reglas de Firestore y App Check pendiente.
2. **App Check sin site key real:** protección no activa hasta configurarla.
3. **Assets vendor faltantes:** la app no carga sin binarios.
4. **Clientes legacy sin `nombre_lower`:** auto-migración reactiva al primer lavado; script proactivo opcional.
5. **Búsqueda por prefijo:** `where` con rango solo encuentra prefijos, no subcadenas (requiere Algolia/Typesense para full-text).
6. **`hasOnly` en updates de `clientes`:** cualquier edición futura debe enviar documento completo o ajustar la regla (documentado en ADR-006).

---

## Hallazgos fuera de alcance (para una eventual Fase 9)

1. **CI/CD con emulador de Firestore:** los tests unitarios no cubren `firestore-service.js`. Evaluar Firebase Emulator Suite.
2. **Búsqueda full-text:** Algolia/Typesense si se requiere búsqueda por subcadena.
3. **Gestión de lavadores:** no hay UI para editar/eliminar lavadores; la regla solo permite `create`.
4. **Migración proactiva automatizada:** incluir el script en el flujo de despliegue como paso opcional.
