import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDiI5kjSiaCnJiegGkhGKYnVLY1tgfdlkk",
  authDomain: "contabilidad-app-4cd29.firebaseapp.com",
  projectId: "contabilidad-app-4cd29",
  storageBucket: "contabilidad-app-4cd29.firebasestorage.app",
  messagingSenderId: "182572888659",
  appId: "1:182572888659:web:e5f8366b0003a6a87bcca6"
};

let app, db, auth;

try {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  console.log("Firebase inicializado correctamente");
} catch (error) {
  console.error("Error al inicializar Firebase:", error);
}

export { app, db, auth, firebase };