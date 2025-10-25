import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

const Graficos = ({ transacciones, temaActual, tasaCambio }) => {
  const [tipoAnalisis, setTipoAnalisis] = useState('gastos'); // gastos, compras, general
  const [periodoAnalisis, setPeriodoAnalisis] = useState('mes'); // dia, semana, mes, año
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Obtener fecha actual
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioAño = new Date(hoy.getFullYear(), 0, 1);

  // Filtrar transacciones por periodo
  const transaccionesFiltradas = useMemo(() => {
    let fechaInicio;
    switch(periodoAnalisis) {
      case 'dia':
        fechaInicio = new Date(hoy.setHours(0, 0, 0, 0));
        break;
      case 'semana':
        fechaInicio = inicioSemana;
        break;
      case 'mes':
        fechaInicio = inicioMes;
        break;
      case 'año':
        fechaInicio = inicioAño;
        break;
      default:
        fechaInicio = new Date(0);
    }

    return transacciones.filter(t => {
      const fechaTransaccion = new Date(t.fecha);
      return fechaTransaccion >= fechaInicio;
    });
  }, [transacciones, periodoAnalisis]);

  // Filtrar por tipo de análisis
  const transaccionesPorTipo = useMemo(() => {
    if (tipoAnalisis === 'gastos') {
      return transaccionesFiltradas.filter(t => t.tipo === 'Gasto');
    } else if (tipoAnalisis === 'compras') {
      return transaccionesFiltradas.filter(t => t.tipo === 'Compra');
    }
    return transaccionesFiltradas; // general
  }, [transaccionesFiltradas, tipoAnalisis]);

  // Calcular estadísticas generales
  const estadisticas = useMemo(() => {
    const stats = {
      total: 0,
      promedio: 0,
      maximo: { monto: 0, transaccion: null },
      minimo: { monto: Infinity, transaccion: null },
      cantidad: transaccionesPorTipo.length
    };

    transaccionesPorTipo.forEach(t => {
      const monto = Math.abs(parseFloat(t.monto) || 0);
      stats.total += monto;

      if (monto > stats.maximo.monto) {
        stats.maximo = { monto, transaccion: t };
      }
      if (monto < stats.minimo.monto && monto > 0) {
        stats.minimo = { monto, transaccion: t };
      }
    });

    stats.promedio = stats.cantidad > 0 ? stats.total / stats.cantidad : 0;
    if (stats.minimo.monto === Infinity) stats.minimo.monto = 0;

    return stats;
  }, [transaccionesPorTipo]);

  // Calcular por categoría
  const porCategoria = useMemo(() => {
    const categorias = {};
    transaccionesPorTipo.forEach(t => {
      const cat = t.categoria || 'Sin categoría';
      if (!categorias[cat]) {
        categorias[cat] = {
          nombre: cat,
          total: 0,
          cantidad: 0,
          promedio: 0
        };
      }
      const monto = Math.abs(parseFloat(t.monto) || 0);
      categorias[cat].total += monto;
      categorias[cat].cantidad++;
    });

    // Calcular promedio
    Object.values(categorias).forEach(cat => {
      cat.promedio = cat.cantidad > 0 ? cat.total / cat.cantidad : 0;
    });

    return Object.values(categorias).sort((a, b) => b.total - a.total);
  }, [transaccionesPorTipo]);

  // Top 5 transacciones más grandes
  const top5Transacciones = useMemo(() => {
    return [...transaccionesPorTipo]
      .sort((a, b) => Math.abs(b.monto) - Math.abs(a.monto))
      .slice(0, 5);
  }, [transaccionesPorTipo]);

  // Análisis por día de la semana
  const porDiaSemana = useMemo(() => {
    const dias = {
      0: { nombre: 'Domingo', total: 0, cantidad: 0 },
      1: { nombre: 'Lunes', total: 0, cantidad: 0 },
      2: { nombre: 'Martes', total: 0, cantidad: 0 },
      3: { nombre: 'Miércoles', total: 0, cantidad: 0 },
      4: { nombre: 'Jueves', total: 0, cantidad: 0 },
      5: { nombre: 'Viernes', total: 0, cantidad: 0 },
      6: { nombre: 'Sábado', total: 0, cantidad: 0 }
    };

    transaccionesPorTipo.forEach(t => {
      const fecha = new Date(t.fecha);
      const dia = fecha.getDay();
      const monto = Math.abs(parseFloat(t.monto) || 0);
      dias[dia].total += monto;
      dias[dia].cantidad++;
    });

    return Object.values(dias);
  }, [transaccionesPorTipo]);

  // Tendencia por mes (últimos 12 meses)
  const tendenciaMensual = useMemo(() => {
    const meses = {};
    const hoy = new Date();
    
    // Inicializar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      meses[key] = {
        nombre: fecha.toLocaleDateString('es', { month: 'short', year: 'numeric' }),
        total: 0,
        cantidad: 0
      };
    }

    transacciones.filter(t => t.tipo === tipoAnalisis.slice(0, -1).charAt(0).toUpperCase() + tipoAnalisis.slice(1, -1) || t.tipo === 'Gasto' || t.tipo === 'Compra').forEach(t => {
      const fecha = new Date(t.fecha);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (meses[key]) {
        const monto = Math.abs(parseFloat(t.monto) || 0);
        meses[key].total += monto;
        meses[key].cantidad++;
      }
    });

    return Object.values(meses);
  }, [transacciones, tipoAnalisis]);

  // Crear gráfico
  useEffect(() => {
    if (!chartRef.current) return;

    // Destruir gráfico anterior
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: porCategoria.slice(0, 10).map(c => c.nombre),
        datasets: [{
          label: `${tipoAnalisis.charAt(0).toUpperCase() + tipoAnalisis.slice(1)} por Categoría`,
          data: porCategoria.slice(0, 10).map(c => c.total),
          backgroundColor: [
            '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#a855f7'
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#ffffff',
              font: { size: 14 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `$${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff',
              callback: function(value) {
                return '$' + value.toFixed(0);
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [porCategoria, tipoAnalisis]);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">📊 Análisis y Estadísticas</h2>
            <p className="text-sm opacity-75">Visualiza tus datos financieros</p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            {/* Selector de tipo */}
            <select
              value={tipoAnalisis}
              onChange={(e) => setTipoAnalisis(e.target.value)}
              className="bg-slate-700 text-white rounded-lg px-4 py-2 font-semibold"
            >
              <option value="gastos">💰 Gastos</option>
              <option value="compras">🛒 Compras</option>
              <option value="general">📈 General</option>
            </select>

            {/* Selector de periodo */}
            <select
              value={periodoAnalisis}
              onChange={(e) => setPeriodoAnalisis(e.target.value)}
              className="bg-slate-700 text-white rounded-lg px-4 py-2 font-semibold"
            >
              <option value="dia">📅 Hoy</option>
              <option value="semana">📆 Esta Semana</option>
              <option value="mes">🗓️ Este Mes</option>
              <option value="año">📊 Este Año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total {tipoAnalisis}</p>
          <p className="text-3xl font-bold">${estadisticas.total.toFixed(2)}</p>
          <p className="text-xs mt-2 opacity-75">{estadisticas.cantidad} transacciones</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Promedio</p>
          <p className="text-3xl font-bold">${estadisticas.promedio.toFixed(2)}</p>
          <p className="text-xs mt-2 opacity-75">Por transacción</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Máximo</p>
          <p className="text-3xl font-bold">${estadisticas.maximo.monto.toFixed(2)}</p>
          <p className="text-xs mt-2 opacity-75 truncate">
            {estadisticas.maximo.transaccion?.descripcion || 'N/A'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Mínimo</p>
          <p className="text-3xl font-bold">${estadisticas.minimo.monto.toFixed(2)}</p>
          <p className="text-xs mt-2 opacity-75 truncate">
            {estadisticas.minimo.transaccion?.descripcion || 'N/A'}
          </p>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4">
          Top 10 Categorías - {tipoAnalisis.charAt(0).toUpperCase() + tipoAnalisis.slice(1)}
        </h3>
        <div className="h-96">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Top 5 transacciones más grandes */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4">🏆 Top 5 {tipoAnalisis} más grandes del periodo</h3>
        <div className="space-y-3">
          {top5Transacciones.map((t, i) => (
            <div key={t.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-bold ${
                  i === 0 ? 'text-yellow-400' : 
                  i === 1 ? 'text-gray-400' : 
                  i === 2 ? 'text-orange-600' : 'text-white'
                }`}>
                  #{i + 1}
                </div>
                <div>
                  <p className="font-semibold">{t.descripcion}</p>
                  <p className="text-sm opacity-75">{t.fecha} - {t.categoria}</p>
                  {t.cliente && <p className="text-xs opacity-60">Cliente: {t.cliente}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-400">${Math.abs(t.monto).toFixed(2)}</p>
                <p className="text-xs opacity-75">{t.moneda}</p>
              </div>
            </div>
          ))}
          {top5Transacciones.length === 0 && (
            <p className="text-center py-8 opacity-75">No hay transacciones en este periodo</p>
          )}
        </div>
      </div>

      {/* Análisis por categoría detallado */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4">📊 Análisis Detallado por Categoría</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3">Categoría</th>
                <th className="text-center p-3">Cantidad</th>
                <th className="text-right p-3">Total</th>
                <th className="text-right p-3">Promedio</th>
                <th className="text-right p-3">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {porCategoria.map((cat, i) => (
                <tr key={cat.nombre} className="border-b border-white/10 hover:bg-white/5">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ 
                          backgroundColor: [
                            '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
                            '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#a855f7'
                          ][i % 10]
                        }}
                      ></div>
                      <span className="font-semibold">{cat.nombre}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">{cat.cantidad}</td>
                  <td className="p-3 text-right font-bold">${cat.total.toFixed(2)}</td>
                  <td className="p-3 text-right">${cat.promedio.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className="text-blue-400 font-semibold">
                      {((cat.total / estadisticas.total) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis por día de la semana */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4">📅 Análisis por Día de la Semana</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {porDiaSemana.map((dia, i) => (
            <div 
              key={i} 
              className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 text-white text-center"
            >
              <p className="text-sm mb-2">{dia.nombre}</p>
              <p className="text-xl font-bold">${dia.total.toFixed(0)}</p>
              <p className="text-xs mt-2 opacity-75">{dia.cantidad} trans.</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tendencia mensual */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4">📈 Tendencia - Últimos 12 Meses</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tendenciaMensual.map((mes, i) => {
              const maxTotal = Math.max(...tendenciaMensual.map(m => m.total));
              const altura = mes.total > 0 ? (mes.total / maxTotal) * 200 : 10;
              
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                  <div className="text-sm font-semibold">${mes.total.toFixed(0)}</div>
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-400"
                    style={{ height: `${altura}px`, minHeight: '10px' }}
                  ></div>
                  <div className="text-xs opacity-75 text-center">{mes.nombre}</div>
                  <div className="text-xs opacity-50">{mes.cantidad}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights y recomendaciones */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4">💡 Insights</h3>
        <div className="space-y-3">
          {porCategoria.length > 0 && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="font-semibold text-blue-300">Categoría con más {tipoAnalisis}:</p>
              <p className="text-lg mt-1">
                <span className="font-bold">{porCategoria[0].nombre}</span> con ${porCategoria[0].total.toFixed(2)} 
                ({porCategoria[0].cantidad} transacciones)
              </p>
            </div>
          )}
          
          {porDiaSemana.length > 0 && (
            <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4">
              <p className="font-semibold text-purple-300">Día con más actividad:</p>
              <p className="text-lg mt-1">
                <span className="font-bold">
                  {[...porDiaSemana].sort((a, b) => b.total - a.total)[0].nombre}
                </span> con ${[...porDiaSemana].sort((a, b) => b.total - a.total)[0].total.toFixed(2)}
              </p>
            </div>
          )}

          {estadisticas.cantidad > 0 && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <p className="font-semibold text-green-300">Frecuencia de {tipoAnalisis}:</p>
              <p className="text-lg mt-1">
                Promedio de <span className="font-bold">{(estadisticas.cantidad / (periodoAnalisis === 'mes' ? 30 : periodoAnalisis === 'semana' ? 7 : 1)).toFixed(1)}</span> {tipoAnalisis} por día
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Graficos;