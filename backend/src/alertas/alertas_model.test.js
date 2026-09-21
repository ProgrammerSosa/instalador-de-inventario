const test = require('node:test');
const assert = require('node:assert/strict');
const { construirAlertas, construirAlertaRespaldo } = require('./alertas_model');

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

test('construirAlertaRespaldo devuelve alerta si nunca se hizo un respaldo', () => {
  const alerta = construirAlertaRespaldo(null);
  assert.equal(alerta.tipo, 'respaldo-pendiente');
  assert.match(alerta.mensaje, /nunca|Todavía no/);
});

test('construirAlertaRespaldo no avisa si el ultimo respaldo fue hace menos de 7 dias', () => {
  const ahora = new Date('2026-09-21T12:00:00');
  const hace3dias = '2026-09-18 12:00:00';
  assert.equal(construirAlertaRespaldo(hace3dias, 7, ahora), null);
});

test('construirAlertaRespaldo avisa si el ultimo respaldo fue hace 7 dias o mas', () => {
  const ahora = new Date('2026-09-21T12:00:00');
  const hace8dias = '2026-09-13 12:00:00';
  const alerta = construirAlertaRespaldo(hace8dias, 7, ahora);
  assert.equal(alerta.tipo, 'respaldo-pendiente');
  assert.match(alerta.mensaje, /Hace 8 días/);
});
