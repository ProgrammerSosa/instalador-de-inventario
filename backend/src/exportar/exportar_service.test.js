const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { crearConexion } = require('../../config/database');
const { crearProductosModel } = require('../productos/productos_model');
const { crearMovimientosModel } = require('../movimientos/movimientos_model');
const { generarExcelBuffer } = require('./exportar_service');

function setup() {
  const db = crearConexion(':memory:');
  return { productos: crearProductosModel(db), movimientos: crearMovimientosModel(db) };
}

test('genera un buffer valido con las hojas Productos y Movimientos', async () => {
  const { productos, movimientos } = setup();
  const buffer = await generarExcelBuffer(productos, movimientos);
  assert.ok(buffer.length > 0);

  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer);
  const nombres = libro.worksheets.map((h) => h.name);
  assert.deepEqual(nombres, ['Productos', 'Movimientos']);
});

test('incluye los productos y movimientos reales con sus columnas', async () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10, stock_minimo: 3 });
  movimientos.registrar({ producto_id: p.id, tipo: 'salida', cantidad: 2, nota: 'para el taller' });

  const buffer = await generarExcelBuffer(productos, movimientos);
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer);

  const hojaProductos = libro.getWorksheet('Productos');
  assert.equal(hojaProductos.getRow(1).getCell(1).value, 'Nombre');
  assert.equal(hojaProductos.getRow(2).getCell(1).value, 'Papel A4');
  assert.equal(hojaProductos.getRow(2).getCell(3).value, 8); // stock ya descontado por la salida

  const hojaMovimientos = libro.getWorksheet('Movimientos');
  assert.equal(hojaMovimientos.getRow(2).getCell(2).value, 'Papel A4');
  assert.equal(hojaMovimientos.getRow(2).getCell(4).value, 'salida');
  assert.equal(hojaMovimientos.getRow(2).getCell(6).value, 'para el taller');
});

test('con la base vacia, genera igual un excel valido con solo encabezados', async () => {
  const { productos, movimientos } = setup();
  const buffer = await generarExcelBuffer(productos, movimientos);
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer);
  assert.equal(libro.getWorksheet('Productos').rowCount, 1);
  assert.equal(libro.getWorksheet('Movimientos').rowCount, 1);
});
