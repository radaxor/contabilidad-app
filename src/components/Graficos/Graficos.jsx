import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

const Graficos = ({ transacciones, temaActual }) => {
  const [vistaActual, setVistaActual] = useState('gastos'); // gastos, ventas, porCobrar, cambios
  const [periodoAnalisis, setPeriodoAnalisis] = useState('mes'); // dia, semana, mes, año, todo
  
  const chartCategorias = useRef(null);
  const chartTendencia = useRef(null);
  const chartInstanceCategorias = useRef(null);
  const chartInstanceTendencia = useRef(null);

  // Obtener fechas de periodo
  const obtenerFechaInicio = () => {
    const hoy = new Date();
    switch(periodoAnalisis) {
      case 'dia':
        return new Date(hoy.setHours(0, 0, 0, 0));
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        return inicioSemana;
      case 'mes':
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      case 'año':
        return new Date(hoy.getFullYear(), 0, 1);
      default:
        return new Date(0); // todo
    }
  };

  // Filtrar transacciones por periodo
  const transaccionesFiltradas = useMemo(() => {
    const fechaInicio = obtenerFechaInicio();
    return transacciones.filter(t => {
      const fechaTransaccion = new Date(t.fecha);
      return fechaTransaccion >= fechaInicio;
    });
  }, [transacciones, periodoAnalisis]);

  // ========================================
  // ANÁLISIS DE GASTOS
  // ========================================
  const analisisGastos = useMemo(() => {
    const gastos = transaccionesFiltradas.filter(t => t.tipo === 'Gasto');
    
    // Total y promedio
    const totalUSD = gastos.reduce((sum, g) => sum + (parseFloat(g.gastoDolar) || parseFloat(g.monto) || 0), 0);
    const totalBs = gastos.reduce((sum, g) => sum + (parseFloat(g.total) || 0), 0);
    const promedio = gastos.length > 0 ? totalUSD / gastos.length : 0;
    
    // Gasto más alto y más bajo
    let masAlto = { monto: 0, data: null };
    let masBajo = { monto: Infinity, data: null };
    
    gastos.forEach(g => {
      const monto = parseFloat(g.gastoDolar) || parseFloat(g.monto) || 0;
      if (monto > masAlto.monto) {
        masAlto = { monto, data: g };
      }
      if (monto < masBajo.monto && monto > 0) {
        masBajo = { monto, data: g };
      }
    });
    
    // Por categoría
    const porCategoria = {};
    gastos.forEach(g => {
      const cat = g.categoria || 'Sin Categoría';
      if (!porCategoria[cat]) {
        porCategoria[cat] = { total: 0, cantidad: 0, porcentaje: 0 };
      }
      porCategoria[cat].total += parseFloat(g.gastoDolar) || parseFloat(g.monto) || 0;
      porCategoria[cat].cantidad++;
    });
    
    // Calcular porcentajes
    Object.keys(porCategoria).forEach(cat => {
      porCategoria[cat].porcentaje = (porCategoria[cat].total / totalUSD) * 100;
    });
    
    // Ordenar por total
    const categoriasOrdenadas = Object.entries(porCategoria)
      .sort((a, b) => b[1].total - a[1].total);
    
    // Tendencia diaria
    const porDia = {};
    gastos.forEach(g => {
      const fecha = g.fecha;
      if (!porDia[fecha]) {
        porDia[fecha] = 0;
      }
      porDia[fecha] += parseFloat(g.gastoDolar) || parseFloat(g.monto) || 0;
    });
    
    return {
      total: totalUSD,
      totalBs,
      promedio,
      cantidad: gastos.length,
      masAlto,
      masBajo,
      porCategoria: categoriasOrdenadas,
      porDia: Object.entries(porDia).sort((a, b) => a[0].localeCompare(b[0]))
    };
  }, [transaccionesFiltradas]);

  // ========================================
  // ANÁLISIS DE VENTAS
  // ========================================
  const analisisVentas = useMemo(() => {
    const ventas = transaccionesFiltradas.filter(t => t.tipo === 'Venta');
    
    // Totales
    const totalUSDT = ventas.reduce((sum, v) => sum + (parseFloat(v.montoUSDT) || parseFloat(v.monto) || 0), 0);
    const totalBs = ventas.reduce((sum, v) => sum + (parseFloat(v.montoBs) || 0), 0);
    const comisionTotal = ventas.reduce((sum, v) => sum + (parseFloat(v.comision) || 0), 0);
    
    // Tasa promedio
    const tasaPromedio = ventas.length > 0 
      ? ventas.reduce((sum, v) => sum + (parseFloat(v.tasa) || 0), 0) / ventas.length 
      : 0;
    
    // Mejor y peor tasa
    let mejorTasa = { tasa: 0, data: null };
    let peorTasa = { tasa: Infinity, data: null };
    
    ventas.forEach(v => {
      const tasa = parseFloat(v.tasa) || 0;
      if (tasa > mejorTasa.tasa) {
        mejorTasa = { tasa, data: v };
      }
      if (tasa < peorTasa.tasa && tasa > 0) {
        peorTasa = { tasa, data: v };
      }
    });
    
    // Venta más grande
    let masGrande = { monto: 0, data: null };
    ventas.forEach(v => {
      const monto = parseFloat(v.montoUSDT) || parseFloat(v.monto) || 0;
      if (monto > masGrande.monto) {
        masGrande = { monto, data: v };
      }
    });
    
    // Por cuenta destino
    const porCuenta = {};
    ventas.forEach(v => {
      const cuenta = v.cuentaDestino || 'Sin especificar';
      if (!porCuenta[cuenta]) {
        porCuenta[cuenta] = { total: 0, cantidad: 0 };
      }
      porCuenta[cuenta].total += parseFloat(v.montoBs) || 0;
      porCuenta[cuenta].cantidad++;
    });
    
    // Tendencia diaria
    const porDia = {};
    ventas.forEach(v => {
      const fecha = v.fecha;
      if (!porDia[fecha]) {
        porDia[fecha] = 0;
      }
      porDia[fecha] += parseFloat(v.montoUSDT) || parseFloat(v.monto) || 0;
    });
    
    return {
      totalUSDT,
      totalBs,
      comisionTotal,
      tasaPromedio,
      cantidad: ventas.length,
      mejorTasa,
      peorTasa,
      masGrande,
      porCuenta: Object.entries(porCuenta).sort((a, b) => b[1].total - a[1].total),
      porDia: Object.entries(porDia).sort((a, b) => a[0].localeCompare(b[0]))
    };
  }, [transaccionesFiltradas]);

  // ========================================
  // ANÁLISIS DE POR COBRAR (COMPRAS)
  // ========================================
  const analisisPorCobrar = useMemo(() => {
    const compras = transaccionesFiltradas.filter(t => t.tipo === 'Compra');
    
    // Por status
    const pagadas = compras.filter(c => c.status === 'Pagado');
    const pendientes = compras.filter(c => c.status === 'Por Cobrar');
    
    const totalUSD = compras.reduce((sum, c) => sum + (parseFloat(c.compraDolar) || parseFloat(c.monto) || 0), 0);
    const totalPagado = pagadas.reduce((sum, c) => sum + (parseFloat(c.compraDolar) || parseFloat(c.monto) || 0), 0);
    const totalPendiente = pendientes.reduce((sum, c) => sum + (parseFloat(c.compraDolar) || parseFloat(c.monto) || 0), 0);
    
    // Ganancia
    const gananciaTotal = compras.reduce((sum, c) => sum + (parseFloat(c.gananciaDolar) || 0), 0);
    const gananciaPagadas = pagadas.reduce((sum, c) => sum + (parseFloat(c.gananciaDolar) || 0), 0);
    const gananciaPendientes = pendientes.reduce((sum, c) => sum + (parseFloat(c.gananciaDolar) || 0), 0);
    
    // Mejor tasa de compra
    let mejorTasa = { tasa: Infinity, data: null };
    compras.forEach(c => {
      const tasa = parseFloat(c.tasa) || 0;
      if (tasa < mejorTasa.tasa && tasa > 0) {
        mejorTasa = { tasa, data: c };
      }
    });
    
    // Compra más grande
    let masGrande = { monto: 0, data: null };
    compras.forEach(c => {
      const monto = parseFloat(c.compraDolar) || parseFloat(c.monto) || 0;
      if (monto > masGrande.monto) {
        masGrande = { monto, data: c };
      }
    });
    
    // Por cliente (top 5)
    const porCliente = {};
    compras.forEach(c => {
      const cliente = c.cliente || 'Sin nombre';
      if (!porCliente[cliente]) {
        porCliente[cliente] = { 
          total: 0, 
          cantidad: 0, 
          pendiente: 0,
          ganancia: 0 
        };
      }
      porCliente[cliente].total += parseFloat(c.compraDolar) || parseFloat(c.monto) || 0;
      porCliente[cliente].cantidad++;
      porCliente[cliente].ganancia += parseFloat(c.gananciaDolar) || 0;
      if (c.status === 'Por Cobrar') {
        porCliente[cliente].pendiente += parseFloat(c.compraDolar) || parseFloat(c.monto) || 0;
      }
    });
    
    const clientesTop = Object.entries(porCliente)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);
    
    return {
      totalUSD,
      totalPagado,
      totalPendiente,
      gananciaTotal,
      gananciaPagadas,
      gananciaPendientes,
      cantidad: compras.length,
      cantidadPagadas: pagadas.length,
      cantidadPendientes: pendientes.length,
      mejorTasa,
      masGrande,
      clientesTop
    };
  }, [transaccionesFiltradas]);

  // ========================================
  // ANÁLISIS DE CAMBIOS USD-USDT
  // ========================================
  const analisisCambios = useMemo(() => {
    const cambios = transaccionesFiltradas.filter(t => t.tipo === 'Cambio' || t.importadoDesde === 'cambios');
    
    const totalUSD = cambios.reduce((sum, c) => sum + (parseFloat(c.usd) || 0), 0);
    const totalUSDT = cambios.reduce((sum, c) => sum + (parseFloat(c.usdt) || 0), 0);
    const comisionTotal = cambios.reduce((sum, c) => sum + (parseFloat(c.comision) || 0), 0);
    
    // Tasa promedio
    const tasaPromedio = cambios.length > 0
      ? cambios.reduce((sum, c) => sum + (parseFloat(c.tasa) || 0), 0) / cambios.length
      : 0;
    
    // Mejor y peor tasa
    let mejorTasa = { tasa: 0, data: null };
    let peorTasa = { tasa: Infinity, data: null };
    
    cambios.forEach(c => {
      const tasa = parseFloat(c.tasa) || 0;
      if (tasa > mejorTasa.tasa) {
        mejorTasa = { tasa, data: c };
      }
      if (tasa < peorTasa.tasa && tasa > 0) {
        peorTasa = { tasa, data: c };
      }
    });
    
    // Cambio más grande
    let masGrande = { monto: 0, data: null };
    cambios.forEach(c => {
      const monto = parseFloat(c.usd) || 0;
      if (monto > masGrande.monto) {
        masGrande = { monto, data: c };
      }
    });
    
    // Por usuario cambiador
    const porUsuario = {};
    cambios.forEach(c => {
      const usuario = c.usuarioCambiador || 'Sin especificar';
      if (!porUsuario[usuario]) {
        porUsuario[usuario] = { total: 0, cantidad: 0 };
      }
      porUsuario[usuario].total += parseFloat(c.usd) || 0;
      porUsuario[usuario].cantidad++;
    });
    
    return {
      totalUSD,
      totalUSDT,
      comisionTotal,
      tasaPromedio,
      cantidad: cambios.length,
      mejorTasa,
      peorTasa,
      masGrande,
      porUsuario: Object.entries(porUsuario).sort((a, b) => b[1].total - a[1].total)
    };
  }, [transaccionesFiltradas]);

  // Renderizar gráficos
  useEffect(() => {
    // Destruir gráficos anteriores
    if (chartInstanceCategorias.current) {
      chartInstanceCategorias.current.destroy();
    }
    if (chartInstanceTendencia.current) {
      chartInstanceTendencia.current.destroy();
    }

    if (!chartCategorias.current || !chartTendencia.current) return;

    const ctxCategorias = chartCategorias.current.getContext('2d');
    const ctxTendencia = chartTendencia.current.getContext('2d');

    // Configuración según la vista actual
    let datosCategorias, datosTendencia;

    if (vistaActual === 'gastos') {
      // Gráfico de categorías de gastos
      datosCategorias = {
        labels: analisisGastos.porCategoria.map(([cat]) => cat),
        datasets: [{
          label: 'Gastos por Categoría (USD)',
          data: analisisGastos.porCategoria.map(([, datos]) => datos.total),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };

      // Gráfico de tendencia diaria
      datosTendencia = {
        labels: analisisGastos.porDia.map(([fecha]) => fecha),
        datasets: [{
          label: 'Gastos Diarios (USD)',
          data: analisisGastos.porDia.map(([, monto]) => monto),
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          tension: 0.4
        }]
      };
    } else if (vistaActual === 'ventas') {
      // Gráfico por cuenta destino
      datosCategorias = {
        labels: analisisVentas.porCuenta.map(([cuenta]) => cuenta),
        datasets: [{
          label: 'Ventas por Cuenta (Bs)',
          data: analisisVentas.porCuenta.map(([, datos]) => datos.total),
          backgroundColor: ['#36A2EB', '#4BC0C0', '#FFCE56'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };

      // Tendencia de ventas
      datosTendencia = {
        labels: analisisVentas.porDia.map(([fecha]) => fecha),
        datasets: [{
          label: 'Ventas Diarias (USDT)',
          data: analisisVentas.porDia.map(([, monto]) => monto),
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4
        }]
      };
    } else if (vistaActual === 'porCobrar') {
      // Top 5 clientes
      datosCategorias = {
        labels: analisisPorCobrar.clientesTop.map(([cliente]) => cliente),
        datasets: [{
          label: 'Compras por Cliente (USD)',
          data: analisisPorCobrar.clientesTop.map(([, datos]) => datos.total),
          backgroundColor: '#FFCE56',
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };

      // Comparación Pagado vs Pendiente
      datosTendencia = {
        labels: ['Pagado', 'Pendiente'],
        datasets: [{
          label: 'Status de Compras (USD)',
          data: [analisisPorCobrar.totalPagado, analisisPorCobrar.totalPendiente],
          backgroundColor: ['#4BC0C0', '#FF9F40'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    } else if (vistaActual === 'cambios') {
      // Por usuario
      datosCategorias = {
        labels: analisisCambios.porUsuario.map(([usuario]) => usuario),
        datasets: [{
          label: 'Cambios por Usuario (USD)',
          data: analisisCambios.porUsuario.map(([, datos]) => datos.total),
          backgroundColor: '#9966FF',
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };

      // Relación USD/USDT
      datosTendencia = {
        labels: ['USD Cambiados', 'USDT Recibidos', 'Comisión'],
        datasets: [{
          label: 'Operaciones de Cambio',
          data: [analisisCambios.totalUSD, analisisCambios.totalUSDT, analisisCambios.comisionTotal],
          backgroundColor: ['#9966FF', '#FF6384', '#FFCE56'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    }

    // Crear gráficos
    chartInstanceCategorias.current = new Chart(ctxCategorias, {
      type: vistaActual === 'porCobrar' ? 'bar' : 'pie',
      data: datosCategorias,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: vistaActual === 'gastos' ? 'right' : 'bottom',
            labels: { color: '#fff' }
          },
          title: {
            display: true,
            text: vistaActual === 'gastos' ? 'Gastos por Categoría' :
                  vistaActual === 'ventas' ? 'Ventas por Cuenta' :
                  vistaActual === 'porCobrar' ? 'Top 5 Clientes' :
                  'Cambios por Usuario',
            color: '#fff',
            font: { size: 16 }
          }
        }
      }
    });

    chartInstanceTendencia.current = new Chart(ctxTendencia, {
      type: vistaActual === 'porCobrar' || vistaActual === 'cambios' ? 'bar' : 'line',
      data: datosTendencia,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#fff' }
          },
          title: {
            display: true,
            text: vistaActual === 'gastos' ? 'Tendencia de Gastos' :
                  vistaActual === 'ventas' ? 'Tendencia de Ventas' :
                  vistaActual === 'porCobrar' ? 'Status de Compras' :
                  'Resumen de Cambios',
            color: '#fff',
            font: { size: 16 }
          }
        },
        scales: vistaActual !== 'cambios' && vistaActual !== 'porCobrar' ? {
          y: {
            beginAtZero: true,
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        } : {
          y: {
            beginAtZero: true,
            ticks: { color: '#fff' }
          },
          x: {
            ticks: { color: '#fff' }
          }
        }
      }
    });

    return () => {
      if (chartInstanceCategorias.current) {
        chartInstanceCategorias.current.destroy();
      }
      if (chartInstanceTendencia.current) {
        chartInstanceTendencia.current.destroy();
      }
    };
  }, [vistaActual, analisisGastos, analisisVentas, analisisPorCobrar, analisisCambios]);

  // Renderizar estadísticas según la vista
  const renderEstadisticas = () => {
    if (vistaActual === 'gastos') {
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Total Gastado</p>
              <p className="text-2xl font-bold">${analisisGastos.total.toFixed(2)}</p>
              <p className="text-xs opacity-60">{analisisGastos.cantidad} gastos</p>
            </div>
            
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Promedio por Gasto</p>
              <p className="text-2xl font-bold">${analisisGastos.promedio.toFixed(2)}</p>
            </div>
            
            <div className="bg-pink-500/20 border border-pink-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Gasto Más Alto</p>
              <p className="text-2xl font-bold">${analisisGastos.masAlto.monto.toFixed(2)}</p>
              <p className="text-xs opacity-60 truncate">{analisisGastos.masAlto.data?.descripcion}</p>
            </div>
            
            <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Categoría Principal</p>
              <p className="text-lg font-bold truncate">
                {analisisGastos.porCategoria[0]?.[0]}
              </p>
              <p className="text-xs opacity-60">
                ${analisisGastos.porCategoria[0]?.[1].total.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <h4 className="font-bold mb-2">💡 Recomendaciones para Reducir Gastos:</h4>
            <ul className="text-sm space-y-1">
              <li>• La categoría <strong>{analisisGastos.porCategoria[0]?.[0]}</strong> representa el {analisisGastos.porCategoria[0]?.[1].porcentaje.toFixed(1)}% del total</li>
              <li>• Promedio diario: ${(analisisGastos.total / Math.max(analisisGastos.porDia.length, 1)).toFixed(2)}</li>
              <li>• Considera revisar gastos en: {analisisGastos.porCategoria.slice(0, 3).map(([cat]) => cat).join(', ')}</li>
            </ul>
          </div>
        </>
      );
    } else if (vistaActual === 'ventas') {
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Total USDT Vendido</p>
              <p className="text-2xl font-bold">{analisisVentas.totalUSDT.toFixed(2)}</p>
              <p className="text-xs opacity-60">{analisisVentas.cantidad} ventas</p>
            </div>
            
            <div className="bg-cyan-500/20 border border-cyan-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Total Bs Recibido</p>
              <p className="text-2xl font-bold">{analisisVentas.totalBs.toFixed(2)}</p>
            </div>
            
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Tasa Promedio</p>
              <p className="text-2xl font-bold">{analisisVentas.tasaPromedio.toFixed(2)}</p>
              <p className="text-xs opacity-60">Bs/USDT</p>
            </div>
            
            <div className="bg-teal-500/20 border border-teal-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Comisión Total</p>
              <p className="text-2xl font-bold">{analisisVentas.comisionTotal.toFixed(2)}</p>
              <p className="text-xs opacity-60">USDT (Binance 0.2%)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-4">
              <h4 className="font-bold mb-2">🎯 Mejor Tasa Lograda</h4>
              <p className="text-xl font-bold">{analisisVentas.mejorTasa.tasa.toFixed(2)} Bs/USDT</p>
              <p className="text-xs opacity-75">{analisisVentas.mejorTasa.data?.fecha}</p>
            </div>
            
            <div className="bg-lime-500/20 border border-lime-500 rounded-lg p-4">
              <h4 className="font-bold mb-2">📊 Venta Más Grande</h4>
              <p className="text-xl font-bold">{analisisVentas.masGrande.monto.toFixed(2)} USDT</p>
              <p className="text-xs opacity-75">{analisisVentas.masGrande.data?.fecha}</p>
            </div>
          </div>
        </>
      );
    } else if (vistaActual === 'porCobrar') {
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Total en Compras</p>
              <p className="text-2xl font-bold">${analisisPorCobrar.totalUSD.toFixed(2)}</p>
              <p className="text-xs opacity-60">{analisisPorCobrar.cantidad} compras</p>
            </div>
            
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Pagado</p>
              <p className="text-2xl font-bold">${analisisPorCobrar.totalPagado.toFixed(2)}</p>
              <p className="text-xs opacity-60">{analisisPorCobrar.cantidadPagadas} compras</p>
            </div>
            
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Pendiente</p>
              <p className="text-2xl font-bold">${analisisPorCobrar.totalPendiente.toFixed(2)}</p>
              <p className="text-xs opacity-60">{analisisPorCobrar.cantidadPendientes} compras</p>
            </div>
            
            <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Ganancia Total</p>
              <p className="text-2xl font-bold">${analisisPorCobrar.gananciaTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
            <h4 className="font-bold mb-2">💡 Recomendaciones para Más Compras:</h4>
            <ul className="text-sm space-y-1">
              <li>• Mejor tasa lograda: <strong>{analisisPorCobrar.mejorTasa.tasa.toFixed(2)} Bs/USD</strong></li>
              <li>• Cliente top: <strong>{analisisPorCobrar.clientesTop[0]?.[0]}</strong> con ${analisisPorCobrar.clientesTop[0]?.[1].total.toFixed(2)}</li>
              <li>• Ganancia pendiente de cobrar: ${analisisPorCobrar.gananciaPendientes.toFixed(2)}</li>
              <li>• Promedio por compra: ${(analisisPorCobrar.totalUSD / analisisPorCobrar.cantidad).toFixed(2)}</li>
            </ul>
          </div>
        </>
      );
    } else if (vistaActual === 'cambios') {
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Total USD Cambiados</p>
              <p className="text-2xl font-bold">${analisisCambios.totalUSD.toFixed(2)}</p>
              <p className="text-xs opacity-60">{analisisCambios.cantidad} cambios</p>
            </div>
            
            <div className="bg-indigo-500/20 border border-indigo-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Total USDT Recibidos</p>
              <p className="text-2xl font-bold">{analisisCambios.totalUSDT.toFixed(2)}</p>
            </div>
            
            <div className="bg-violet-500/20 border border-violet-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Tasa Promedio</p>
              <p className="text-2xl font-bold">{analisisCambios.tasaPromedio.toFixed(4)}</p>
              <p className="text-xs opacity-60">USDT/USD</p>
            </div>
            
            <div className="bg-fuchsia-500/20 border border-fuchsia-500 rounded-lg p-4">
              <p className="text-sm opacity-75">Comisión Total</p>
              <p className="text-2xl font-bold">{analisisCambios.comisionTotal.toFixed(2)}</p>
              <p className="text-xs opacity-60">USDT</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-pink-500/20 border border-pink-500 rounded-lg p-4">
              <h4 className="font-bold mb-2">🎯 Mejor Tasa</h4>
              <p className="text-xl font-bold">{analisisCambios.mejorTasa.tasa.toFixed(4)}</p>
              <p className="text-xs opacity-75">{analisisCambios.mejorTasa.data?.fecha}</p>
            </div>
            
            <div className="bg-rose-500/20 border border-rose-500 rounded-lg p-4">
              <h4 className="font-bold mb-2">📊 Cambio Más Grande</h4>
              <p className="text-xl font-bold">${analisisCambios.masGrande.monto.toFixed(2)}</p>
              <p className="text-xs opacity-75">{analisisCambios.masGrande.data?.fecha}</p>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📊 Análisis y Gráficos</h2>
          <p className="text-sm opacity-75">Estadísticas clave para tomar decisiones</p>
        </div>
        
        <div className="flex gap-3">
          {/* Selector de vista */}
          <select 
            value={vistaActual}
            onChange={(e) => setVistaActual(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2"
          >
            <option value="gastos">💸 Gastos</option>
            <option value="ventas">💵 Ventas</option>
            <option value="porCobrar">💰 Por Cobrar</option>
            <option value="cambios">🔄 Cambios USD-USDT</option>
          </select>
          
          {/* Selector de periodo */}
          <select 
            value={periodoAnalisis}
            onChange={(e) => setPeriodoAnalisis(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2"
          >
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="año">Este Año</option>
            <option value="todo">Todo</option>
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      {renderEstadisticas()}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-lg p-6">
          <canvas ref={chartCategorias} style={{ maxHeight: '400px' }}></canvas>
        </div>
        
        <div className="bg-white/5 rounded-lg p-6">
          <canvas ref={chartTendencia} style={{ maxHeight: '400px' }}></canvas>
        </div>
      </div>
    </div>
  );
};

export default Graficos;