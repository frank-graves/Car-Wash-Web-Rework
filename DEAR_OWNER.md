# PR — Auditoría y Refactorización del Car Wash Web

**Autor:** Practicante — [tu nombre]  
**Proyecto:** `laurallontop514-code/Car-Wash-Web`  
**Stack:** Firebase (Auth + Firestore + Hosting) + ES6 Modules nativos + SheetJS autohospedado

---

## 1. Resumen ejecutivo del PR

**Problemas detectados en la versión anterior:**

| # | Problema | Riesgo |
|---|----------|--------|
| 1 | PII expuesta en el cliente (`onSnapshot` sin auth) | Placas, teléfonos y montos legibles desde DevTools |
| 2 | Race condition en registro de lavado | Doble inserción y tarjeta 6+1 corrupta |
| 3 | Deploy roto (HTML servía toda la raíz) | `src/`, tests y backups expuestos en hosting |
| 4 | XSS por interpolación directa en `innerHTML` | Datos de Firestore podían ejecutar script |

**Correcciones aplicadas:**

- 🔒 **Seguridad:** Firestore Rules + Auth Guard + App Check + escapado XSS.
- ⚛️ **Atomicidad:** `runTransaction` reemplaza la secuencia de escrituras sueltas.
- 📦 **Deploy:** todo lo servible vive en `public/`; `firebase.json` apunta solo ahí.
- 🧪 **Testing:** 24 tests unitarios + smoke tests manuales documentados.

**Score de salud estimado:** `3/10 → 8/10`  
*(No es 10/10: quedan deudas documentadas en la sección 6.)*

---

## 2. Cambios principales

### 🔒 Seguridad

| Archivo | Cambio | Motivo |
|---------|--------|--------|
| `firestore.rules` | `read`/`create`/`update` separados; `hasOnly` valida campos; `delete: false` | Evitar acceso anónimo y escrituras maliciosas |
| `public/src/js/config/firebase-config.js` | Inicialización condicional de App Check | Blindar `apiKey` contra abuso externo |
| `public/src/js/utils/escape.js` | Nuevo `escaparHTML()` | Neutralizar XSS en renders |
| `public/src/js/ui/render.js` | Reescrito con `createElement`/`textContent` | Eliminar `innerHTML` con datos dinámicos |

### 🏗️ Arquitectura

| Archivo | Cambio | Motivo |
|---------|--------|--------|
| `public/src/js/services/firestore-service.js` | `registrarLavadoTransaccional` con `runTransaction` | Atomicidad en lavado + acumulados |
| `public/src/js/core/domain.js` | `evaluarGratis`, `normalizarBusqueda`, `construirUpdateAcumulados` | Centralizar reglas de negocio |
| `public/src/js/core/validators.js` | Nuevo: validación pura de cliente y lavador | Separar lógica de I/O y DOM |
| `public/src/js/main.js` | Consume validators y servicio transaccional | Eliminar validación inline duplicada |

### ⚡ Rendimiento

| Archivo | Cambio | Motivo |
|---------|--------|--------|
| `public/src/js/services/firestore-service.js` | Paginación con `onSnapshot` + `startAfter` (50/docs) | No cargar colecciones completas |
| `public/src/js/main.js` | Estado `paginaBase`/`paginasExtra` separado | Evitar que `onSnapshot` pise páginas cargadas |
| `public/src/js/services/firestore-service.js` | `buscarClientes` con `where` sobre `nombre_lower` | Búsqueda server-side con debounce |

### 🧪 Testing

| Archivo | Cambio | Motivo |
|---------|--------|--------|
| `tests/access-control.test.mjs` | Corregido a ESM y ruta `public/` | El test anterior usaba CommonJS roto |
| `tests/validators.test.mjs` | Nuevo: 4 tests de validación | Cubrir reglas de negocio |
| `tests/domain.test.mjs` | Nuevo: 12 tests de dominio | Cubrir `evaluarGratis`, fechas, búsqueda |
| `tests/type-guards.test.mjs` | Nuevo: 6 tests de utilidades | Cubrir validaciones defensivas |
| `.github/workflows/tests.yml` | CI/CD: corre tests en cada push | Validación automática en GitHub |

---

## 3. Verificación rápida para el revisor

### Ejecutar tests

```bash
node --test tests/
```

**Resultado esperado:**

```
✔ access-control: 2 tests
✔ domain: 12 tests
✔ type-guards: 6 tests
✔ validators: 4 tests
tests 24
pass 24
fail 0
```

### Archivos críticos a revisar primero

1. `firestore.rules` — reglas de acceso y validación de campos.
2. `public/src/js/services/firestore-service.js` — transacción y paginación.
3. `public/src/js/ui/render.js` — render seguro sin `innerHTML` dinámico.
4. `public/src/js/main.js` — orquestación y manejo de estado.

