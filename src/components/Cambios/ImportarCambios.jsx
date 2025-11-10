import React, { useRef, useState } from 'react';
import { importarExcelCambios } from '../../utils/importarCambios';

const ImportarCambios = ({ usuario, temaActual }) => {
  const fileInputRef = useRef(null);
  const [importando, setImportando] = useState(false);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setImportando(true);

    try {
      const result = await importarExcelCambios(file, usuario);

      let mensaje = '';
      
      if (result.exitosas > 0) {
        mensaje = `✅ Importación de cambios USD→USDT completada!\n\n`;
        mensaje += `💱 ${result.exitosas} cambios importados exitosamente\n`;
        mensaje += `📄 ${result.total} filas procesadas\n`;
        
        if (result.filasVacias > 0) {
          mensaje += `⚪ ${result.filasVacias} filas vacías omitidas\n`;
        }
        
        if (result.errores.length > 0) {
          mensaje += `\n⚠️ ${result.errores.length} filas con errores:\n`;
          mensaje += result.errores.slice(0, 5).join('\n');
          if (result.errores.length > 5) {
            mensaje += `\n... y ${result.errores.length - 5} errores más`;
          }
        }
        
        alert(mensaje);
        window.location.reload(); // Recargar para ver los cambios
      } else {
        alert(`❌ No se pudo importar ningún cambio.\n\nErrores:\n${result.errores.slice(0, 10).join('\n')}`);
      }

    } catch (error) {
      console.error('Error al importar cambios:', error);
      alert('Error al importar el archivo: ' + error.message);
    } finally {
      setImportando(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <button
        onClick={handleButtonClick}
        disabled={importando}
        className={`${importando ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2`}
      >
        {importando ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Importando...
          </>
        ) : (
          <>
            💱 Importar Cambios USD→USDT
          </>
        )}
      </button>
      
      {/* Instrucciones */}
      <div className="mt-4 text-sm text-gray-300">
        <p className="font-semibold mb-2">📋 Formato del Excel:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Fecha</strong>: DD-MM-YYYY (ej: 15-01-2025)</li>
          <li><strong>Hora</strong>: HH:MM (opcional)</li>
          <li><strong>USD Cambiados</strong>: Monto en USD que se cambió</li>
          <li><strong>USDT Recibidos</strong>: Monto en USDT que se recibió</li>
          <li><strong>Comisión %</strong>: Porcentaje de comisión (0-1%)</li>
          <li><strong>Descripción</strong>: Nota opcional</li>
        </ul>
        <p className="mt-2 text-xs text-gray-400">
          💡 La comisión se calcula automáticamente por la diferencia entre USD y USDT
        </p>
      </div>
    </div>
  );
};

export default ImportarCambios;