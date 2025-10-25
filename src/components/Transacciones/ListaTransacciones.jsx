import React, { useState, useMemo } from 'react';
import { db } from '../../services/firebase';

const ListaTransacciones = ({ transacciones, temaActual }) => {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [editando, setEditando] = useState(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);

  // Ordenar transacciones por fecha (más reciente primero)
  const transaccionesOrdenadas = useMemo(() => {
    const ordenadas = [...transacciones].sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return fechaB - fechaA; // Descendente (más reciente primero)
    });

    // Filtrar por tipo si no es "todos"
    if (filtroTipo === 'todos') {
      return ordenadas;
    }
    return ordenadas.filter(t => t.tipo === filtroTipo);
  }, [transacciones, filtroTipo]);

  // Obtener tipos únicos de transacciones
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(transacciones.map(t => t.tipo));
    return ['todos', ...Array.from(tipos)];
  }, [transacciones]);

  // Seleccionar/Deseleccionar transacción
  const toggleSeleccion = (id) => {
    const nuevasSeleccionadas = new Set(seleccionadas);
    if (nuevasSeleccionadas.has(id)) {
      nuevasSeleccionadas.delete(id);
    } else {
      nuevasSeleccionadas.add(id);
    }
    setSeleccionadas(nuevasSeleccionadas);
  };

  // Seleccionar todas
  const seleccionarTodas = () => {
    if (seleccionadas.size === transaccionesOrdenadas.length) {
      setSeleccionadas(new Set());
    } else {
      const todasIds = new Set(transaccionesOrdenadas.map(t => t.id));
      setSeleccionadas(todasIds);
    }
  };

  // Eliminar transacción individual
  const eliminarTransaccion = async (id) => {
    if (window.confirm('¿Eliminar esta transacción?')) {
      try {
        await db.collection('transacciones').doc(id).delete();
        alert('✅ Transacción eliminada');
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('❌ Error al eliminar la transacción');
      }
    }
  };

  // Eliminar múltiples transacciones
  const eliminarSeleccionadas = async () => {
    if (seleccionadas.size === 0) {
      alert('⚠️ No hay transacciones seleccionadas');
      return;
    }

    if (window.confirm(`¿Eliminar ${seleccionadas.size} transacciones seleccionadas?`)) {
      try {
        const promesas = Array.from(seleccionadas).map(id => 
          db.collection('transacciones').doc(id).delete()
        );
        await Promise.all(promesas);
        setSeleccionadas(new Set());
        setModoSeleccion(false);
        alert(`✅ ${seleccionadas.size} transacciones eliminadas`);
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('❌ Error al eliminar las transacciones');
      }
    }
  };

  // Editar transacción
  const iniciarEdicion = (transaccion) => {
    setEditando({
      id: transaccion.id,
      descripcion: transaccion.descripcion || '',
      monto: transaccion.monto || 0,
      categoria: transaccion.categoria || ''
    });
  };

  const guardarEdicion = async () => {
    if (!editando) return;

    try {
      await db.collection('transacciones').doc(editando.id).update({
        descripcion: editando.descripcion,
        monto: parseFloat(editando.monto),
        categoria: editando.categoria
      });
      setEditando(null);
      alert('✅ Transacción actualizada');
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('❌ Error al actualizar la transacción');
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
  };

  return (
    <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
      {/* Header con controles */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Mi Historial de Transacciones</h2>
        
        <div className="flex gap-2 flex-wrap items-center">
          {/* Filtro por tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-slate-700 text-white rounded-lg px-4 py-2"
          >
            {tiposUnicos.map(tipo => (
              <option key={tipo} value={tipo}>
                {tipo === 'todos' ? 'Todos los tipos' : tipo}
              </option>
            ))}
          </select>

          {/* Botón modo selección */}
          <button
            onClick={() => {
              setModoSeleccion(!modoSeleccion);
              if (modoSeleccion) setSeleccionadas(new Set());
            }}
            className={`${modoSeleccion ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg font-semibold`}
          >
            {modoSeleccion ? '✓ Modo Selección' : '☑ Seleccionar'}
          </button>

          {/* Botones cuando está en modo selección */}
          {modoSeleccion && (
            <>
              <button
                onClick={seleccionarTodas}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                {seleccionadas.size === transaccionesOrdenadas.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
              </button>
              
              <button
                onClick={eliminarSeleccionadas}
                disabled={seleccionadas.size === 0}
                className={`${seleccionadas.size === 0 ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded-lg font-semibold`}
              >
                🗑 Eliminar ({seleccionadas.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contador */}
      <div className="mb-4 text-sm opacity-75">
        Mostrando {transaccionesOrdenadas.length} de {transacciones.length} transacciones
      </div>

      {/* Tabla de transacciones */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              {modoSeleccion && (
                <th className="text-center p-3 w-12">
                  <input
                    type="checkbox"
                    checked={seleccionadas.size === transaccionesOrdenadas.length && transaccionesOrdenadas.length > 0}
                    onChange={seleccionarTodas}
                    className="w-5 h-5 cursor-pointer"
                  />
                </th>
              )}
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Categoría</th>
              <th className="text-left p-3">Descripción</th>
              <th className="text-right p-3">Monto</th>
              <th className="text-center p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transaccionesOrdenadas.map(t => (
              <tr 
                key={t.id} 
                className={`border-b border-white/10 hover:bg-white/5 ${seleccionadas.has(t.id) ? 'bg-blue-500/20' : ''}`}
              >
                {/* Checkbox de selección */}
                {modoSeleccion && (
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(t.id)}
                      onChange={() => toggleSeleccion(t.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </td>
                )}

                {/* Fecha */}
                <td className="p-3 whitespace-nowrap">{t.fecha}</td>

                {/* Tipo */}
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    t.tipo === 'Ingreso' ? 'bg-green-500/20 text-green-400' :
                    t.tipo === 'Gasto' ? 'bg-red-500/20 text-red-400' :
                    t.tipo === 'Compra' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {t.tipo}
                    {t.importado && <span className="ml-1">📥</span>}
                  </span>
                </td>

                {/* Categoría */}
                <td className="p-3">
                  {editando?.id === t.id ? (
                    <input
                      type="text"
                      value={editando.categoria}
                      onChange={(e) => setEditando({...editando, categoria: e.target.value})}
                      className="bg-slate-700 text-white rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <span className="text-sm opacity-75">{t.categoria}</span>
                  )}
                </td>

                {/* Descripción */}
                <td className="p-3">
                  {editando?.id === t.id ? (
                    <input
                      type="text"
                      value={editando.descripcion}
                      onChange={(e) => setEditando({...editando, descripcion: e.target.value})}
                      className="bg-slate-700 text-white rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <div>
                      <p className="font-semibold">{t.descripcion}</p>
                      {t.tipo === 'Compra' && t.cliente && (
                        <div className="text-xs mt-1 space-y-1">
                          <p>Cliente: {t.cliente}</p>
                          <p>Status: <span className={t.status === 'Pagado' ? 'text-green-400' : 'text-yellow-400'}>{t.status}</span></p>
                          {t.operador && <p>Operador: {t.operador}</p>}
                        </div>
                      )}
                      {t.tipo === 'Gasto' && t.gastoDolar !== undefined && (
                        <p className="text-xs text-red-400 mt-1">Gasto en $: ${t.gastoDolar.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </td>

                {/* Monto */}
                <td className="p-3 text-right font-semibold">
                  {editando?.id === t.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editando.monto}
                      onChange={(e) => setEditando({...editando, monto: e.target.value})}
                      className="bg-slate-700 text-white rounded px-2 py-1 w-24 text-right"
                    />
                  ) : (
                    <span className={t.tipo === 'Ingreso' || t.tipo === 'Venta' ? 'text-green-400' : t.tipo === 'Compra' ? 'text-blue-400' : 'text-red-400'}>
                      {t.tipo === 'Compra' && t.compraDolar ? (
                        `${t.compraDolar.toFixed(2)} USD`
                      ) : (
                        <>
                          {t.tipo === 'Ingreso' || t.tipo === 'Venta' ? '+' : '-'}{Math.abs(t.monto).toFixed(2)} {t.moneda}
                        </>
                      )}
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="p-3">
                  {editando?.id === t.id ? (
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={guardarEdicion}
                        className="text-green-400 hover:text-green-300 font-semibold"
                      >
                        ✓
                      </button>
                      <button 
                        onClick={cancelarEdicion}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => iniciarEdicion(t)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => eliminarTransaccion(t.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transaccionesOrdenadas.length === 0 && (
        <div className="text-center py-12 opacity-75">
          <p className="text-xl">No hay transacciones para mostrar</p>
          {filtroTipo !== 'todos' && (
            <p className="text-sm mt-2">Intenta cambiar el filtro de tipo</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ListaTransacciones;