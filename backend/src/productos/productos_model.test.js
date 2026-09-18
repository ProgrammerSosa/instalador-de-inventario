const test = require('node:test');
const assert = require('node:assert/strict');
const { crearConexion } = require('../../config/database');
const { crearProductosModel } = require('./productos_model');

function setup() {
  const db = crearConexion(':memory:');
  return { db, model: crearProductosModel(db) };
}

test('create + getAll devuelve el producto creado', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10, stock_minimo: 5 });
  assert.equal(creado.nombre, 'Papel A4');
  assert.equal(creado.stock_actual, 10);
  assert.equal(model.getAll().length, 1);
});

test('getAll filtra por categoria', () => {
  const { model } = setup();
  model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  model.create({ nombre: 'Detergente', categoria: 'Limpieza' });
  const soloLimpieza = model.getAll('Limpieza');
  assert.equal(soloLimpieza.length, 1);
  assert.equal(soloLimpieza[0].nombre, 'Detergente');
});

test('getBajoStock solo devuelve productos en o bajo el minimo', () => {
  const { model } = setup();
  model.create({ nombre: 'Bajo', categoria: 'Librería', stock_actual: 2, stock_minimo: 5 });
  model.create({ nombre: 'Justo', categoria: 'Librería', stock_actual: 5, stock_minimo: 5 });
  model.create({ nombre: 'OK', categoria: 'Librería', stock_actual: 10, stock_minimo: 5 });
  const bajos = model.getBajoStock().map(p => p.nombre).sort();
  assert.deepEqual(bajos, ['Bajo', 'Justo']);
});

test('update modifica nombre, stock_minimo y unidad', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería', stock_minimo: 5 });
  const actualizado = model.update(creado.id, { nombre: 'Papel Oficio', stock_minimo: 8 });
  assert.equal(actualizado.nombre, 'Papel Oficio');
  assert.equal(actualizado.stock_minimo, 8);
});

test('update devuelve null si el producto no existe', () => {
  const { model } = setup();
  assert.equal(model.update(999, { nombre: 'X' }), null);
});

test('remove elimina un producto sin movimientos', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  assert.equal(model.remove(creado.id), true);
  assert.equal(model.getById(creado.id), null);
});

test('remove rechaza eliminar un producto con movimientos', () => {
  const { db, model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  db.prepare(`INSERT INTO movimientos (producto_id, tipo, cantidad) VALUES (?, 'entrada', 1)`).run(creado.id);
  assert.throws(() => model.remove(creado.id), /movimientos registrados/);
});

test('create usa icono por defecto si no se especifica, y update lo puede cambiar', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  assert.equal(creado.icono, '📦');
  const conIconoCustom = model.create({ nombre: 'Cuaderno', categoria: 'Librería', icono: '📓' });
  assert.equal(conIconoCustom.icono, '📓');
  const actualizado = model.update(creado.id, { icono: '📝' });
  assert.equal(actualizado.icono, '📝');
});

test('getBajoStock filtra por categoria', () => {
  const { model } = setup();
  model.create({ nombre: 'Bajo Libreria', categoria: 'Librería', stock_actual: 1, stock_minimo: 5 });
  model.create({ nombre: 'Bajo Limpieza', categoria: 'Limpieza', stock_actual: 1, stock_minimo: 5 });
  const soloLimpieza = model.getBajoStock('Limpieza');
  assert.equal(soloLimpieza.length, 1);
  assert.equal(soloLimpieza[0].nombre, 'Bajo Limpieza');
});
