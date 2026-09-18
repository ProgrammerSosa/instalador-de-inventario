function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

function error(res, mensaje, status = 400) {
  return res.status(status).json({ ok: false, error: mensaje });
}

module.exports = { ok, error };
