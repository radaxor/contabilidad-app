import React, { useRef, useState, useMemo } from 'react';
import { importarExcelCambios } from '../../utils/importarCambios';
import { calcularEstadisticasCambios } from '../../utils/calculos';
import { db } from '../../services/firebase';

const Cambios = ({ usuario, temaActual, transacciones }) => {
  const fileInputRef = useRef(null);
  const [importando, setImportando] = useState(false);
  const [vistaActual, setVistaActual] = useState('estadisticas'); // estadisticas | tabla

  // Filtrar solo cambios
  const cambios = useMemo(() => {
    return transacciones.filter(t => 
      t.tipo === 'Cambio' && t.importadoDesde === 'cambios'
    ).sort((a, b) => {
      const fechaA = new Date(a.fecha + ' ' + (a.hora || '00:00'));
      const fechaB = new Date(b.fecha + ' ' + (b.hora || '00:00'));
      return fechaB - fechaA; // Más reciente primero
    });
  }, [transacciones]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    return calcularEstadisticasCambios(transacciones);
  }, [transacciones]);

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
        window.location.reload();
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

  const limpiarCambiosImportados = async () => {
    const confirmar = window.confirm(
      '⚠️ ¿Estás seguro de que deseas eliminar TODOS los cambios importados?\n\n' +
      'Esta acción NO se puede deshacer.'
    );

    if (!confirmar) return;

    try {
      const snapshot = await db.collection('transacciones')
        .where('usuarioId', '==', usuario.uid)
        .where('importado', '==', true)
        .where('importadoDesde', '==', 'cambios')
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      alert(`✅ Se eliminaron ${snapshot.size} cambios importados`);
      window.location.reload();
    } catch (error) {
      console.error('Error al limpiar cambios:', error);
      alert('Error al eliminar cambios: ' + error.message);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const [año, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${año}`;
  };

  const formatearNumero = (num) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${temaActual.tarjeta} backdrop-blur-sm p-6 rounded-xl shadow-xl`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">💱 Cambios USD → USDT</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setVistaActual('estadisticas')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                vistaActual === 'estadisticas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              📊 Estadísticas
            </button>
            <button
              onClick={() => setVistaActual('tabla')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                vistaActual === 'tabla'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              📋 Tabla
            </button>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4">
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
            className={`${
              importando ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'
            } text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2`}
          >
            {importando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Importando...
              </>
            ) : (
              <>📥 Importar Excel</>
            )}
          </button>

          {cambios.length > 0 && (
            <button
              onClick={limpiarCambiosImportados}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              🗑️ Limpiar Cambios Importados
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {cambios.length === 0 ? (
        <div className={`${temaActual.tarjeta} backdrop-blur-sm p-8 rounded-xl shadow-xl text-center`}>
          <p className="text-xl mb-4">📭 No hay cambios importados</p>
          <p className="text-gray-400 mb-6">
            Importa un archivo Excel con tus cambios de USD a USDT para ver las estadísticas
          </p>
          <div className="text-left max-w-2xl mx-auto">
            <p className="font-semibold mb-2">📋 Formato del Excel:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li><strong>fecha</strong>: DD/MM/YYYY</li>
              <li><strong>hora</strong>: HH:MM</li>
              <li><strong>usd</strong>: Monto en USD cambiados</li>
              <li><strong>usdt</strong>: Monto en USDT recibidos</li>
              <li><strong>Usuario Cambiador</strong>: Nombre</li>
              <li><strong>Descripcion</strong>: Nota</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          {/* VISTA: Estadísticas */}
          {vistaActual === 'estadisticas' && estadisticas && (
            <div className="space-y-6">
              {/* Resumen General */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                  <p className="text-sm text-gray-400">Total Cambios</p>
                  <p className="text-2xl font-bold">{estadisticas.totalCambios}</p>
                </div>
                <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                  <p className="text-sm text-gray-400">Total USD</p>
                  <p className="text-2xl font-bold">${formatearNumero(estadisticas.totalUSD)}</p>
                </div>
                <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                  <p className="text-sm text-gray-400">Total USDT</p>
                  <p className="text-2xl font-bold">{formatearNumero(estadisticas.totalUSDT)}</p>
                </div>
                <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                  <p className="text-sm text-gray-400">Comisión Total</p>
                  <p className="text-2xl font-bold text-red-400">${formatearNumero(estadisticas.totalComision)}</p>
                  <p className="text-xs text-gray-400 mt-1">{estadisticas.promedioComision.toFixed(3)}% promedio</p>
                </div>
              </div>

              {/* Registros Destacados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                  <p className="text-sm text-gray-400 mb-2">🔼 Cambio Más Alto</p>
                  <p className="text-xl font-bold">${formatearNumero(estadisticas.cambioMasAlto.montoUSD || 0)}</p>
                  <p className="text-sm text-gray-300">
                    {formatearFecha(estadisticas.cambioMasAlto.fecha)} - {estadisticas.cambioMasAlto.usuarioCambiador}
                  </p>
                </div>

                <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                  <p className="text-sm text-gray-400 mb-2">🔽 Cambio Más Bajo</p>
                  <p className="text-xl font-bold">${formatearNumero(estadisticas.cambioMasBajo.montoUSD || 0)}</p>
                  <p className="text-sm text-gray-300">
                    {formatearFecha(estadisticas.cambioMasBajo.fecha)} - {estadisticas.cambioMasBajo.usuarioCambiador}
                  </p>
                </div>

                <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                  <p className="text-sm text-gray-400 mb-2">✅ Mejor Tasa</p>
                  <p className="text-xl font-bold text-green-400">{estadisticas.mejorTasa.tasa.toFixed(4)}</p>
                  <p className="text-sm text-gray-300">
                    {formatearFecha(estadisticas.mejorTasa.fecha)} - ${formatearNumero(estadisticas.mejorTasa.montoUSD || 0)}
                  </p>
                </div>

                <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                  <p className="text-sm text-gray-400 mb-2">❌ Peor Tasa</p>
                  <p className="text-xl font-bold text-red-400">{estadisticas.peorTasa.tasa.toFixed(4)}</p>
                  <p className="text-sm text-gray-300">
                    {formatearFecha(estadisticas.peorTasa.fecha)} - ${formatearNumero(estadisticas.peorTasa.montoUSD || 0)}
                  </p>
                </div>
              </div>

              {/* Día con más cambios */}
              <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                <p className="text-sm text-gray-400 mb-2">📅 Día con Más Cambios</p>
                <p className="text-xl font-bold">{formatearFecha(estadisticas.diaConMasCambios.fecha)}</p>
                <p className="text-sm text-gray-300">
                  {estadisticas.diaConMasCambios.cantidad} operaciones - ${formatearNumero(estadisticas.diaConMasCambios.totalUSD)}
                </p>
              </div>

              {/* Usuario Top */}
              <div className={`${temaActual.tarjeta} backdrop-blur-sm p-4 rounded-xl`}>
                <p className="text-sm text-gray-400 mb-2">👤 Usuario que Más Cambió</p>
                <p className="text-xl font-bold">{estadisticas.usuarioTop.nombre}</p>
                <p className="text-sm text-gray-300">
                  {estadisticas.usuarioTop.cantidad} cambios - ${formatearNumero(estadisticas.usuarioTop.totalUSD)} USD
                </p>
              </div>
            </div>
          )}

          {/* VISTA: Tabla */}
          {vistaActual === 'tabla' && (
            <div className={`${temaActual.tarjeta} backdrop-blur-sm rounded-xl shadow-xl overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Hora</th>
                      <th className="px-4 py-3 text-right">USD</th>
                      <th className="px-4 py-3 text-right">USDT</th>
                      <th className="px-4 py-3 text-right">Comisión</th>
                      <th className="px-4 py-3 text-right">Tasa</th>
                      <th className="px-4 py-3 text-left">Usuario</th>
                      <th className="px-4 py-3 text-left">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cambios.map((cambio, index) => (
                      <tr key={index} className="border-t border-white/10 hover:bg-white/5">
                        <td className="px-4 py-3">{formatearFecha(cambio.fecha)}</td>
                        <td className="px-4 py-3">{cambio.hora || '--:--'}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ${formatearNumero(cambio.montoUSD)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-400">
                          {formatearNumero(cambio.montoUSDT)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400">
                          ${formatearNumero(cambio.comision || 0)}
                          <span className="text-xs ml-1">
                            ({(cambio.comisionPorcentaje || 0).toFixed(2)}%)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(cambio.tasaCambio || 0).toFixed(4)}
                        </td>
                        <td className="px-4 py-3">{cambio.usuarioCambiador || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {cambio.descripcion || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cambios;