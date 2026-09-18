const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');

function crearApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ ok: true, data: { status: 'up' } });
  });

  // Las tareas siguientes montan acá sus routers (app.use('/api/...', ...))
  // SIEMPRE antes de errorHandler — Express solo captura errores de rutas
  // registradas ANTES del middleware de 4 argumentos.

  app.use(errorHandler);

  return app;
}

module.exports = { crearApp };
