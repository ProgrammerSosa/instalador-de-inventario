const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

function crearTablas(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL CHECK(categoria IN ('Librería','Limpieza')),
      stock_actual INTEGER NOT NULL DEFAULT 0,
      stock_minimo INTEGER NOT NULL DEFAULT 0,
      unidad TEXT DEFAULT 'unidad',
      icono TEXT DEFAULT 'Package',
      imagen TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now','localtime')),
      updated_at DATETIME DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada','salida')),
      cantidad INTEGER NOT NULL CHECK(cantidad > 0),
      fecha DATETIME DEFAULT (datetime('now','localtime')),
      nota TEXT
    );
  `);
}

function crearConexion(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  crearTablas(db);
  return db;
}

module.exports = { crearConexion, crearTablas };
