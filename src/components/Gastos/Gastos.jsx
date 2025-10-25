import React from 'react';
import ImportarGastos from './ImportarGastos';
import { db } from '../../services/firebase';

const Gastos = ({ transacciones, temaActual, usuario, tasaVenta }) => {
  // Filtrar solo gastos
  const gastos = transacciones.filter(t => t.tipo === 'Gasto');

  // Calcular total por categoría
  const calcularPorCategoria = () => {
    const porCategoria = {};
    gastos.forEach(g => {
      if (!porCategoria[g.categoria]) {
        porCategoria[g.categoria] = {
          categoria: g.categoria,
          totalBs: 0,
          totalDolar: 0,
          cantidad: 0
        };
      }
      porCategoria[g.categoria].totalBs += g.total || g.monto || 0;
      porCategoria[g.categoria].totalDolar += g.gastoDolar || 0;
      porCategoria[g.categoria].cantidad++;
    });
    return Object.values(porCategoria).sort((a, b) => b.totalDolar - a.totalDolar);
  };

  // ✅ FUNCIÓN PARA LIMPIAR GASTOS IMPORTADOS
  const limpiarGastosImportados = async () => {
    const confirmar = window.confirm(
      '⚠️ ¿Eliminar TODOS los gastos importados?\n\n' +
      'Esta acción NO se puede deshacer.'
    );

    if (!confirmar) return;

    try {
      const snapshot = await db.collection('transacciones')
        .where('usuarioId', '==', usuario.uid)
        .where('importado', '==', true)
        .where('importadoDesde', '==', 'gastos')
        .get();

      if (snapshot.empty) {
        alert('ℹ️ No hay gastos importados para eliminar');
        return;
      }

      const promesas = [];
      snapshot.forEach(doc => {
        promesas.push(db.collection('transacciones').doc(doc.id).delete());
      });

      await Promise.all(promesas);
      
      alert(`✅ Se eliminaron ${snapshot.size} gastos importados.`);
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const resumenCategorias = calcularPorCategoria();

  // Calcular totales generales
  const totales = {
    totalBs: gastos.reduce((sum, g) => sum + (g.total || g.monto || 0), 0),
    totalDolar: gastos.reduce((sum, g) => sum + (g.gastoDolar || 0), 0),
    importados: gastos.filter(g => g.importado).length,
    normales: gastos.filter(g => !g.importado).length
  };

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6 border border-white/20`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">💰 Gestión de Gastos</h2>
            <p className="text-sm opacity-75">
              Total de gastos: {gastos.length} 
              ({totales.normales} normales, {totales.importados} importados)
            </p>
          </div>
          <div className="flex gap-2">
            <ImportarGastos 
              usuario={usuario}
              tasaVenta={tasaVenta}
              temaActual={temaActual}
            />
            {/* ✅ BOTÓN PARA LIMPIAR GASTOS IMPORTADOS */}
            <button
              onClick={limpiarGastosImportados}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              🗑️ Limpiar Importados
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total Gastos</p>
          <p className="text-3xl font-bold">{gastos.length}</p>
          <p className="text-xs mt-2 opacity-75">Transacciones</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total en Bs</p>
          <p className="text-2xl font-bold">{totales.totalBs.toFixed(2)}</p>
          <p className="text-xs mt-2 opacity-75">Bolívares</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total en USD</p>
          <p className="text-3xl font-bold">${totales.totalDolar.toFixed(2)}</p>
          <p className="text-xs mt-2 opacity-75">Dólares</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Promedio por Gasto</p>
          <p className="text-2xl font-bold">
            ${gastos.length > 0 ? (totales.totalDolar / gastos.length).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs mt-2 opacity-75">USD</p>
        </div>
      </div>

      {/* Resumen por categoría */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h2 className="text-2xl font-bold mb-4">📊 Resumen por Categoría</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3">Categoría</th>
                <th className="text-center p-3">Cantidad</th>
                <th className="text-right p-3">Total Bs</th>
                <th className="text-right p-3">Total USD</th>
                <th className="text-right p-3">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {resumenCategorias.map(cat => (
                <tr key={cat.categoria} className="border-b border-white/10 hover:bg-white/5">
                  <td className="p-3 font-semibold">{cat.categoria}</td>
                  <td className="p-3 text-center">{cat.cantidad}</td>
                  <td className="p-3 text-right">{cat.totalBs.toFixed(2)} Bs</td>
                  <td className="p-3 text-right font-bold text-red-400">${cat.totalDolar.toFixed(2)}</td>
                  <td className="p-3 text-right text-blue-400 font-semibold">
                    {totales.totalDolar > 0 ? ((cat.totalDolar / totales.totalDolar) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de gastos recientes */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h2 className="text-2xl font-bold mb-4">📋 Últimos 20 Gastos</h2>
        <div className="space-y-2">
          {gastos.slice(0, 20).map(g => (
            <div key={g.id} className="flex justify-between items-center bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{g.descripcion}</p>
                  {g.importado && (
                    <span className="text-xs bg-blue-500/30 px-2 py-1 rounded">📥 Importado</span>
                  )}
                </div>
                <p className="text-sm opacity-75">
                  {g.fecha} - {g.categoria} - {g.cuenta}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-400">
                  {g.total?.toFixed(2) || g.monto?.toFixed(2) || '0.00'} Bs
                </p>
                <p className="text-sm text-red-300">${g.gastoDolar?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          ))}
          {gastos.length === 0 && (
            <p className="text-center py-8 opacity-75">No hay gastos registrados</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gastos;