const express = require('express');

function crearAlertasRouter(controller) {
  const router = express.Router();
  router.get('/', controller.listar);
  return router;
}

module.exports = { crearAlertasRouter };
