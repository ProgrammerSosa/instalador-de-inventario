const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');
const { ok } = require('./utils/httpResponses');
const { crearProductosModel } = require('./src/productos/productos_model');
const { crearProductosController } = require('./src/productos/productos_controller');
const { crearProductosRouter } = require('./src/productos/productos_routes');
const { crearMovimientosModel } = require('./src/movimientos/movimientos_model');
const { crearMovimientosController } = require('./src/movimientos/movimientos_controller');
const { crearMovimientoRegistroRouter, crearMovimientosRouter } = require('./src/movimientos/movimientos_routes');
const { crearAlertasController } = require('./src/alertas/alertas_controller');
const { crearAlertasRouter } = require('./src/alertas/alertas_routes');

function crearApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' })); // 2mb: las fotos de producto van en base64 dentro del JSON

  app.get('/health', (req, res) => {
    ok(res, { status: 'up' });
  });

  const productosModel = crearProductosModel(db);
  const productosController = crearProductosController(productosModel);
  app.use('/api/productos', crearProductosRouter(productosController));

  const movimientosModel = crearMovimientosModel(db);
  const movimientosController = crearMovimientosController(movimientosModel);
  app.use('/api/productos/:id/movimiento', crearMovimientoRegistroRouter(movimientosController));
  app.use('/api/movimientos', crearMovimientosRouter(movimientosController));

  const alertasController = crearAlertasController(productosModel);
  app.use('/api/alertas', crearAlertasRouter(alertasController));

  app.use((req, res, next) => {
    const err = new Error('Ruta no encontrada');
    err.status = 404;
    next(err);
  });

  app.use(errorHandler);

  return app;
}

module.exports = { crearApp };
