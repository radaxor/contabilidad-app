import * as XLSX from 'xlsx';
import { crearTransaccion } from '../services/transacciones.service';
import { db } from '../services/firebase';

export const importarExcelVentas = async (file, usuario) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: ''
        });

        console.log('📊 Total de filas leídas:', jsonData.length);
        console.log('📋 Primera fila de ejemplo:', jsonData[0]);

        if (jsonData.length === 0) {
          alert('❌ El archivo Excel está vacío o no tiene el formato correcto');
          return resolve({
            exitosas: 0,
            errores: ['Archivo vacío'],
            total: 0,
            filasVacias: 0
          });
        }

        // Verificar si ya hay ventas importadas
        const existentes = await db.collection('transacciones')
          .where('usuarioId', '==', usuario.uid)
          .where('importado', '==', true)
          .where('importadoDesde', '==', 'ventas')
          .limit(1)
          .get();

        if (!existentes.empty) {
          const confirmar = window.confirm(
            `⚠️ Ya tienes ventas importadas anteriormente.\n\n` +
            '¿Deseas continuar? Esto podría crear duplicados.\n\n' +
            '💡 Recomendación: Usa el botón "🗑️ Limpiar Ventas Importadas" antes de reimportar.'
          );
          
          if (!confirmar) {
            return resolve({
              exitosas: 0,
              errores: ['Importación cancelada por el usuario'],
              total: jsonData.length,
              filasVacias: 0
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
            // 🔧 FUNCIÓN MEJORADA PARA LIMPIAR NÚMEROS
            const limpiarNumero = (valor) => {
              if (!valor) return 0;
              if (typeof valor === 'number') return valor;
              
              // Convertir a string y limpiar símbolos
              let limpio = String(valor).replace(/[BsF$\s]/g, '').trim();
              
              // Detectar formato por posición de los separadores
              const indexComa = limpio.indexOf(',');
              const indexPunto = limpio.indexOf('.');
              
              if (indexComa !== -1 && indexPunto !== -1) {
                // Ambos separadores presentes: detectar cuál viene primero
                if (indexComa < indexPunto) {
                  // ✅ Formato AMERICANO: 31,009.00 (coma para miles, punto para decimal)
                  limpio = limpio.replace(/,/g, ''); // Eliminar comas (miles)
                  console.log(`   Formato americano detectado: ${valor} → ${limpio}`);
                } else {
                  // ✅ Formato EUROPEO: 31.009,00 (punto para miles, coma para decimal)
                  limpio = limpio.replace(/\./g, '').replace(',', '.');
                  console.log(`   Formato europeo detectado: ${valor} → ${limpio}`);
                }
              } else if (indexComa !== -1) {
                // Solo coma: formato europeo decimal (1234,56)
                limpio = limpio.replace(',', '.');
                console.log(`   Solo coma (europeo): ${valor} → ${limpio}`);
              } else if (indexPunto !== -1) {
                // Solo punto: formato americano decimal (1234.56)
                console.log(`   Solo punto (americano): ${valor} → ${limpio}`);
              }
              
              const numero = parseFloat(limpio);
              return isNaN(numero) ? 0 : numero;
            };

            // 📋 LEER CAMPOS DEL EXCEL (con múltiples variantes de nombres)
            const recibidoBs = limpiarNumero(
              row['Recibido en CTA'] || 
              row['Recibido'] || 
              row['RECIBIDO EN CTA'] ||
              row['Recibido en cuenta'] ||
              0
            );
            
            const tasa = limpiarNumero(
              row['Tasa'] || 
              row['TASA'] || 
              row['Tasa Venta'] ||
              0
            );
            
            const ventaUsd = limpiarNumero(
              row['VENTA $'] || 
              row['Venta $'] ||
              row['VENTA'] ||
              row['Venta USDT'] ||
              0
            );
            
            const fechaRaw = row['Fecha'] || row['FECHA'] || '';
            const hora = row['Hora'] || row['HORA'] || '';

            // 📅 PARSEAR FECHA - FORMATO: DD/MM/YYYY
            let fecha = '';
            
            if (fechaRaw) {
              const fechaStr = String(fechaRaw).trim();
              
              // Formato DD/MM/YYYY o DD-MM-YYYY
              if (fechaStr.includes('/') || fechaStr.includes('-')) {
                const separador = fechaStr.includes('/') ? '/' : '-';
                const partes = fechaStr.split(separador);
                
                if (partes.length === 3) {
                  // Día: primera parte
                  let dia = partes[0].trim().padStart(2, '0');
                  
                  // Mes: segunda parte (en medio)
                  let mes = partes[1].trim().padStart(2, '0');
                  
                  // Año: tercera parte (debe ser de 4 dígitos)
                  let año = partes[2].trim();
                  
                  // Asegurar que el año sea de 4 dígitos
                  if (año.length === 2) {
                    año = '20' + año;
                  } else if (año.length !== 4) {
                    console.warn(`⚠️ Fila ${numFila}: Año inválido "${año}", usando año actual`);
                    año = new Date().getFullYear().toString();
                  }
                  
                  // Validar que día y mes sean válidos
                  const diaNum = parseInt(dia);
                  const mesNum = parseInt(mes);
                  
                  if (diaNum < 1 || diaNum > 31) {
                    console.warn(`⚠️ Fila ${numFila}: Día inválido "${dia}"`);
                    continue;
                  }
                  
                  if (mesNum < 1 || mesNum > 12) {
                    console.warn(`⚠️ Fila ${numFila}: Mes inválido "${mes}"`);
                    continue;
                  }
                  
                  // Formato final: YYYY-MM-DD para Firebase
                  fecha = `${año}-${mes}-${dia}`;
                  
                  console.log(`📅 Fila ${numFila}: Fecha parseada - ${fechaStr} → ${fecha}`);
                }
              }
              // Formato de Excel numérico (días desde 1900)
              else if (!isNaN(fechaStr)) {
                const excelDate = parseFloat(fechaStr);
                const date = new Date((excelDate - 25569) * 86400 * 1000);
                const año = date.getFullYear();
                const mes = String(date.getMonth() + 1).padStart(2, '0');
                const dia = String(date.getDate()).padStart(2, '0');
                fecha = `${año}-${mes}-${dia}`;
                
                console.log(`📅 Fila ${numFila}: Fecha Excel - ${fechaStr} → ${fecha}`);
              }
            }

            // ✅ VALIDAR DATOS MÍNIMOS
            if (!fecha || ventaUsd === 0 || recibidoBs === 0) {
              console.log(`⚠️ Fila ${numFila}: Datos incompletos, saltando...`);
              console.log(`   Fecha: ${fecha}, Venta: ${ventaUsd}, Recibido: ${recibidoBs}`);
              filasVacias++;
              continue;
            }

            // 💰 CALCULAR COMISIÓN DE BINANCE (0.2%)
            const comisionBinance = ventaUsd * 0.002;
            const usdtNeto = ventaUsd - comisionBinance;

            // 🎯 CALCULAR MONTOBS (el que faltaba!)
            // montoBs es lo que recibiste en Bolivares
            const montoBs = recibidoBs;

            // 📝 CREAR TRANSACCIÓN DE VENTA CON TODOS LOS CAMPOS
            const transaccion = {
              tipo: 'Venta',
              fecha: fecha,
              hora: hora,
              montoUSDT: ventaUsd, // Monto original en USDT
              comisionBinance: comisionBinance,
              usdtNeto: usdtNeto, // USDT después de comisión
              tasaVenta: tasa,
              montoBs: montoBs, // 🔥 CRÍTICO: Bs recibidos
              cuentaDestino: 'Provincial', // Por defecto
              descripcion: `Venta Binance - ${ventaUsd.toFixed(2)} USDT @ ${tasa.toFixed(2)} (Importado)`,
              monto: ventaUsd, // Para el balance
              moneda: 'USDT',
              categoria: 'Venta de Divisas',
              cuenta: 'Binance',
              importado: true,
              importadoDesde: 'ventas'
            };

            console.log(`✅ Fila ${numFila}: $${ventaUsd.toFixed(2)} USDT → Bs${montoBs.toFixed(2)} @ ${tasa.toFixed(2)}`);
            console.log('   Transacción completa:', transaccion);

            await crearTransaccion(transaccion, usuario);
            transaccionesCreadas.push(transaccion);

          } catch (error) {
            console.error(`❌ Error en fila ${numFila}:`, error);
            errores.push(`Fila ${numFila}: ${error.message}`);
          }
        }

        resolve({
          exitosas: transaccionesCreadas.length,
          errores: errores,
          total: jsonData.length,
          filasVacias: filasVacias
        });

      } catch (error) {
        console.error('❌ Error general:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};