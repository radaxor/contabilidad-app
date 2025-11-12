import React, { useState } from 'react';
import { procesarArchivoGastos, validarGastosImportados } from '../../utils/importarGastos';
import { db } from '../../services/firebase';

const ImportadorGastos = ({ usuario, tasaVenta }) => {
  const [archivo, setArchivo] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errores, setErrores] = useState([]);
  const [importando, setImportando] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArchivo(file);
    setErrores([]);
    setPreviewData([]);

    try {
      console.log('📁 Procesando archivo:', file.name);
      const gastosImportados = await procesarArchivoGastos(file, usuario, tasaVenta);
      
      console.log('✅ Gastos procesados:', gastosImportados.length);
      console.log('💰 Total USD a importar:', gastosImportados.reduce((sum, g) => sum + g.gastoDolar, 0));
      
      const { gastosValidos, errores: erroresValidacion } = validarGastosImportados(gastosImportados);
      
      if (erroresValidacion.length > 0) {
        setErrores(erroresValidacion);
      }
      
      setPreviewData(gastosValidos);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setErrores([error.message]);
    }
  };

  const importarGastos = async () => {
    if (previewData.length === 0) return;

    const gastosConCero = previewData.filter(g => g.gastoDolar === 0).length;
    const mensajeCero = gastosConCero > 0 ? `\n\n⚠️ Nota: ${gastosConCero} gastos tienen valor $0 (vacíos en Excel)` : '';

    const confirmar = window.confirm(
      `¿Importar ${previewData.length} gastos?\n\n` +
      `Total USD: $${previewData.reduce((sum, g) => sum + g.gastoDolar, 0).toFixed(2)}\n` +
      `Total Bs: ${previewData.reduce((sum, g) => sum + g.total, 0).toFixed(2)}` +
      mensajeCero +
      '\n\nLos gastos importados NO afectarán el balance del dashboard.'
    );

    if (!confirmar) return;

    setImportando(true);

    try {
      console.log('📤 Iniciando importación de', previewData.length, 'gastos...');
      
      let batch = db.batch();
      let contador = 0;
      let operacionesEnBatch = 0;

      for (const gasto of previewData) {
        const docRef = db.collection('transacciones').doc();
        batch.set(docRef, gasto);
        contador++;
        operacionesEnBatch++;
        
        // Firebase tiene límite de 500 operaciones por batch
        if (operacionesEnBatch >= 500) {
          await batch.commit();
          console.log(`✅ Importados ${contador} gastos...`);
          
          // ⭐ CREAR NUEVO BATCH después del commit
          batch = db.batch();
          operacionesEnBatch = 0;
        }
      }

      // Commit final solo si hay operaciones pendientes
      if (operacionesEnBatch > 0) {
        await batch.commit();
      }
      
      console.log('✅ Importación completada:', contador, 'gastos');
      
      alert(`✅ Se importaron ${contador} gastos correctamente!\n\nTotal USD: $${previewData.reduce((sum, g) => sum + g.gastoDolar, 0).toFixed(2)}`);
      
      // Reset
      setArchivo(null);
      setPreviewData([]);
      setErrores([]);
      
      // Resetear el input
      document.getElementById('file-input-gastos').value = '';
      
    } catch (error) {
      console.error('❌ Error en importación:', error);
      alert('Error al importar: ' + error.message);
    } finally {
      setImportando(false);
    }
  };

  const calcularTotales = () => {
    return {
      totalUSD: previewData.reduce((sum, g) => sum + (parseFloat(g.gastoDolar) || 0), 0),
      totalBs: previewData.reduce((sum, g) => sum + (parseFloat(g.total) || 0), 0),
      cantidad: previewData.length
    };
  };

  const totales = calcularTotales();

  return (
    <div>
      <button
        onClick={() => document.getElementById('file-input-gastos').click()}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        📥 Importar Gastos
      </button>

      <input
        id="file-input-gastos"
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Modal de Preview */}
      {previewData.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">📋 Vista Previa de Importación</h3>
            
            {/* Resumen */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4">
                <p className="text-sm opacity-75">Gastos a Importar</p>
                <p className="text-2xl font-bold">{totales.cantidad}</p>
              </div>
              <div className="bg-pink-500/20 border border-pink-500 rounded-lg p-4">
                <p className="text-sm opacity-75">Total USD</p>
                <p className="text-2xl font-bold">${totales.totalUSD.toFixed(2)}</p>
              </div>
              <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
                <p className="text-sm opacity-75">Total Bs</p>
                <p className="text-2xl font-bold">{totales.totalBs.toFixed(2)}</p>
              </div>
              <div className="bg-gray-500/20 border border-gray-500 rounded-lg p-4">
                <p className="text-sm opacity-75">Gastos con $0</p>
                <p className="text-2xl font-bold">{previewData.filter(g => g.gastoDolar === 0).length}</p>
                <p className="text-xs opacity-60 mt-1">Vacíos en Excel</p>
              </div>
            </div>

            {/* Errores */}
            {errores.length > 0 && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-red-400 mb-2">⚠️ Errores encontrados:</h4>
                <ul className="list-disc list-inside text-sm">
                  {errores.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tabla de Preview */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Hora</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-left p-2">Categoría</th>
                    <th className="text-right p-2">Gasto $</th>
                    <th className="text-right p-2">Tasa</th>
                    <th className="text-right p-2">Total Bs</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((gasto, i) => (
                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-2">{gasto.fecha}</td>
                      <td className="p-2">{gasto.hora}</td>
                      <td className="p-2">{gasto.descripcion}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-purple-500/20 rounded text-xs">
                          {gasto.categoria}
                        </span>
                      </td>
                      <td className="p-2 text-right font-bold">
                        {gasto.gastoDolar === 0 ? (
                          <span className="text-gray-500 flex items-center justify-end gap-1">
                            $0.00 <span className="text-xs">(vacío)</span>
                          </span>
                        ) : (
                          <span className="text-red-400">${gasto.gastoDolar.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-2 text-right">{gasto.tasa.toFixed(2)}</td>
                      <td className="p-2 text-right">{gasto.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <p className="text-sm text-gray-400 mt-2 text-center">
                  ... y {previewData.length - 10} gastos más
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setPreviewData([]);
                  setArchivo(null);
                  setErrores([]);
                  document.getElementById('file-input-gastos').value = '';
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={importarGastos}
                disabled={importando || errores.length > 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importando ? '⏳ Importando...' : `✅ Importar ${previewData.length} Gastos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportadorGastos;