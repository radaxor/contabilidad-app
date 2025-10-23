import React, { useState } from 'react';
import { login, registro } from '../../services/auth.service';

const Login = ({ temaActual }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modoLogin, setModoLogin] = useState('login');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modoLogin === 'login') {
        await login(email, password);
      } else {
        await registro(email, password);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${temaActual.primario} flex items-center justify-center p-4`}>
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20`}>
        <h1 className={`text-3xl font-bold mb-6 text-center ${temaActual.texto}`}>
          🔐 {modoLogin === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm mb-2 ${temaActual.texto}`}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600"
              required
            />
          </div>
          <div>
            <label className={`block text-sm mb-2 ${temaActual.texto}`}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600"
              required
            />
          </div>
          <button type="submit" className={`w-full ${temaActual.boton} text-white py-3 rounded-lg font-semibold`}>
            {modoLogin === 'login' ? 'Entrar' : 'Crear Cuenta'}
          </button>
        </form>
        <button
          onClick={() => setModoLogin(modoLogin === 'login' ? 'registro' : 'login')}
          className={`w-full mt-4 ${temaActual.texto} text-center text-sm underline`}
        >
          {modoLogin === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
        
        <div className="mt-8 pt-6 border-t border-white/20">
          <p className={`text-center text-sm ${temaActual.texto} opacity-75`}>
            💡 Cada usuario tiene su propia base de datos separada
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;