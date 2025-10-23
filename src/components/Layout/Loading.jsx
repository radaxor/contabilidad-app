import React from 'react';

const Loading = ({ temaActual }) => {
  // Valor por defecto si temaActual no está definido
  const tema = temaActual || {
    primario: 'from-slate-900 via-purple-900 to-slate-900',
    texto: 'text-white'
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${tema.primario} flex items-center justify-center`}>
      <div className={`${tema.texto} text-center`}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
        <p className="text-xl">Cargando...</p>
      </div>
    </div>
  );
};

export default Loading;