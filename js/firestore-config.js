// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYO96jQpui-2PgXFgfLV-_vcTH4u5ACEw",
  authDomain: "fotografias-77c27.firebaseapp.com",
  projectId: "fotografias-77c27",
  storageBucket: "fotografias-77c27.firebasestorage.app",
  messagingSenderId: "444095450643",
  appId: "1:444095450643:web:833af4cf80d4ad6ffd79e6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firebase Storage
const storage = getStorage(app);

// Export para usar en otros módulos
export { app, auth, storage };