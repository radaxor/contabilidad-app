import { useState, useEffect } from 'react';
import { observarAutenticacion } from '../services/auth.service';

export const useAuth = () => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = observarAutenticacion((user) => {
      setUsuario(user);
      setCargando(false);
    });
    
    return () => unsub();
  }, []);

  return { usuario, cargando };
};