# CHECKLIST DE DESPLIEGUE — Car-Wash-Web-Rework

Sigue este checklist en orden para dejar la aplicación operativa en producción.

---

## 1. Pre-despliegue

### 1.1 Rotar API key (F1-02)
- Ve a Firebase Console → Configuración del proyecto → Claves de API.
- Rota la key expuesta en GitHub.
- Restringe por dominio HTTP: `localhost`, dominio de producción y dominios de preview.
- Actualiza `public/src/js/config/firebase-config.js` con la nueva key.

### 1.2 Descargar assets vendor (F1-05)
Ejecuta desde la raíz del proyecto:

```bash
mkdir -p public/assets/vendor
cd public/assets/vendor

curl -o firebase-app-compat.js        https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js
curl -o firebase-auth-compat.js       https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js
curl -o firebase-firestore-compat.js  https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js
curl -o firebase-app-check-compat.js  https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check-compat.js
curl -o xlsx.full.min.js              https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js
```

### 1.3 Configurar App Check (F3-04)

- En Firebase Console → App Check, activa con reCAPTCHA v3.
- Copia la site key.
- Reemplaza `SITE_KEY_RECAPTCHA_V3` en `public/src/js/config/firebase-config.js` por la site key real.
- Registra los dominios autorizados.

### 1.4 Eliminar archivos duplicados (F3-05/F2-06)

```
rm auth-guard.js auth-guard.test.js tests/access-control.test.js
```

### 1.5 Migración de clientes legacy

La migración es automática al registrar el primer lavado post-despliegue (ver ADR-006).

Opcionalmente, para migrar todos de una vez:

```
cd scripts
npm install firebase-admin
GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/serviceAccount.json node migrar_nombre_lower.mjs
```

---

## 2. Despliegue

```
# Desplegar reglas de Firestore
firebase deploy --only firestore:rules

# Desplegar índices (si es necesario)
firebase deploy --only firestore:indexes

# Desplegar hosting
firebase deploy --only hosting
```

---

## 3. Post-despliegue

### 3.1 Ejecutar smoke tests

Abre `SMOKE_TEST.md` y ejecuta los escenarios completos. Registra PASS/FAIL en cada uno.

- □  
Autenticación (login correcto, incorrecto, logout)
- □  
Registro de lavado (cliente existente, nuevo, lavador nuevo)
- □  
Tarjeta 6+1 (aviso GRATIS y lavado gratis)
- □  
Búsqueda case-insensitive y por placa
- □  
Paginación de clientes e historial
- □  
Exportación Excel con 3 hojas
- □  
Acceso anónimo bloqueado
- □  
App Check activa

### 3.2 Verificaciones adicionales

- □  
Sin sesión, consulta directa a `clientes` devuelve `PERMISSION_DENIED`.
- □  
`/src/js/main.js` en hosting devuelve 404.
- □  
No hay errores 404 de vendor en consola.
- □  
Un cliente legacy recibe `nombre_lower` automáticamente tras su primer lavado.

---

Fin del checklist.

