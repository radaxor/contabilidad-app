import React from 'react';
import { calcularTotalPorCobrar, obtenerResumenPorCliente } from '../../utils/calculos';
import { actualizarStatusTransaccion } from '../../services/transacciones.service';
import FiltrosPorCobrar from './FiltrosPorCobrar';
import ResumenPorCliente from './ResumenPorCliente';
import DetalleTransacciones from './DetalleTransacciones';
import ImportarExcel from './ImportarExcel';

const PorCobrar = ({ 
  comprasFiltradas, 
  temaActual, 
  filtrosPorCobrar, 
  setFiltrosPorCobrar, 
  clientesUnicos, 
  operadoresUnicos, 
  limpiarFiltros,
  usuario,
  compras // ← Necesitamos todas las compras, no solo las filtradas
}) => {
  const totales = calcularTotalPorCobrar(comprasFiltradas);
  const resumenClientes = obtenerResumenPorCliente(comprasFiltradas);

  // Calcular ganancia USD no realizada (solo "Por Cobrar")
  const calcularGananciaNoRealizada = () => {
    let gananciaNoRealizadaUSD = 0;
    
    // Usar todas las compras, no las filtradas
    compras.forEach(c => {
      if (c.status === 'Por Cobrar') {
        gananciaNoRealizadaUSD += (c.gananciaDolar || 0);
      }
    });
    
    return gananciaNoRealizadaUSD;
  };

  const gananciaNoRealizada = calcularGananciaNoRealizada();

  const handleCambiarStatus = async (compra) => {
    const nuevoStatus = compra.status === 'Pagado' ? 'Por Cobrar' : 'Pagado';
    if (window.confirm(`¿Cambiar status a "${nuevoStatus}"?`)) {
      await actualizarStatusTransaccion(compra.id, nuevoStatus);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen total */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Transacciones</p>
          <p className="text-3xl font-bold">{totales.cantidad}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total en Bs</p>
          <p className="text-2xl font-bold">{totales.totalBs.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Total en USD</p>
          <p className="text-3xl font-bold">${totales.totalUsd.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Ganancia USD No Realizada</p>
          <p className="text-xs opacity-90 mb-1">(Por Cobrar)</p>
          <p className="text-3xl font-bold">${gananciaNoRealizada.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white">
          <p className="text-sm mb-2">Ganancia USD Total</p>
          <p className="text-3xl font-bold">${totales.totalGananciaUsd.toFixed(2)}</p>
        </div>
      </div>

      {/* AGREGAR BOTÓN DE IMPORTAR */}
      <div className={`${temaActual.tarjeta} backdrop-blur-lg rounded-2xl p-6`}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📥 Importar Datos</h2>
          <ImportarExcel 
            usuario={usuario}
            temaActual={temaActual}
          />
        </div>
        <p className="text-sm opacity-75 mt-2">
          Importa transacciones desde un archivo Excel con las columnas: 
          Fecha, Status, Cliente, Depositos, Comision Banco, TASA, COMPRA $, Operador, Ganancia en bs, Ganancia en Dolar, Tasa Venta
        </p>
      </div>

      <FiltrosPorCobrar
        temaActual={temaActual}
        filtrosPorCobrar={filtrosPorCobrar}
        setFiltrosPorCobrar={setFiltrosPorCobrar}
        clientesUnicos={clientesUnicos}
        operadoresUnicos={operadoresUnicos}
        limpiarFiltros={limpiarFiltros}
      />

      <ResumenPorCliente
        temaActual={temaActual}
        resumenClientes={resumenClientes}
      />

      <DetalleTransacciones
        temaActual={temaActual}
        comprasFiltradas={comprasFiltradas}
        handleCambiarStatus={handleCambiarStatus}
      />
    </div>
  );
};

export default PorCobrar;