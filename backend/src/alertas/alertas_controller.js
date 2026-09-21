const { ok } = require('../../utils/httpResponses');
const { construirAlertas, construirAlertaRespaldo } = require('./alertas_model');

function crearAlertasController(productosModel, configModel) {
  return {
    listar(req, res) {
      const productos = [...productosModel.getBajoStock('Librería'), ...productosModel.getBajoStock('Limpieza')];
      const alertas = construirAlertas(productos);

      const ultimoRespaldo = configModel.obtener('ultimo_respaldo_fecha');
      const alertaRespaldo = construirAlertaRespaldo(ultimoRespaldo);
      if (alertaRespaldo) alertas.push(alertaRespaldo);

      ok(res, alertas);
    }
  };
}

module.exports = { crearAlertasController };
