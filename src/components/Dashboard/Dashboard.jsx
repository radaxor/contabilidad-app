import React from 'react';
import { calcularResumenMensual, calcularPorCategoria } from '../../utils/calculos';

const Dashboard = ({ transacciones, balance, temaActual, filtroMes, setFiltroMes, mesesDisponibles, tasaCambio }) => {
  // Calcular resumen y categorías basado en las transacciones filtradas
  const resumen = calcularResumenMensual(transacciones, tasaCambio);
  const categorias = calcularPorCategoria(transacciones, tasaCambio);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <select 
          value={filtroMes} 
          onChange={e => setFiltroMes(e.target.value)} 
          className="bg-slate-700 text-white rounded-lg px-4 py-2"
        >
          <option value="todos">Todos los meses</option>
          {mesesDisponibles.map(mes => (
            <option key={mes} value={mes}>{mes}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white">
          <p className="mb-2">Balance (DIVISA)</p>
          <p className="text-3xl font-bold">${balance.usd.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
          <p className="mb-2">Balance Binance (USDT)</p>
          <p className="text-3xl font-bold">{balance.usdt.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
          <p className="mb-2">Balance BS</p>
          <p className="text-3xl font-bold">{balance.bs.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white">
          <p className="mb-2">Mis Transacciones</p>
          <p className="text-3xl font-bold">{transacciones.length}</p>
        </div>
      </div>

      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h2 className="text-2xl font-bold mb-4">Resumen del Período</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/50">
            <p className="text-sm">Ingresos</p>
            <p className="text-2xl font-bold text-green-400">${resumen.ingresos.toFixed(2)}</p>
          </div>
          <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/50">
            <p className="text-sm">Gastos</p>
            <p className="text-2xl font-bold text-red-400">${resumen.gastos.toFixed(2)}</p>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/50">
            <p className="text-sm">Compras</p>
            <p className="text-2xl font-bold text-blue-400">${resumen.compras.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/50">
            <p className="text-sm">Ventas</p>
            <p className="text-2xl font-bold text-yellow-400">${resumen.ventas.toFixed(2)}</p>
          </div>
          <div className={`rounded-lg p-4 border ${resumen.balance >= 0 ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
            <p className="text-sm">Balance</p>
            <p className={`text-2xl font-bold ${resumen.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${resumen.balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h2 className="text-2xl font-bold mb-4">Top Categorías</h2>
        <div className="space-y-3">
          {categorias.slice(0, 5).map(([cat, monto], i) => (
            <div key={cat} className="flex justify-between items-center bg-slate-700/50 rounded-lg p-4">
              <span className="font-semibold">{i + 1}. {cat}</span>
              <span className="text-lg font-bold">${monto.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;