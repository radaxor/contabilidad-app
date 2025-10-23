import { useState, useEffect } from 'react';
import { observarTransacciones } from '../services/transacciones.service';

export const useTransacciones = (usuario) => {
  const [transacciones, setTransacciones] = useState([]);

  useEffect(() => {
    if (!usuario) return;
    
    const unsub = observarTransacciones(usuario, (datos) => {
      setTransacciones(datos);
    });
    
    return () => unsub();
  }, [usuario]);

  const obtenerMesesDisponibles = () => {
    const meses = new Set();
    transacciones.forEach(t => {
      const [año, mes] = t.fecha.split('-');
      meses.add(`${año}-${mes}`);
    });
    return Array.from(meses).sort().reverse();
  };

  const obtenerCompras = () => {
    return transacciones.filter(t => t.tipo === 'Compra');
  };

  const obtenerClientesUnicos = () => {
    const compras = obtenerCompras();
    const clientes = new Set();
    compras.forEach(c => {
      if (c.cliente) clientes.add(c.cliente);
    });
    return Array.from(clientes).sort();
  };

  const obtenerOperadoresUnicos = () => {
    const compras = obtenerCompras();
    const operadores = new Set();
    compras.forEach(c => {
      if (c.operador) operadores.add(c.operador);
    });
    return Array.from(operadores).sort();
  };

  return {
    transacciones,
    obtenerMesesDisponibles,
    obtenerCompras,
    obtenerClientesUnicos,
    obtenerOperadoresUnicos
  };
};