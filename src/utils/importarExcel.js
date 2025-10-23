import * as XLSX from 'xlsx';
import { crearTransaccion } from '../services/transacciones.service';

export const importarExcelPorCobrar = async (file, usuario) => {
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

            // **MAPEO DE COLUMNAS SEGÚN LA IMAGEN**
            const fechaRaw = row['Fecha'] || '';
            const status = row['Status'] || 'Por Cobrar';
            const cliente = row['Cliente'] || '';
            const depositosBs = limpiarNumero(row['Depositos'] || 0); // ← Esta columna es la compra en Bs
            const comisionBanco = limpiarNumero(row['Comision Banco.'] || 0);
            const tasa = limpiarNumero(row['TASA'] || 0);
            const compraDolar = limpiarNumero(row['COMPRA $'] || 0);
            const operador = row['Operador'] || '';
            const gananciaBs = limpiarNumero(row['Ganancia en Bs'] || 0);
            const gananciaDolar = limpiarNumero(row['Ganancia en Dolar'] || 0);
            const tasaVentaExcel = limpiarNumero(row['Tasa Venta'] || 0);

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
            if (!cliente || compraDolar === 0) {
              console.log(`⚠️ Fila ${numFila}: Datos incompletos, saltando...`);
              filasVacias++;
              continue;
            }

            // **CREAR TRANSACCIÓN CON CAMPOS DEL EXCEL**
            const transaccion = {
              tipo: 'Compra',
              fecha: fecha || new Date().toISOString().split('T')[0],
              status: status,
              cliente: cliente.trim(),
              compraBs: depositosBs, // ← Depositos es la compra en Bs
              comisionBanco: comisionBanco,
              tasa: tasa, // ← Tasa de compra
              compraDolar: compraDolar,
              operador: operador.trim(),
              gananciaBs: gananciaBs,
              gananciaDolar: gananciaDolar,
              tasaVenta: tasaVentaExcel, // ← Tasa del Excel (solo para importación)
              monto: compraDolar,
              moneda: 'USD',
              categoria: 'Compra de Divisas',
              descripcion: `Compra - Cliente: ${cliente.trim()} (Importado)`,
              cuenta: 'Operaciones',
              importado: true, // ← Marca que vino del Excel
              importadoDesde: 'compras' // ← AGREGAR ESTA LÍNEA
            };

            console.log(`✅ Fila ${numFila}: ${cliente} - $${compraDolar}`);

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