import React, { useRef, useState } from 'react';
import { importarExcelPorCobrar } from '../../utils/importarExcel';

const ImportarExcel = ({ usuario, tasaVenta, temaActual }) => {
  const fileInputRef = useRef(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setImportando(true);
    setResultado(null);

    try {
      const result = await importarExcelPorCobrar(file, usuario, tasaVenta);
      setResultado(result);

      let mensaje = '';
      
      if (result.exitosas > 0) {
        mensaje = `✅ Importación completada!\n\n`;
        mensaje += `📊 ${result.exitosas} transacciones importadas exitosamente\n`;
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
      } else {
        alert(`❌ No se pudo importar ninguna transacción.\n\nErrores:\n${result.errores.slice(0, 10).join('\n')}`);
      }

    } catch (error) {
      console.error('Error al importar:', error);
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
        className={`${importando ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors`}
      >
        {importando ? (
          <>
            <span className="animate-spin">⏳</span>
            Importando...
          </>
        ) : (
          <>
            📥 Importar Excel
          </>
        )}
      </button>

      {resultado && (
        <div className="mt-4">
          {resultado.exitosas > 0 && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-2">
              <h3 className="font-bold text-green-400">✅ Importación exitosa</h3>
              <p className="text-sm text-green-300 mt-1">
                {resultado.exitosas} de {resultado.total} transacciones importadas
              </p>
            </div>
          )}
          
          {resultado.errores.length > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
              <h3 className="font-bold text-yellow-400 mb-2">⚠️ Advertencias ({resultado.errores.length})</h3>
              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {resultado.errores.map((error, i) => (
                  <li key={i} className="text-yellow-300">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportarExcel;