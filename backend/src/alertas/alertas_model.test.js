const test = require('node:test');
const assert = require('node:assert/strict');
const { construirAlertas } = require('./alertas_model');

test('clasifica bajo-minimo cuando stock_actual > 0 pero <= stock_minimo', () => {
  const alertas = construirAlertas([
    { id: 1, nombre: 'Papel A4', categoria: 'Librería', stock_actual: 2, stock_minimo: 5, unidad: 'unidad' }
  ]);
  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].tipo, 'bajo-minimo');
  assert.equal(alertas[0].producto_id, 1);
  assert.match(alertas[0].mensaje, /quedan 2 unidad de Papel A4/);
  assert.match(alertas[0].mensaje, /Hay que reponer stock\./);
});

test('clasifica agotado cuando stock_actual es 0', () => {
  const alertas = construirAlertas([
    { id: 2, nombre: 'Detergente', categoria: 'Limpieza', stock_actual: 0, stock_minimo: 3, unidad: 'unidad' }
  ]);
  assert.equal(alertas[0].tipo, 'agotado');
  assert.match(alertas[0].mensaje, /Detergente está agotado, no queda stock/);
  assert.match(alertas[0].mensaje, /con urgencia\./);
});

test('devuelve lista vacia si no hay productos bajo stock', () => {
  assert.deepEqual(construirAlertas([]), []);
});

test('conserva categoria y unidad en cada alerta', () => {
  const alertas = construirAlertas([
    { id: 3, nombre: 'Escoba', categoria: 'Limpieza', stock_actual: 1, stock_minimo: 2, unidad: 'caja' }
  ]);
  assert.equal(alertas[0].categoria, 'Limpieza');
  assert.equal(alertas[0].unidad, 'caja');
  assert.equal(alertas[0].stock_actual, 1);
});
