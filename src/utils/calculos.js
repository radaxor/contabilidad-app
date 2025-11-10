
// ========================================
// FUNCIONES DE CÁLCULO PARA EL SISTEMA
// ========================================

/**
 * Calcula el balance general del dashboard
 * SOLO cuenta transacciones NUEVAS (no importadas)
 */
export const calcularBalance = (transacciones) => {
  let usd = 0, usdt = 0, bs = 0;

   // ⭐ FILTRAR: Solo transacciones NO importadas para el dashboard
  const transaccionesNuevas = transacciones.filter(t => !t.importado);
  transaccionesNuevas.forEach(t => { 
    const monto = parseFloat(t.monto) || 0;
    const total = parseFloat(t.total) || 0;

    if (t.tipo === 'Venta') {
       // VENTA: Restar USDT de Binance y Sumar Bs recibidos
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

/**
 * Calcular balance considerando transacciones importadas
 * Esta función maneja el balance para módulos que muestran TODO
 */
export const calcularBalanceConImportacion = (transacciones) => {
  let usd = 0, usdt = 0, bs = 0;
  
  transacciones.forEach(t => {
    if (t.importado && t.importadoDesde === 'compras') {
      // **COMPRAS IMPORTADAS DEL EXCEL:**
      // - Ganancia en Dolar → Se SUMA al balance USD
      usd += t.gananciaDolar || 0;
      // - Depositos (compraBs) → Se RESTA del balance Bs
      bs -= t.compraBs || 0;
      
    } else if (t.importado && t.importadoDesde === 'gastos') {
      // **GASTOS IMPORTADOS DEL EXCEL:**
      // - Se resta del balance USDT (Binance)
      usdt -= t.gastoDolar || t.monto || 0;
      
    } else if (t.importado && t.importadoDesde === 'ventas') {
      // ⭐⭐⭐ **VENTAS IMPORTADAS DEL EXCEL:**
      // - Se RESTA USDT de Binance
      const montoUSDT = parseFloat(t.montoUSDT) || parseFloat(t.monto) || 0;
      usdt -= montoUSDT;
      
      // - Se SUMA Bs recibidos
      const montoBs = parseFloat(t.montoBs) || 0;
      bs += montoBs;
      
    } else if (t.importado && t.importadoDesde === 'cambios') {
      // ⭐⭐⭐ **CAMBIOS USD → USDT IMPORTADOS:**
      // - Se RESTA USD (porque se cambió)
      const montoUSD = parseFloat(t.montoUSD) || 0;
      usd -= montoUSD;
      
      // - Se SUMA USDT (recibido después del cambio)
      const montoUSDT = parseFloat(t.montoUSDT) || 0;
      usdt += montoUSDT;
      
    } else {
      // **TRANSACCIONES NORMALES (creadas en la app):**
      let m = parseFloat(t.monto) || 0;
      if (t.tipo === 'Gasto' || t.tipo === 'Compra') m = -Math.abs(m);
      
      if (t.moneda === 'USD') usd += m;
      else if (t.moneda === 'USDT') usdt += m;
      else if (t.moneda === 'BS' || t.moneda === 'Bs') bs += m;
    }
  });
  
  return { usd, usdt, bs };
};

// --- Conversión y totales ---
export function calcularBalanceGeneral({ divisaUsd=0, binanceUsd=0, balanceBs=0, tasaVenta=0 }) {
  const t = Number(tasaVenta) || 0;
  const bsToUsd = t > 0 ? (Number(balanceBs)||0) / t : 0;
  const totalUsd = (Number(divisaUsd)||0) + (Number(binanceUsd)||0) + bsToUsd;
  return { bsToUsd, totalUsd };
}

export function fmtMoney(num, currency='USD', locale='es-VE') {
  const n = Number(num) || 0;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
}

export function fmtNumber(num, locale='es-VE') {
  const n = Number(num) || 0;
  return new Intl.NumberFormat(locale).format(n);
}

// ========================================
// FUNCIONES DE ESTADÍSTICAS PARA CAMBIOS
// ========================================

/**
 * Calcula estadísticas completas de cambios USD → USDT
 */
export const calcularEstadisticasCambios = (transacciones) => {
  // Filtrar solo transacciones de cambios
  const cambios = transacciones.filter(t => 
    t.tipo === 'Cambio' && t.importadoDesde === 'cambios'
  );

  if (cambios.length === 0) {
    return null;
  }

  // Calcular totales
  let totalUSD = 0;
  let totalUSDT = 0;
  let totalComision = 0;
  let cambioMasAlto = { monto: 0 };
  let cambioMasBajo = { monto: Infinity };
  let mejorTasa = { tasa: 0 };
  let peorTasa = { tasa: Infinity };
  
  const cambiosPorFecha = {};
  const cambiosPorUsuario = {};

  cambios.forEach(c => {
    const usd = parseFloat(c.montoUSD) || 0;
    const usdt = parseFloat(c.montoUSDT) || 0;
    const comision = parseFloat(c.comision) || 0;
    const tasa = parseFloat(c.tasaCambio) || 0;
    const usuario = c.usuarioCambiador || 'Sin especificar';

    // Totales
    totalUSD += usd;
    totalUSDT += usdt;
    totalComision += comision;

    // Cambio más alto y más bajo
    if (usd > cambioMasAlto.monto) {
      cambioMasAlto = { ...c, monto: usd };
    }
    if (usd < cambioMasBajo.monto && usd > 0) {
      cambioMasBajo = { ...c, monto: usd };
    }

    // Mejor y peor tasa
    if (tasa > mejorTasa.tasa) {
      mejorTasa = { ...c, tasa };
    }
    if (tasa < peorTasa.tasa && tasa > 0) {
      peorTasa = { ...c, tasa };
    }

    // Cambios por fecha
    const fecha = c.fecha;
    if (!cambiosPorFecha[fecha]) {
      cambiosPorFecha[fecha] = { cantidad: 0, totalUSD: 0 };
    }
    cambiosPorFecha[fecha].cantidad++;
    cambiosPorFecha[fecha].totalUSD += usd;

    // Cambios por usuario
    if (!cambiosPorUsuario[usuario]) {
      cambiosPorUsuario[usuario] = { cantidad: 0, totalUSD: 0, totalUSDT: 0 };
    }
    cambiosPorUsuario[usuario].cantidad++;
    cambiosPorUsuario[usuario].totalUSD += usd;
    cambiosPorUsuario[usuario].totalUSDT += usdt;
  });

  // Encontrar día con más cambios
  let diaConMasCambios = { fecha: '', cantidad: 0, totalUSD: 0 };
  Object.entries(cambiosPorFecha).forEach(([fecha, datos]) => {
    if (datos.cantidad > diaConMasCambios.cantidad) {
      diaConMasCambios = { fecha, ...datos };
    }
  });

  // Promedio de comisión
  const promedioComision = totalUSD > 0 ? (totalComision / totalUSD) * 100 : 0;

  // Usuario que más cambió
  let usuarioTop = { nombre: '', totalUSD: 0, cantidad: 0 };
  Object.entries(cambiosPorUsuario).forEach(([nombre, datos]) => {
    if (datos.totalUSD > usuarioTop.totalUSD) {
      usuarioTop = { nombre, ...datos };
    }
  });

  return {
    totalCambios: cambios.length,
    totalUSD,
    totalUSDT,
    totalComision,
    promedioComision,
    cambioMasAlto,
    cambioMasBajo,
    mejorTasa,
    peorTasa,
    diaConMasCambios,
    usuarioTop,
    cambiosPorFecha,
    cambiosPorUsuario,
    tasaPromedioGeneral: totalUSD > 0 ? totalUSDT / totalUSD : 1
  };
};

/**
 * Obtiene el resumen mensual de cambios
 */
export const obtenerResumenMensualCambios = (transacciones) => {
  const cambios = transacciones.filter(t => 
    t.tipo === 'Cambio' && t.importadoDesde === 'cambios'
  );

  const resumenPorMes = {};

  cambios.forEach(c => {
    const fecha = c.fecha || '';
    const [año, mes] = fecha.split('-');
    const claveMes = `${año}-${mes}`;

    if (!resumenPorMes[claveMes]) {
      resumenPorMes[claveMes] = {
        cantidad: 0,
        totalUSD: 0,
        totalUSDT: 0,
        totalComision: 0
      };
    }

    resumenPorMes[claveMes].cantidad++;
    resumenPorMes[claveMes].totalUSD += parseFloat(c.montoUSD) || 0;
    resumenPorMes[claveMes].totalUSDT += parseFloat(c.montoUSDT) || 0;
    resumenPorMes[claveMes].totalComision += parseFloat(c.comision) || 0;
  });

  return Object.entries(resumenPorMes)
    .sort((a, b) => b[0].localeCompare(a[0])) // Ordenar de más reciente a más antiguo
    .map(([mes, datos]) => ({ mes, ...datos }));
};