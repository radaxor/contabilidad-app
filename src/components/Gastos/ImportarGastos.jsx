import React, { useRef, useState } from 'react';
import { importarExcelGastos } from '../../utils/importarGastos';

const ImportarGastos = ({ usuario, tasaVenta, temaActual }) => {
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
      const result = await importarExcelGastos(file, usuario, tasaVenta);

      let mensaje = '';
      
      if (result.exitosas > 0) {
        mensaje = `✅ Importación de gastos completada!\n\n`;
        mensaje += `📊 ${result.exitosas} gastos importados exitosamente\n`;
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
        alert(`❌ No se pudo importar ningún gasto.\n\nErrores:\n${result.errores.slice(0, 10).join('\n')}`);
      }

    } catch (error) {
      console.error('Error al importar gastos:', error);
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
        className={`${importando ? 'bg-gray-500' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2`}
      >
        {importando ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Importando...
          </>
        ) : (
          <>
            📥 Importar Gastos
          </>
        )}
      </button>
    </div>
  );
};

export default ImportarGastos;