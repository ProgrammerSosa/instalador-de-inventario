const test = require('node:test');
const assert = require('node:assert/strict');
const { crearConexion } = require('../../config/database');
const { crearProductosModel } = require('../productos/productos_model');
const { crearMovimientosModel } = require('./movimientos_model');

function setup() {
  const db = crearConexion(':memory:');
  return { db, productos: crearProductosModel(db), movimientos: crearMovimientosModel(db) };
}

test('una entrada suma al stock_actual', () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10 });
  movimientos.registrar({ producto_id: p.id, tipo: 'entrada', cantidad: 5 });
  assert.equal(productos.getById(p.id).stock_actual, 15);
});

test('una salida resta del stock_actual', () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10 });
  movimientos.registrar({ producto_id: p.id, tipo: 'salida', cantidad: 4 });
  assert.equal(productos.getById(p.id).stock_actual, 6);
});

test('una salida que deja el stock en negativo se rechaza y no modifica nada', () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 3 });
  assert.throws(
    () => movimientos.registrar({ producto_id: p.id, tipo: 'salida', cantidad: 5 }),
    /No hay stock suficiente/
  );
  assert.equal(productos.getById(p.id).stock_actual, 3);
  assert.equal(movimientos.listar().length, 0);
});

test('registrar contra un producto inexistente lanza error', () => {
  const { movimientos } = setup();
  assert.throws(
    () => movimientos.registrar({ producto_id: 999, tipo: 'entrada', cantidad: 1 }),
    /Producto no encontrado/
  );
});

test('listar devuelve los mas recientes primero, con nombre y categoria del producto', () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10 });
  movimientos.registrar({ producto_id: p.id, tipo: 'entrada', cantidad: 5 });
  movimientos.registrar({ producto_id: p.id, tipo: 'salida', cantidad: 2 });
  const lista = movimientos.listar();
  assert.equal(lista.length, 2);
  assert.equal(lista[0].tipo, 'salida');
  assert.equal(lista[0].producto_nombre, 'Papel A4');
  assert.equal(lista[0].producto_categoria, 'Librería');
});

test('listar filtra por producto_id', () => {
  const { productos, movimientos } = setup();
  const p1 = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10 });
  const p2 = productos.create({ nombre: 'Detergente', categoria: 'Limpieza', stock_actual: 10 });
  movimientos.registrar({ producto_id: p1.id, tipo: 'entrada', cantidad: 1 });
  movimientos.registrar({ producto_id: p2.id, tipo: 'entrada', cantidad: 1 });
  const soloP1 = movimientos.listar({ producto_id: p1.id });
  assert.equal(soloP1.length, 1);
  assert.equal(soloP1[0].producto_id, p1.id);
});
