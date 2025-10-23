import React from 'react';

const Calendario = ({ transacciones, temaActual }) => {
  // Ordenar transacciones de más reciente a más antigua
  const transaccionesOrdenadas = [...transacciones].sort((a, b) => {
    const fechaA = new Date(a.fecha);
    const fechaB = new Date(b.fecha);
    return fechaB - fechaA; // Más reciente primero
  });

  return (
    <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
      <h2 className="text-2xl font-bold mb-4">📅 Vista de Calendario</h2>
      <p className="text-sm opacity-75 mb-4">
        Mostrando las últimas 20 transacciones (más recientes primero)
      </p>
      <div className="space-y-4">
        {transaccionesOrdenadas.slice(0, 20).map(t => (
          <div key={t.id} className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
            <div className="text-center min-w-[60px]">
              <div className="text-2xl font-bold">{new Date(t.fecha).getDate()}</div>
              <div className="text-xs uppercase">{new Date(t.fecha).toLocaleDateString('es', {month: 'short'})}</div>
              <div className="text-xs opacity-50">{new Date(t.fecha).getFullYear()}</div>
            </div>
            <div className="flex-1">
              <p className="font-semibold">{t.descripcion}</p>
              <p className="text-sm opacity-75">{t.categoria}</p>
            </div>
            <div className={`text-xl font-bold ${t.tipo === 'Ingreso' || t.tipo === 'Venta' ? 'text-green-400' : 'text-red-400'}`}>
              {t.tipo === 'Ingreso' || t.tipo === 'Venta' ? '+' : '-'}{Math.abs(t.monto).toFixed(2)} {t.moneda}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendario;