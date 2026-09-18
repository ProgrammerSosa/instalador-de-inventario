const test = require('node:test');
const assert = require('node:assert/strict');
const { crearConexion } = require('./database');

test('crearConexion crea las tablas productos y movimientos', () => {
  const db = crearConexion(':memory:');
  const tablas = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  ).all().map(r => r.name);
  assert.ok(tablas.includes('productos'));
  assert.ok(tablas.includes('movimientos'));
  db.close();
});

test('la tabla productos rechaza una categoria invalida', () => {
  const db = crearConexion(':memory:');
  assert.throws(() => {
    db.prepare(`INSERT INTO productos (nombre, categoria) VALUES (?, ?)`).run('Test', 'Cocina');
  }, /CHECK constraint failed/);
  db.close();
});

test('la tabla movimientos rechaza cantidad <= 0', () => {
  const db = crearConexion(':memory:');
  db.prepare(`INSERT INTO productos (nombre, categoria) VALUES (?, ?)`).run('Test', 'Librería');
  assert.throws(() => {
    db.prepare(`INSERT INTO movimientos (producto_id, tipo, cantidad) VALUES (1, 'entrada', 0)`).run();
  }, /CHECK constraint failed/);
  db.close();
});
