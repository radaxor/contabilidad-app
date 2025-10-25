import * as XLSX from 'xlsx';
import { crearTransaccion } from '../services/transacciones.service';
import { db } from '../services/firebase';

export const importarExcelGastos = async (file, usuario, tasaVenta) => {
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

        console.log('📊 Total de filas de gastos leídas:', jsonData.length);
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

        // Verificar si ya hay gastos importados
        const existentes = await db.collection('transacciones')
          .where('usuarioId', '==', usuario.uid)
          .where('importado', '==', true)
          .where('importadoDesde', '==', 'gastos')
          .limit(1)
          .get();

        if (!existentes.empty) {
          const confirmar = window.confirm(
            `⚠️ Ya tienes gastos importados anteriormente.\n\n` +
            '¿Deseas continuar? Esto podría crear duplicados.\n\n' +
            '💡 Recomendación: Usa el botón "🗑️ Limpiar Gastos Importados" antes de reimportar.'
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
            const fechaRaw = row['Fecha'] || row['FECHA'] || '';
            const descripcion = row['Descripcion'] || row['DESCRIPCION'] || row['Descripción'] || '';
            const monto = limpiarNumero(row['Monto'] || row['MONTO'] || 0);
            const categoria = row['Categoria'] || row['CATEGORIA'] || row['Categoría'] || 'Varios';
            const cuenta = row['Cuenta'] || row['CUENTA'] || 'Provincial';
            const moneda = row['Moneda'] || row['MONEDA'] || 'Bs';
            const total = limpiarNumero(row['Total'] || row['TOTAL'] || monto);

            // Parsear fecha
            let fecha = fechaRaw;
            if (fecha && fecha.includes('/')) {
              const partes = fecha.split('/');
              if (partes.length === 3) {
                const dia = partes[0].padStart(2, '0');
                const mes = partes[1].padStart(2, '0');
                const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
                fecha = `${año}-${mes}-${dia}`;
              }
            } else if (fecha && fecha.includes('-')) {
              const partes = fecha.split('-');
              if (partes.length === 3 && partes[0].length === 2) {
                const dia = partes[0].padStart(2, '0');
                const mes = partes[1].padStart(2, '0');
                const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
                fecha = `${año}-${mes}-${dia}`;
              }
            }

            // Validar datos mínimos
            if (!fecha || !descripcion || total === 0) {
              console.log(`⚠️ Fila ${numFila}: Datos incompletos, saltando...`);
              filasVacias++;
              continue;
            }

            // Calcular gasto en dólares
            const gastoDolar = tasaVenta > 0 ? total / tasaVenta : 0;

            // CRÍTICO: Crear transacción con tipo: 'Gasto'
            const transaccion = {
              tipo: 'Gasto', // ← ESTO ES CRÍTICO
              fecha: fecha,
              descripcion: descripcion,
              monto: monto || gastoDolar, // Usar gastoDolar si monto está vacío
              categoria: categoria,
              cuenta: cuenta,
              moneda: moneda,
              total: total,
              gastoDolar: gastoDolar,
              tasaVenta: tasaVenta,
              importado: true,
              importadoDesde: 'gastos'
            };

            console.log(`✅ Fila ${numFila}: ${descripcion} - Bs${total} → $${gastoDolar.toFixed(2)}`);

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