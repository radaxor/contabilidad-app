import React from 'react';
import ImportarGastos from './ImportarGastos';

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

  const resumenCategorias = calcularPorCategoria();

  return (
    <div className="space-y-6">
      {/* Header con botón de importar */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6 border border-white/20`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">💰 Gestión de Gastos</h2>
            <p className="text-sm opacity-75">Total de gastos: {gastos.length}</p>
          </div>
          <ImportarGastos 
            usuario={usuario}
            tasaVenta={tasaVenta}
            temaActual={temaActual}
          />
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
              </tr>
            </thead>
            <tbody>
              {resumenCategorias.map(cat => (
                <tr key={cat.categoria} className="border-b border-white/10 hover:bg-white/5">
                  <td className="p-3 font-semibold">{cat.categoria}</td>
                  <td className="p-3 text-center">{cat.cantidad}</td>
                  <td className="p-3 text-right">{cat.totalBs.toFixed(2)} Bs</td>
                  <td className="p-3 text-right font-bold text-red-400">${cat.totalDolar.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de gastos recientes */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h2 className="text-2xl font-bold mb-4">📋 Últimos Gastos</h2>
        <div className="space-y-2">
          {gastos.slice(0, 20).map(g => (
            <div key={g.id} className="flex justify-between items-center bg-slate-700/50 rounded-lg p-4">
              <div className="flex-1">
                <p className="font-semibold">{g.descripcion}</p>
                <p className="text-sm opacity-75">{g.fecha} - {g.categoria}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-400">{g.total?.toFixed(2) || g.monto?.toFixed(2)} Bs</p>
                <p className="text-sm text-red-300">${g.gastoDolar?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gastos;