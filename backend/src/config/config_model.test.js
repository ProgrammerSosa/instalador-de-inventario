const test = require('node:test');
const assert = require('node:assert/strict');
const { crearConexion } = require('../../config/database');
const { crearConfigModel } = require('./config_model');

function setup() {
  const db = crearConexion(':memory:');
  return { model: crearConfigModel(db) };
}

test('obtener devuelve null si la clave no existe', () => {
  const { model } = setup();
  assert.equal(model.obtener('ultimo_respaldo_fecha'), null);
});

test('guardar crea el valor, y volver a guardar lo actualiza', () => {
  const { model } = setup();
  model.guardar('ultimo_respaldo_fecha', '2026-09-21 10:00:00');
  assert.equal(model.obtener('ultimo_respaldo_fecha'), '2026-09-21 10:00:00');

  model.guardar('ultimo_respaldo_fecha', '2026-09-22 08:30:00');
  assert.equal(model.obtener('ultimo_respaldo_fecha'), '2026-09-22 08:30:00');
});

test('claves distintas no se pisan entre si', () => {
  const { model } = setup();
  model.guardar('a', '1');
  model.guardar('b', '2');
  assert.equal(model.obtener('a'), '1');
  assert.equal(model.obtener('b'), '2');
});
