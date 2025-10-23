import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export const exportarExcel = (transacciones, email) => {
  const datos = transacciones.map(t => ({
    Fecha: t.fecha,
    Tipo: t.tipo,
    Categoría: t.categoria,
    Descripción: t.descripcion,
    Monto: t.monto,
    Moneda: t.moneda,
    Cuenta: t.cuenta,
    Usuario: t.creadoPor
  }));
  
  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
  XLSX.writeFile(wb, `contabilidad_${email}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportarPDF = (transacciones, email) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Reporte de ${email}`, 20, 20);
  doc.setFontSize(10);
  
  let y = 40;
  transacciones.slice(0, 30).forEach((t) => {
    doc.text(`${t.fecha} - ${t.tipo} - ${t.descripcion} - ${t.monto} ${t.moneda}`, 20, y);
    y += 7;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });
  
  doc.save(`reporte_${email}_${new Date().toISOString().split('T')[0]}.pdf`);
};