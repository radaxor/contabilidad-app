import { useState, useEffect } from 'react';
import { observarTasaVenta, observarTasaCambio } from '../services/configuracion.service';
import { TASAS_INICIALES } from '../config/constants';

export const useTasas = (usuario) => {
  const [tasaVenta, setTasaVenta] = useState(TASAS_INICIALES.tasaVenta);
  const [tasaCambio, setTasaCambio] = useState({
    usdToBs: TASAS_INICIALES.usdToBs,
    usdtToUsd: TASAS_INICIALES.usdtToUsd
  });

  useEffect(() => {
    if (!usuario) return;
    
    const unsubTasaVenta = observarTasaVenta(usuario, (valor) => {
      setTasaVenta(valor);
    });
    
    return () => unsubTasaVenta();
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    
    const unsubTasaCambio = observarTasaCambio(usuario, (datos) => {
      setTasaCambio(datos);
    });
    
    return () => unsubTasaCambio();
  }, [usuario]);

  return { tasaVenta, setTasaVenta, tasaCambio, setTasaCambio };
};