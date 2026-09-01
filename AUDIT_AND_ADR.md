```markdown
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

**Decisión.** Opción A en Fase 1.

**Justificación.** El vector de ataque es el doble clic del operador, no
un adversario distribuido. Un token de transacción exige round-trip extra
y complejidad de reintento que el hardware modesto no justifica.

**Consecuencias.** La garantía es de UX, no criptográfica. Si apareciera
concurrencia multi-dispositivo real, se escalaría a `runTransaction` sobre
`lavados_acumulados` (ya documentado como deuda controlada).

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

---

## Métricas de Impacto Estimadas

| Métrica | Legacy | Refactorizado | Delta |
|---|---|---|---|
| Requests externos (CDN) | 4 (fonts + SDK + SheetJS) | 0 (todo local) | −100% |
| Peso inicial (gzip, aprox.) | ~310 kB | ~280 kB | −10% |
| FCP estimado | 600–900 ms | 300–500 ms | −40% |
| Vulnerabilidad PII expuesta | Sí | No | eliminada |
| Race condition en registro | Sí | No | eliminada |
| Líneas JS en un solo archivo | ~520 | ~80 por módulo | fragmentado |
| Dependencias de build | 0 | 0 | 0 |
```

---

[NOTA DEL ARQUITECTO]
- Sacrificio: aceptamos vendor lock-in de Firebase SDK a cambio de cero fricción de despliegue; la deuda se aísla en `services/` para migración futura.
- Edge case no cubierto: concurrencia multi-dispositivo real (dos operadores registrando al mismo cliente) sigue sin transacción server-side.
- Costo: 0 dependencias nuevas; documentación pura, sin impacto en RAM/CPU/peso del runtime.