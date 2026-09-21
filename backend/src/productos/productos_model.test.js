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
  assert.equal(creado.icono, 'Package');
  const conIconoCustom = model.create({ nombre: 'Cuaderno', categoria: 'Librería', icono: 'Book' });
  assert.equal(conIconoCustom.icono, 'Book');
  const actualizado = model.update(creado.id, { icono: 'Pencil' });
  assert.equal(actualizado.icono, 'Pencil');
});

test('getBajoStock filtra por categoria', () => {
  const { model } = setup();
  model.create({ nombre: 'Bajo Libreria', categoria: 'Librería', stock_actual: 1, stock_minimo: 5 });
  model.create({ nombre: 'Bajo Limpieza', categoria: 'Limpieza', stock_actual: 1, stock_minimo: 5 });
  const soloLimpieza = model.getBajoStock('Limpieza');
  assert.equal(soloLimpieza.length, 1);
  assert.equal(soloLimpieza[0].nombre, 'Bajo Limpieza');
});

test('un producto nuevo esta activo por defecto y aparece en getAll', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  assert.equal(creado.activo, 1);
  assert.equal(model.getAll().length, 1);
});

test('archivar un producto (activo=false) lo saca de getAll y getBajoStock, pero sigue en getById', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 1, stock_minimo: 5 });
  const archivado = model.update(creado.id, { activo: false });
  assert.equal(archivado.activo, 0);
  assert.equal(model.getAll().length, 0);
  assert.equal(model.getBajoStock().length, 0);
  assert.notEqual(model.getById(creado.id), null);
});

test('archivar un producto con movimientos funciona aunque remove() lo rechace', () => {
  const { db, model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  db.prepare(`INSERT INTO movimientos (producto_id, tipo, cantidad) VALUES (?, 'entrada', 1)`).run(creado.id);
  assert.throws(() => model.remove(creado.id), /movimientos registrados/);
  const archivado = model.update(creado.id, { activo: false });
  assert.equal(archivado.activo, 0);
  assert.equal(model.getAll().length, 0);
});

test('create acepta imagen, y update la puede cambiar o borrar', () => {
  const { model } = setup();
  const sinImagen = model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  assert.equal(sinImagen.imagen, null);
  const conImagen = model.create({ nombre: 'Trapo', categoria: 'Limpieza', imagen: 'data:image/jpeg;base64,abc123' });
  assert.equal(conImagen.imagen, 'data:image/jpeg;base64,abc123');
  const actualizado = model.update(conImagen.id, { imagen: 'data:image/jpeg;base64,def456' });
  assert.equal(actualizado.imagen, 'data:image/jpeg;base64,def456');
  const sinImagenDeNuevo = model.update(conImagen.id, { imagen: null });
  assert.equal(sinImagenDeNuevo.imagen, null);
});
