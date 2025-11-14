/* ===================================
   CONFIGURACIÓN DE FIREBASE - T&C GROUP
   =================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCYO96jQpui-2PgXFgfLV-_vcTH4u5ACEw",
  authDomain: "fotografias-77c27.firebaseapp.com",
  projectId: "fotografias-77c27",
  storageBucket: "fotografias-77c27.firebasestorage.app",
  messagingSenderId: "444095450643",
  appId: "1:444095450643:web:833af4cf80d4ad6ffd79e6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('✅ Firebase inicializado correctamente');

// Exportar servicios para usar en otros módulos
export { app, auth, db, storage };