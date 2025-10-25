import React from 'react';

const DetalleTransacciones = ({ temaActual, comprasFiltradas, handleCambiarStatus }) => {
  return (
    <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
      <h2 className="text-2xl font-bold mb-4">📋 Detalle de Transacciones</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Cliente</th>
              <th className="text-left p-3">Operador</th>
              <th className="text-center p-3">Status</th>
              <th className="text-right p-3">Compra Bs</th>
              <th className="text-right p-3">Tasa</th>
              <th className="text-right p-3">Compra USD</th>
              <th className="text-right p-3">Ganancia</th>
              <th className="text-center p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.map(compra => (
              <tr key={compra.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="p-3">{compra.fecha}</td>
                <td className="p-3 font-semibold">{compra.cliente}</td>
                <td className="p-3">{compra.operador}</td>
                <td className="p-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    compra.status === 'Pagado' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500' 
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500'
                  }`}>
                    {compra.status}
                  </span>
                </td>
                <td className="p-3 text-right">{compra.compraBs.toFixed(2)} Bs</td>
                <td className="p-3 text-right">{compra.tasa.toFixed(2)}</td>
                <td className="p-3 text-right font-bold text-blue-400">${compra.compraDolar.toFixed(2)}</td>
                <td className="p-3 text-right">
                  <div className="text-sm">
                    <div className="text-green-400 font-semibold">{compra.gananciaBs.toFixed(2)} Bs</div>
                    <div className="text-green-300">${compra.gananciaDolar.toFixed(2)}</div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => handleCambiarStatus(compra)}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      compra.status === 'Pagado'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {compra.status === 'Pagado' ? 'Marcar Por Cobrar' : 'Marcar Pagado'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DetalleTransacciones;