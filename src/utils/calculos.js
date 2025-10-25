export const calcularBalance = (transacciones) => {
  let usd = 0, usdt = 0, bs = 0;
  
  transacciones.forEach(t => {
    const monto = parseFloat(t.monto) || 0;
    const total = parseFloat(t.total) || 0;

    if (t.tipo === 'Venta') {
      // NUEVO: Manejo especial para ventas
      const montoUSDT = parseFloat(t.montoUSDT) || monto;
      const montoBs = parseFloat(t.montoBs) || 0;
      
      // Restar USDT de Binance
      usdt -= montoUSDT;
      
      // Sumar Bs a la cuenta destino
      bs += montoBs;
      
    } else if (t.tipo === 'Gasto') {
      // Para gastos, restar según la moneda
      if (t.moneda === 'USD') {
        usd -= Math.abs(monto);
      } else if (t.moneda === 'USDT') {
        usdt -= Math.abs(monto);
      } else if (t.moneda === 'Bs') {
        // Si es en Bs, usar el campo 'total' que tiene el monto original
        bs -= Math.abs(total || monto);
      }
    } 
    else if (t.tipo === 'Compra') {
      // COMPRA: Restar Bs gastados, Sumar USD comprados
      const compraBs = parseFloat(t.compraBs) || 0;
      
      bs -= compraBs;     // Se resta el monto en Bs gastado
      usd += monto;       // Se suma el monto en USD comprado
    } 
    else if (t.tipo === 'Ingreso') {
      // Ingresos suman
      if (t.moneda === 'USD') {
        usd += monto;
      } else if (t.moneda === 'USDT') {
        usdt += monto;
      } else if (t.moneda === 'BS' || t.moneda === 'Bs') {
        bs += monto;
      }
    }
  });
  
  return { usd, usdt, bs };
};



export const calcularPorCategoria = (transacciones, tasaCambio) => {
  const porCat = {};
  
  transacciones.forEach(t => {
    if (!porCat[t.categoria]) porCat[t.categoria] = 0;
    const m = Math.abs(parseFloat(t.monto));
    let montoUSD = m;
    
    if (t.moneda === 'USDT') montoUSD = m * tasaCambio.usdtToUsd;
    if (t.moneda === 'BS') montoUSD = m / tasaCambio.usdToBs;
    
    porCat[t.categoria] += montoUSD;
  });
  
  return Object.entries(porCat).sort((a, b) => b[1] - a[1]);
};

export const calcularResumenMensual = (transacciones, tasaCambio) => {
  const resumen = { ingresos: 0, gastos: 0, compras: 0, ventas: 0 };
  
  transacciones.forEach(t => {
    const m = Math.abs(parseFloat(t.monto));
    let montoUSD = m;
    
    if (t.moneda === 'USDT') montoUSD = m * tasaCambio.usdtToUsd;
    if (t.moneda === 'BS') montoUSD = m / tasaCambio.usdToBs;
    
    if (t.tipo === 'Ingreso') resumen.ingresos += montoUSD;
    else if (t.tipo === 'Gasto') resumen.gastos += montoUSD;
    else if (t.tipo === 'Compra') resumen.compras += montoUSD;
    else if (t.tipo === 'Venta') resumen.ventas += montoUSD;
  });
  
  resumen.balance = resumen.ingresos + resumen.ventas - resumen.gastos - resumen.compras;
  return resumen;
};

export const calcularCompra = (compraBs, tasa, tasaVenta) => {
  const comisionBanco = compraBs * 0.003;
  const compraDolar = tasa > 0 ? compraBs / tasa : 0;
  const gananciaBs = tasa > 0 ? (compraDolar * tasaVenta) - compraBs : 0;
  const gananciaDolar = tasa > 0 ? gananciaBs / tasa : 0;
  
  return { comisionBanco, compraDolar, gananciaBs, gananciaDolar };
};

export const calcularGastoDolar = (total, tasaVenta) => {
  return tasaVenta > 0 ? total / tasaVenta : 0;
};



export const calcularTotalPorCobrar = (compras) => {
  let totalBs = 0;
  let totalUsd = 0;
  let totalGananciaBs = 0;
  let totalGananciaUsd = 0;

  compras.forEach(c => {
    totalBs += c.compraBs || 0;
    totalUsd += c.compraDolar || 0;
    totalGananciaBs += c.gananciaBs || 0;
    totalGananciaUsd += c.gananciaDolar || 0;
  });

  return {
    cantidad: compras.length,
    totalBs,
    totalUsd,
    totalGananciaBs,
    totalGananciaUsd
  };
};

export const obtenerResumenPorCliente = (compras) => {
  const resumen = {};

  compras.forEach(c => {
    if (!resumen[c.cliente]) {
      resumen[c.cliente] = {
        cliente: c.cliente,
        cantidad: 0,
        totalBs: 0,
        totalUsd: 0,
        porCobrar: 0,
        pagado: 0
      };
    }

    resumen[c.cliente].cantidad++;
    resumen[c.cliente].totalBs += c.compraBs || 0;
    resumen[c.cliente].totalUsd += c.compraDolar || 0;

    if (c.status === 'Por Cobrar') {
      resumen[c.cliente].porCobrar += c.compraDolar || 0;
    } else {
      resumen[c.cliente].pagado += c.compraDolar || 0;
    }
  });

  return Object.values(resumen).sort((a, b) => b.totalUsd - a.totalUsd);
};

// Calcular balance considerando transacciones importadas
export const calcularBalanceConImportacion = (transacciones) => {
  let usd = 0, usdt = 0, bs = 0;
  
  transacciones.forEach(t => {
    if (t.importado && t.importadoDesde === 'compras') {
      // **PARA TRANSACCIONES DE COMPRAS IMPORTADAS DEL EXCEL:**
      // - Ganancia en Dolar → Se SUMA al balance USD
      usd += t.gananciaDolar || 0;
      // - Depositos (compraBs) → Se RESTA del balance Bs
      bs -= t.compraBs || 0;
    } else if (t.importado && t.importadoDesde === 'gastos') {
      // **PARA GASTOS IMPORTADOS DEL EXCEL:**
      // - Se resta del balance USDT (Binance)
      usdt -= t.gastoDolar || t.monto || 0;
    } else {
      // **PARA TRANSACCIONES NORMALES (creadas en la app):**
      let m = parseFloat(t.monto) || 0;
      if (t.tipo === 'Gasto' || t.tipo === 'Compra') m = -Math.abs(m);
      
      if (t.moneda === 'USD') usd += m;
      else if (t.moneda === 'USDT') usdt += m;
      else if (t.moneda === 'BS' || t.moneda === 'Bs') bs += m;
    }
  });
  
  return { usd, usdt, bs };
};