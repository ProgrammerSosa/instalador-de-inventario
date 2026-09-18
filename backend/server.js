const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');
const { crearProductosModel } = require('./src/productos/productos_model');
const { crearProductosController } = require('./src/productos/productos_controller');
const { crearProductosRouter } = require('./src/productos/productos_routes');
const { crearMovimientosModel } = require('./src/movimientos/movimientos_model');
const { crearMovimientosController } = require('./src/movimientos/movimientos_controller');
const { crearMovimientoRegistroRouter, crearMovimientosRouter } = require('./src/movimientos/movimientos_routes');

function crearApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ ok: true, data: { status: 'up' } });
  });

  const productosModel = crearProductosModel(db);
  const productosController = crearProductosController(productosModel);
  app.use('/api/productos', crearProductosRouter(productosController));

  const movimientosModel = crearMovimientosModel(db);
  const movimientosController = crearMovimientosController(movimientosModel);
  app.use('/api/productos/:id/movimiento', crearMovimientoRegistroRouter(movimientosController));
  app.use('/api/movimientos', crearMovimientosRouter(movimientosController));

  app.use(errorHandler);

  return app;
}

module.exports = { crearApp };
