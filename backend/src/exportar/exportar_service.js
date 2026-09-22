const ExcelJS = require('exceljs');

// Arma un .xlsx con dos hojas (productos y movimientos) a partir de los models
// del backend. Devuelve un Buffer listo para escribir a disco — no sabe nada
// de diálogos ni de Electron, eso lo maneja quien la llame.
async function generarExcelBuffer(productosModel, movimientosModel) {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Sistema de Inventario';
  libro.created = new Date();

  const hojaProductos = libro.addWorksheet('Productos');
  hojaProductos.columns = [
    { header: 'Nombre', key: 'nombre', width: 28 },
    { header: 'Categoría', key: 'categoria', width: 14 },
    { header: 'Stock actual', key: 'stock_actual', width: 14 },
    { header: 'Stock mínimo', key: 'stock_minimo', width: 14 },
    { header: 'Unidad', key: 'unidad', width: 12 }
  ];
  hojaProductos.getRow(1).font = { bold: true };
  for (const p of productosModel.getAll()) {
    hojaProductos.addRow({
      nombre: p.nombre,
      categoria: p.categoria,
      stock_actual: p.stock_actual,
      stock_minimo: p.stock_minimo,
      unidad: p.unidad
    });
  }

  
  const hojaMovimientos = libro.addWorksheet('Movimientos');    
  hojaMovimientos.columns = [
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Producto', key: 'producto_nombre', width: 28 },
    { header: 'Categoría', key: 'producto_categoria', width: 14 },
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Cantidad', key: 'cantidad', width: 10 },
    { header: 'Nota', key: 'nota', width: 30 }
  ];
  hojaMovimientos.getRow(1).font = { bold: true };
  for (const m of movimientosModel.listar()) {
    hojaMovimientos.addRow({
      fecha: m.fecha,
      producto_nombre: m.producto_nombre,
      producto_categoria: m.producto_categoria,
      tipo: m.tipo,
      cantidad: m.cantidad,
      nota: m.nota ?? ''
    });
  }

  return libro.xlsx.writeBuffer();
}

module.exports = { generarExcelBuffer };


