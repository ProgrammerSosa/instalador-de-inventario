const test = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler } = require('./errorHandler');

function crearResFalso() {
  return {
    _status: null,
    _body: null,
    status(codigo) { this._status = codigo; return this; },
    json(body) { this._body = body; return this; }
  };
}

test('usa err.status si esta definido', () => {
  const res = crearResFalso();
  const err = new Error('no encontrado');
  err.status = 404;
  errorHandler(err, {}, res, () => {});
  assert.equal(res._status, 404);
  assert.deepEqual(res._body, { ok: false, error: 'no encontrado' });
});

test('usa 500 por default si err.status no esta definido', () => {
  const res = crearResFalso();
  const err = new Error('boom');
  errorHandler(err, {}, res, () => {});
  assert.equal(res._status, 500);
  assert.deepEqual(res._body, { ok: false, error: 'boom' });
});
