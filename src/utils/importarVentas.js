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
            // Limpiar y convertir números
            const limpiarNumero = (valor) => {
              if (!valor) return 0;
              if (typeof valor === 'number') return valor;
              const limpio = String(valor).replace(/[BsF$,\s]/g, '').replace(',', '.');
              const numero = parseFloat(limpio);
              return isNaN(numero) ? 0 : numero;
            };

            // Leer campos del Excel
            const recibidoBs = limpiarNumero(row['Recibido en CTA'] || 0);
            const tasa = limpiarNumero(row['Tasa'] || 0);
            const ventaUsd = limpiarNumero(row['VENTA $'] || 0);
            const fechaRaw = row['Fecha'] || '';
            const hora = row['Hora'] || '';

            // Parsear fecha DD-MM-YYYY → YYYY-MM-DD
            let fecha = fechaRaw;
            if (fecha && fecha.includes('-')) {
              const partes = fecha.split('-');
              if (partes.length === 3) {
                const dia = partes[0].padStart(2, '0');
                const mes = partes[1].padStart(2, '0');
                const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
                fecha = `${año}-${mes}-${dia}`;
              }
            }

            // Validar datos mínimos
            if (!fecha || ventaUsd === 0 || recibidoBs === 0) {
              console.log(`⚠️ Fila ${numFila}: Datos incompletos, saltando...`);
              filasVacias++;
              continue;
            }

            // Calcular comisión de Binance (0.2%)
            const comisionBinance = ventaUsd * 0.002;
            const usdtNeto = ventaUsd - comisionBinance;

            // Crear transacción de venta
            const transaccion = {
              tipo: 'Venta',
              fecha: fecha,
              hora: hora,
              montoUSDT: ventaUsd, // Monto original en USDT
              comisionBinance: comisionBinance,
              usdtNeto: usdtNeto, // USDT después de comisión
              tasaVenta: tasa,
              montoBs: recibidoBs, // Bs recibidos
              cuentaDestino: 'Provincial', // Por defecto
              descripcion: `Venta Binance - ${ventaUsd.toFixed(2)} USDT @ ${tasa} (Importado)`,
              monto: ventaUsd, // Para el balance
              moneda: 'USDT',
              categoria: 'Venta de Divisas',
              cuenta: 'Binance',
              importado: true,
              importadoDesde: 'ventas'
            };

            console.log(`✅ Fila ${numFila}: $${ventaUsd} USDT → Bs${recibidoBs} @ ${tasa}`);

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