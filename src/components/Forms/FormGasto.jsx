// src/components/Forms/FormGasto.jsx
import React, { useEffect, useState } from 'react';
import { obtenerTasaParaGasto } from '../../services/tasaVenta.service';
import { db } from '../../services/firebase';

const FormGasto = ({ formGasto, setFormGasto, usuario, onSolicitarVenta }) => {
  const [infoTasa, setInfoTasa] = useState(null);
  const [cargandoTasa, setCargandoTasa] = useState(false);
  const [tasaManual, setTasaManual] = useState('');
  const [usarTasaManual, setUsarTasaManual] = useState(false);
  
  // Estados para categorías dinámicas
  const [categorias, setCategorias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [categoriaInput, setCategoriaInput] = useState('');

  // Categorías predeterminadas
  const categoriasBase = [
    'Varios', 'Escuela', 'Servicios', 'Rafael', 'Emilys',
    'Casa', 'Carro', 'Prestamos', 'Remesas', 'Pasajes',
    'Comida', 'Salud', 'Entretenimiento', 'Ropa', 'Transporte'
  ];

  // Cargar categorías usadas anteriormente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const snapshot = await db
          .collection('transacciones')
          .where('usuarioId', '==', usuario.uid)
          .where('tipo', '==', 'Gasto')
          .get();

        const categoriasUsadas = new Set(categoriasBase);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.categoria) {
            categoriasUsadas.add(data.categoria);
          }
        });

        setCategorias(Array.from(categoriasUsadas).sort());
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        setCategorias(categoriasBase);
      }
    };

    if (usuario) {
      cargarCategorias();
    }
  }, [usuario]);

  // Filtrar categorías según lo que escribe el usuario
  const categoriasFiltradas = categorias.filter(cat =>
    cat.toLowerCase().includes(categoriaInput.toLowerCase())
  );

  // Manejar cambio en el input de categoría
  const handleCategoriaChange = (valor) => {
    setCategoriaInput(valor);
    setFormGasto({...formGasto, categoria: valor});
    setMostrarSugerencias(true);
  };

  // Seleccionar categoría de la lista
  const seleccionarCategoria = (cat) => {
    setCategoriaInput(cat);
    setFormGasto({...formGasto, categoria: cat});
    setMostrarSugerencias(false);
  };

  // 🔥 CRÍTICO: Buscar tasa cuando cambia la fecha O la moneda
  useEffect(() => {
    const buscarTasa = async () => {
      // Solo buscar tasa si la moneda es Bs
      if (formGasto.moneda !== 'Bs') {
        setInfoTasa(null);
        setCargandoTasa(false);
        setUsarTasaManual(false);
        setTasaManual('');
        // Si no es Bs, limpiar gastoDolar
        setFormGasto(prev => ({
          ...prev,
          gastoDolar: 0,
          tasaUsada: null
        }));
        return;
      }

      if (!formGasto.fecha || !usuario) return;

      console.log('🔍 Buscando tasa para fecha:', formGasto.fecha);
      setCargandoTasa(true);
      
      const resultado = await obtenerTasaParaGasto(formGasto.fecha, usuario.uid);
      console.log('📊 Resultado de búsqueda:', resultado);
      
      setInfoTasa(resultado);
      setCargandoTasa(false);

      if (resultado.requiereInput) {
        // No hay tasa para esta fecha, permitir input manual
        console.log('⚠️ Se requiere tasa manual para', formGasto.fecha);
        setUsarTasaManual(true);
        setTasaManual('');
      } else if (resultado.tasa) {
        // Se encontró tasa, usarla automáticamente
        console.log('✅ Tasa encontrada:', resultado.tasa, 'Bs/$');
        setUsarTasaManual(false);
        setTasaManual('');
      }
    };

    buscarTasa();
  }, [formGasto.fecha, formGasto.moneda, usuario]);

  // 🔥 NUEVO: useEffect separado SOLO para calcular cuando cambia el monto o la tasa
  useEffect(() => {
    // Solo calcular si hay monto y es moneda Bs
    if (formGasto.moneda !== 'Bs') {
      // Para USD o USDT, gastoDolar = monto
      const monto = parseFloat(formGasto.monto) || 0;
      setFormGasto(prev => ({
        ...prev,
        gastoDolar: monto,
        tasaUsada: null
      }));
      return;
    }

    if (!formGasto.monto || parseFloat(formGasto.monto) === 0) {
      setFormGasto(prev => ({
        ...prev,
        gastoDolar: 0,
        tasaUsada: null
      }));
      return;
    }

    // Para Bs, necesitamos una tasa
    let tasaAUsar = null;
    
    if (usarTasaManual && tasaManual && parseFloat(tasaManual) > 0) {
      tasaAUsar = parseFloat(tasaManual);
      console.log('💰 Usando tasa MANUAL:', tasaAUsar);
    } else if (infoTasa?.tasa && parseFloat(infoTasa.tasa) > 0) {
      tasaAUsar = parseFloat(infoTasa.tasa);
      console.log('💰 Usando tasa ENCONTRADA:', tasaAUsar);
    }

    if (tasaAUsar && tasaAUsar > 0) {
      const monto = parseFloat(formGasto.monto) || 0;
      const gastoDolar = monto / tasaAUsar;
      
      console.log('🧮 CÁLCULO:', {
        monto: monto,
        tasa: tasaAUsar,
        operacion: `${monto} ÷ ${tasaAUsar}`,
        resultado: gastoDolar.toFixed(2)
      });

      setFormGasto(prev => ({
        ...prev,
        gastoDolar: gastoDolar,
        tasaUsada: tasaAUsar
      }));
    }
  }, [formGasto.monto, formGasto.moneda, tasaManual, usarTasaManual, infoTasa]);

  const handleActualizarTasa = () => {
    if (onSolicitarVenta) {
      onSolicitarVenta();
    }
  };

  return (
    <div className="space-y-4">
      {/* Fecha */}
      <div>
        <label className="block text-sm mb-2 text-white">Fecha</label>
        <input 
          type="date" 
          value={formGasto.fecha} 
          onChange={e => {
            console.log('📅 Fecha cambiada a:', e.target.value);
            setFormGasto({...formGasto, fecha: e.target.value});
          }} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          required 
        />
      </div>

      {/* Información de la Tasa (solo si es moneda Bs) */}
      {formGasto.moneda === 'Bs' && (
        <>
          {cargandoTasa ? (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-300 text-sm">⏳ Buscando tasa de venta para {formGasto.fecha}...</p>
            </div>
          ) : infoTasa && (
            <div>
              {/* Tasa encontrada */}
              {infoTasa.estado === 'encontrada' && (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                  <p className="text-green-300 text-sm font-semibold mb-2">
                    ✅ Tasa de venta encontrada {infoTasa.esImportada ? '(importada)' : '(manual)'}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-white">Tasa: <span className="font-bold text-green-400">{parseFloat(infoTasa.tasa).toFixed(2)} Bs/$</span></p>
                    <p className="text-white">Fecha: {infoTasa.fecha} | Hora: {infoTasa.hora}</p>
                  </div>
                </div>
              )}

              {/* Tasa reciente */}
              {infoTasa.estado === 'reciente' && (
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
                  <p className="text-blue-300 text-sm font-semibold mb-2">ℹ️ Usando última tasa disponible</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-white">Tasa: <span className="font-bold text-blue-400">{parseFloat(infoTasa.tasa).toFixed(2)} Bs/$</span></p>
                    <p className="text-white">Actualizada: {infoTasa.fecha} a las {infoTasa.hora}</p>
                    <p className="text-yellow-300 text-xs mt-2">💡 No hay tasa para {formGasto.fecha}, usando la más reciente</p>
                  </div>
                </div>
              )}

              {/* Tasa desactualizada */}
              {infoTasa.estado === 'desactualizada' && (
                <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
                  <p className="text-orange-300 text-sm font-semibold mb-2">⚠️ Tasa desactualizada</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-white">{infoTasa.mensaje}</p>
                    <button
                      type="button"
                      onClick={handleActualizarTasa}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-semibold"
                    >
                      📈 Registrar Venta para Actualizar Tasa
                    </button>
                  </div>
                </div>
              )}

              {/* Sin tasa */}
              {infoTasa.estado === 'sin_tasa' && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                  <p className="text-red-300 text-sm font-semibold mb-2">❌ Sin tasa de venta</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-white">{infoTasa.mensaje}</p>
                    <button
                      type="button"
                      onClick={handleActualizarTasa}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold"
                    >
                      📈 Registrar Primera Venta
                    </button>
                  </div>
                </div>
              )}

              {/* Fecha sin tasa (histórica) - PERMITIR INPUT MANUAL */}
              {infoTasa.estado === 'fecha_sin_tasa' && (
                <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm font-semibold mb-2">📅 Fecha sin tasa registrada</p>
                  <p className="text-white text-sm mb-3">No hay ventas registradas para {formGasto.fecha}. Por favor ingrese la tasa de venta de ese día.</p>
                  
                  <div>
                    <label className="block text-sm mb-2 text-white">Ingrese la tasa de venta del {formGasto.fecha}:</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={tasaManual}
                      onChange={e => {
                        const valor = e.target.value;
                        console.log('✏️ Tasa manual ingresada:', valor);
                        setTasaManual(valor);
                      }}
                      className="w-full bg-slate-700 rounded px-4 py-2 text-white"
                      placeholder="Ej: 36.50"
                      required
                    />
                    {tasaManual && parseFloat(tasaManual) > 0 && (
                      <p className="text-xs text-green-300 mt-2">
                        ✅ Tasa manual: {parseFloat(tasaManual).toFixed(2)} Bs/$
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Descripción */}
      <div>
        <label className="block text-sm mb-2 text-white">Descripción</label>
        <textarea
          value={formGasto.descripcion} 
          onChange={e => setFormGasto({...formGasto, descripcion: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white resize-none" 
          placeholder="Breve descripción del gasto"
          rows="3"
          required 
        />
      </div>

      {/* Categoría con autocompletado */}
      <div>
        <label className="block text-sm mb-2 text-white font-semibold">
          Categoría
          <span className="text-xs font-normal opacity-75 ml-2">
            (Escribe una nueva o selecciona existente)
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={categoriaInput}
            onChange={e => handleCategoriaChange(e.target.value)}
            onFocus={() => setMostrarSugerencias(true)}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
            placeholder="Ej: Comida, Transporte, etc."
            required
          />
          
          {/* Lista de sugerencias */}
          {mostrarSugerencias && categoriasFiltradas.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {categoriasFiltradas.map((cat, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => seleccionarCategoria(cat)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-white"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Indicador de categoría nueva */}
        {categoriaInput && !categorias.includes(categoriaInput) && (
          <p className="text-xs text-green-400 mt-1">
            ✨ Nueva categoría "{categoriaInput}" se agregará automáticamente
          </p>
        )}
      </div>

      {/* Moneda y Monto */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Moneda</label>
          <select 
            value={formGasto.moneda} 
            onChange={e => {
              console.log('💱 Moneda cambiada a:', e.target.value);
              setFormGasto({...formGasto, moneda: e.target.value});
            }} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          >
            <option>Bs</option>
            <option>USD</option>
            <option>USDT</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {formGasto.moneda === 'Bs' && '💡 Se descontará del balance en Bolívares'}
            {formGasto.moneda === 'USD' && '💡 Se descontará del balance en Divisa (USD)'}
            {formGasto.moneda === 'USDT' && '💡 Se descontará del balance en Binance (USDT)'}
          </p>
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Monto</label>
          <input 
            type="number" 
            step="0.01"
            value={formGasto.monto} 
            onChange={e => {
              console.log('💰 Monto cambiado a:', e.target.value);
              setFormGasto({...formGasto, monto: e.target.value});
            }} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white text-lg font-semibold" 
            placeholder="0.00"
            required 
          />
        </div>
      </div>

      {/* Cuenta */}
      <div>
        <label className="block text-sm mb-2 text-white">Cuenta</label>
        <select 
          value={formGasto.cuenta} 
          onChange={e => setFormGasto({...formGasto, cuenta: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white"
        >
          <option>Provincial</option>
          <option>Venezuela</option>
          <option>Efectivo</option>
          <option>Binance</option>
          <option>Otros</option>
        </select>
      </div>

      {/* Resumen del gasto */}
      {formGasto.monto && parseFloat(formGasto.monto) > 0 && (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-sm mb-3 text-white font-semibold">📊 Resumen del gasto:</p>
          
          <div className="space-y-2">
            {/* Monto en la moneda original */}
            <div className="flex justify-between items-center">
              <span className="text-white">Monto del gasto:</span>
              <span className="text-2xl font-bold text-red-400">
                {formGasto.moneda === 'Bs' && `Bs ${parseFloat(formGasto.monto).toFixed(2)}`}
                {formGasto.moneda === 'USD' && `$${parseFloat(formGasto.monto).toFixed(2)}`}
                {formGasto.moneda === 'USDT' && `${parseFloat(formGasto.monto).toFixed(2)} USDT`}
              </span>
            </div>

            {/* Mostrar equivalente en dólares solo si es Bs y hay tasa */}
            {formGasto.moneda === 'Bs' && (formGasto.gastoDolar > 0 || (usarTasaManual && tasaManual && parseFloat(tasaManual) > 0)) && (
              <div className="border-t border-white/20 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm">Equivalente en USD:</span>
                  <span className="text-xl font-bold text-yellow-400">
                    ${formGasto.gastoDolar ? formGasto.gastoDolar.toFixed(2) : '0.00'}
                  </span>
                </div>
                {(formGasto.tasaUsada || (usarTasaManual && tasaManual)) && (
                  <p className="text-xs text-gray-300 mt-1 text-right">
                    Cálculo: {parseFloat(formGasto.monto).toFixed(2)} Bs ÷ {(formGasto.tasaUsada || parseFloat(tasaManual)).toFixed(2)} = ${formGasto.gastoDolar ? formGasto.gastoDolar.toFixed(2) : '0.00'}
                  </p>
                )}
              </div>
            )}

            {/* Información adicional */}
            <div className="border-t border-white/20 pt-2 mt-2">
              <p className="text-xs text-gray-300">
                {formGasto.moneda === 'Bs' && '✅ Se descontará del balance en Bolívares'}
                {formGasto.moneda === 'USD' && '✅ Se descontará del balance en Divisa (USD)'}
                {formGasto.moneda === 'USDT' && '✅ Se descontará del balance en Binance (USDT)'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormGasto;