# NOTAS FASE 3 — Car-Wash-Web-Rework

## Resumen de cambios

### Creados
| Archivo | Cambio |
|---|---|
| `public/src/js/core/validators.js` | Funciones puras `validarNuevoCliente`, `validarLavador`, `calcularCostoFinal`. |
| `tests/validators.test.mjs` | 4 tests unitarios para validators. |

### Modificados
| Archivo | Cambio |
|---|---|
| `public/src/js/services/firestore-service.js` | F3-01: `.orderBy('nombre').limit(200)` en clientes, `.orderBy('fecha','desc').limit(100)` en lavados. |
| `public/src/js/ui/render.js` | F3-03: `renderListaClientes` y `renderHistorial` reescritos con `createElement`/`textContent`. Sin `innerHTML` con datos Firestore. |
| `public/src/js/main.js` | F3-02: Consume `validators.js`. Eliminada validación inline. |
| `public/index.html` | F3-04: Añadido script `firebase-app-check-compat.js`. |
| `public/src/js/config/firebase-config.js` | F3-04: Inicialización condicional de App Check con placeholder `SITE_KEY_RECAPTCHA_V3`. |
| `tests/access-control.test.mjs` | Reconfirmado (sin cambios funcionales). |

### Eliminados (acción manual requerida)
| Archivo | Motivo |
|---|---|
| `auth-guard.js` (raíz) | Duplicado de `access-control.js`. |
| `auth-guard.test.js` (raíz) | Duplicado. |
| `tests/access-control.test.js` | CommonJS con ruta antigua a `src/`. |

**Comando manual:**
```bash
rm auth-guard.js auth-guard.test.js tests/access-control.test.js
```

---

## Tareas completadas

- **F3-01 — Paginación:** Suscripciones limitadas a 200 clientes y 100 lavados. La paginación con `startAfter` queda documentada como pendiente.
- **F3-02 — Funciones puras:** Lógica de validación y cálculo extraída a `validators.js`. `main.js` consume las funciones sin duplicar lógica.
- **F3-03 — Render seguro:** `renderListaClientes` y `renderHistorial` usan `createElement`/`textContent`. No hay `innerHTML` con variables dinámicas de Firestore.
- **F3-04 — App Check:** Script e inicialización condicional añadidos. Pendiente la site key real.
- **F3-05 — Limpieza:** Documentada; los archivos duplicados requieren eliminación manual.

---

## Comandos de test

```
node --test tests/
```

Resultado esperado:

```
✔ anónimo: bloquea historial y clientes, permite registrar
✔ autenticado: habilita historial y clientes
✔ cliente sin nombre → error
✔ placa con <> → error
✔ cliente con 6 lavados → gratis
✔ cliente con 3 lavados → no gratis, acumula 4
tests 6
pass 6
fail 0
```

---

## Pendientes manuales (consolidado)

### F1-02 — Rotar API key

Sin acceso a Firebase Console. La key sigue expuesta en `firebase-config.js`.

### F1-05 — Assets vendor

Los binarios deben estar en `public/assets/vendor/`. Faltan:

- `firebase-app-compat.js` (v10.12.2)
- `firebase-auth-compat.js` (v10.12.2)
- `firebase-firestore-compat.js` (v10.12.2)
- `firebase-app-check-compat.js` (v10.12.2) ← **nuevo en F3-04**
- `xlsx.full.min.js`

### F3-04 — App Check

Pasos manuales:

1. Firebase Console → App Check → Activar con reCAPTCHA v3.
2. Obtener la site key.
3. Reemplazar `SITE_KEY_RECAPTCHA_V3` en `public/src/js/config/firebase-config.js`.
4. Registrar dominios autorizados.

---

## Hallazgos fuera de alcance (para Fase 4)

1. **Paginación real:** `.limit(200)` y `.limit(100)` son topes duros. Con más documentos, los antiguos no se cargan. Implementar `startAfter` + botón "Cargar más".
2. **Reglas Firestore aún amplias:** `allow read, write` para cualquier autenticado. Separar `read` de `write`, validar campos con `request.resource.data`.
3. **`lavador` como texto libre:** Sin colección `lavadores`. Normalizar en catálogo.
4. **Índices compuestos:** Las queries `.orderBy('nombre')` y `.orderBy('fecha','desc')` pueden requerir índices compuestos en Firestore si se combinan con filtros. Verificar en consola.
5. **Cobertura de tests:** Solo `access-control` y `validators` cubiertos. Falta `domain.js`, `firestore-service.js`, `type-guards.js`.

---

## Riesgos pendientes

- **API key expuesta** hasta rotarse manualmente.
- **App Check sin site key real:** la protección no está activa hasta configurarla.
- **Assets vendor faltantes:** la app no carga sin los binarios.
- **Duplicados en raíz** si no se eliminan manualmente.
- **Despliegue no realizado:** los cambios locales no están en hosting.

