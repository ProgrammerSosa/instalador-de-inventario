const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');
const { crearProductosModel } = require('./src/productos/productos_model');
const { crearProductosController } = require('./src/productos/productos_controller');
const { crearProductosRouter } = require('./src/productos/productos_routes');

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

  app.use(errorHandler);

  return app;
}

module.exports = { crearApp };
