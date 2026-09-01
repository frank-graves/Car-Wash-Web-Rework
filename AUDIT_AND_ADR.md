# Auditoría Técnica & Registro de Decisiones (ADR)

## Diagnóstico Inicial — Post-Mortem de la Versión Legacy

La versión monolítica presentaba tres clases de defecto estructural:

1. **Race condition en mutación de estado.** El despachador de lavado
   carecía de bloqueo atómico. Dos eventos `click` consecutivos producían
   doble inserción en `lavados` y doble incremento de `lavados_acumulados`,
   corrompiendo la tarjeta 6+1. La corrección no fue cosmética: se pasó de
   "confiar en el usuario" a **Idempotent Execution** con guarda `disabled`
   y restauración garantizada vía `finally`.

2. **Exposición de PII en el cliente.** `onSnapshot` sobre `clientes` y
   `lavados` operaba sin barrera de autenticación. Placas, teléfonos y
   montos eran legibles abriendo DevTools. La solución fue doble:
   **Auth Guard** en la capa de presentación y **Firestore Security Rules**
   en la capa de datos. La defensa real vive en el servidor; el guardián
   del cliente es solo ergonomía.

3. **Desalineación de esquema y render.** Las columnas `lavador` y
   `metodo_pago` existían en la UI pero no se persistían ni renderizaban.
   Firestore es schemaless: la corrección consistió en normalizar las
   llaves (`nombre_lavador`, `metodo_pago`) y aplicar *fallback seguro*
   (`|| '—'`) para documentos legacy.

---

## Architectural Decision Records

### ADR-001 — Firebase Hosting vs. Migración de Infraestructura

**Contexto.** El prototipo ya vive en Firebase (Hosting, Firestore).
Migrar a VPS self-hosted implicaría reconstruir auth, sincronización
realtime y pipeline de deploy.

**Decisión.** Permanecer en Firebase Hosting.

**Justificación.** El costo de fricción de una migración supera el
beneficio de soberanía total en esta etapa. Se mitiga el *vendor lock-in*
manteniendo el dominio separado del SDK (módulos `core/` y `services/`
permiten intercambiar el backend sin tocar la UI).

**Consecuencias.** Aceptamos CDNs de Google para el SDK Firebase como
dependencia inevitable de plataforma, compensada con self-hosting del
resto de assets.

### ADR-002 — Idempotencia por `btn.disabled` vs. Tokens de Transacción

**Contexto.** La duplicación de registros exigía una garantía de
ejecución única.

**Opción A:** `btn.disabled` en cliente.
**Opción B:** idempotency keys + transacción server-side (`runTransaction`).

**Decisión.** Opción A en Fase 1, escalada a Opción B en Fase 2.

**Justificación.** El vector de ataque inicial era el doble clic del
operador. El token de transacción exige round-trip extra y complejidad
que no se justificaba en hardware modesto. En Fase 2 se implementa
`runTransaction` para cerrar la brecha TOCTOU en concurrencia real.

**Consecuencias.** La garantía es de UX, no criptográfica. Con
`registrarLavadoTransaccional` la atomicidad queda en el servidor.

### ADR-003 — ES6 Modules nativos vs. Bundlers (Vite/Webpack)

**Contexto.** El monolito `index.html` concentraba 500+ líneas de JS.
La refactorización exigía modularidad sin penalizar el entorno de
desarrollo (dual-core, 4 GB RAM).

**Opción A:** Vite/Webpack.
**Opción B:** ES6 Modules nativos + `<script type="module">`.

**Decisión.** Opción B.

**Justificación.** Zero-Build System: el navegador es el bundler. Se
elimina la cadena de tooling (node_modules, watchers, HMR) y el FCP no
paga coste de parseo de un bundle. La modularidad se logra con
*zero-cost abstractions*: imports estáticos resueltos nativamente.

**Consecuencias.** Sin tree-shaking automático; se mitiga con imports
quirúrgicos por dominio. Sin soporte para navegadores legacy (aceptado).

### ADR-004 — Estructura `public/` como raíz de hosting

**Contexto.** La Fase 1 expuso archivos innecesarios (`src/`, `tests/`,
documentación) al hosting público. Era un riesgo de fuga de información
y código no transpilado.

**Decisión.** Mover todos los assets servibles a `public/` y apuntar
`firebase.json` a esa carpeta.

**Justificación.** Separación clara entre lo que se despliega y lo que
no. Evita exponer tests, configuraciones y documentación interna.
Mantiene la simplicidad de ES6 Modules: las rutas relativas dentro de
`public/` no cambian.

**Consecuencias.** Los archivos de raíz (`auth-guard.js`,
`auth-guard.test.js`, `AUDIT_AND_ADR.md`, `NOTAS_*.md`) quedan fuera del
deploy. Los tests importan desde `public/src/js/...`.

### ADR-005 — Paginación mixta: separar base live de páginas extra

**Contexto.** En F4-01 se introdujo paginación con `onSnapshot` para la
primera página y `getDocs` con `startAfter` para las siguientes. Al
coexistir ambos mecanismos, cualquier cambio en la primera página
disparaba `onSnapshot` y sobrescribía el estado completo, descartando
las páginas adicionales ya cargadas.

**Decisión.** Separar el estado en `paginaBase` (viva, actualizada por
`onSnapshot`) y `paginasExtra` (estática, acumulada manualmente).
`catalogo` pasa a ser derivado: `[...base, ...extra]`. Ante un cambio en
la base, se limpian las páginas extra para evitar desalineación.

**Justificación.** La simplicidad de la primera implementación
sacrificaba consistencia. Separar la fuente de verdad reactiva de la
acumulación manual permite conservar la paginación sin perder
documentos ni mezclar datos obsoletos.

**Consecuencias.** Las páginas extra se invalidan ante cambios en la
base; el usuario debe volver a pulsar "Cargar más". Es una compensación
aceptable para una app de operación local, documentada como deuda.

### ADR-006 — `nombre_lower` para búsqueda insensible a mayúsculas

**Contexto.** Firestore no ofrece búsqueda full-text ni case-insensitive.
El `where` por rango sobre `nombre` es sensible a mayúsculas. Para que
"juan" encuentre "Juan Pérez", se necesita un campo normalizado.

**Decisión.** Añadir `nombre_lower` en `clientes`, generado en
`crearClienteNuevo` con `nombre.trim().toLowerCase()`. La búsqueda usa
`where('nombre_lower', '>=', terminoLower).where('nombre_lower', '<=', terminoLower + '\uf8ff')`.

**Migración automática.** La migración de clientes legacy es automática:
al registrar un lavado, si `nombre_lower` falta, la transacción lo añade
derivado de `nombre` mediante `construirUpdateAcumulados`. No se requiere
script manual. El primer lavado post-despliegue deja al cliente listo
para búsquedas.

**Consecuencias.** Los clientes legacy sin `nombre_lower` no aparecen en
búsqueda hasta su primer lavado. La regla `hasOnly` de `clientes` incluye
`nombre_lower` y exige que esté presente en `create` y `update`. Los
updates futuros de `clientes` deben incluir todos los campos de `hasOnly`
o la regla debe ajustarse.

**Advertencia explícita.** La regla `allow create, update` con `hasOnly`
significa que cualquier `update` debe enviar **todos** los campos listados,
no solo el campo a modificar. Hoy la única operación de `update` es
`construirUpdateAcumulados`, que incluye `lavados_acumulados` y, si falta,
`nombre_lower`. Si en el futuro se implementa edición de clientes, la
regla debe cambiarse o los updates deben enviar el documento completo.
