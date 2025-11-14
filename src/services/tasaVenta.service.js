// src/services/tasaVenta.service.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Obtener instancia de Firestore
const db = firebase.firestore();

/**
 * Obtiene la tasa de venta para una fecha específica
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} usuarioId - ID del usuario actual
 * @returns {Promise<Object|null>}
 */
export const obtenerTasaVentaPorFecha = async (fecha, usuarioId) => {
  try {
    // Intento 1: Query completa con orderBy (requiere índice)
    const snapshot = await db.collection('transacciones')
      .where('usuarioId', '==', usuarioId)
      .where('tipo', '==', 'Venta')
      .where('fecha', '==', fecha)
      .orderBy('hora', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const venta = snapshot.docs[0].data();
      return {
        tasa: venta.tasaVenta,
        fecha: venta.fecha,
        hora: venta.hora || '00:00',
        existe: true
      };
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Índice no disponible, usando fallback. Error:', error.message);
    
    // FALLBACK: Sin orderBy (no requiere índice)
    try {
      const snapshot = await db.collection('transacciones')
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'Venta')
        .where('fecha', '==', fecha)
        .get();

      if (!snapshot.empty) {
        // Ordenar manualmente por hora
        const ventas = [];
        snapshot.forEach(doc => ventas.push(doc.data()));
        ventas.sort((a, b) => (b.hora || '00:00').localeCompare(a.hora || '00:00'));
        
        const venta = ventas[0];
        return {
          tasa: venta.tasaVenta,
          fecha: venta.fecha,
          hora: venta.hora || '00:00',
          existe: true
        };
      }
    } catch (innerError) {
      console.error('❌ Error en fallback:', innerError);
    }

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
    // Intento 1: Query completa con orderBy (requiere índice)
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
        hora: venta.hora || '00:00',
        existe: true
      };
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Índice no disponible, usando fallback. Error:', error.message);
    
    // FALLBACK: Sin orderBy de hora (solo fecha)
    try {
      const snapshot = await db.collection('transacciones')
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'Venta')
        .orderBy('fecha', 'desc')
        .limit(10)
        .get();

      if (!snapshot.empty) {
        // Ordenar manualmente por fecha y hora
        const ventas = [];
        snapshot.forEach(doc => ventas.push(doc.data()));
        ventas.sort((a, b) => {
          const fechaCompare = b.fecha.localeCompare(a.fecha);
          if (fechaCompare !== 0) return fechaCompare;
          return (b.hora || '00:00').localeCompare(a.hora || '00:00');
        });
        
        const venta = ventas[0];
        return {
          tasa: venta.tasaVenta,
          fecha: venta.fecha,
          hora: venta.hora || '00:00',
          existe: true
        };
      }
    } catch (innerError) {
      console.error('❌ Error en fallback:', innerError);
    }

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
  const d1 = new Date(fecha1 + 'T00:00:00');
  const d2 = new Date(fecha2 + 'T00:00:00');
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
          mensaje: `La última tasa es del ${ultimaTasa.fecha}. Por favor registra una venta de hoy.`,
          requiereActualizacion: true
        };
      } else {
        return {
          tasa: ultimaTasa.tasa,
          fecha: ultimaTasa.fecha,
          hora: ultimaTasa.hora,
          estado: 'reciente',
          mensaje: `Usando última tasa del ${ultimaTasa.fecha}`,
          requiereActualizacion: false
        };
      }
    } else {
      return {
        tasa: null,
        fecha: null,
        hora: null,
        estado: 'sin_tasas',
        mensaje: 'No hay tasas registradas. Por favor registra una venta primero.',
        requiereActualizacion: true
      };
    }
  } else {
    // Es una fecha histórica sin tasa
    return {
      tasa: null,
      fecha: null,
      hora: null,
      estado: 'historica_sin_tasa',
      mensaje: `No hay ventas registradas para ${fechaGasto}. Ingresa la tasa manualmente.`,
      requiereActualizacion: false,
      permitirManual: true
    };
  }
};