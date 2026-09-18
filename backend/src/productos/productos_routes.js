const express = require('express');

function crearProductosRouter(controller) {
  const router = express.Router();
  router.get('/bajo-stock', controller.bajoStock);
  router.get('/', controller.listar);
  router.post('/', controller.crear);
  router.put('/:id', controller.actualizar);
  router.delete('/:id', controller.eliminar);
  return router;
}

module.exports = { crearProductosRouter };
