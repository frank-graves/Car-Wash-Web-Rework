# SMOKE TEST — Car-Wash-Web-Rework

Ejecutar en producción después del despliegue. Marcar cada escenario como PASS/FAIL.
Si algún escenario falla, detener y documentar en `NOTAS_FASE8.md`.

---

## 1. Autenticación

### 1.1 Login correcto
- **Pasos:** Abrir la app, ir a Clientes, ingresar correo y contraseña válidos, pulsar "Ingresar".
- **Resultado esperado:** La vista Clientes se muestra; el botón "Cerrar sesión" aparece.
- **Fallo si:** El overlay de login no se cierra o no se cargan datos.

### 1.2 Login incorrecto
- **Pasos:** Ingresar credenciales inválidas.
- **Resultado esperado:** Toast con mensaje de error ("Contraseña incorrecta", "Usuario no encontrado", etc.). No se accede a Clientes ni Historial.
- **Fallo si:** Se cierra el overlay o se muestran datos protegidos.

### 1.3 Logout
- **Pasos:** Pulsar "Cerrar sesión".
- **Resultado esperado:** Desaparece el botón de logout; Clientes e Historial vuelven a pedir login.
- **Fallo si:** Siguen visibles datos de clientes o historial.

---

## 2. Registro de lavado

### 2.1 Con cliente existente
- **Pasos:** Seleccionar cliente existente, elegir vehículo, tipo de lavado, método de pago, y lavador existente. Pulsar "Registrar lavado".
- **Resultado esperado:** Toast "Lavado registrado correctamente". El historial muestra el nuevo lavado. El acumulado del cliente incrementa.
- **Fallo si:** No aparece en historial o el acumulado no cambia.

### 2.2 Con cliente nuevo
- **Pasos:** Seleccionar "+ Nuevo cliente", llenar nombre, placa y teléfono. Elegir lavado y lavador. Registrar.
- **Resultado esperado:** El cliente se crea y aparece en el select y en la lista. El lavado queda registrado.
- **Fallo si:** El cliente no se guarda o el lavado falla.

### 2.3 Con lavador nuevo
- **Pasos:** En "Lavador", elegir "+ Nuevo lavador", escribir nombre. Registrar lavado.
- **Resultado esperado:** El lavador se crea, aparece en el select, y el lavado guarda `lavador_id` y `nombre_lavador`.
- **Fallo si:** El lavador no se guarda o el lavado falla.

---

## 3. Tarjeta 6+1

### 3.1 Aviso GRATIS en el sexto lavado
- **Precondición:** Cliente con 5 lavados acumulados.
- **Pasos:** Seleccionar el cliente en "Registrar Lavado".
- **Resultado esperado:** Aparece el aviso "🎉 Este cliente completó su tarjeta — este lavado es GRATIS."
- **Fallo si:** El aviso no aparece.

### 3.2 Séptimo lavado gratis
- **Precondición:** Cliente con 6 lavados acumulados.
- **Pasos:** Registrar un lavado para ese cliente.
- **Resultado esperado:** El costo final es 0. En historial aparece "GRATIS". El acumulado vuelve a 0.
- **Fallo si:** Se cobra el costo o el acumulado no se reinicia.

---

## 4. Búsqueda de clientes

### 4.1 Case-insensitive por nombre
- **Pasos:** En Clientes, escribir "juan" con minúsculas.
- **Resultado esperado:** Aparece "Juan Pérez" si existe.
- **Fallo si:** No aparece por diferencia de mayúsculas.

### 4.2 Por placa
- **Pasos:** Buscar por una placa existente.
- **Resultado esperado:** Aparece el cliente dueño de esa placa.
- **Fallo si:** No aparece.

---

## 5. Paginación

### 5.1 Cargar más clientes
- **Precondición:** Más de 50 clientes.
- **Pasos:** Ir a Clientes, pulsar "Cargar más clientes".
- **Resultado esperado:** Se añaden más clientes sin perder los anteriores. El botón desaparece al llegar al final.
- **Fallo si:** Se pierden clientes o el botón no carga.

### 5.2 Cargar más historial
- **Precondición:** Más de 50 lavados.
- **Pasos:** Ir a Historial, pulsar "Cargar más lavados".
- **Resultado esperado:** Se añaden más lavados sin perder los anteriores.
- **Fallo si:** Se pierden registros o el botón no carga.

---

## 6. Exportación Excel

### 6.1 Descarga con 3 hojas
- **Pasos:** Ir a Historial, pulsar "Exportar a Excel".
- **Resultado esperado:** Se descarga `.xlsx` con hojas `Lavados`, `Clientes`, `Lavadores`.
- **Fallo si:** Falta alguna hoja o no descarga.

---

## 7. Acceso anónimo

### 7.1 Redirección a login
- **Pasos:** Sin sesión iniciada, pulsar Clientes o Historial.
- **Resultado esperado:** Aparece el overlay de login. No se muestran datos.
- **Fallo si:** Se muestran datos protegidos.

### 7.2 Firestore bloqueado
- **Pasos:** En DevTools, intentar `db.collection('clientes').get()` sin sesión.
- **Resultado esperado:** Error `PERMISSION_DENIED`.
- **Fallo si:** Devuelve documentos.

---

## 8. App Check

### 8.1 Dominio no autorizado
- **Precondición:** App Check activado con reCAPTCHA v3 y site key real.
- **Pasos:** Intentar acceder desde un dominio no autorizado o simular token inválido.
- **Resultado esperado:** Firestore rechaza con `PERMISSION_DENIED` incluso con sesión iniciada.
- **Fallo si:** La app funciona sin token válido de App Check.

---

Fin de smoke tests.
