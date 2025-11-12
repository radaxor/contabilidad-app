import React from 'react';
import ImportadorGastos from './ImportadorGastos';
import { db } from '../../services/firebase';

const Gastos = ({ transacciones, temaActual, usuario, tasaVenta }) => {
  // Filtrar solo gastos
  const gastos = transacciones.filter(t => t.tipo === 'Gasto');
  
  console.log('📊 Total de gastos:', gastos.length);
  console.log('📦 Gastos importados:', gastos.filter(g => g.esImportado).length);
  console.log('✍️ Gastos normales:', gastos.filter(g => !g.esImportado).length);

  // ⭐ CALCULAR TOTALES CORRECTAMENTE
  const calcularTotales = () => {
    let totalBs = 0;
    let totalUSD = 0;
    
    gastos.forEach(g => {
      // Sumar Bolívares (campo 'total')
      const bs = parseFloat(g.total) || 0;
      totalBs += bs;
      
      // ⭐ CRÍTICO: Sumar USD usando el campo 'gastoDolar' si existe
      // Si no existe, usar 'monto' como fallback
      const usd = parseFloat(g.gastoDolar) || parseFloat(g.monto) || 0;
      totalUSD += usd;
      
      // Debug para las primeras 5 transacciones
      if (gastos.indexOf(g) < 5) {
        console.log(`Gasto #${gastos.indexOf(g) + 1}:`, {
          descripcion: g.descripcion,
          gastoDolar: g.gastoDolar,
          monto: g.monto,
          total: g.total,
          'USD sumado': usd
        });
      }
    });
    
    console.log('💰 Total USD calculado:', totalUSD);
    console.log('💵 Total Bs calculado:', totalBs);
    
    return {
      totalBs,
      totalUSD,
      promedio: gastos.length > 0 ? totalUSD / gastos.length : 0
    };
  };

  // Calcular total por categoría
  const calcularPorCategoria = () => {
    const porCategoria = {};
    
    gastos.forEach(g => {
      if (!porCategoria[g.categoria]) {
        porCategoria[g.categoria] = {
          categoria: g.categoria,
          totalBs: 0,
          totalDolar: 0,
          cantidad: 0
        };
      }
      
      porCategoria[g.categoria].totalBs += parseFloat(g.total) || 0;
      
      // ⭐ Sumar USD correctamente
      const usd = parseFloat(g.gastoDolar) || parseFloat(g.monto) || 0;
      porCategoria[g.categoria].totalDolar += usd;
      porCategoria[g.categoria].cantidad++;
    });
    
    return Object.values(porCategoria).sort((a, b) => b.totalDolar - a.totalDolar);
  };

  // Limpiar gastos importados
  const limpiarGastosImportados = async () => {
    const confirmar = window.confirm(
      '⚠️ ¿Eliminar TODOS los gastos importados?\n\n' +
      'Esta acción NO se puede deshacer.'
    );

    if (!confirmar) return;

    try {
      const snapshot = await db.collection('transacciones')
        .where('usuarioId', '==', usuario.uid)
        .where('esImportado', '==', true)
        .where('importadoDesde', '==', 'gastos')
        .get();

      if (snapshot.empty) {
        alert('ℹ️ No hay gastos importados para eliminar');
        return;
      }

      const promesas = [];
      snapshot.forEach(doc => {
        promesas.push(db.collection('transacciones').doc(doc.id).delete());
      });

      await Promise.all(promesas);
      
      alert(`✅ Se eliminaron ${snapshot.size} gastos importados.`);
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const totales = calcularTotales();
  const resumenCategorias = calcularPorCategoria();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            💸 Gestión de Gastos
          </h2>
          <p className="text-sm opacity-75">
            Total de gastos: {gastos.length} 
            ({gastos.filter(g => !g.esImportado).length} normales, {gastos.filter(g => g.esImportado).length} importados)
          </p>
        </div>
        
        <div className="flex gap-3">
          <ImportadorGastos usuario={usuario} tasaVenta={tasaVenta} />
          <button
            onClick={limpiarGastosImportados}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            🗑️ Limpiar Importados
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6">
          <p className="text-sm opacity-75 mb-2">Total Gastos</p>
          <p className="text-3xl font-bold">{gastos.length}</p>
          <p className="text-xs opacity-60 mt-1">Transacciones</p>
        </div>
        
        <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-6">
          <p className="text-sm opacity-75 mb-2">Total en Bs</p>
          <p className="text-3xl font-bold">{totales.totalBs.toFixed(2)}</p>
          <p className="text-xs opacity-60 mt-1">Bolívares</p>
        </div>
        
        <div className="bg-pink-500/20 border border-pink-500 rounded-lg p-6">
          <p className="text-sm opacity-75 mb-2">Total en USD</p>
          <p className="text-3xl font-bold">${totales.totalUSD.toFixed(2)}</p>
          <p className="text-xs opacity-60 mt-1">Dólares</p>
        </div>
        
        <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-6">
          <p className="text-sm opacity-75 mb-2">Promedio por Gasto</p>
          <p className="text-3xl font-bold">${totales.promedio.toFixed(2)}</p>
          <p className="text-xs opacity-60 mt-1">USD</p>
        </div>
      </div>

      {/* Gastos por Categoría */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">📊 Gastos por Categoría</h3>
        <div className="space-y-3">
          {resumenCategorias.map((cat, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <p className="font-semibold">{cat.categoria}</p>
                <p className="text-sm opacity-75">{cat.cantidad} gastos</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">${cat.totalDolar.toFixed(2)}</p>
                <p className="text-sm opacity-75">{cat.totalBs.toFixed(2)} Bs</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Gastos Recientes */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">📝 Gastos Recientes</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {gastos
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 20)
            .map((g, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{g.descripcion}</p>
                    {g.esImportado && (
                      <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded">
                        📥 Importado
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-75">
                    {g.fecha} • {g.categoria}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-400">
                    ${(parseFloat(g.gastoDolar) || parseFloat(g.monto) || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-red-300">
                    {(parseFloat(g.total) || 0).toFixed(2)} Bs
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Gastos;