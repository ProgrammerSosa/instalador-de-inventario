const { ok } = require('../../utils/httpResponses');
const { TIPOS_MOVIMIENTO } = require('../../utils/constants');

function crearMovimientosController(movimientosModel) {
  return {
    listar(req, res) {
      const { producto_id, categoria, desde, hasta } = req.query;
      ok(res, movimientosModel.listar({ producto_id, categoria, desde, hasta }));
    },

    registrar(req, res, next) {
      try {
        const { id } = req.params;
        const { tipo, nota } = req.body;
        const cantidad = Number(req.body.cantidad);

        if (!TIPOS_MOVIMIENTO.includes(tipo)) {
          const err = new Error(`tipo debe ser una de: ${TIPOS_MOVIMIENTO.join(', ')}`);
          err.status = 400;
          throw err;
        }
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          const err = new Error('cantidad debe ser un entero mayor a 0');
          err.status = 400;
          throw err;
        }

        const movimiento = movimientosModel.registrar({ producto_id: id, tipo, cantidad, nota });
        ok(res, movimiento, 201);
      } catch (err) {
        next(err);
      }
    }
  };
}

module.exports = { crearMovimientosController };
