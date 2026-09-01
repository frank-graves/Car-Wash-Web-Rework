# NOTAS FASE 1 — Car-Wash-Web-Rework

## Estado: COMPLETADA salvo F1-02 (rotación manual de API key)

---

## Resumen de cambios ejecutados

### Seguridad
| Tarea | Estado | Detalle |
|---|---|---|
| F1-01 — Firestore Security Rules | ✅ | `firestore.rules` creado: `clientes` y `lavados` requieren `request.auth != null`. |
| F1-02 — Rotar API key | ⚠️ PENDIENTE | Requiere acceso manual a Firebase Console. Ver sección abajo. |
| F1-06 — `escaparHTML()` en renders | ✅ | `public/src/js/utils/escape.js` creado; aplicado a `nombre`, `placa`, `telefono`, `nombre_lavador`, `metodo_pago`, `tipo` (fallback) en `render.js`. |

### Estructura de deploy
| Tarea | Estado | Detalle |
|---|---|---|
| F1-03 — Eliminar archivos muertos | ✅ | Eliminados `index.js` (raíz), `firebase - copia.json`, `index.html` (raíz), `src/` duplicado, `.firebase/` cache, `auth-guard.js`, `auth-guard.test.js`. |
| F1-04 — Restringir `firebase.json` a `public/` | ✅ | `hosting.public` cambiado de `"."` a `"public"`. |
| F1-05 — Assets vendor | ✅ | `firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`, `xlsx.full.min.js` ubicados en `public/assets/vendor/`. |

### Tests
| Cambio | Detalle |
|---|---|
| `tests/access-control.test.js` eliminado | Usaba `require` (CommonJS) sobre módulo ESM → fallaba. |
| `tests/access-control.test.mjs` creado | Importa `../public/src/js/core/access-control.js`. Resultado: **2/2 pass**. |

---

## Pendiente crítico: F1-02 — Rotar API key

**Motivo:** Sin acceso a Firebase Console. La key actual sigue en `public/src/js/config/firebase-config.js`.

**Pasos manuales:**
1. Firebase Console → Configuración del proyecto → Claves de API.
2. Rotar la key expuesta en GitHub (invalidar la actual).
3. Restringir por dominio HTTP: `localhost`, dominio de producción y dominios de preview.
4. Actualizar `public/src/js/config/firebase-config.js` con la nueva key.
5. Verificar que la key antigua ya no inicializa Firebase.

**Riesgo mientras no se ejecute:** Cualquier persona con la key expuesta puede inicializar Firebase. Las reglas F1-01 limitan el daño a usuarios autenticados, pero la rotación es obligatoria.

---

## Comandos de despliegue

```bash
# 1. Desplegar reglas de Firestore
firebase deploy --only firestore:rules

# 2. Desplegar hosting (publica solo public/)
firebase deploy --only hosting
```

**Verificación post-deploy:**

- Sin sesión, consulta directa a `clientes` o `lavados` → `PERMISSION_DENIED`.
- `/src/js/main.js` en hosting → 404.
- `/index.html` en hosting → carga la app.
- Consola sin errores 404 de vendor.
- Dato con `<img src=x onerror=alert(1)>` se renderiza como texto literal.

---

## Hallazgos para Fase 2

1. **Concurrencia multi-dispositivo:** `registrarLavado()` y `actualizarAcumulados()` son dos escrituras separadas sin transacción. ADR-002 lo documenta como deuda. Escalar a `runTransaction`.
2. **Reglas Firestore amplias:** `allow read, write` para cualquier autenticado permite borrar/editar documentos ajenos. Separar `read` de `write`, validar campos con `request.resource.data`, considerar roles.
3. **`lavador` como texto libre:** No existe colección `lavadores`; no hay reutilización ni validación de duplicados.
4. **`README.md` incompleto:** Existe pero sin instrucciones de setup, deploy ni arquitectura.
5. **Tests solo cubren `access-control`:** Falta cobertura para `domain.js`, `firestore-service.js`, `type-guards.js` y `escape.js`.
6. **Sin CI/CD:** El deploy es manual. Evaluar GitHub Actions para validar tests y desplegar reglas en cada push.

---

## Riesgos pendientes

- **F1-02 sin ejecutar:** Key expuesta sigue válida hasta rotarse manualmente.
- **Sin `firebase deploy` ejecutado:** La estructura local es correcta, pero el hosting remoto aún sirve la versión anterior hasta desplegar.

