import React, { useEffect } from 'react';
import { CATEGORIAS_GASTO, CUENTAS_BANCO } from '../../config/constants';

const FormGasto = ({ formGasto, setFormGasto, tasaVenta }) => {
  // Calcular gasto en dólares cuando cambia el monto o la moneda
  useEffect(() => {
    const monto = parseFloat(formGasto.monto) || 0;
    let gastoDolar = 0;

    if (formGasto.moneda === 'Bs') {
      // Si es en Bs, dividir entre tasa de venta para obtener dólares
      gastoDolar = tasaVenta > 0 ? monto / tasaVenta : 0;
    } else if (formGasto.moneda === 'USD' || formGasto.moneda === 'USDT') {
      // Si ya es en USD o USDT, el gasto en dólar es el mismo monto
      gastoDolar = monto;
    }

    setFormGasto(prev => ({
      ...prev,
      total: monto,
      gastoDolar: gastoDolar
    }));
  }, [formGasto.monto, formGasto.moneda, tasaVenta, setFormGasto]);

  const handleMontoChange = (e) => {
    setFormGasto({
      ...formGasto,
      monto: e.target.value
    });
  };

  const getMensajeBalance = () => {
    const monto = parseFloat(formGasto.monto) || 0;
    
    switch(formGasto.moneda) {
      case 'Bs':
        return {
          texto: 'Balance en Bs se reducirá en:',
          valor: `-${monto.toFixed(2)} Bs`
        };
      case 'USD':
        return {
          texto: 'Balance en USD se reducirá en:',
          valor: `-$${monto.toFixed(2)}`
        };
      case 'USDT':
        return {
          texto: 'Balance en Binance se reducirá en:',
          valor: `-${monto.toFixed(2)} USDT`
        };
      default:
        return {
          texto: 'Balance se reducirá en:',
          valor: `-${monto.toFixed(2)}`
        };
    }
  };

  const balance = getMensajeBalance();

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-4 mb-4">
        <p className="text-sm text-red-100 mb-1">Gasto Equivalente en $ (Calculado)</p>
        <p className="text-3xl font-bold text-white">${formGasto.gastoDolar.toFixed(2)}</p>
        {formGasto.moneda === 'Bs' && (
          <p className="text-xs text-red-100 mt-1">Monto ÷ Tasa de Venta ({tasaVenta.toFixed(2)} Bs)</p>
        )}
      </div>

      <div>
        <label className="block text-sm mb-2 text-white">Fecha</label>
        <input 
          type="date" 
          value={formGasto.fecha} 
          onChange={e => setFormGasto({...formGasto, fecha: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          required 
        />
      </div>

      <div>
        <label className="block text-sm mb-2 text-white">Descripción</label>
        <textarea
          value={formGasto.descripcion} 
          onChange={e => setFormGasto({...formGasto, descripcion: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white resize-none" 
          placeholder="Breve descripción del gasto"
          rows="3"
          required 
        />
      </div>

      <div>
        <label className="block text-sm mb-2 text-white">Moneda del Gasto</label>
        <select 
          value={formGasto.moneda} 
          onChange={e => setFormGasto({...formGasto, moneda: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white"
        >
          <option value="Bs">Bolívares (Bs)</option>
          <option value="USD">Dólares (USD)</option>
          <option value="USDT">Tether (USDT)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm mb-2 text-white font-semibold">
          Monto del Gasto (en {formGasto.moneda})
        </label>
        <input 
          type="number" 
          step="0.01" 
          value={formGasto.monto} 
          onChange={handleMontoChange}
          className="w-full bg-slate-700 rounded px-4 py-2 text-white text-lg font-semibold" 
          placeholder="0.00"
          required 
        />
        <p className="text-xs text-gray-400 mt-1">
          {formGasto.moneda === 'Bs' 
            ? 'Este monto se dividirá entre la tasa de venta para calcular el equivalente en dólares'
            : 'Este monto se restará directamente del balance'
          }
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Categoría</label>
          <select 
            value={formGasto.categoria} 
            onChange={e => setFormGasto({...formGasto, categoria: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          >
            {CATEGORIAS_GASTO.map(cat => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Cuenta</label>
          <select 
            value={formGasto.cuenta} 
            onChange={e => setFormGasto({...formGasto, cuenta: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          >
            {CUENTAS_BANCO.map(cuenta => (
              <option key={cuenta}>{cuenta}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-700/50 rounded-lg p-4 border-2 border-red-500/50">
        <div className="flex justify-between items-center">
          <span className="text-white font-semibold">{balance.texto}</span>
          <span className="text-2xl font-bold text-red-400">{balance.valor}</span>
        </div>
      </div>
    </div>
  );
};

export default FormGasto;