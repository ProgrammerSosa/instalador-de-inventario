const test = require('node:test');
const assert = require('node:assert/strict');
const { ok, error } = require('./httpResponses');

function crearResFalso() {
  return {
    _status: null,
    _body: null,
    status(codigo) { this._status = codigo; return this; },
    json(body) { this._body = body; return this; }
  };
}

test('ok responde 200 con { ok: true, data } por default', () => {
  const res = crearResFalso();
  ok(res, { id: 1 });
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, { ok: true, data: { id: 1 } });
});

test('ok acepta un status distinto', () => {
  const res = crearResFalso();
  ok(res, { id: 1 }, 201);
  assert.equal(res._status, 201);
});

test('error responde 400 con { ok: false, error } por default', () => {
  const res = crearResFalso();
  error(res, 'algo salió mal');
  assert.equal(res._status, 400);
  assert.deepEqual(res._body, { ok: false, error: 'algo salió mal' });
});

test('error acepta un status distinto', () => {
  const res = crearResFalso();
  error(res, 'no encontrado', 404);
  assert.equal(res._status, 404);
});
