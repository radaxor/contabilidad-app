import React from 'react';
import { logout } from '../../services/auth.service';
import { exportarExcel, exportarPDF } from '../../utils/exportar';

const Header = ({ usuario, balance, temaActual, setMostrarForm, transacciones }) => {
  // Validación: usar tema por defecto si no existe
  const tema = temaActual || {
    tarjeta: 'bg-white/10',
    texto: 'text-white',
    boton: 'bg-purple-600 hover:bg-purple-700'
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`${tema.tarjeta} backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20`}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">💰 Sistema Premium</h1>
          <p className="text-sm opacity-75">👤 {usuario.email}</p>
          <p className="text-xs opacity-50 mt-1">Mis datos personales</p>
          <p className="text-2xl mt-2 font-bold text-green-400">${balance.usd.toFixed(2)} USD</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setMostrarForm(true)} 
            className={`${tema.boton} text-white px-4 py-2 rounded-lg font-semibold`}
          >
            + Nueva
          </button>
          <button 
            onClick={() => exportarExcel(transacciones, usuario.email)} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            📊 Excel
          </button>
          <button 
            onClick={() => exportarPDF(transacciones, usuario.email)} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            📄 PDF
          </button>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;