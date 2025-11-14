import React from 'react';

const FormVenta = ({ formVenta, setFormVenta }) => {
  const cuentasDestino = ['Provincial', 'Venezuela'];

  // Calcular comisión Binance (0.2%)
  const montoUSDT = parseFloat(formVenta.montoUSDT) || 0;
  const comisionBinance = montoUSDT * 0.002;
  const usdtNeto = montoUSDT - comisionBinance;
  const tasaVenta = parseFloat(formVenta.tasaVenta) || 0;
  const montoBs = usdtNeto * tasaVenta;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-500 to-green-500 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-100 mb-1">💰 Venta desde Binance</p>
        <p className="text-lg font-bold text-white">
          Registra tu venta de USDT a Bolívares
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Fecha</label>
          <input 
            type="date" 
            value={formVenta.fecha} 
            onChange={e => setFormVenta({...formVenta, fecha: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Hora de la Operación</label>
          <input 
            type="time" 
            value={formVenta.hora} 
            onChange={e => setFormVenta({...formVenta, hora: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2 text-white font-semibold">
          Monto en USDT (Cantidad vendida)
        </label>
        <input 
          type="number" 
          step="0.01" 
          value={formVenta.montoUSDT} 
          onChange={e => setFormVenta({...formVenta, montoUSDT: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white text-lg font-semibold" 
          placeholder="0.00"
          required 
        />
        <p className="text-xs text-gray-400 mt-1">Cantidad de USDT que vendiste desde Binance</p>
      </div>

      <div>
        <label className="block text-sm mb-2 text-white font-semibold">
          Tasa de Venta (Bs por USDT)
        </label>
        <input 
          type="number" 
          step="0.01" 
          value={formVenta.tasaVenta} 
          onChange={e => setFormVenta({...formVenta, tasaVenta: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white text-lg font-semibold" 
          placeholder="37.50"
          required 
        />
        <p className="text-xs text-gray-400 mt-1">Precio de venta por cada USDT</p>
      </div>

      <div>
        <label className="block text-sm mb-2 text-white">Cuenta de Destino</label>
        <select 
          value={formVenta.cuentaDestino} 
          onChange={e => setFormVenta({...formVenta, cuentaDestino: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white"
        >
          {cuentasDestino.map(cuenta => (
            <option key={cuenta} value={cuenta}>{cuenta}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Cuenta bancaria donde recibiste los Bolívares</p>
      </div>

      <div>
        <label className="block text-sm mb-2 text-white">Descripción (Opcional)</label>
        <textarea
          value={formVenta.descripcion} 
          onChange={e => setFormVenta({...formVenta, descripcion: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white resize-none" 
          placeholder="Ej: Venta para pago de servicios"
          rows="2"
        />
      </div>

      {/* Cálculos automáticos */}
      <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white">Monto USDT:</span>
          <span className="font-bold text-blue-400">{montoUSDT.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white">Comisión Binance (0.2%):</span>
          <span className="font-bold text-red-400">-{comisionBinance.toFixed(4)} USDT</span>
        </div>
        <div className="flex justify-between text-sm border-t border-white/20 pt-2">
          <span className="text-white">USDT Neto:</span>
          <span className="font-bold text-green-400">{usdtNeto.toFixed(4)} USDT</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white">× Tasa de Venta:</span>
          <span className="font-bold text-white">{tasaVenta.toFixed(2)} Bs</span>
        </div>
        <div className="flex justify-between border-t border-white/20 pt-2">
          <span className="text-white font-semibold">Total a Recibir en {formVenta.cuentaDestino}:</span>
          <span className="font-bold text-green-400 text-lg">{montoBs.toFixed(2)} Bs</span>
        </div>
      </div>

      <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
        <p className="text-xs text-yellow-200">
          ⚠️ <strong>Balance Binance se reducirá en:</strong> -{montoUSDT.toFixed(2)} USDT
        </p>
        <p className="text-xs text-green-200 mt-1">
          ✅ <strong>Balance {formVenta.cuentaDestino} aumentará en:</strong> +{montoBs.toFixed(2)} Bs
        </p>
      </div>
    </div>
  );
};

export default FormVenta;