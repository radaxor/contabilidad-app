import { db } from './firebase';

const TASAS_INICIALES = {
  usdToBs: 36.50,
  usdtToUsd: 1.00,
  tasaVenta: 37.00
};

export const observarTasaVenta = (usuario, callback) => {
  return db.collection('usuarios')
    .doc(usuario.uid)
    .collection('configuracion')
    .doc('tasaVenta')
    .onSnapshot(doc => {
      if (doc.exists) {
        callback(doc.data().valor);
      } else {
        db.collection('usuarios')
          .doc(usuario.uid)
          .collection('configuracion')
          .doc('tasaVenta')
          .set({ valor: TASAS_INICIALES.tasaVenta });
        callback(TASAS_INICIALES.tasaVenta);
      }
    });
};

export const observarTasaCambio = (usuario, callback) => {
  return db.collection('usuarios')
    .doc(usuario.uid)
    .collection('configuracion')
    .doc('tasaCambio')
    .onSnapshot(doc => {
      if (doc.exists) {
        callback(doc.data());
      } else {
        const tasasIniciales = {
          usdToBs: TASAS_INICIALES.usdToBs,
          usdtToUsd: TASAS_INICIALES.usdtToUsd
        };
        db.collection('usuarios')
          .doc(usuario.uid)
          .collection('configuracion')
          .doc('tasaCambio')
          .set(tasasIniciales);
        callback(tasasIniciales);
      }
    });
};

export const actualizarTasaCambio = async (usuario, tasaCambio) => {
  return await db.collection('usuarios')
    .doc(usuario.uid)
    .collection('configuracion')
    .doc('tasaCambio')
    .set(tasaCambio);
};

export const actualizarTasaVenta = async (usuario, tasaVenta) => {
  return await db.collection('usuarios')
    .doc(usuario.uid)
    .collection('configuracion')
    .doc('tasaVenta')
    .set({ valor: tasaVenta });
};