import React from 'react';

const FiltrosPorCobrar = ({ 
  temaActual, 
  filtrosPorCobrar, 
  setFiltrosPorCobrar, 
  clientesUnicos, 
  operadoresUnicos, 
  limpiarFiltros 
}) => {
  return (
    <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
      <h2 className="text-2xl font-bold mb-4">🔍 Filtros</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm mb-2 font-semibold">Cliente</label>
          <select
            value={filtrosPorCobrar.cliente}
            onChange={e => setFiltrosPorCobrar({...filtrosPorCobrar, cliente: e.target.value})}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-2"
          >
            <option value="todos">Todos los clientes</option>
            {clientesUnicos.map(cliente => (
              <option key={cliente} value={cliente}>{cliente}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-2 font-semibold">Status</label>
          <select
            value={filtrosPorCobrar.status}
            onChange={e => setFiltrosPorCobrar({...filtrosPorCobrar, status: e.target.value})}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-2"
          >
            <option value="todos">Todos</option>
            <option value="Por Cobrar">Por Cobrar</option>
            <option value="Pagado">Pagado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-2 font-semibold">Operador</label>
          <select
            value={filtrosPorCobrar.operador}
            onChange={e => setFiltrosPorCobrar({...filtrosPorCobrar, operador: e.target.value})}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-2"
          >
            <option value="todos">Todos los operadores</option>
            {operadoresUnicos.map(operador => (
              <option key={operador} value={operador}>{operador}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-2 font-semibold">Fecha Inicio</label>
          <input
            type="date"
            value={filtrosPorCobrar.fechaInicio}
            onChange={e => setFiltrosPorCobrar({...filtrosPorCobrar, fechaInicio: e.target.value})}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 font-semibold">Fecha Fin</label>
          <input
            type="date"
            value={filtrosPorCobrar.fechaFin}
            onChange={e => setFiltrosPorCobrar({...filtrosPorCobrar, fechaFin: e.target.value})}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-2"
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={limpiarFiltros}
          className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};

export default FiltrosPorCobrar;