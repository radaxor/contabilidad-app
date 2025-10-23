import React, { useState, useEffect } from 'react';
import { crearTransaccion } from '../../services/transacciones.service';
import { calcularCompra, calcularGastoDolar } from '../../utils/calculos';
import FormCompra from './FormCompra';
import FormGasto from './FormGasto';
import FormGeneral from './FormGeneral';
import FormVenta from './FormVenta';

const FormTransaccion = ({ usuario, tasaVenta, setMostrarForm }) => {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Gasto',
    categoria: 'Comida',
    descripcion: '',
    monto: '',
    moneda: 'USD',
    cuenta: 'Efectivo'
  });

  const [formCompra, setFormCompra] = useState({
    fecha: new Date().toISOString().split('T')[0],
    status: 'Por Cobrar',
    cliente: '',
    compraBs: '',
    comisionBanco: 0,
    tasa: '',
    compraDolar: 0,
    operador: '',
    gananciaBs: 0,
    gananciaDolar: 0
  });

  const [formGasto, setFormGasto] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    monto: '',
    categoria: 'Varios',
    cuenta: 'Provincial',
    moneda: 'Bs',
    total: '',
    gastoDolar: 0
  });

  const [formVenta, setFormVenta] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    montoUSDT: '',
    tasaVenta: '',
    cuentaDestino: 'Provincial',
    descripcion: ''
  });

  // Calcular campos automáticos de Compra
  useEffect(() => {
    if (form.tipo === 'Compra') {
      const compraBs = parseFloat(formCompra.compraBs) || 0;
      const tasa = parseFloat(formCompra.tasa) || 0;
      
      const resultado = calcularCompra(compraBs, tasa, tasaVenta);

      setFormCompra(prev => ({
        ...prev,
        ...resultado
      }));
    }
  }, [formCompra.compraBs, formCompra.tasa, tasaVenta, form.tipo]);

  // Calcular campos automáticos de Gasto
  useEffect(() => {
    if (form.tipo === 'Gasto') {
      const monto = parseFloat(formGasto.monto) || 0;
      let gastoDolar = 0;

      if (formGasto.moneda === 'Bs') {
        gastoDolar = tasaVenta > 0 ? monto / tasaVenta : 0;
      } else {
        gastoDolar = monto;
      }

      setFormGasto(prev => ({
        ...prev,
        total: monto,
        gastoDolar: gastoDolar
      }));
    }
  }, [formGasto.monto, formGasto.moneda, tasaVenta, form.tipo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let datosTransaccion;
      
      if (form.tipo === 'Compra') {
        datosTransaccion = {
          tipo: 'Compra',
          fecha: formCompra.fecha,
          status: formCompra.status,
          cliente: formCompra.cliente,
          compraBs: parseFloat(formCompra.compraBs),
          comisionBanco: formCompra.comisionBanco,
          tasa: parseFloat(formCompra.tasa),
          compraDolar: formCompra.compraDolar,
          operador: formCompra.operador,
          gananciaBs: formCompra.gananciaBs,
          gananciaDolar: formCompra.gananciaDolar,
          tasaVenta: tasaVenta,
          monto: formCompra.compraDolar,
          moneda: 'USD',
          categoria: 'Compra de Divisas',
          descripcion: `Compra - Cliente: ${formCompra.cliente}`,
          cuenta: 'Operaciones'
        };
      } else if (form.tipo === 'Gasto') {
        const montoOriginal = parseFloat(formGasto.monto) || 0;
        
        datosTransaccion = {
          tipo: 'Gasto',
          fecha: formGasto.fecha,
          descripcion: formGasto.descripcion,
          monto: montoOriginal,
          categoria: formGasto.categoria,
          cuenta: formGasto.cuenta,
          moneda: formGasto.moneda,
          total: montoOriginal,
          gastoDolar: formGasto.gastoDolar,
          tasaVenta: tasaVenta
        };
      } else if (form.tipo === 'Venta') {
        // NUEVO: Manejo de Ventas
        const montoUSDT = parseFloat(formVenta.montoUSDT) || 0;
        const tasaVentaUsada = parseFloat(formVenta.tasaVenta) || 0;
        const comisionBinance = montoUSDT * 0.002; // 0.2%
        const usdtNeto = montoUSDT - comisionBinance;
        const montoBs = usdtNeto * tasaVentaUsada;

        datosTransaccion = {
          tipo: 'Venta',
          fecha: formVenta.fecha,
          hora: formVenta.hora,
          montoUSDT: montoUSDT,
          tasaVenta: tasaVentaUsada,
          comisionBinance: comisionBinance,
          usdtNeto: usdtNeto,
          montoBs: montoBs,
          cuentaDestino: formVenta.cuentaDestino,
          descripcion: formVenta.descripcion || `Venta USDT a ${formVenta.cuentaDestino}`,
          monto: montoUSDT, // El monto USDT que se resta de Binance
          moneda: 'USDT',
          categoria: 'Venta de Divisas',
          cuenta: 'Binance'
        };
      } else {
        datosTransaccion = {
          ...form,
          monto: parseFloat(form.monto)
        };
      }

      // IMPORTANTE: Pasar datosTransaccion Y usuario como parámetros separados
      await crearTransaccion(datosTransaccion, usuario);
      
      // Reset formularios
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'Gasto',
        categoria: 'Comida',
        descripcion: '',
        monto: '',
        moneda: 'USD',
        cuenta: 'Efectivo'
      });
      
      setFormCompra({
        fecha: new Date().toISOString().split('T')[0],
        status: 'Pagado',
        cliente: '',
        compraBs: '',
        comisionBanco: 0,
        tasa: '',
        compraDolar: 0,
        operador: '',
        gananciaBs: 0,
        gananciaDolar: 0
      });
      
      setFormGasto({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        monto: '',
        categoria: 'Varios',
        cuenta: 'Provincial',
        moneda: 'Bs',
        total: '',
        gastoDolar: 0
      });

      setFormVenta({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        montoUSDT: '',
        tasaVenta: '',
        cuentaDestino: 'Provincial',
        descripcion: ''
      });
      
      setMostrarForm(false);
      
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Nueva Transacción</h2>
          <button 
            onClick={() => setMostrarForm(false)} 
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de tipo */}
          <div>
            <label className="block text-sm mb-2 text-white">Tipo de Transacción</label>
            <select 
              value={form.tipo} 
              onChange={e => setForm({...form, tipo: e.target.value})} 
              className="w-full bg-slate-700 rounded px-4 py-2 text-white"
            >
              <option>Ingreso</option>
              <option>Gasto</option>
              <option>Compra</option>
              <option>Venta</option>
            </select>
          </div>

          {/* Renderizar formulario según tipo */}
          {form.tipo === 'Compra' ? (
            <FormCompra 
              formCompra={formCompra} 
              setFormCompra={setFormCompra} 
              tasaVenta={tasaVenta}
            />
          ) : form.tipo === 'Gasto' ? (
            <FormGasto 
              formGasto={formGasto} 
              setFormGasto={setFormGasto} 
              tasaVenta={tasaVenta}
            />
          ) : form.tipo === 'Venta' ? (
            <FormVenta 
              formVenta={formVenta} 
              setFormVenta={setFormVenta}
            />
          ) : (
            <FormGeneral 
              form={form} 
              setForm={setForm}
            />
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              className="flex-1 bg-green-500 hover:bg-green-600 py-3 rounded-lg font-semibold text-white"
            >
              Guardar Transacción
            </button>
            <button 
              type="button" 
              onClick={() => setMostrarForm(false)} 
              className="px-6 bg-slate-600 py-3 rounded-lg text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormTransaccion;