import React from 'react';
import { temas } from '../../config/temas';

const Temas = ({ temaActual, tema, setTema }) => {
  return (
    <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
      <h2 className="text-2xl font-bold mb-4">🎨 Seleccionar Tema</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(temas).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setTema(key)}
            className={`p-6 rounded-2xl border-4 ${tema === key ? 'border-white' : 'border-transparent'} bg-gradient-to-br ${t.primario}`}
          >
            <p className="text-white font-bold">{t.nombre}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Temas;