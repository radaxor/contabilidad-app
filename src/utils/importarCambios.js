import * as XLSX from 'xlsx';
import { crearTransaccion } from '../services/transacciones.service';
import { db } from '../services/firebase';

/**
 * Importa cambios de USD a USDT desde archivo Excel
 * Formato: fecha | hora | usd | % | tasa | # | usdt | Comision | Usuario Cambiador | Descripcion
 */
export const importarExcelCambios = async (file, usuario) => {
  return new Promise((resolve, reject) => {

    // ✅ VALIDACIÓN INICIAL: Verificar que usuario existe
    if (!usuario || !usuario.uid) {
        console.error('❌ Error: Usuario no definido o sin UID');
        alert('❌ Error: No se pudo identificar el usuario. Por favor, recarga la página.');
        return reject(new Error('Usuario no definido'));
      }
  
      console.log('👤 Usuario identificado:', usuario.email || usuario.uid);
    
      const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: '',
          blankrows: false
        });

        console.log('📊 Total de filas leídas:', jsonData.length);
        console.log('📋 Primera fila de ejemplo:', jsonData[0]);

        if (jsonData.length === 0) {
          alert('❌ El archivo Excel está vacío o no tiene el formato correcto');
          return resolve({
            exitosas: 0,
            errores: ['Archivo vacío'],
            total: 0,
            
          });
        }

        // Verificar si ya hay cambios importados
        const existentes = await db.collection('transacciones')
          .where('usuarioId', '==', usuario.uid)
          .where('importado', '==', true)
          .where('importadoDesde', '==', 'cambios')
          .limit(1)
          .get();

        if (!existentes.empty) {
          const confirmar = window.confirm(
            `⚠️ Ya tienes cambios USD→USDT importados anteriormente.\n\n` +
            '¿Deseas continuar? Esto podría crear duplicados.\n\n' +
            '💡 Recomendación: Usa el botón "🗑️ Limpiar Cambios Importados" antes de reimportar.'
          );
          
          if (!confirmar) {
            return resolve({
              exitosas: 0,
              errores: ['Importación cancelada por el usuario'],
              total: jsonData.length,
              
            });
          }
        }

        const transaccionesCreadas = [];
        const errores = [];
        let filasVacias = 0;

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const numFila = i + 2;
          
          try {
            // 🔧 FUNCIÓN CORREGIDA: Limpia y convierte números con comas decimales
            const limpiarNumero = (valor) => {
              if (!valor && valor !== 0) return 0;
              if (typeof valor === 'number') return valor;
              
              // Convertir a string y limpiar
              let limpio = String(valor).trim();
              
              // Eliminar símbolos de moneda y porcentajes primero
              limpio = limpio.replace(/[BsF$\s%]/g, '');
              
              // 🔥 CORRECCIÓN CRÍTICA: Primero reemplazar COMA por PUNTO
              // Detectar si tiene comas y puntos
              const tienePunto = limpio.includes('.');
              const tieneComa = limpio.includes(',');
              
              if (tienePunto && tieneComa) {
                // Formato europeo: 1.234,56 (punto=miles, coma=decimal)
                // Formato americano: 1,234.56 (coma=miles, punto=decimal)
                const ultimoPunto = limpio.lastIndexOf('.');
                const ultimaComa = limpio.lastIndexOf(',');
                
                if (ultimaComa > ultimoPunto) {
                  // Formato europeo: la coma es el decimal
                  limpio = limpio.replace(/\./g, ''); // Eliminar puntos de miles
                  limpio = limpio.replace(',', '.'); // Coma a punto decimal
                } else {
                  // Formato americano: el punto es el decimal
                  limpio = limpio.replace(/,/g, ''); // Eliminar comas de miles
                }
              } else if (tieneComa && !tienePunto) {
                // Solo tiene comas: determinar si es decimal o miles
                const cantidadComas = (limpio.match(/,/g) || []).length;
                if (cantidadComas === 1) {
                  // Una sola coma = decimal (1009,8)
                  limpio = limpio.replace(',', '.');
                } else {
                  // Múltiples comas = miles (1,000,000)
                  limpio = limpio.replace(/,/g, '');
                }
              }
              // Si solo tiene punto, ya está correcto
              
              const numero = parseFloat(limpio);
              return isNaN(numero) ? 0 : numero;
            };

            // Leer campos del Excel según TU formato
            const fechaRaw = row['fecha'] || '';
            const hora = row['hora'] || '';
            
            // 📝 LOG DE DEPURACIÓN: Ver valores ANTES de limpiar
            console.log(`📝 Fila ${numFila} - Valores RAW del Excel:`, {
              usd_raw: row['usd'],
              usdt_raw: row['usdt']
            });
            
            const montoUSD = limpiarNumero(row['usd'] || 0);
            const porcentaje = limpiarNumero(row['%'] || 0);
            const tasa = limpiarNumero(row['tasa'] || 0);
            const numero = limpiarNumero(row['#'] || 0);
            const montoUSDT = limpiarNumero(row['usdt'] || 0);
            const comision = limpiarNumero(row['Comision'] || 0);
            const usuarioCambiador = row['Usuario Cambiador'] || '';
            const descripcion = row['Descripcion'] || '';

            // 📝 LOG DE DEPURACIÓN: Ver valores DESPUÉS de limpiar
            console.log(`✅ Fila ${numFila} - Valores PROCESADOS:`, {
              usd: montoUSD,
              usdt: montoUSDT,
              diferencia: montoUSD - montoUSDT
            });

            // Parsear fecha DD/MM/YYYY → YYYY-MM-DD
            let fecha = fechaRaw;
            if (fecha && fecha.includes('/')) {
              const partes = fecha.split('/');
              if (partes.length === 3) {
                const dia = partes[0].padStart(2, '0');
                const mes = partes[1].padStart(2, '0');
                const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
                fecha = `${año}-${mes}-${dia}`;
              }
            }

            // Validar datos mínimos
            if (!fecha || montoUSD === 0 || montoUSDT === 0) {
              console.log(`⚠️ Fila ${numFila}: Datos incompletos, saltando...`);
              filasVacias++;
              continue;
            }

            // Calcular métricas
            const diferencia = montoUSD - montoUSDT;
            const comisionCalculada = comision > 0 ? comision : diferencia;
            const tasaCambio = montoUSD > 0 ? montoUSDT / montoUSD : 1;
            const porcentajePerdida = montoUSD > 0 ? (comisionCalculada / montoUSD) * 100 : 0;

            // Crear transacción de cambio
            const transaccion = {
              tipo: 'Cambio',
              fecha: fecha,
              hora: hora,
              montoUSD: montoUSD,                    // USD que se cambiaron
              montoUSDT: montoUSDT,                  // USDT que se recibieron
              comision: comisionCalculada,           // Comisión/pérdida
              comisionPorcentaje: porcentajePerdida, // % de pérdida
              tasaCambio: tasaCambio,                // Ratio USDT/USD
              porcentaje: porcentaje,                // % del Excel
              tasa: tasa,                            // Tasa del Excel
              numero: numero,                        // # del Excel
              usuarioCambiador: usuarioCambiador,    // Quién hizo el cambio
              descripcion: descripcion || `Cambio USD→USDT - ${montoUSD.toFixed(2)} USD → ${montoUSDT.toFixed(2)} USDT`,
              monto: montoUSD,                       // Para referencia
              moneda: 'USD',
              categoria: 'Cambio de Divisa',
              cuenta: 'Binance',
              importado: true,
              importadoDesde: 'cambios'
            };

            console.log(`✅ Fila ${numFila}: $${montoUSD} USD → ${montoUSDT} USDT (${porcentajePerdida.toFixed(2)}% comisión) - ${usuarioCambiador}`);

            await crearTransaccion(transaccion, usuario);
            transaccionesCreadas.push(transaccion);

          } catch (error) {
            console.error(`❌ Error en fila ${numFila}:`, error);
            errores.push(`Fila ${numFila}: ${error.message}`);
          }
        }

        // Mostrar resumen
        const mensaje = `✅ Importación completada:\n\n` +
                       `✓ ${transaccionesCreadas.length} cambios importados\n` +
                       `⚠ ${filasVacias} filas vacías\n` +
                       `${errores.length > 0 ? `✗ ${errores.length} errores` : ''}`;
        
        alert(mensaje);

        resolve({
          exitosas: transaccionesCreadas.length,
          errores: errores,
          total: jsonData.length,
          filasVacias: filasVacias
        });

      } catch (error) {
        console.error('❌ Error general:', error);
        alert(`❌ Error al importar: ${error.message}`);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error('❌ Error al leer archivo:', error);
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Elimina todos los cambios USD→USDT importados
 */
export const limpiarCambiosImportados = async (usuario) => {
  try {
    if (!usuario || !usuario.uid) {
      throw new Error('Usuario no definido');
    }

    const snapshot = await db.collection('transacciones')
      .where('usuarioId', '==', usuario.uid)
      .where('importado', '==', true)
      .where('importadoDesde', '==', 'cambios')
      .get();

    if (snapshot.empty) {
      alert('ℹ️ No hay cambios importados para limpiar');
      return {
        success: true,
        eliminados: 0
      };
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    alert(`✅ Se eliminaron ${snapshot.size} cambios importados`);
    
    return {
      success: true,
      eliminados: snapshot.size
    };
  } catch (error) {
    console.error('Error al limpiar cambios:', error);
    alert(`❌ Error al limpiar: ${error.message}`);
    throw error;
  }
};