import React from 'react';
import { actualizarTasaCambio, actualizarTasaVenta } from '../../services/configuracion.service';

const Tasas = ({ usuario, temaActual, tasaCambio, setTasaCambio, tasaVenta, setTasaVenta }) => {
  const handleActualizarTasas = async () => {
    try {
      await actualizarTasaCambio(usuario, tasaCambio);
      alert('Tasas actualizadas correctamente');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleActualizarTasaVenta = async () => {
    try {
      await actualizarTasaVenta(usuario, tasaVenta);
      alert('Tasa de venta actualizada correctamente');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
      <h2 className="text-2xl font-bold mb-4">💱 Mis Configuraciones de Tasas</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-3">Tasas de Cambio General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">USD a BS</label>
              <input
                type="number"
                step="0.01"
                value={tasaCambio.usdToBs}
                onChange={e => setTasaCambio({...tasaCambio, usdToBs: parseFloat(e.target.value)})}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">USDT a USD</label>
              <input
                type="number"
                step="0.0001"
                value={tasaCambio.usdtToUsd}
                onChange={e => setTasaCambio({...tasaCambio, usdtToUsd: parseFloat(e.target.value)})}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2"
              />
            </div>
          </div>
        </div>

        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-3 text-green-400">Tasa de Venta (Para Cálculo de Ganancias y Gastos)</h3>
          <div>
            <label className="block text-sm mb-2">Precio de Venta por Dólar (en Bs)</label>
            <input
              type="number"
              step="0.01"
              value={tasaVenta}
              onChange={e => setTasaVenta(parseFloat(e.target.value))}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2"
              placeholder="37.00"
            />
            <p className="text-xs text-green-300 mt-2">Esta tasa se usa para calcular las ganancias en las compras de divisas y para convertir los gastos a dólares</p>
          </div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
          <p className="text-sm text-blue-200">
            📝 <strong>Nota:</strong> Estas configuraciones son personales y no afectan a otros usuarios del sistema.
          </p>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleActualizarTasas}
          className={`flex-1 ${temaActual.boton} text-white px-6 py-3 rounded-lg font-semibold`}
        >
          Guardar Tasas de Cambio
        </button>
        <button
          onClick={handleActualizarTasaVenta}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Guardar Tasa de Venta
        </button>
      </div>
    </div>
  );
};

export default Tasas;