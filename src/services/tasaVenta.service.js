// src/services/tasaVenta.service.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Obtener instancia de Firestore
const db = firebase.firestore();

/**
 * Obtiene la última venta registrada para una fecha específica
 * Busca en transacciones manuales E importadas
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} usuarioId - ID del usuario actual
 * @returns {Promise<Object|null>} - Objeto con la tasa y datos de la venta, o null
 */
export const obtenerTasaVentaPorFecha = async (fecha, usuarioId) => {
  try {
    console.log('🔎 [SERVICIO] Buscando tasa de venta para:', { fecha, usuarioId });

    // PRIMERO: Buscar en transacciones NO importadas (prioridad)
    console.log('📍 Buscando en ventas MANUALES (importado=false)...');
    
    try {
      const snapshotNoImportadas = await db.collection('transacciones')
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'Venta')
        .where('fecha', '==', fecha)
        .where('importado', '==', false)
        .orderBy('hora', 'desc')
        .limit(1)
        .get();

      if (!snapshotNoImportadas.empty) {
        const venta = snapshotNoImportadas.docs[0].data();
        console.log('✅ [SERVICIO] Tasa encontrada (MANUAL):', {
          tasa: venta.tasaVenta,
          fecha: venta.fecha,
          hora: venta.hora
        });
        return {
          tasa: parseFloat(venta.tasaVenta),
          fecha: venta.fecha,
          hora: venta.hora,
          existe: true,
          esHoy: fecha === new Date().toISOString().split('T')[0],
          esImportada: false
        };
      }
    } catch (error) {
      console.warn('⚠️ Error al buscar ventas manuales (puede ser falta de índice):', error.message);
    }

    console.log('⚠️ No hay ventas MANUALES para', fecha);

    // SEGUNDO: Buscar en transacciones IMPORTADAS
    console.log('📍 Buscando en ventas IMPORTADAS (importado=true)...');
    
    try {
      const snapshotImportadas = await db.collection('transacciones')
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'Venta')
        .where('fecha', '==', fecha)
        .where('importado', '==', true)
        .orderBy('hora', 'desc')
        .limit(1)
        .get();

      if (!snapshotImportadas.empty) {
        const venta = snapshotImportadas.docs[0].data();
        console.log('✅ [SERVICIO] Tasa encontrada (IMPORTADA):', {
          tasa: venta.tasaVenta,
          fecha: venta.fecha,
          hora: venta.hora
        });
        return {
          tasa: parseFloat(venta.tasaVenta),
          fecha: venta.fecha,
          hora: venta.hora,
          existe: true,
          esHoy: fecha === new Date().toISOString().split('T')[0],
          esImportada: true
        };
      }
    } catch (error) {
      console.warn('⚠️ Error al buscar ventas importadas (puede ser falta de índice):', error.message);
    }

    console.log('⚠️ No hay ventas IMPORTADAS para', fecha);

    // TERCERO: Buscar SIN filtro de importado (fallback)
    console.log('📍 Buscando ventas SIN filtro de importado (fallback)...');
    
    try {
      const snapshotSinFiltro = await db.collection('transacciones')
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'Venta')
        .where('fecha', '==', fecha)
        .orderBy('hora', 'desc')
        .limit(1)
        .get();

      if (!snapshotSinFiltro.empty) {
        const venta = snapshotSinFiltro.docs[0].data();
        console.log('✅ [SERVICIO] Tasa encontrada (SIN FILTRO):', {
          tasa: venta.tasaVenta,
          fecha: venta.fecha,
          hora: venta.hora,
          importado: venta.importado
        });
        return {
          tasa: parseFloat(venta.tasaVenta),
          fecha: venta.fecha,
          hora: venta.hora,
          existe: true,
          esHoy: fecha === new Date().toISOString().split('T')[0],
          esImportada: venta.importado === true
        };
      }
    } catch (error) {
      console.error('❌ Error al buscar ventas sin filtro:', error.message);
    }

    console.log('❌ [SERVICIO] No se encontró NINGUNA tasa para la fecha:', fecha);
    return null;
  } catch (error) {
    console.error('💥 [SERVICIO] Error general al obtener tasa de venta:', error);
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
    console.log('🔎 [SERVICIO] Buscando última tasa de venta (sin importar fecha)');

    // Buscar en transacciones NO importadas primero
    try {
      const snapshotNoImportadas = await db.collection('transacciones')
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'Venta')
        .where('importado', '==', false)
        .orderBy('fecha', 'desc')
        .orderBy('hora', 'desc')
        .limit(1)
        .get();

      if (!snapshotNoImportadas.empty) {
        const venta = snapshotNoImportadas.docs[0].data();
        console.log('✅ [SERVICIO] Última tasa encontrada (MANUAL):', {
          tasa: venta.tasaVenta,
          fecha: venta.fecha,
          hora: venta.hora
        });
        return {
          tasa: parseFloat(venta.tasaVenta),
          fecha: venta.fecha,
          hora: venta.hora,
          existe: true
        };
      }
    } catch (error) {
      console.warn('⚠️ Error al buscar última venta manual:', error.message);
    }

    // Si no hay ventas manuales, buscar en importadas
    try {
      const snapshotImportadas = await db.collection('transacciones')
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'Venta')
        .where('importado', '==', true)
        .orderBy('fecha', 'desc')
        .orderBy('hora', 'desc')
        .limit(1)
        .get();

      if (!snapshotImportadas.empty) {
        const venta = snapshotImportadas.docs[0].data();
        console.log('✅ [SERVICIO] Última tasa encontrada (IMPORTADA):', {
          tasa: venta.tasaVenta,
          fecha: venta.fecha,
          hora: venta.hora
        });
        return {
          tasa: parseFloat(venta.tasaVenta),
          fecha: venta.fecha,
          hora: venta.hora,
          existe: true
        };
      }
    } catch (error) {
      console.warn('⚠️ Error al buscar última venta importada:', error.message);
    }

    // Fallback: buscar sin filtro de importado
    try {
      const snapshotSinFiltro = await db.collection('transacciones')
        .where('usuarioId', '==', usuarioId)
        .where('tipo', '==', 'Venta')
        .orderBy('fecha', 'desc')
        .orderBy('hora', 'desc')
        .limit(1)
        .get();

      if (!snapshotSinFiltro.empty) {
        const venta = snapshotSinFiltro.docs[0].data();
        console.log('✅ [SERVICIO] Última tasa encontrada (SIN FILTRO):', {
          tasa: venta.tasaVenta,
          fecha: venta.fecha,
          hora: venta.hora
        });
        return {
          tasa: parseFloat(venta.tasaVenta),
          fecha: venta.fecha,
          hora: venta.hora,
          existe: true
        };
      }
    } catch (error) {
      console.error('❌ Error al buscar última venta sin filtro:', error.message);
    }

    console.log('❌ [SERVICIO] No hay NINGUNA tasa de venta registrada');
    return null;
  } catch (error) {
    console.error('💥 [SERVICIO] Error general al obtener última tasa:', error);
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
  console.log('🎯 [SERVICIO] obtenerTasaParaGasto llamado con:', { fechaGasto, usuarioId });
  
  const hoy = new Date().toISOString().split('T')[0];
  const esHoy = fechaGasto === hoy;

  // PASO 1: Buscar tasa para la fecha específica del gasto
  const tasaFechaEspecifica = await obtenerTasaVentaPorFecha(fechaGasto, usuarioId);

  if (tasaFechaEspecifica) {
    console.log('✨ [SERVICIO] Estado: ENCONTRADA para fecha', fechaGasto);
    console.log('📊 [SERVICIO] Tasa que se usará:', tasaFechaEspecifica.tasa, 'Bs/$');
    return {
      tasa: tasaFechaEspecifica.tasa,
      fecha: tasaFechaEspecifica.fecha,
      hora: tasaFechaEspecifica.hora,
      estado: 'encontrada',
      mensaje: `Tasa encontrada para ${fechaGasto}`,
      requiereActualizacion: false,
      requiereInput: false,
      esImportada: tasaFechaEspecifica.esImportada
    };
  }

  console.log('⚠️ [SERVICIO] No hay tasa para', fechaGasto, '- Evaluando alternativas...');

  // PASO 2: Si no hay tasa para esa fecha específica
  if (esHoy) {
    console.log('📅 [SERVICIO] Es fecha de HOY - Buscando última tasa disponible');
    
    // Si es hoy, verificar última tasa disponible
    const ultimaTasa = await obtenerUltimaTasaVenta(usuarioId);

    if (ultimaTasa) {
      const desactualizada = tasaEstaDesactualizada(ultimaTasa.fecha);
      const diasDiferencia = calcularDiferenciaDias(ultimaTasa.fecha, hoy);

      if (desactualizada) {
        console.log('⚠️ [SERVICIO] Estado: DESACTUALIZADA (', diasDiferencia, 'días)');
        return {
          tasa: null,
          fecha: ultimaTasa.fecha,
          hora: ultimaTasa.hora,
          estado: 'desactualizada',
          mensaje: `La última tasa es del ${ultimaTasa.fecha} (hace ${diasDiferencia} días). Debe registrar una venta HOY para actualizar.`,
          requiereActualizacion: true,
          requiereInput: false,
          ultimaTasa: ultimaTasa.tasa
        };
      }

      console.log('✅ [SERVICIO] Estado: RECIENTE - Usando tasa de', ultimaTasa.fecha);
      console.log('📊 [SERVICIO] Tasa que se usará:', ultimaTasa.tasa, 'Bs/$');
      return {
        tasa: ultimaTasa.tasa,
        fecha: ultimaTasa.fecha,
        hora: ultimaTasa.hora,
        estado: 'reciente',
        mensaje: `Usando última tasa del ${ultimaTasa.fecha}`,
        requiereActualizacion: false,
        requiereInput: false
      };
    }

    console.log('❌ [SERVICIO] Estado: SIN_TASA - No hay ninguna tasa registrada');
    return {
      tasa: null,
      fecha: null,
      hora: null,
      estado: 'sin_tasa',
      mensaje: 'No hay tasas de venta registradas. Debe registrar una venta primero.',
      requiereActualizacion: true,
      requiereInput: false
    };
  }

  // PASO 3: Si es fecha anterior y no hay tasa para esa fecha
  console.log('📅 [SERVICIO] Estado: FECHA_SIN_TASA - Fecha histórica sin ventas registradas');
  return {
    tasa: null,
    fecha: fechaGasto,
    hora: null,
    estado: 'fecha_sin_tasa',
    mensaje: `No hay ventas registradas para ${fechaGasto}. Debe ingresar la tasa manualmente.`,
    requiereActualizacion: false,
    requiereInput: true
  };
};