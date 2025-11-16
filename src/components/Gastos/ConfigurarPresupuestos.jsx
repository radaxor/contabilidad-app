import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';

const ConfigurarPresupuestos = ({ usuario, categorias, temaActual, onCerrar }) => {
  const [presupuestos, setPresupuestos] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Cargar presupuestos existentes
  useEffect(() => {
    const cargarPresupuestos = async () => {
      try {
        const doc = await db
          .collection('usuarios')
          .doc(usuario.uid)
          .collection('configuracion')
          .doc('presupuestos')
          .get();

        if (doc.exists) {
          setPresupuestos(doc.data().categorias || {});
        }
      } catch (error) {
        console.error('Error al cargar presupuestos:', error);
      }
    };

    cargarPresupuestos();
  }, [usuario]);

  // Guardar presupuestos
  const guardarPresupuestos = async () => {
    setGuardando(true);
    try {
      await db
        .collection('usuarios')
        .doc(usuario.uid)
        .collection('configuracion')
        .doc('presupuestos')
        .set({
          categorias: presupuestos,
          ultimaActualizacion: new Date().toISOString()
        });

      alert('✅ Presupuestos guardados correctamente');
      onCerrar();
    } catch (error) {
      console.error('Error al guardar presupuestos:', error);
      alert('❌ Error al guardar presupuestos: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Actualizar presupuesto de una categoría
  const actualizarPresupuesto = (categoria, monto) => {
    setPresupuestos(prev => ({
      ...prev,
      [categoria]: parseFloat(monto) || 0
    }));
  };

  return (
    <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6 border border-green-500/50`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold">💵 Configurar Presupuestos Mensuales</h3>
          <p className="text-sm opacity-75 mt-1">
            Establece límites de gasto mensuales para cada categoría
          </p>
        </div>
        <button
          onClick={onCerrar}
          className="text-white hover:text-red-400 text-2xl"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {categorias.map(categoria => (
          <div key={categoria} className="bg-slate-700/50 rounded-lg p-4">
            <label className="block text-sm font-semibold mb-2">
              {categoria}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-white">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={presupuestos[categoria] || ''}
                onChange={e => actualizarPresupuesto(categoria, e.target.value)}
                className="flex-1 bg-slate-800 rounded px-3 py-2 text-white"
                placeholder="0.00"
              />
            </div>
            {presupuestos[categoria] > 0 && (
              <p className="text-xs text-green-400 mt-2">
                Límite mensual: ${presupuestos[categoria].toFixed(2)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-4">
        <p className="text-blue-300 text-sm">
          💡 <strong>Consejo:</strong> Los presupuestos te ayudarán a controlar tus gastos. 
          Recibirás alertas cuando te acerques al límite de cada categoría.
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCerrar}
          className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={guardarPresupuestos}
          disabled={guardando}
          className={`px-6 py-3 rounded-lg font-semibold ${
            guardando 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {guardando ? '💾 Guardando...' : '💾 Guardar Presupuestos'}
        </button>
      </div>
    </div>
  );
};

export default ConfigurarPresupuestos;