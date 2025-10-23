import * as XLSX from 'xlsx';
import { crearTransaccion } from '../services/transacciones.service';

export const importarExcelGastos = async (file, usuario) => {
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

        // Categorías que buscamos en las columnas
        const categorias = [
          'Varios', 'Escuela', 'Servicios', 'Rafael', 
          'Emilys', 'Casa', 'Carro', 'Prestamos', 
          'Remesas', 'Pasajes'
        ];

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

            // Leer campos comunes
            const tasaVenta = limpiarNumero(row['Tasa de venta'] || row['Tasa de Venta'] || 0);
            const gastoEnDolar = limpiarNumero(row['Gasto en $'] || row['Gasto en Dolar'] || 0);
            const fechaRaw = row['Fecha'] || '';
            const descripcion = row['Descripcion'] || row['Descripción'] || '';

            // Parsear fecha DD-MM-YYYY → YYYY-MM-DD
            let fecha = fechaRaw;
            if (fecha && (fecha.includes('-') || fecha.includes('/'))) {
              const separador = fecha.includes('-') ? '-' : '/';
              const partes = fecha.split(separador);
              if (partes.length >= 3) {
                const dia = partes[0].padStart(2, '0');
                const mes = partes[1].padStart(2, '0');
                const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
                fecha = `${año}-${mes}-${dia}`;
              }
            }

            // Validar fecha
            if (!fecha) {
              console.log(`⚠️ Fila ${numFila}: Sin fecha, saltando...`);
              filasVacias++;
              continue;
            }

            // Buscar en cada categoría si hay un monto
            let hayAlgunGasto = false;

            for (const categoria of categorias) {
              const monto = limpiarNumero(row[categoria] || 0);

              if (monto > 0) {
                hayAlgunGasto = true;

                // Calcular gasto en dólares
                let gastoDolar = gastoEnDolar;
                if (gastoDolar === 0 && tasaVenta > 0) {
                  gastoDolar = monto / tasaVenta;
                }

                // ✅ CREAR TRANSACCIÓN DE GASTO QUE SE RESTA DE BINANCE (USDT)
                const transaccion = {
                  tipo: 'Gasto',
                  fecha: fecha,
                  descripcion: descripcion || `Gasto en ${categoria}`,
                  monto: gastoDolar, // ← Monto en dólares
                  categoria: categoria,
                  cuenta: 'Binance', // ← Cuenta Binance
                  moneda: 'USDT', // ← Moneda USDT para que se reste del balance Binance
                  total: monto, // ← Total en Bs
                  gastoDolar: gastoDolar,
                  tasaVenta: tasaVenta,
                  importado: true,
                  importadoDesde: 'gastos'
                };

                console.log(`✅ Fila ${numFila} - ${categoria}: Bs${monto} → -$${gastoDolar.toFixed(2)} USDT de Binance`);

                await crearTransaccion(transaccion, usuario);
                transaccionesCreadas.push(transaccion);
              }
            }

            if (!hayAlgunGasto) {
              filasVacias++;
            }

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