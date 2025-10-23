import { useState } from 'react';

export const useFiltros = () => {
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtrosPorCobrar, setFiltrosPorCobrar] = useState({
    cliente: 'todos',
    status: 'Por Cobrar',
    fechaInicio: '',
    fechaFin: '',
    operador: 'todos'
  });

  const obtenerTransaccionesFiltradas = (transacciones) => {
    let filtradas = transacciones;
    
    if (filtroMes !== 'todos') {
      const [año, mes] = filtroMes.split('-');
      filtradas = transacciones.filter(t => {
        const [tAño, tMes] = t.fecha.split('-');
        return tAño === año && tMes === mes;
      });
    }
    
    // Ordenar de más reciente a más antigua
    return filtradas.sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return fechaB - fechaA;
    });
  };

  const obtenerComprasFiltradas = (compras) => {
    let resultado = compras;

    if (filtrosPorCobrar.cliente !== 'todos') {
      resultado = resultado.filter(c => c.cliente === filtrosPorCobrar.cliente);
    }

    if (filtrosPorCobrar.status !== 'todos') {
      resultado = resultado.filter(c => c.status === filtrosPorCobrar.status);
    }

    if (filtrosPorCobrar.operador !== 'todos') {
      resultado = resultado.filter(c => c.operador === filtrosPorCobrar.operador);
    }

    if (filtrosPorCobrar.fechaInicio) {
      resultado = resultado.filter(c => c.fecha >= filtrosPorCobrar.fechaInicio);
    }

    if (filtrosPorCobrar.fechaFin) {
      resultado = resultado.filter(c => c.fecha <= filtrosPorCobrar.fechaFin);
    }

    // Ordenar de más reciente a más antigua
    return resultado.sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return fechaB - fechaA;
    });
  };

  const limpiarFiltrosPorCobrar = () => {
    setFiltrosPorCobrar({
      cliente: 'todos',
      status: 'Por Cobrar',
      fechaInicio: '',
      fechaFin: '',
      operador: 'todos'
    });
  };

  return {
    filtroMes,
    setFiltroMes,
    filtrosPorCobrar,
    setFiltrosPorCobrar,
    obtenerTransaccionesFiltradas,
    obtenerComprasFiltradas,
    limpiarFiltrosPorCobrar
  };
};