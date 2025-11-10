// src/components/Forms/FormGasto.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { obtenerTasaParaGasto } from '../../services/tasaVenta.service';

const FormGasto = ({ formGasto, setFormGasto, usuario, onSolicitarVenta }) => {
  const [infoTasa, setInfoTasa] = useState(null);
  const [cargandoTasa, setCargandoTasa] = useState(false);
  const [tasaManual, setTasaManual] = useState('');
  const [usarTasaManual, setUsarTasaManual] = useState(false);

  // Desestructuramos para dependencias estables
  const { fecha, moneda, monto } = formGasto;
  const uid = usuario?.uid;

  // 1) Memoriza la función que calcula (evita re-crearla en cada render)
  const calcularGasto = useCallback((tasa) => {
    const montoNum = parseFloat(monto) || 0;
    let gastoDolar = 0;

    if (moneda === 'Bs') {
      gastoDolar = tasa > 0 ? montoNum / tasa : 0;
    } else {
      gastoDolar = montoNum;
    }

    setFormGasto(prev => ({
      ...prev,
      gastoDolar,
      tasaUsada: tasa
    }));
  }, [monto, moneda, setFormGasto]);

  // 2) Buscar tasa cuando cambian fecha o usuario
  useEffect(() => {
    const buscarTasa = async () => {
      if (!fecha || !uid) return;

      setCargandoTasa(true);
      const resultado = await obtenerTasaParaGasto(fecha, uid);
      setInfoTasa(resultado);
      setCargandoTasa(false);

      if (resultado.requiereInput) {
        setUsarTasaManual(true);
        setTasaManual('');
      } else if (resultado.tasa) {
        setUsarTasaManual(false);
        calcularGasto(resultado.tasa);
      }
    };

    buscarTasa();
  }, [fecha, uid, calcularGasto]); // ← incluir calcularGasto resuelve el warning

  // 3) Recalcular cuando cambian tasa manual o infoTasa
  useEffect(() => {
    if (usarTasaManual && tasaManual) {
      calcularGasto(parseFloat(tasaManual));
    } else if (infoTasa?.tasa) {
      calcularGasto(infoTasa.tasa);
    }
  }, [usarTasaManual, tasaManual, infoTasa?.tasa, calcularGasto]);

  const handleActualizarTasa = () => {
    if (onSolicitarVenta) onSolicitarVenta();
  };

  return (
    <div className="space-y-4">
      {/* Fecha */}
      <div>
        <label className="block text-sm mb-2 text-white">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFormGasto({ ...formGasto, fecha: e.target.value })}
          className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          required
        />
      </div>

      {/* Información de la Tasa */}
      {cargandoTasa ? (
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
          <p className="text-blue-300 text-sm">⏳ Buscando tasa de venta...</p>
        </div>
      ) : infoTasa && (
        <div>
          {infoTasa.estado === 'encontrada' && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <p className="text-green-300 text-sm font-semibold mb-2">✅ Tasa de venta encontrada</p>
              <div className="space-y-1 text-sm">
                <p className="text-white">Tasa: <span className="font-bold text-green-400">{infoTasa.tasa} Bs</span></p>
                <p className="text-white">Fecha: {infoTasa.fecha} | Hora: {infoTasa.hora}</p>
              </div>
            </div>
          )}

          {infoTasa.estado === 'reciente' && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-300 text-sm font-semibold mb-2">ℹ️ Usando última tasa disponible</p>
              <div className="space-y-1 text-sm">
                <p className="text-white">Tasa: <span className="font-bold text-blue-400">{infoTasa.tasa} Bs</span></p>
                <p className="text-white">Actualizada: {infoTasa.fecha} a las {infoTasa.hora}</p>
                <p className="text-yellow-300 text-xs mt-2">💡 Esta tasa es del último día registrado</p>
              </div>
            </div>
          )}

          {infoTasa.estado === 'desactualizada' && (
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <p className="text-orange-300 text-sm font-semibold mb-2">⚠️ Tasa desactualizada</p>
              <div className="space-y-2 text-sm">
                <p className="text-white">{infoTasa.mensaje}</p>
                <p className="text-white">Última tasa: <span className="font-bold">{infoTasa.ultimaTasa} Bs</span> ({infoTasa.fecha})</p>
                <button
                  type="button"
                  onClick={handleActualizarTasa}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-semibold mt-2"
                >
                  📈 Registrar Venta para Actualizar Tasa
                </button>
              </div>
            </div>
          )}

          {infoTasa.estado === 'sin_tasa' && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-300 text-sm font-semibold mb-2">❌ Sin tasa de venta</p>
              <div className="space-y-2 text-sm">
                <p className="text-white">{infoTasa.mensaje}</p>
                <button
                  type="button"
                  onClick={handleActualizarTasa}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold mt-2"
                >
                  📈 Registrar Primera Venta
                </button>
              </div>
            </div>
          )}

          {infoTasa.estado === 'fecha_sin_tasa' && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-300 text-sm font-semibold mb-2">📅 Fecha sin tasa registrada</p>
              <p className="text-white text-sm mb-3">{infoTasa.mensaje}</p>

              <div>
                <label className="block text-sm mb-2 text-white">Ingrese la tasa de venta de ese día:</label>
                <input
                  type="number"
                  step="0.01"
                  value={tasaManual}
                  onChange={e => setTasaManual(e.target.value)}
                  className="w-full bg-slate-700 rounded px-4 py-2 text-white"
                  placeholder="Ej: 36.50"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Esta tasa se usará para calcular el gasto en dólares
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Descripción */}
      <div>
        <label className="block text-sm mb-2 text-white">Descripción</label>
        <textarea
          value={formGasto.descripcion}
          onChange={e => setFormGasto({ ...formGasto, descripcion: e.target.value })}
          className="w-full bg-slate-700 rounded px-4 py-2 text-white resize-none"
          placeholder="Breve descripción del gasto"
          rows="3"
          required
        />
      </div>

      {/* Categoría y Cuenta */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Categoría</label>
          <select
            value={formGasto.categoria}
            onChange={e => setFormGasto({ ...formGasto, categoria: e.target.value })}
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          >
            <option>Varios</option>
            <option>Escuela</option>
            <option>Servicios</option>
            <option>Rafael</option>
            <option>Emilys</option>
            <option>Casa</option>
            <option>Carro</option>
            <option>Prestamos</option>
            <option>Remesas</option>
            <option>Pasajes</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Cuenta</label>
          <select
            value={formGasto.cuenta}
            onChange={e => setFormGasto({ ...formGasto, cuenta: e.target.value })}
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          >
            <option>Provincial</option>
            <option>Venezuela</option>
            <option>USD</option>
            <option>Binance</option>
          </select>
        </div>
      </div>

      {/* Moneda y Monto */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Moneda</label>
          <select
            value={moneda}
            onChange={e => setFormGasto({ ...formGasto, moneda: e.target.value })}
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          >
            <option>Bs</option>
            <option>USD</option>
            <option>USDT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Monto</label>
          <input
            type="number"
            step="0.01"
            value={monto}
            onChange={e => setFormGasto({ ...formGasto, monto: e.target.value })}
            className="w-full bg-slate-700 rounded px-4 py-2 text-white text-lg font-semibold"
            placeholder="0.00"
            required
            disabled={infoTasa?.requiereActualizacion}
          />
        </div>
      </div>

      {/* Gasto en Dólares (Calculado) */}
      {!infoTasa?.requiereActualizacion && (infoTasa?.tasa || tasaManual) && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-4">
          <p className="text-sm text-red-100 mb-1">Gasto en $ (Calculado)</p>
          <p className="text-3xl font-bold text-white">
            ${formGasto.gastoDolar?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-red-100 mt-1">
            {moneda === 'Bs'
              ? `${monto || 0} Bs ÷ ${usarTasaManual ? tasaManual : infoTasa?.tasa} = `
              : ''}
            ${formGasto.gastoDolar?.toFixed(2) || '0.00'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FormGasto;
