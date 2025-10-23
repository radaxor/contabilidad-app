import { db, firebase } from './firebase';

export const crearTransaccion = async (datosTransaccion, usuario) => {
  const transaccion = {
    ...datosTransaccion,
    usuarioId: usuario.uid,
    creadoPor: usuario.email,
    creadoEn: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  return await db.collection('transacciones').add(transaccion);
};

export const eliminarTransaccion = async (id) => {
  return await db.collection('transacciones').doc(id).delete();
};

export const actualizarStatusTransaccion = async (id, nuevoStatus) => {
  return await db.collection('transacciones').doc(id).update({
    status: nuevoStatus
  });
};

export const observarTransacciones = (usuario, callback) => {
  return db.collection('transacciones')
    .where('usuarioId', '==', usuario.uid)
    .orderBy('fecha', 'desc')
    .onSnapshot(snapshot => {
      const datos = [];
      snapshot.forEach(doc => datos.push({ id: doc.id, ...doc.data() }));
      callback(datos);
    }, error => {
      console.error("Error al cargar transacciones:", error);
      db.collection('transacciones')
        .where('usuarioId', '==', usuario.uid)
        .onSnapshot(snapshot => {
          const datos = [];
          snapshot.forEach(doc => datos.push({ id: doc.id, ...doc.data() }));
          datos.sort((a, b) => b.fecha.localeCompare(a.fecha));
          callback(datos);
        });
    });
};