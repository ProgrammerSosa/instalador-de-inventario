const path = require('path');
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
const { crearConfigModel } = require('./src/config/config_model');
const { crearAlertasController } = require('./src/alertas/alertas_controller');
const { crearAlertasRouter } = require('./src/alertas/alertas_routes');

// opciones.staticDir: carpeta del build de React (frontend/dist) a servir.
// Solo Electron la pasa — en desarrollo/tests, crearApp(db) sigue siendo una API pura.
function crearApp(db, opciones = {}) {
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

  const configModel = crearConfigModel(db);
  const alertasController = crearAlertasController(productosModel, configModel);
  app.use('/api/alertas', crearAlertasRouter(alertasController));

  if (opciones.staticDir) {
    app.use(express.static(opciones.staticDir));
    // Cualquier ruta que no sea /api/* ni /health es una pantalla de React
    // (el ruteo real lo maneja react-router del lado del navegador).
    app.get(/^\/(?!api\/|health).*/, (req, res) => {
      res.sendFile(path.join(opciones.staticDir, 'index.html'));
    });
  }

  app.use((req, res, next) => {
    const err = new Error('Ruta no encontrada');
    err.status = 404;
    next(err);
  });

  app.use(errorHandler);

  return app;
}

module.exports = { crearApp };
