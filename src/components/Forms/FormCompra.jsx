// src/components/Forms/FormCompra.jsx
import React, { useEffect, useState } from 'react';
import { obtenerTasaParaGasto } from '../../services/tasaVenta.service';
import { db } from '../../services/firebase';

const FormCompra = ({ formCompra, setFormCompra, tasaVenta, usuario, onSolicitarVenta }) => {
  const [infoTasa, setInfoTasa] = useState(null);
  const [cargandoTasa, setCargandoTasa] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);

  // 📋 CARGAR CLIENTES EXISTENTES AL MONTAR EL COMPONENTE
  useEffect(() => {
    const cargarClientes = async () => {
      if (!usuario) return;

      try {
        setCargandoClientes(true);
        
        // Obtener todas las compras del usuario
        const snapshot = await db.collection('transacciones')
          .where('usuarioId', '==', usuario.uid)
          .where('tipo', '==', 'Compra')
          .get();

        // Extraer clientes únicos
        const clientesUnicos = new Set();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.cliente && data.cliente.trim()) {
            clientesUnicos.add(data.cliente.trim());
          }
        });

        // Convertir Set a Array y ordenar alfabéticamente
        const listaClientes = Array.from(clientesUnicos).sort();
        setClientes(listaClientes);
        
        console.log('✅ Clientes cargados:', listaClientes.length);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      } finally {
        setCargandoClientes(false);
      }
    };

    cargarClientes();
  }, [usuario]);

  // 🔍 BUSCAR TASA CUANDO CAMBIA LA FECHA
  useEffect(() => {
    const buscarTasa = async () => {
      if (!formCompra.fecha || !usuario) return;

      setCargandoTasa(true);
      const resultado = await obtenerTasaParaGasto(formCompra.fecha, usuario.uid);
      setInfoTasa(resultado);
      setCargandoTasa(false);

      console.log('📊 Tasa encontrada para compra:', resultado);
    };

    buscarTasa();
  }, [formCompra.fecha, usuario]);

  // 📝 MANEJAR CAMBIO DE CLIENTE (SIN agregar automáticamente)
  const handleClienteChange = (e) => {
    const nuevoCliente = e.target.value;
    setFormCompra({...formCompra, cliente: nuevoCliente});
    
    // NO agregamos el cliente aquí - se agregará después de guardar
  };

  // 🎯 BOTÓN PARA ACTUALIZAR TASA (registrar venta)
  const handleActualizarTasa = () => {
    if (onSolicitarVenta) {
      onSolicitarVenta();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-100 mb-1">💰 Registro de Compra</p>
        <p className="text-lg font-bold text-white">
          Compra de dólares a clientes
        </p>
      </div>

      {/* FILA 1: Fecha, Hora, Status */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Fecha</label>
          <input 
            type="date" 
            value={formCompra.fecha} 
            onChange={e => setFormCompra({...formCompra, fecha: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Hora</label>
          <input 
            type="time" 
            value={formCompra.hora} 
            onChange={e => setFormCompra({...formCompra, hora: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Status</label>
          <select 
            value={formCompra.status} 
            onChange={e => setFormCompra({...formCompra, status: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white"
          >
            <option value="Por Cobrar">Por Cobrar</option>
            <option value="Pagado">Pagado</option>
          </select>
        </div>
      </div>

      {/* ⚠️ ADVERTENCIA DE STATUS */}
      {formCompra.status === 'Por Cobrar' && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
          <p className="text-xs text-yellow-200">
            ⚠️ <strong>Nota:</strong> Mientras el status sea "Por Cobrar", el balance en USD NO se modificará. 
            Solo se actualizará cuando cambies el status a "Pagado".
          </p>
        </div>
      )}

      {formCompra.status === 'Pagado' && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
          <p className="text-xs text-green-200">
            ✅ <strong>Balance USD se incrementará en:</strong> ${formCompra.compraDolar.toFixed(2)} + ${formCompra.gananciaDolar.toFixed(2)} (ganancia) = ${(formCompra.compraDolar + formCompra.gananciaDolar).toFixed(2)}
          </p>
        </div>
      )}

      {/* INFORMACIÓN DE LA TASA DETECTADA */}
      {cargandoTasa ? (
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
          <p className="text-blue-300 text-sm">⏳ Buscando tasa de venta...</p>
        </div>
      ) : infoTasa && (
        <div>
          {/* Tasa encontrada */}
          {infoTasa.estado === 'encontrada' && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <p className="text-green-300 text-sm font-semibold mb-2">✅ Tasa de venta encontrada para esta fecha</p>
              <div className="space-y-1 text-sm">
                <p className="text-white">Tasa: <span className="font-bold text-green-400">{infoTasa.tasa.toFixed(2)} Bs</span></p>
                <p className="text-white">Registrada: {infoTasa.fecha} a las {infoTasa.hora}</p>
              </div>
            </div>
          )}

          {/* Tasa reciente */}
          {infoTasa.estado === 'reciente' && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-300 text-sm font-semibold mb-2">ℹ️ Usando última tasa disponible</p>
              <div className="space-y-1 text-sm">
                <p className="text-white">Tasa: <span className="font-bold text-blue-400">{infoTasa.tasa.toFixed(2)} Bs</span></p>
                <p className="text-white">Actualizada: {infoTasa.fecha} a las {infoTasa.hora}</p>
              </div>
            </div>
          )}

          {/* Tasa desactualizada */}
          {infoTasa.estado === 'desactualizada' && (
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <p className="text-orange-300 text-sm font-semibold mb-2">⚠️ Tasa desactualizada</p>
              <div className="space-y-2 text-sm">
                <p className="text-white">{infoTasa.mensaje}</p>
                <p className="text-white">Última tasa: <span className="font-bold">{infoTasa.ultimaTasa.toFixed(2)} Bs</span> ({infoTasa.fecha})</p>
                <button
                  type="button"
                  onClick={handleActualizarTasa}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-semibold mt-2"
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold mt-2"
                >
                  📈 Registrar Primera Venta
                </button>
              </div>
            </div>
          )}

          {/* Fecha histórica sin tasa */}
          {infoTasa.estado === 'fecha_sin_tasa' && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-300 text-sm font-semibold mb-2">📅 Fecha sin tasa registrada</p>
              <p className="text-white text-sm">{infoTasa.mensaje}</p>
              <p className="text-xs text-yellow-200 mt-2">
                💡 La tasa de venta actual ({tasaVenta.toFixed(2)} Bs) se usará para calcular la ganancia.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CLIENTE CON AUTOCOMPLETE */}
      <div>
        <label className="block text-sm mb-2 text-white">
          Cliente {cargandoClientes && <span className="text-xs text-gray-400">(cargando...)</span>}
        </label>
        <input 
          list="clientes-list"
          value={formCompra.cliente} 
          onChange={handleClienteChange}
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          placeholder="Escribe o selecciona un cliente"
          required 
        />
        <datalist id="clientes-list">
          {clientes.map((cliente, index) => (
            <option key={index} value={cliente} />
          ))}
        </datalist>
        <p className="text-xs text-gray-400 mt-1">
          {clientes.length > 0 ? (
            `💡 ${clientes.length} cliente(s) registrado(s). Los nuevos clientes se guardarán al completar la transacción.`
          ) : (
            '💡 Escribe el nombre del cliente. Se guardará cuando completes la transacción.'
          )}
        </p>
      </div>

      {/* COMPRA BS Y COMISIÓN */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 text-white">Compra Bs (Depósito)</label>
          <input 
            type="number" 
            step="0.01" 
            value={formCompra.compraBs} 
            onChange={e => setFormCompra({...formCompra, compraBs: e.target.value})} 
            className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
            placeholder="0.00"
            required 
          />
          <p className="text-xs text-gray-400 mt-1">Monto en Bs que el cliente depositó</p>
        </div>
        <div>
          <label className="block text-sm mb-2 text-white">Comisión Banco (0.3%)</label>
          <input 
            type="number" 
            step="0.01" 
            value={formCompra.comisionBanco.toFixed(2)} 
            className="w-full bg-slate-600 rounded px-4 py-2 text-gray-400" 
            disabled 
          />
          <p className="text-xs text-gray-400 mt-1">Calculado automáticamente</p>
        </div>
      </div>

      {/* TASA DE COMPRA */}
      <div>
        <label className="block text-sm mb-2 text-white font-semibold">
          TASA (Precio de Compra en Bs)
        </label>
        <input 
          type="number" 
          step="0.01" 
          value={formCompra.tasa} 
          onChange={e => setFormCompra({...formCompra, tasa: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white text-lg font-semibold" 
          placeholder="36.50"
          required 
        />
        <p className="text-xs text-gray-400 mt-1">
          Tasa a la que compraste los dólares del cliente
        </p>
      </div>

      {/* COMPRA DOLAR (RESULTADO) */}
      <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
        <p className="text-sm text-blue-200 mb-1">💵 COMPRA $ (Calculado)</p>
        <p className="text-3xl font-bold text-blue-400">${formCompra.compraDolar.toFixed(2)}</p>
        <p className="text-xs text-blue-200 mt-2">
          Dólares que compraste = Bs {formCompra.compraBs || 0} ÷ {formCompra.tasa || 0}
        </p>
      </div>

      {/* OPERADOR */}
      <div>
        <label className="block text-sm mb-2 text-white">Operador (Opcional)</label>
        <input 
          value={formCompra.operador} 
          onChange={e => setFormCompra({...formCompra, operador: e.target.value})} 
          className="w-full bg-slate-700 rounded px-4 py-2 text-white" 
          placeholder="Rafael Rosas"
        />
        <p className="text-xs text-gray-400 mt-1">Deja en blanco o cambia según el operador</p>
      </div>

      {/* RESUMEN DE IMPACTO EN BALANCE */}
      <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-white mb-3">📊 Impacto en Balance</h4>
        
        {formCompra.status === 'Por Cobrar' ? (
          // MODO: POR COBRAR
          <>
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-300 mb-2">💸 Balance Bs (Inmediato)</p>
              <p className="text-2xl font-bold text-red-400">
                -{(parseFloat(formCompra.compraBs) || 0).toFixed(2)} Bs
              </p>
              <p className="text-xs text-red-200 mt-1">
                Se descuentan ahora del balance Bs
              </p>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
              <p className="text-sm font-semibold text-yellow-300 mb-2">⏳ USD Pendientes</p>
              <p className="text-2xl font-bold text-yellow-400">
                +{formCompra.compraDolar.toFixed(2)} USD
              </p>
              <p className="text-xs text-yellow-200 mt-1">
                Esperando pago del cliente
              </p>
            </div>

            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-3">
              <p className="text-sm font-semibold text-orange-300 mb-2">💰 Ganancia Potencial</p>
              <div className="space-y-1">
                <p className="text-sm text-white">
                  Tasa Compra: <span className="font-bold text-blue-400">{(parseFloat(formCompra.tasa) || 0).toFixed(2)} Bs</span>
                </p>
                <p className="text-sm text-white">
                  Tasa Venta: <span className="font-bold text-green-400">{tasaVenta.toFixed(2)} Bs</span>
                </p>
                <p className="text-lg font-bold text-orange-400 mt-2">
                  {formCompra.gananciaBs.toFixed(2)} Bs
                </p>
                <p className="text-sm font-bold text-orange-300">
                  ${formCompra.gananciaDolar.toFixed(2)} USD
                </p>
              </div>
              <p className="text-xs text-orange-200 mt-2">
                Se realizará cuando el cliente pague
              </p>
            </div>
          </>
        ) : (
          // MODO: PAGADO
          <>
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-300 mb-2">💸 Balance Bs</p>
              <p className="text-2xl font-bold text-red-400">
                -{(parseFloat(formCompra.compraBs) || 0).toFixed(2)} Bs
              </p>
              <p className="text-xs text-red-200 mt-1">
                Descontados del balance
              </p>
            </div>

            <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
              <p className="text-sm font-semibold text-green-300 mb-2">✅ Balance USD se incrementará</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Dólares Comprados:</span>
                  <span className="text-xl font-bold text-green-400">
                    +{formCompra.compraDolar.toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-white/20 pt-2">
                  <span className="text-sm text-white">Ganancia en USD:</span>
                  <span className="text-xl font-bold text-green-400">
                    +{formCompra.gananciaDolar.toFixed(2)} USD
                  </span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Total USD:</span>
                    <span className="text-2xl font-bold text-green-300">
                      +{(formCompra.compraDolar + formCompra.gananciaDolar).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-300 mb-2">📈 Detalles de Ganancia</p>
              <div className="space-y-1 text-sm">
                <p className="text-white">
                  Tasa Compra: <span className="font-bold text-blue-400">{(parseFloat(formCompra.tasa) || 0).toFixed(2)} Bs</span>
                </p>
                <p className="text-white">
                  Tasa Venta: <span className="font-bold text-green-400">{tasaVenta.toFixed(2)} Bs</span>
                </p>
                <p className="text-white mt-2">
                  Ganancia Bs: <span className="font-bold text-green-400">{formCompra.gananciaBs.toFixed(2)} Bs</span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FormCompra;