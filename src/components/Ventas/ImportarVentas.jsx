import React, { useRef, useState } from 'react';
import { importarExcelVentas } from '../../utils/importarVentas';

const ImportarVentas = ({ usuario, temaActual }) => {
  const fileInputRef = useRef(null);
  const [importando, setImportando] = useState(false);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
      alert('❌ Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setImportando(true);

    try {
      console.log('🚀 Iniciando importación de ventas...');
      const result = await importarExcelVentas(file, usuario);

      let mensaje = '';
      
      if (result.exitosas > 0) {
        mensaje = `✅ ¡Importación de ventas completada!\n\n`;
        mensaje += `📊 ${result.exitosas} ventas importadas exitosamente\n`;
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

        mensaje += '\n\n🔄 La página se recargará para mostrar los cambios.';
        
        alert(mensaje);
        
        // Recargar la página para mostrar las ventas importadas
        window.location.reload();
        
      } else {
        alert(`❌ No se pudo importar ninguna venta.\n\nErrores:\n${result.errores.slice(0, 10).join('\n')}`);
      }

    } catch (error) {
      console.error('❌ Error al importar ventas:', error);
      alert('❌ Error al importar el archivo:\n\n' + error.message);
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
        disabled={importando}
      />
      
      <button
        onClick={handleButtonClick}
        disabled={importando}
        className={`${
          importando 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors`}
      >
        {importando ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Importando...</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span>Importar Ventas</span>
          </>
        )}
      </button>

      {importando && (
        <p className="text-xs text-gray-400 mt-2 animate-pulse">
          Procesando archivo Excel, por favor espera...
        </p>
      )}

      {!importando && (
        <div className="mt-2 text-xs text-gray-400">
          <p className="font-semibold text-white mb-1">📋 Formato requerido del Excel:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Fecha:</strong> DD/MM/YYYY (Ej: 15/11/2024)</li>
            <li><strong>VENTA $:</strong> Monto en USDT</li>
            <li><strong>Tasa:</strong> Tasa de venta</li>
            <li><strong>Recibido en CTA:</strong> Bolívares recibidos</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImportarVentas;