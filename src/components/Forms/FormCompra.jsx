import React from 'react';

const FormCompra = ({ formCompra, setFormCompra, tasaVenta }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Fecha</label>
          <input 
            type="date" 
            value={formCompra.fecha} 
            onChange={e => setFormCompra({...formCompra, fecha: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Status</label>
          <select 
            value={formCompra.status} 
            onChange={e => setFormCompra({...formCompra, status: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          >
            <option>Pagado</option>
            <option>Por Cobrar</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2 text-white">Cliente</label>
        <input 
          value={formCompra.cliente} 
          onChange={e => setFormCompra({...formCompra, cliente: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          placeholder="Nombre del cliente"
          required 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Compra Bs</label>
          <input 
            type="number" 
            step="0.01" 
            value={formCompra.compraBs} 
            onChange={e => setFormCompra({...formCompra, compraBs: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
            placeholder="0.00"
            required 
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Comisión Banco (0.3%)</label>
          <input 
            type="number" 
            step="0.01" 
            value={formCompra.comisionBanco.toFixed(2)} 
            className="w-full bg-slate-600 rounded px-4 py-2 text-gray-400" 
            disabled 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2 text-white">TASA (Precio de Compra)</label>
        <input 
          type="number" 
          step="0.01" 
          value={formCompra.tasa} 
          onChange={e => setFormCompra({...formCompra, tasa: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          placeholder="36.50"
          required 
        />
      </div>

      <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
        <p className="text-sm text-blue-200 mb-1">COMPRA $ (Calculado)</p>
        <p className="text-3xl font-bold text-blue-400">${formCompra.compraDolar.toFixed(2)}</p>
      </div>

      <div>
        <label className="block text-sm mb-2 text-white">Operador</label>
        <input 
          value={formCompra.operador} 
          onChange={e => setFormCompra({...formCompra, operador: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          placeholder="Nombre del operador"
          required 
        />
      </div>

      <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-white">Tasa de Venta:</span>
          <span className="font-bold text-green-400">{tasaVenta.toFixed(2)} Bs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white">Ganancia en Bs:</span>
          <span className="font-bold text-green-400">{formCompra.gananciaBs.toFixed(2)} Bs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white">Ganancia en $:</span>
          <span className="font-bold text-green-400">${formCompra.gananciaDolar.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default FormCompra;