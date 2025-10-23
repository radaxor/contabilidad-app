import React, { useMemo } from 'react';
import ImportarVentas from './ImportarVentas';
import { db } from '../../services/firebase';

const Ventas = ({ transacciones, temaActual, usuario }) => {
  // Filtrar solo ventas
  const ventas = useMemo(() => {
    return transacciones.filter(t => t.tipo === 'Venta');
  }, [transacciones]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    let totalUSDT = 0;
    let totalBs = 0;
    let totalComision = 0;

    ventas.forEach(v => {
      totalUSDT += v.montoUSDT || 0;
      totalBs += v.montoBs || 0;
      totalComision += v.comisionBinance || 0;
    });

    const tasaPromedio = totalUSDT > 0 ? totalBs / totalUSDT : 0;

    return {
      cantidad: ventas.length,
      totalUSDT,
      totalBs,
      totalComision,
      tasaPromedio
    };
  }, [ventas]);

  // Limpiar ventas importadas
  const limpiarVentasImportadas = async () => {
    const confirmar = window.confirm(
      '⚠️ ¿Eliminar TODAS las ventas importadas de Binance?\n\n' +
      'Esta acción NO se puede deshacer.'
    );

    if (!confirmar) return;

    try {
      const snapshot = await db.collection('transacciones')
        .where('usuarioId', '==', usuario.uid)
        .where('importado', '==', true)
        .where('importadoDesde', '==', 'ventas')
        .get();

      if (snapshot.empty) {
        alert('ℹ️ No hay ventas importadas para eliminar');
        return;
      }

      const promesas = [];
      snapshot.forEach(doc => {
        promesas.push(db.collection('transacciones').doc(doc.id).delete());
      });

      await Promise.all(promesas);
      
      alert(`✅ Se eliminaron ${snapshot.size} ventas importadas.`);
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6 border border-white/20`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">💵 Ventas de Binance</h2>
            <p className="text-sm opacity-75">Gestión de ventas P2P</p>
          </div>
          <div className="flex gap-2">
            <ImportarVentas 
              usuario={usuario}
              temaActual={temaActual}
            />
            <button
              onClick={limpiarVentasImportadas}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              🗑️ Limpiar Ventas
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total Ventas</p>
          <p className="text-3xl font-bold">{estadisticas.cantidad}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total USDT Vendido</p>
          <p className="text-2xl font-bold">${estadisticas.totalUSDT.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total Bs Recibido</p>
          <p className="text-2xl font-bold">Bs {estadisticas.totalBs.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Comisión Binance</p>
          <p className="text-2xl font-bold">${estadisticas.totalComision.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Tasa Promedio</p>
          <p className="text-2xl font-bold">{estadisticas.tasaPromedio.toFixed(2)}</p>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4">📋 Historial de Ventas</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Hora</th>
                <th className="text-right p-3">USDT Vendido</th>
                <th className="text-right p-3">Comisión</th>
                <th className="text-right p-3">Tasa</th>
                <th className="text-right p-3">Bs Recibido</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="p-3">{v.fecha}</td>
                  <td className="p-3">{v.hora}</td>
                  <td className="p-3 text-right font-bold text-blue-400">
                    ${v.montoUSDT?.toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-red-400">
                    ${v.comisionBinance?.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">{v.tasaVenta?.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold text-green-400">
                    Bs {v.montoBs?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ventas.length === 0 && (
            <p className="text-center py-8 opacity-75">No hay ventas registradas</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ventas;