# NOTAS FASE 7 — Car-Wash-Web-Rework

## Resumen de cambios

### Modificados
| Archivo | Cambio |
|---|---|
| `public/src/js/core/domain.js` | Añadida `construirUpdateAcumulados` (auto-migración pura). |
| `public/src/js/services/firestore-service.js` | `registrarLavadoTransaccional` usa `construirUpdateAcumulados`; la transacción añade `nombre_lower` a clientes legacy. |
| `tests/domain.test.mjs` | Añadidos tests de `construirUpdateAcumulados`. |
| `AUDIT_AND_ADR.md` | ADR-006 actualizado: migración automática documentada. |
| `CHECKLIST_DESPLEGUE.md` | Sección 1.5 reescrita: migración automática, sin pasos manuales. |

### Creados
| Archivo | Cambio |
|---|---|
| `NOTAS_FASE7.md` | Este documento. |

---

## Bug corregido

**F7-00 — Auto-migración de `nombre_lower` en la transacción.**

- **Problema:** la regla `update` de `clientes` exige `nombre_lower` en `hasOnly`.
  Un cliente legacy sin ese campo fallaba al intentar actualizar `lavados_acumulados`,
  rompiendo el registro de lavado.
- **Solución:** `construirUpdateAcumulados` detecta si falta `nombre_lower` y lo
  añade derivado de `nombre`. La transacción lo incluye siempre que haga falta.
- **Impacto:** clientes legacy quedan migrados automáticamente en su primer lavado.

---

## Tareas completadas

- **F7-00 — Auto-migración:** implementada en `construirUpdateAcumulados` y usada en la transacción.
- **F7-01 — Test unitario:** `construirUpdateAcumulados` cubierto en `domain.test.mjs` (2 casos).
- **F7-02 — ADR-006 actualizado:** migración automática documentada.
- **F7-03 — Checklist actualizado:** sin migración manual.
- **F7-04 — Notas:** este documento.

---

## Comandos de test

```bash
node --test tests/
```

Resultado esperado:

```
✔ access-control: 2 tests
✔ domain: 12 tests (incluye construirUpdateAcumulados)
✔ type-guards: 6 tests
✔ validators: 4 tests
tests 24
pass 24
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
⚙

---

## Hallazgos fuera de alcance (para Fase 8)

1. **Migración proactiva de `nombre_lower`:** la actual es reactiva (al primer lavado).
Si se quiere que todos los legacy aparezcan en búsqueda de inmediato, se requiere
un script con Admin SDK (fuera de alcance por ahora).
2. **Búsqueda por prefijo limitada:** `where` con rango solo encuentra prefijos, no
subcadenas. Para búsqueda completa se necesita Algolia/Typesense.
3. **`hasOnly` y updates de `clientes`:** cualquier edición futura debe enviar
documento completo o ajustar la regla (documentado en ADR-006).
4. **Tests de `firestore-service.js`:** requieren emulador; pendiente.

---

## Riesgos pendientes

- **API key expuesta** hasta rotarse manualmente.
- **App Check sin site key real:** protección no activa.
- **Assets vendor faltantes:** la app no carga sin binarios.
- **Despliegue no realizado:** cambios locales no están en hosting.

