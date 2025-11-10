import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransacciones } from './hooks/useTransacciones';
import { useTasas } from './hooks/useTasas';
import { useFiltros } from './hooks/useFiltros';
import { calcularBalance } from './utils/calculos';
import { temas } from './config/temas';



// Componentes
import Login from './components/Auth/Login';
import Loading from './components/Layout/Loading';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import FormTransaccion from './components/Forms/FormTransaccion';
import Dashboard from './components/Dashboard/Dashboard';
import ListaTransacciones from './components/Transacciones/ListaTransacciones';
import PorCobrar from './components/PorCobrar/PorCobrar';
import Ventas from './components/Ventas/Ventas';
import Gastos from './components/Gastos/Gastos';
import Cambios from './components/Cambios/Cambios';
import Graficos from './components/Graficos/Graficos';
import Calendario from './components/Calendario/Calendario';
import Tasas from './components/Tasas/Tasas';
import Temas from './components/Temas/Temas';

function App() {
  const { usuario, cargando } = useAuth();
  const { transacciones, obtenerMesesDisponibles, obtenerCompras, obtenerClientesUnicos, obtenerOperadoresUnicos } = useTransacciones(usuario);
  const { tasaVenta, setTasaVenta, tasaCambio, setTasaCambio } = useTasas(usuario);
  const { 
    filtroMes, 
    setFiltroMes, 
    filtrosPorCobrar, 
    setFiltrosPorCobrar, 
    obtenerTransaccionesFiltradas, 
    obtenerComprasFiltradas,
    limpiarFiltrosPorCobrar 
  } = useFiltros();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [vista, setVista] = useState('dashboard');
  const [tema, setTema] = useState('oscuro');
  const temaActual = temas[tema];
  const transaccionesFiltradas = obtenerTransaccionesFiltradas(transacciones);
  const balance = calcularBalance(transacciones);
  const mesesDisponibles = obtenerMesesDisponibles();
  const compras = obtenerCompras();
  const comprasFiltradas = obtenerComprasFiltradas(compras);
  const clientesUnicos = obtenerClientesUnicos();
  const operadoresUnicos = obtenerOperadoresUnicos();

  if (cargando) {
    return <Loading temaActual={temaActual} />;
  }

  if (!usuario) {
    return <Login temaActual={temaActual} />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${temaActual.primario} ${temaActual.texto} p-4`}>
      <div className="max-w-7xl mx-auto">
        
        <Header 
          usuario={usuario}
          balance={balance}
          temaActual={temaActual}
          setMostrarForm={setMostrarForm}
          transacciones={transacciones}
        />

        <Navigation 
          vista={vista}
          setVista={setVista}
          temaActual={temaActual}
        />

        {mostrarForm && (
          <FormTransaccion 
            usuario={usuario}
            tasaVenta={tasaVenta}
            setMostrarForm={setMostrarForm}
          />
        )}

        {vista === 'dashboard' && (
          <Dashboard 
            transacciones={transaccionesFiltradas}
            balance={balance}
            temaActual={temaActual}
            filtroMes={filtroMes}
            setFiltroMes={setFiltroMes}
            mesesDisponibles={mesesDisponibles}
            tasaCambio={tasaCambio}
          />
        )}

        {vista === 'transacciones' && (
          <ListaTransacciones 
            transacciones={transaccionesFiltradas}
            temaActual={temaActual}
          />
        )}

        {vista === 'porCobrar' && (
          <PorCobrar 
            comprasFiltradas={comprasFiltradas}
            temaActual={temaActual}
            filtrosPorCobrar={filtrosPorCobrar}
            setFiltrosPorCobrar={setFiltrosPorCobrar}
            clientesUnicos={clientesUnicos}
            operadoresUnicos={operadoresUnicos}
            limpiarFiltros={limpiarFiltrosPorCobrar}
            usuario={usuario}          
            compras={compras}  // ← AGREGAR TODAS LAS COMPRAS
          />
        )}

        {vista === 'ventas' && (
          <Ventas 
            transacciones={transacciones}
            temaActual={temaActual}
            usuario={usuario}
          />
        )}
        
        {vista === 'gastos' && (
          <Gastos 
            transacciones={transacciones}
            temaActual={temaActual}
            usuario={usuario}
            tasaVenta={tasaVenta}
          />
        )}

        {vista === 'cambios' && (
          <Cambios 
            usuario={usuario}
            temaActual={temaActual}
            transacciones={transacciones}
          />
        )}

        {vista === 'graficos' && (
          <Graficos 
            transacciones={transaccionesFiltradas}
            temaActual={temaActual}
            tasaCambio={tasaCambio}
          />
        )}

        {vista === 'calendario' && (
          <Calendario 
            transacciones={transaccionesFiltradas}
            temaActual={temaActual}
          />
        )}

        {vista === 'tasas' && (
          <Tasas 
            usuario={usuario}
            temaActual={temaActual}
            tasaCambio={tasaCambio}
            setTasaCambio={setTasaCambio}
            tasaVenta={tasaVenta}
            setTasaVenta={setTasaVenta}
          />
        )}

        {vista === 'temas' && (
          <Temas 
            temaActual={temaActual}
            tema={tema}
            setTema={setTema}
          />
        )}

      </div>
    </div>
  );
}

export default App;