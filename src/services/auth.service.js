import { auth, db, firebase } from './firebase';

const TASAS_INICIALES = {
  usdToBs: 36.50,
  usdtToUsd: 1.00,
  tasaVenta: 37.00
};

export const login = async (email, password) => {
  return await auth.signInWithEmailAndPassword(email, password);
};

export const registro = async (email, password) => {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const uid = userCredential.user.uid;
  
  await db.collection('usuarios').doc(uid).set({
    email: email,
    creadoEn: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  await db.collection('usuarios').doc(uid).collection('configuracion').doc('tasaVenta').set({ 
    valor: TASAS_INICIALES.tasaVenta 
  });
  
  await db.collection('usuarios').doc(uid).collection('configuracion').doc('tasaCambio').set({ 
    usdToBs: TASAS_INICIALES.usdToBs, 
    usdtToUsd: TASAS_INICIALES.usdtToUsd 
  });
  
  return userCredential;
};

export const logout = () => {
  return auth.signOut();
};

export const observarAutenticacion = (callback) => {
  return auth.onAuthStateChanged(callback);
};