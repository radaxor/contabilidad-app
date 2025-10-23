import React from 'react';

const ResumenPorCliente = ({ temaActual, resumenClientes }) => {
  return (
    <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
      <h2 className="text-2xl font-bold mb-4">👥 Resumen por Cliente</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left p-3">Cliente</th>
              <th className="text-center p-3">Operaciones</th>
              <th className="text-right p-3">Total Bs</th>
              <th className="text-right p-3">Total USD</th>
              <th className="text-right p-3">Por Cobrar</th>
              <th className="text-right p-3">Pagado</th>
            </tr>
          </thead>
          <tbody>
            {resumenClientes.map(resumen => (
              <tr key={resumen.cliente} className="border-b border-white/10 hover:bg-white/5">
                <td className="p-3 font-semibold">{resumen.cliente}</td>
                <td className="p-3 text-center">{resumen.cantidad}</td>
                <td className="p-3 text-right">{resumen.totalBs.toFixed(2)} Bs</td>
                <td className="p-3 text-right font-semibold text-blue-400">${resumen.totalUsd.toFixed(2)}</td>
                <td className="p-3 text-right">
                  <span className="text-orange-400 font-bold">${resumen.porCobrar.toFixed(2)}</span>
                </td>
                <td className="p-3 text-right">
                  <span className="text-green-400 font-bold">${resumen.pagado.toFixed(2)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResumenPorCliente;