// src/components/Ventas/Ventas.jsx
import React, { useMemo } from 'react';
import ImportarVentas from './ImportarVentas';
import { db } from '../../services/firebase';

const Ventas = ({ transacciones, temaActual, usuario }) => {
  // Función para formatear fecha: 2025-11-14 → 14/11/25
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    
    const partes = fecha.split('-');
    if (partes.length !== 3) return fecha;
    
    const [año, mes, dia] = partes;
    
    // Convertir año de 4 dígitos a 2: 2025 → 25
    const añoCorto = año.slice(-2);
    
    // Asegurar que día y mes tengan 2 dígitos
    const diaFormateado = dia.padStart(2, '0');
    const mesFormateado = mes.padStart(2, '0');
    
    return `${diaFormateado}/${mesFormateado}/${añoCorto}`;
  };

  // Filtrar y ORDENAR ventas (más reciente primero)
  const ventas = useMemo(() => {
    const ventasFiltradas = transacciones.filter(t => t.tipo === 'Venta');
    
    // Ordenar de más reciente a más antigua
    const ordenadas = ventasFiltradas.sort((a, b) => {
      const fechaA = new Date(a.fecha + 'T' + (a.hora || '00:00'));
      const fechaB = new Date(b.fecha + 'T' + (b.hora || '00:00'));
      return fechaB - fechaA; // Descendente (más reciente primero)
    });

    // Log para verificar ordenamiento
    if (ordenadas.length > 0) {
      console.log('📊 Ventas ordenadas (primeras 5):');
      ordenadas.slice(0, 5).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.fecha} ${v.hora || '00:00'} - $${v.montoUSDT?.toFixed(2)}`);
      });
    }

    return ordenadas;
  }, [transacciones]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    let totalUSDT = 0;
    let totalBs = 0;
    let totalComision = 0;

    ventas.forEach(v => {
      totalUSDT += v.montoUSDT || 0;
      totalBs += v.montoBs || 0;
      totalComision += v.comisionBinance || 0;
    });

    const tasaPromedio = totalUSDT > 0 ? totalBs / totalUSDT : 0;

    return {
      cantidad: ventas.length,
      totalUSDT,
      totalBs,
      totalComision,
      tasaPromedio
    };
  }, [ventas]);

  // Limpiar ventas importadas
  const limpiarVentasImportadas = async () => {
    const confirmar = window.confirm(
      '⚠️ ¿Eliminar TODAS las ventas importadas de Binance?\n\n' +
      'Esta acción NO se puede deshacer.'
    );

    if (!confirmar) return;

    try {
      const snapshot = await db.collection('transacciones')
        .where('usuarioId', '==', usuario.uid)
        .where('importado', '==', true)
        .where('importadoDesde', '==', 'ventas')
        .get();

      if (snapshot.empty) {
        alert('ℹ️ No hay ventas importadas para eliminar');
        return;
      }

      const promesas = [];
      snapshot.forEach(doc => {
        promesas.push(db.collection('transacciones').doc(doc.id).delete());
      });

      await Promise.all(promesas);
      
      alert(`✅ Se eliminaron ${snapshot.size} ventas importadas.`);
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6 border border-white/20`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">💵 Ventas de Binance</h2>
            <p className="text-sm opacity-75">
              Gestión de ventas P2P - Ordenadas por más reciente
            </p>
          </div>
          <div className="flex gap-2">
            <ImportarVentas 
              usuario={usuario}
              temaActual={temaActual}
            />
            <button
              onClick={limpiarVentasImportadas}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              🗑️ Limpiar Ventas
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total Ventas</p>
          <p className="text-3xl font-bold">{estadisticas.cantidad}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total USDT Vendido</p>
          <p className="text-2xl font-bold">${estadisticas.totalUSDT.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total Bs Recibido</p>
          <p className="text-2xl font-bold">Bs {estadisticas.totalBs.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Comisión Binance</p>
          <p className="text-2xl font-bold">${estadisticas.totalComision.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Tasa Promedio</p>
          <p className="text-2xl font-bold">{estadisticas.tasaPromedio.toFixed(2)}</p>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">📋 Historial de Ventas</h3>
          <span className="text-sm opacity-75">
            {ventas.length > 0 && `Mostrando ${ventas.length} ${ventas.length === 1 ? 'venta' : 'ventas'}`}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Hora</th>
                <th className="text-right p-3">USDT Vendido</th>
                <th className="text-right p-3">Comisión</th>
                <th className="text-right p-3">Tasa</th>
                <th className="text-right p-3">Bs Recibido</th>
                <th className="text-center p-3">Origen</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v, index) => (
                <tr 
                  key={v.id} 
                  className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                    index === 0 ? 'bg-green-500/10' : ''
                  }`}
                >
                  <td className="p-3">
                    <span className="font-medium">
                      {formatearFecha(v.fecha)}
                    </span>
                    {index === 0 && (
                      <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                        Más reciente
                      </span>
                    )}
                  </td>
                  <td className="p-3">{v.hora || '--:--'}</td>
                  <td className="p-3 text-right font-bold text-blue-400">
                    ${v.montoUSDT?.toFixed(2) || '0.00'}
                  </td>
                  <td className="p-3 text-right text-red-400">
                    ${v.comisionBinance?.toFixed(2) || '0.00'}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {v.tasaVenta?.toFixed(2) || '0.00'}
                  </td>
                  <td className="p-3 text-right font-bold text-green-400">
                    Bs {v.montoBs?.toFixed(2) || '0.00'}
                  </td>
                  <td className="p-3 text-center">
                    {v.importado ? (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        Importada
                      </span>
                    ) : (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        Manual
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ventas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl opacity-75 mb-2">📭 No hay ventas registradas</p>
              <p className="text-sm opacity-50">
                Importa ventas desde Excel o registra una venta manualmente
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ventas;