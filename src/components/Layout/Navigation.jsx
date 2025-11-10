import React from 'react';

const Navigation = ({ vista, setVista, temaActual }) => {
  const vistas = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transacciones', label: 'Transacciones' },
    { id: 'porCobrar', label: 'Por Cobrar' },
    { id: 'ventas', label: 'Ventas' },
    { id: 'gastos', label: 'Gastos' }, 
    { id: 'cambios', label: 'cambios' },
    { id: 'graficos', label: 'Graficos' },
    { id: 'calendario', label: 'Calendario' },
    { id: 'tasas', label: 'Tasas' },
    { id: 'temas', label: 'Temas' }
  ];

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {vistas.map(v => (
        <button
          key={v.id}
          onClick={() => setVista(v.id)}
          className={`px-4 py-2 rounded-lg ${vista === v.id ? temaActual.boton : 'bg-white/10'} text-white transition-colors`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
};

export default Navigation;