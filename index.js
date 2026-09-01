// Importar los módulos necesarios del SDK de Firebase (v10.12.2 para estar alineados con el HTML)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  Timestamp, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de tu proyecto en Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDAfC7KYoY_P3tVCeY_ljLrmPxt-fO4bh0",
  authDomain: "car-wash-7cc3d.firebaseapp.com",
  projectId: "car-wash-7cc3d",
  storageBucket: "car-wash-7cc3d.firebasestorage.app",
  messagingSenderId: "538896177028",
  appId: "1:538896177028:web:c948aaafe47631a839efd1"
};

// Inicializar la App y la base de datos Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias del DOM HTML
const formulario = document.getElementById("formulario");
const nombreInput = document.getElementById("nombre");
const listaRegistros = document.getElementById("listaRegistros");

// Guardar datos en Firestore al enviar el formulario
formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = nombreInput.value;

  try {
    await addDoc(collection(db, "usuarios"), {
      nombre: nombre,
      // Se guarda como un Timestamp nativo usando la hora del servidor
      fechaRegistro: serverTimestamp(),
      // Ejemplo alternativo: usando la fecha local convertida a Timestamp
      fechaCliente: Timestamp.fromDate(new Date())
    });

    console.log("Datos guardados con éxito.");
    nombreInput.value = "";
    obtenerRegistros(); // Actualizar la lista en pantalla
  } catch (error) {
    console.error("Error al guardar en Firestore:", error);
  }
});

// Función para obtener los datos de Firestore y renderizarlos
async function obtenerRegistros() {
  listaRegistros.innerHTML = ""; // Limpiar la lista antes de cargar

  try {
    const querySnapshot = await getDocs(collection(db, "usuarios"));

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Convertir el Timestamp de Firestore a Date de JS
      let fechaTexto = "Sin fecha";
      if (data.fechaRegistro) {
        const fechaJS = data.fechaRegistro.toDate();
        fechaTexto = fechaJS.toLocaleString("es-PE"); // Formato local Perú
      }

      // Crear elemento en la lista
      const li = document.createElement("li");
      li.textContent = `${data.nombre} - Fecha: ${fechaTexto}`;
      listaRegistros.appendChild(li);
    });
  } catch (error) {
    console.error("Error al obtener los registros:", error);
  }
}

// Cargar registros al iniciar la página
obtenerRegistros();