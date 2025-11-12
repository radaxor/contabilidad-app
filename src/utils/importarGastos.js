import * as XLSX from 'xlsx';

/**
 * Función auxiliar para limpiar números (maneja formatos con comas y puntos)
 */
const limpiarNumero = (valor) => {
  // ✅ Manejar valores vacíos, null, undefined o strings vacíos
  if (valor === null || valor === undefined || valor === '' || valor === ' ') return 0;
  
  // Si ya es número, retornarlo (incluyendo 0)
  if (typeof valor === 'number') return valor;
  
  // Convertir a string y limpiar espacios
  let str = String(valor).trim();
  
  // Si después de limpiar está vacío, retornar 0
  if (str === '') return 0;
  
  // Remover símbolos de moneda y espacios
  str = str.replace(/[$\s]/g, '');
  
  // Si quedó vacío después de remover símbolos, retornar 0
  if (str === '') return 0;
  
  // Detectar si usa formato europeo (coma como decimal)
  // Si tiene punto como separador de miles Y coma como decimal: 1.234,56
  if (str.match(/\.\d{3}/) && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  // Si solo tiene coma (formato europeo simple): 1234,56
  else if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  }
  // Si tiene coma Y punto, pero el punto está al final (decimal): 1,234.56
  else if (str.includes(',') && str.includes('.')) {
    str = str.replace(/,/g, '');
  }
  
  const numero = parseFloat(str);
  
  // Si el resultado es NaN, retornar 0
  return isNaN(numero) ? 0 : numero;
};

/**
 * Convierte fecha de Excel (número serial) a formato YYYY-MM-DD
 */
const convertirFechaExcel = (serial) => {
  if (!serial) return new Date().toISOString().split('T')[0];
  
  // Si ya es una fecha válida
  if (typeof serial === 'string' && serial.includes('-')) {
    return serial;
  }
  
  // Si es un número serial de Excel
  if (typeof serial === 'number') {
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  return new Date().toISOString().split('T')[0];
};

/**
 * Convierte hora de Excel a formato HH:MM
 */
const convertirHoraExcel = (valor) => {
  if (!valor) return '00:00';
  
  // Si ya es string en formato correcto
  if (typeof valor === 'string' && valor.includes(':')) {
    return valor;
  }
  
  // Si es fracción de día de Excel (0.5 = 12:00 PM)
  if (typeof valor === 'number' && valor < 1) {
    const totalMinutes = Math.round(valor * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return '00:00';
};

/**
 * Procesa el archivo Excel de gastos
 */
export const procesarArchivoGastos = (file, usuario, tasaVenta) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log('📁 Leyendo archivo Excel...');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        console.log('📊 Datos leídos del Excel:', jsonData.length, 'filas');
        console.log('📋 Primera fila de ejemplo:', jsonData[0]);
        
        // Mapear los datos del Excel al formato de la app
        const gastosImportados = jsonData.map((row, index) => {
          // Leer campos del Excel
          const fecha = convertirFechaExcel(row['Fecha']);
          const hora = convertirHoraExcel(row['Hora']);
          const descripcion = row['Descripcion'] || row['descripcion'] || `Gasto ${index + 1}`;
          
          // ⭐ CAMPO CRÍTICO: Leer "Gasto en $" correctamente
          const gastoDolar = limpiarNumero(row['Gasto en $'] || row['Gasto en'] || row['gasto en $'] || 0);
          
          // Leer tasa de venta (para calcular el monto en Bs)
          const tasaUsada = limpiarNumero(row['Tasa de venta'] || row['Tasa Venta'] || row['tasa de venta'] || tasaVenta);
          
          // Calcular el total en Bs (gasto en $ * tasa)
          const totalBs = gastoDolar * tasaUsada;
          
          // Determinar categoría (buscar en múltiples columnas)
          let categoria = 'Sin Categoría';
          const columnasCategoria = [
            'Varios', 'Escuela', 'Servicios', 'Rafael', 'Emilys', 
            'Casa', 'Carro', 'Prestamos', 'Remesas', 'Pasajes'
          ];
          
          for (const col of columnasCategoria) {
            const valor = limpiarNumero(row[col]);
            if (valor > 0) {
              categoria = col;
              break;
            }
          }
          
          console.log(`Fila ${index + 1}:`, {
            descripcion,
            'Gasto en $': gastoDolar === 0 ? '0 (vacío)' : gastoDolar,
            'Tasa': tasaUsada,
            'Total Bs': totalBs,
            categoria
          });
          
          return {
            tipo: 'Gasto',
            fecha: fecha,
            hora: hora,
            descripcion: descripcion,
            categoria: categoria,
            moneda: 'USD',
            monto: gastoDolar,           // ⭐ Gasto en dólares
            gastoDolar: gastoDolar,       // ⭐ Campo específico para el gasto en $
            tasa: tasaUsada,
            total: totalBs,               // Total en Bs calculado
            cuenta: 'General',
            esImportado: true,            // ⭐ Marca como importado
            importadoDesde: 'gastos',
            usuarioId: usuario.uid,
            creadoPor: usuario.email,
            importado: true,  // ← ¿Está esta línea?
            importadoEn: new Date().toISOString()
          };
        });
        
        console.log('✅ Gastos procesados:', gastosImportados.length);
        console.log('💰 Suma total USD:', gastosImportados.reduce((sum, g) => sum + g.gastoDolar, 0));
        
        resolve(gastosImportados);
        
      } catch (error) {
        console.error('❌ Error al procesar archivo:', error);
        reject(new Error('Error al procesar el archivo: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Valida los gastos importados
 */
export const validarGastosImportados = (gastos) => {
  const errores = [];
  const gastosValidos = [];
  
  gastos.forEach((gasto, index) => {
    const fila = index + 2; // +2 porque Excel empieza en 1 y tiene headers
    
    // Validaciones
    if (!gasto.fecha || gasto.fecha === 'Invalid Date') {
      errores.push(`Fila ${fila}: Fecha inválida`);
      return;
    }
    
    if (!gasto.descripcion) {
      errores.push(`Fila ${fila}: Falta descripción`);
      return;
    }
    
    // ✅ PERMITIR gastos con valor 0 o null
    // Solo validar que el valor sea un número válido
    if (isNaN(gasto.gastoDolar)) {
      errores.push(`Fila ${fila}: Gasto en $ tiene un valor inválido (valor: ${gasto.gastoDolar})`);
      return;
    }
    
    gastosValidos.push(gasto);
  });
  
  return { gastosValidos, errores };
};