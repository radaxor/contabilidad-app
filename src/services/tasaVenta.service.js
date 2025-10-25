// src/services/tasaVenta.service.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Obtener instancia de Firestore
const db = firebase.firestore();

/**
 * Obtiene la última venta registrada para una fecha específica
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} usuarioId - ID del usuario actual
 * @returns {Promise<Object|null>} - Objeto con la tasa y datos de la venta, o null
 */
export const obtenerTasaVentaPorFecha = async (fecha, usuarioId) => {
  try {
    // Buscar ventas del usuario para esa fecha específica
    const snapshot = await db.collection('transacciones')
      .where('usuarioId', '==', usuarioId)
      .where('tipo', '==', 'Venta')
      .where('fecha', '==', fecha)
      .orderBy('hora', 'desc') // Ordenar por hora descendente para obtener la más reciente
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const venta = snapshot.docs[0].data();
      return {
        tasa: venta.tasaVenta,
        fecha: venta.fecha,
        hora: venta.hora,
        existe: true,
        esHoy: fecha === new Date().toISOString().split('T')[0]
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener tasa de venta:', error);
    return null;
  }
};

/**
 * Obtiene la última tasa de venta registrada (sin importar la fecha)
 * @param {string} usuarioId - ID del usuario actual
 * @returns {Promise<Object|null>}
 */
export const obtenerUltimaTasaVenta = async (usuarioId) => {
  try {
    const snapshot = await db.collection('transacciones')
      .where('usuarioId', '==', usuarioId)
      .where('tipo', '==', 'Venta')
      .orderBy('fecha', 'desc')
      .orderBy('hora', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const venta = snapshot.docs[0].data();
      return {
        tasa: venta.tasaVenta,
        fecha: venta.fecha,
        hora: venta.hora,
        existe: true
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener última tasa:', error);
    return null;
  }
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {string} fecha1 - Fecha en formato YYYY-MM-DD
 * @param {string} fecha2 - Fecha en formato YYYY-MM-DD
 * @returns {number} - Diferencia en días
 */
export const calcularDiferenciaDias = (fecha1, fecha2) => {
  const d1 = new Date(fecha1);
  const d2 = new Date(fecha2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Verifica si una tasa está desactualizada (más de 1 día)
 * @param {string} fechaTasa - Fecha de la última tasa
 * @returns {boolean}
 */
export const tasaEstaDesactualizada = (fechaTasa) => {
  const hoy = new Date().toISOString().split('T')[0];
  const diferencia = calcularDiferenciaDias(fechaTasa, hoy);
  return diferencia > 1;
};

/**
 * Obtiene la tasa de venta apropiada para un gasto según la fecha
 * @param {string} fechaGasto - Fecha del gasto
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<Object>} - Objeto con tasa, info y estado
 */
export const obtenerTasaParaGasto = async (fechaGasto, usuarioId) => {
  const hoy = new Date().toISOString().split('T')[0];
  const esHoy = fechaGasto === hoy;

  // Buscar tasa para la fecha específica del gasto
  const tasaFechaEspecifica = await obtenerTasaVentaPorFecha(fechaGasto, usuarioId);

  if (tasaFechaEspecifica) {
    return {
      tasa: tasaFechaEspecifica.tasa,
      fecha: tasaFechaEspecifica.fecha,
      hora: tasaFechaEspecifica.hora,
      estado: 'encontrada',
      mensaje: `Tasa encontrada para ${fechaGasto}`,
      requiereActualizacion: false
    };
  }

  // Si no hay tasa para esa fecha específica
  if (esHoy) {
    // Si es hoy, verificar última tasa disponible
    const ultimaTasa = await obtenerUltimaTasaVenta(usuarioId);

    if (ultimaTasa) {
      const desactualizada = tasaEstaDesactualizada(ultimaTasa.fecha);

      if (desactualizada) {
        return {
          tasa: null,
          fecha: ultimaTasa.fecha,
          hora: ultimaTasa.hora,
          estado: 'desactualizada',
          mensaje: `La última tasa es del ${ultimaTasa.fecha}. Debe registrar una venta hoy para actualizar la tasa.`,
          requiereActualizacion: true,
          ultimaTasa: ultimaTasa.tasa
        };
      }

      return {
        tasa: ultimaTasa.tasa,
        fecha: ultimaTasa.fecha,
        hora: ultimaTasa.hora,
        estado: 'reciente',
        mensaje: `Usando tasa del ${ultimaTasa.fecha}`,
        requiereActualizacion: false
      };
    }

    return {
      tasa: null,
      fecha: null,
      hora: null,
      estado: 'sin_tasa',
      mensaje: 'No hay tasas de venta registradas. Debe registrar una venta primero.',
      requiereActualizacion: true
    };
  }

  // Si es fecha anterior y no hay tasa para esa fecha
  return {
    tasa: null,
    fecha: null,
    hora: null,
    estado: 'fecha_sin_tasa',
    mensaje: `No hay tasa de venta registrada para ${fechaGasto}. Debe ingresar la tasa manualmente.`,
    requiereActualizacion: false,
    requiereInput: true
  };
};