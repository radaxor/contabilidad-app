// src/hooks/useExportar.js
import { useState } from 'react';
import { exportarExcel, exportarPDF } from '../utils/exportar';

export const useExportar = (usuario) => {
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState(null);

  const exportarTransaccionesExcel = async (transacciones) => {
    try {
      setExportando(true);
      setError(null);
      
      const nombreArchivo = `contabilidad_${usuario?.email}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const result = exportarExcel(transacciones, nombreArchivo);
      
      if (!result.success) {
        setError(result.error);
        return { success: false };
      }
      
      return { success: true };
    } catch (err) {
      const errorMsg = 'Error al exportar Excel';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setExportando(false);
    }
  };

  const exportarTransaccionesPDF = async (transacciones) => {
    try {
      setExportando(true);
      setError(null);
      
      const nombreArchivo = `reporte_${usuario?.email}_${new Date().toISOString().split('T')[0]}.pdf`;
      const result = exportarPDF(transacciones, usuario?.email, nombreArchivo);
      
      if (!result.success) {
        setError(result.error);
        return { success: false };
      }
      
      return { success: true };
    } catch (err) {
      const errorMsg = 'Error al exportar PDF';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setExportando(false);
    }
  };

  return {
    exportando,
    error,
    exportarTransaccionesExcel,
    exportarTransaccionesPDF
  };
};

export default useExportar;