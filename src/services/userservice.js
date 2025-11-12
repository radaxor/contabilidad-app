import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Crear o actualizar perfil de usuario
export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Verificar si el usuario ya existe
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Crear nuevo perfil
      await setDoc(userRef, {
        email: userData.email,
        nombre: userData.nombre || 'Usuario',
        role: userData.role || 'operador',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Perfil de usuario creado');
    } else {
      console.log('✅ Usuario ya existe');
    }
  } catch (error) {
    console.error('❌ Error al crear perfil:', error);
    throw error;
  }
};

// Obtener información del usuario
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log('Usuario no encontrado');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
};