const { ok } = require('../../utils/httpResponses');
const { construirAlertas } = require('./alertas_model');

function crearAlertasController(productosModel) {
  return {
    listar(req, res) {
      const productos = [...productosModel.getBajoStock('Librería'), ...productosModel.getBajoStock('Limpieza')];
      ok(res, construirAlertas(productos));
    }
  };
}

module.exports = { crearAlertasController };
