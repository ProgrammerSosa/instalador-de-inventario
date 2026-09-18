require('dotenv').config({ quiet: true });
const path = require('path');
const { crearConexion } = require('./config/database');
const { crearApp } = require('./server');

const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'inventario.db');

const db = crearConexion(DB_PATH);
const app = crearApp(db);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend escuchando en http://0.0.0.0:${PORT}`);
});