### Detección rápida de roturas

- `grep -r "innerHTML" public/src/js/ui/render.js` → solo debe aparecer en plantillas estáticas (`renderVehiculos`, `renderTiposLavado`), nunca con datos de Firestore.
- `grep -r "console.log" public/src/js/` → no debe haber ninguno; solo `console.error` en catches.
- `grep -r "auth-guard\|access-control.test" public/ tests/` → no debe haber referencias rotas.

---

## 4. Pasos manuales que SOLO el owner puede hacer

> Estos pasos requieren acceso a Firebase Console o descarga de binarios. No se pudieron automatizar en el PR.

| # | Paso | Dónde | Documentación |
|---|---|---|---|
| 1 | Rotar API key expuesta | Firebase Console → Configuración → Claves de API | `CHECKLIST_DESPLEGUE.md` §1.1 |
| 2 | Descargar assets vendor (5 binarios) | `public/assets/vendor/` | `CHECKLIST_DESPLEGUE.md` §1.2 |
| 3 | Activar App Check con reCAPTCHA v3 | Firebase Console → App Check | `CHECKLIST_DESPLEGUE.md` §1.3 |
| 4 | Eliminar archivos duplicados | Raíz del repo | `CHECKLIST_DESPLEGUE.md` §1.4 |
| 5 | Desplegar reglas e índices | `firebase deploy` | `CHECKLIST_DESPLEGUE.md` §2 |

**Por qué no se automatizaron:** la API key real, la site key de App Check y los binarios vendor no pueden generarse desde un PR sin exponer secretos o depender de descargas externas.

---

## 5. Cómo probar antes de aprobar

### Levantar localmente

```
firebase login
firebase serve --only hosting
```

Abre `http://localhost:5000`.

### Flujos mínimos a probar

1. **Login:** con usuario creado en Authentication → cierra overlay y muestra "Cerrar sesión".
2. **Registro de lavado:** con cliente existente y con cliente nuevo → historial se actualiza.
3. **Tarjeta 6+1:** cliente con 5 acumulados muestra aviso GRATIS; con 6, el lavado sale gratis.
4. **Búsqueda:** "juan" encuentra "Juan Pérez" (case-insensitive).
5. **Exportación:** descarga Excel con 3 hojas (`Lavados`, `Clientes`, `Lavadores`).

### Documentos de apoyo

- `SMOKE_TEST.md` — suite completa de smoke tests con escenarios PASS/FAIL.
- `CHECKLIST_DESPLEGUE.md` — guía detallada de despliegue y verificación.

---

## 6. Riesgos y consideraciones

### Deuda técnica pendiente

| Deuda | Impacto | Mitigación actual |
|---|---|---|
| Búsqueda por prefijo (no subcadena) | `where` con rango solo encuentra inicios de palabra | Aceptado; full-text requeriría Algolia/Typesense |
| Paginación reactiva limitada | Páginas extra se invalidan ante cambios en la base | Limpieza automática y botón "Cargar más" |
| Tests de `firestore-service.js` sin emulador | Lógica transaccional no cubierta por unit tests | Documentado como pendiente; smoke tests manuales cubren el flujo |
| `hasOnly` en `update` de `clientes` | Futuros updates deben enviar documento completo | ADR-006 documenta la restricción |

### Lo que NO se cambió (y por qué)

- **Firebase como stack:** decisión de superiores; no se migró a self-hosted.
- **ES6 Modules nativos sin bundler:** se mantuvo por restricción de hardware modesto y cero build.
- **Estructura de carpetas salvo `public/`:** se respetó el layout existente para minimizar el diff.

---

## 7. Preguntas para el revisor

1. **¿Tienes acceso a Firebase Console para rotar la API key?**
Si no, la key expuesta seguirá válida y el PR no estará completo.
2. **¿Prefieres mantener los vendor self-hosted o volver a CDN?**
La versión actual elimina dependencias externas en runtime (ADR-003), pero exige descargar 5 binarios manualmente.
3. **¿El dominio de producción es solo `firebaseapp.com`/`web.app` o hay dominio personalizado?**
Necesario para restringir la API key y App Check correctamente.
4. **¿Quieres que la migración de `nombre_lower` sea proactiva (script) o reactiva (auto al primer lavado)?**
La reactiva ya está implementada; la proactiva es opcional con `scripts/migrar_nombre_lower.mjs`.
5. **¿Apruebas la eliminación de `auth-guard.js` y `auth-guard.test.js`?**
Duplicaban la lógica de `public/src/js/core/access-control.js`; el test canónico está en `tests/access-control.test.mjs`.

---

**Listo para revisión.**

```

