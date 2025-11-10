import React from 'react';
import { CUENTAS_GENERAL, } from '../../config/constants';

const FormGeneral = ({ form, setForm }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm mb-2 text-white">Fecha</label>
        <input 
          type="date" 
          value={form.fecha} 
          onChange={e => setForm({...form, fecha: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-white">Monto</label>
        <input 
          type="number" 
          step="0.01" 
          value={form.monto} 
          onChange={e => setForm({...form, monto: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-white">Moneda</label>
        <select 
          value={form.moneda} 
          onChange={e => setForm({...form, moneda: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white"
        >
          <option>USD</option>
          <option>USDT</option>
          <option>BS</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-2 text-white">Cuenta</label>
        <select 
          value={form.cuenta} 
          onChange={e => setForm({...form, cuenta: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white"
        >
          {CUENTAS_GENERAL.map(cuenta => (
            <option key={cuenta}>{cuenta}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-2 text-white">Categoría</label>
        <input 
          value={form.categoria} 
          onChange={e => setForm({...form, categoria: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm mb-2 text-white">Descripción</label>
        <input 
          value={form.descripcion} 
          onChange={e => setForm({...form, descripcion: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          required 
        />
      </div>
    </div>
  );
};

export default FormGeneral;