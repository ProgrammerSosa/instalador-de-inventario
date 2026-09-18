const express = require('express');

function crearMovimientoRegistroRouter(controller) {
  const router = express.Router({ mergeParams: true });
  router.post('/', controller.registrar);
  return router;
}

function crearMovimientosRouter(controller) {
  const router = express.Router();
  router.get('/', controller.listar);
  return router;
}

module.exports = { crearMovimientoRegistroRouter, crearMovimientosRouter };
