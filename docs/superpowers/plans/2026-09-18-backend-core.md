# Backend Core (Productos y Movimientos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la API REST del backend (productos y movimientos de stock) sobre Express + SQLite, funcionando y verificable de forma independiente — sin frontend ni Electron todavía.

**Architecture:** Capas separadas con inyección de dependencias: `config/database.js` (conexión SQLite pura, sin efectos secundarios) → `*_model.js` (queries SQL, reciben `db` por parámetro) → `*_controller.js` (reciben el model, manejan req/res) → `*_routes.js` (arman el Router de Express) → `server.js` (compone todo en una app Express, recibe `db` por parámetro) → `index.js` (crea la conexión real y levanta el servidor). Esto permite testear los models con una base SQLite en memoria, sin depender de un servidor HTTP corriendo.

**Tech Stack:** Node.js 20+, Express 4, better-sqlite3, `node:test` (test runner nativo de Node, sin dependencias extra).

## Roadmap general (dónde encaja este plan)

Este es el **Plan 1 de 4**:
1. **Backend core** (este plan) — API REST de productos y movimientos.
2. Frontend core (React) — consume esta API.
3. Electron + empaquetado — arma el instalador `.exe`.
4. Alertas (campanita + bot de voz) y Respaldo/Exportación.

Los endpoints de alertas (`GET /api/alertas`), respaldo y exportación a Excel **no** están en este plan — se agregan en el Plan 4, cuando ya exista la tabla `app_config` y el mecanismo de notificaciones. No es un olvido.

## Global Constraints

- Todo el código en CommonJS (`require`/`module.exports`), no ESM — evita fricción con `better-sqlite3` y, más adelante, con Electron.
- Categorías válidas: exactamente `'Librería'` y `'Limpieza'` (con tilde), tal cual en el spec.
- Tipos de movimiento válidos: exactamente `'entrada'` y `'salida'`.
- Todas las respuestas HTTP usan el formato `{ ok: true, data }` o `{ ok: false, error: "mensaje" }`.
- Testing acotado según el spec (`docs/superpowers/specs/2026-09-18-inventario-institucion-design.md`): tests automatizados con `node:test` solo donde vive lógica real (conexión/schema, utils, y sobre todo `productos_model.js` y `movimientos_model.js`). Controllers y rutas se verifican manualmente con `curl` contra el servidor corriendo — no hace falta una suite HTTP completa.
- **No ejecutar `git commit` ni `git push`.** Cada tarea termina con un paso "dejar preparado para commit" que muestra el mensaje sugerido, pero quien ejecute este plan no debe correr esos comandos — el usuario los ejecuta manualmente cuando revisa el cambio.
- Se trabaja directo sobre la rama actual (`master`), sin crear ramas nuevas.

---

### Task 1: Scaffolding del backend

**Files:**
- Create: `backend/package.json` (via `npm init` + `npm install`)
- Create: `backend/.env`
- Create: `backend/.gitignore`

**Interfaces:**
- Consumes: nada (primera tarea).
- Produces: carpeta `backend/` con dependencias instaladas (`express`, `better-sqlite3`, `cors`, `dotenv`), script `npm test` configurado. Las siguientes tareas asumen que `cd backend && npm install <algo>` ya funciona.

- [ ] **Paso 1: Crear la carpeta e inicializar el proyecto**

```bash
mkdir -p "backend"
cd "backend" && npm init -y
```

- [ ] **Paso 2: Instalar dependencias**

```bash
cd "backend" && npm install express better-sqlite3 cors dotenv
```

- [ ] **Paso 3: Agregar el script de test**

Editar `backend/package.json` y dejar la sección `"scripts"` así:

```json
"scripts": {
  "start": "node index.js",
  "test": "node --test"
}
```

- [ ] **Paso 4: Crear `.env`**

Crear `backend/.env`:

```
PORT=4000
```

- [ ] **Paso 5: Crear `.gitignore`**

Crear `backend/.gitignore`:

```
node_modules/
data/
```

(No se ignora `.env` a propósito: no tiene secretos, solo el puerto, y así ambas PCs arrancan con la misma config sin pasos extra.)

- [ ] **Paso 6: Verificar que las dependencias se pueden importar**

```bash
cd "backend" && node -e "require('express'); require('better-sqlite3'); require('cors'); require('dotenv'); console.log('deps ok')"
```

Expected: imprime `deps ok` sin errores.

- [ ] **Paso 7: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `chore: scaffolding inicial del backend`

---

### Task 2: Conexión a la base de datos

**Files:**
- Create: `backend/config/database.js`
- Test: `backend/config/database.test.js`

**Interfaces:**
- Consumes: `better-sqlite3` (Task 1).
- Produces: `crearConexion(dbPath: string) => Database` y `crearTablas(db: Database) => void`, exportados desde `backend/config/database.js`. `dbPath` puede ser `':memory:'` para tests. Todas las tareas siguientes que necesiten una conexión usan `crearConexion`.

- [ ] **Paso 1: Escribir los tests**

Crear `backend/config/database.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearConexion } = require('./database');

test('crearConexion crea las tablas productos y movimientos', () => {
  const db = crearConexion(':memory:');
  const tablas = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  ).all().map(r => r.name);
  assert.ok(tablas.includes('productos'));
  assert.ok(tablas.includes('movimientos'));
  db.close();
});

test('la tabla productos rechaza una categoria invalida', () => {
  const db = crearConexion(':memory:');
  assert.throws(() => {
    db.prepare(`INSERT INTO productos (nombre, categoria) VALUES (?, ?)`).run('Test', 'Cocina');
  }, /CHECK constraint failed/);
  db.close();
});

test('la tabla movimientos rechaza cantidad <= 0', () => {
  const db = crearConexion(':memory:');
  db.prepare(`INSERT INTO productos (nombre, categoria) VALUES (?, ?)`).run('Test', 'Librería');
  assert.throws(() => {
    db.prepare(`INSERT INTO movimientos (producto_id, tipo, cantidad) VALUES (1, 'entrada', 0)`).run();
  }, /CHECK constraint failed/);
  db.close();
});
```

- [ ] **Paso 2: Correr los tests y verificar que fallan**

```bash
cd "backend" && node --test config/database.test.js
```

Expected: FAIL — `Cannot find module './database'`.

- [ ] **Paso 3: Implementar `database.js`**

Crear `backend/config/database.js`:

```js
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada','salida')),
      cantidad INTEGER NOT NULL CHECK(cantidad > 0),
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
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
```

- [ ] **Paso 4: Correr los tests y verificar que pasan**

```bash
cd "backend" && node --test config/database.test.js
```

Expected: 3 tests, 0 fallos.

- [ ] **Paso 5: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: conexion y schema de SQLite (productos, movimientos)`

---

### Task 3: Utilidades (respuestas HTTP y constantes)

**Files:**
- Create: `backend/utils/constants.js`
- Create: `backend/utils/httpResponses.js`
- Test: `backend/utils/httpResponses.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `CATEGORIAS: string[]` y `TIPOS_MOVIMIENTO: string[]` desde `constants.js`; `ok(res, data, status = 200)` y `error(res, mensaje, status = 400)` desde `httpResponses.js`. Todos los controllers de las tareas siguientes usan estas dos funciones para responder.

- [ ] **Paso 1: Escribir el test de httpResponses**

Crear `backend/utils/httpResponses.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { ok, error } = require('./httpResponses');

function crearResFalso() {
  return {
    _status: null,
    _body: null,
    status(codigo) { this._status = codigo; return this; },
    json(body) { this._body = body; return this; }
  };
}

test('ok responde 200 con { ok: true, data } por default', () => {
  const res = crearResFalso();
  ok(res, { id: 1 });
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, { ok: true, data: { id: 1 } });
});

test('ok acepta un status distinto', () => {
  const res = crearResFalso();
  ok(res, { id: 1 }, 201);
  assert.equal(res._status, 201);
});

test('error responde 400 con { ok: false, error } por default', () => {
  const res = crearResFalso();
  error(res, 'algo salió mal');
  assert.equal(res._status, 400);
  assert.deepEqual(res._body, { ok: false, error: 'algo salió mal' });
});

test('error acepta un status distinto', () => {
  const res = crearResFalso();
  error(res, 'no encontrado', 404);
  assert.equal(res._status, 404);
});
```

- [ ] **Paso 2: Correr el test y verificar que falla**

```bash
cd "backend" && node --test utils/httpResponses.test.js
```

Expected: FAIL — `Cannot find module './httpResponses'`.

- [ ] **Paso 3: Implementar `constants.js` y `httpResponses.js`**

Crear `backend/utils/constants.js`:

```js
const CATEGORIAS = ['Librería', 'Limpieza'];
const TIPOS_MOVIMIENTO = ['entrada', 'salida'];

module.exports = { CATEGORIAS, TIPOS_MOVIMIENTO };
```

Crear `backend/utils/httpResponses.js`:

```js
function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

function error(res, mensaje, status = 400) {
  return res.status(status).json({ ok: false, error: mensaje });
}

module.exports = { ok, error };
```

- [ ] **Paso 4: Correr el test y verificar que pasa**

```bash
cd "backend" && node --test utils/httpResponses.test.js
```

Expected: 4 tests, 0 fallos.

- [ ] **Paso 5: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: utilidades de respuestas HTTP y constantes`

---

### Task 4: Manejador global de errores

**Files:**
- Create: `backend/middlewares/errorHandler.js`
- Test: `backend/middlewares/errorHandler.test.js`

**Interfaces:**
- Consumes: `error()` de `utils/httpResponses.js` (Task 3).
- Produces: `errorHandler(err, req, res, next)`, middleware de Express de 4 argumentos. `server.js` (Task 5) lo monta último, después de todas las rutas. Cualquier `Error` con `.status` definido (ej. `err.status = 404`) se traduce a esa respuesta; si no tiene `.status`, responde 500.

- [ ] **Paso 1: Escribir los tests**

Crear `backend/middlewares/errorHandler.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler } = require('./errorHandler');

function crearResFalso() {
  return {
    _status: null,
    _body: null,
    status(codigo) { this._status = codigo; return this; },
    json(body) { this._body = body; return this; }
  };
}

test('usa err.status si esta definido', () => {
  const res = crearResFalso();
  const err = new Error('no encontrado');
  err.status = 404;
  errorHandler(err, {}, res, () => {});
  assert.equal(res._status, 404);
  assert.deepEqual(res._body, { ok: false, error: 'no encontrado' });
});

test('usa 500 por default si err.status no esta definido', () => {
  const res = crearResFalso();
  const err = new Error('boom');
  errorHandler(err, {}, res, () => {});
  assert.equal(res._status, 500);
  assert.deepEqual(res._body, { ok: false, error: 'boom' });
});
```

- [ ] **Paso 2: Correr los tests y verificar que fallan**

```bash
cd "backend" && node --test middlewares/errorHandler.test.js
```

Expected: FAIL — `Cannot find module './errorHandler'`.

- [ ] **Paso 3: Implementar `errorHandler.js`**

Crear `backend/middlewares/errorHandler.js`:

```js
const { error } = require('../utils/httpResponses');

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
  }
  error(res, err.message || 'Error interno', status);
}

module.exports = { errorHandler };
```

- [ ] **Paso 4: Correr los tests y verificar que pasan**

```bash
cd "backend" && node --test middlewares/errorHandler.test.js
```

Expected: 2 tests, 0 fallos.

- [ ] **Paso 5: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: manejador global de errores`

---

### Task 5: Servidor mínimo (`server.js` + `index.js`)

**Files:**
- Create: `backend/server.js`
- Create: `backend/index.js`

**Interfaces:**
- Consumes: `crearConexion` (Task 2), `errorHandler` (Task 4).
- Produces: `crearApp(db) => Express.Application`, exportado desde `server.js`. Las tareas 7 y 9 **modifican** `server.js` para montar sus routers antes de `app.use(errorHandler)`. `index.js` es el punto de entrada real (`npm start`), no lo importa nadie.

- [ ] **Paso 1: Implementar `server.js`**

Crear `backend/server.js`:

```js
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
```

- [ ] **Paso 2: Implementar `index.js`**

Crear `backend/index.js`:

```js
require('dotenv').config();
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
```

- [ ] **Paso 3: Levantar el servidor y verificar manualmente**

En una terminal:

```bash
cd "backend" && node index.js
```

Expected: imprime `Backend escuchando en http://0.0.0.0:4000` y queda corriendo.

En otra terminal:

```bash
curl http://localhost:4000/health
```

Expected: `{"ok":true,"data":{"status":"up"}}`

Dejar el servidor corriendo — las próximas tareas lo siguen usando para verificar con curl. (Si hay que reiniciarlo tras un cambio, `Ctrl+C` y volver a correr `node index.js`.)

- [ ] **Paso 4: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: servidor Express minimo con endpoint de health check`

---

### Task 6: Modelo de productos

**Files:**
- Create: `backend/src/productos/productos_model.js`
- Test: `backend/src/productos/productos_model.test.js`

**Interfaces:**
- Consumes: `crearConexion` (Task 2).
- Produces: `crearProductosModel(db) => { getAll(categoria?), getById(id), getBajoStock(categoria?), create({nombre, categoria, stock_actual?, stock_minimo?, unidad?}), update(id, {nombre?, stock_minimo?, unidad?}), remove(id) }`. `remove(id)` lanza `Error` con `.status = 400` si el producto tiene movimientos. El controller de productos (Task 7) usa exactamente estos seis métodos.

- [ ] **Paso 1: Escribir los tests**

Crear `backend/src/productos/productos_model.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearConexion } = require('../../config/database');
const { crearProductosModel } = require('./productos_model');

function setup() {
  const db = crearConexion(':memory:');
  return { db, model: crearProductosModel(db) };
}

test('create + getAll devuelve el producto creado', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10, stock_minimo: 5 });
  assert.equal(creado.nombre, 'Papel A4');
  assert.equal(creado.stock_actual, 10);
  assert.equal(model.getAll().length, 1);
});

test('getAll filtra por categoria', () => {
  const { model } = setup();
  model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  model.create({ nombre: 'Detergente', categoria: 'Limpieza' });
  const soloLimpieza = model.getAll('Limpieza');
  assert.equal(soloLimpieza.length, 1);
  assert.equal(soloLimpieza[0].nombre, 'Detergente');
});

test('getBajoStock solo devuelve productos en o bajo el minimo', () => {
  const { model } = setup();
  model.create({ nombre: 'Bajo', categoria: 'Librería', stock_actual: 2, stock_minimo: 5 });
  model.create({ nombre: 'Justo', categoria: 'Librería', stock_actual: 5, stock_minimo: 5 });
  model.create({ nombre: 'OK', categoria: 'Librería', stock_actual: 10, stock_minimo: 5 });
  const bajos = model.getBajoStock().map(p => p.nombre).sort();
  assert.deepEqual(bajos, ['Bajo', 'Justo']);
});

test('update modifica nombre, stock_minimo y unidad', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería', stock_minimo: 5 });
  const actualizado = model.update(creado.id, { nombre: 'Papel Oficio', stock_minimo: 8 });
  assert.equal(actualizado.nombre, 'Papel Oficio');
  assert.equal(actualizado.stock_minimo, 8);
});

test('update devuelve null si el producto no existe', () => {
  const { model } = setup();
  assert.equal(model.update(999, { nombre: 'X' }), null);
});

test('remove elimina un producto sin movimientos', () => {
  const { model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  assert.equal(model.remove(creado.id), true);
  assert.equal(model.getById(creado.id), null);
});

test('remove rechaza eliminar un producto con movimientos', () => {
  const { db, model } = setup();
  const creado = model.create({ nombre: 'Papel A4', categoria: 'Librería' });
  db.prepare(`INSERT INTO movimientos (producto_id, tipo, cantidad) VALUES (?, 'entrada', 1)`).run(creado.id);
  assert.throws(() => model.remove(creado.id), /movimientos registrados/);
});
```

- [ ] **Paso 2: Correr los tests y verificar que fallan**

```bash
cd "backend" && node --test src/productos/productos_model.test.js
```

Expected: FAIL — `Cannot find module './productos_model'`.

- [ ] **Paso 3: Implementar `productos_model.js`**

Crear `backend/src/productos/productos_model.js`:

```js
function crearProductosModel(db) {
  const stmtGetAll = db.prepare(
    `SELECT * FROM productos WHERE (@categoria IS NULL OR categoria = @categoria) ORDER BY nombre`
  );
  const stmtGetById = db.prepare(`SELECT * FROM productos WHERE id = ?`);
  const stmtGetBajoStock = db.prepare(
    `SELECT * FROM productos WHERE stock_actual <= stock_minimo AND (@categoria IS NULL OR categoria = @categoria) ORDER BY nombre`
  );
  const stmtInsert = db.prepare(
    `INSERT INTO productos (nombre, categoria, stock_actual, stock_minimo, unidad)
     VALUES (@nombre, @categoria, @stock_actual, @stock_minimo, @unidad)`
  );
  const stmtUpdate = db.prepare(
    `UPDATE productos SET nombre = @nombre, stock_minimo = @stock_minimo, unidad = @unidad, updated_at = CURRENT_TIMESTAMP
     WHERE id = @id`
  );
  const stmtDelete = db.prepare(`DELETE FROM productos WHERE id = ?`);
  const stmtContarMovimientos = db.prepare(`SELECT COUNT(*) AS total FROM movimientos WHERE producto_id = ?`);

  const model = {
    getAll(categoria = null) {
      return stmtGetAll.all({ categoria });
    },

    getById(id) {
      return stmtGetById.get(id) || null;
    },

    getBajoStock(categoria = null) {
      return stmtGetBajoStock.all({ categoria });
    },

    create({ nombre, categoria, stock_actual = 0, stock_minimo = 0, unidad = 'unidad' }) {
      const info = stmtInsert.run({ nombre, categoria, stock_actual, stock_minimo, unidad });
      return model.getById(info.lastInsertRowid);
    },

    update(id, { nombre, stock_minimo, unidad } = {}) {
      const actual = model.getById(id);
      if (!actual) return null;
      stmtUpdate.run({
        id,
        nombre: nombre ?? actual.nombre,
        stock_minimo: stock_minimo ?? actual.stock_minimo,
        unidad: unidad ?? actual.unidad
      });
      return model.getById(id);
    },

    remove(id) {
      const { total } = stmtContarMovimientos.get(id);
      if (total > 0) {
        const err = new Error('No se puede eliminar un producto con movimientos registrados');
        err.status = 400;
        throw err;
      }
      const info = stmtDelete.run(id);
      return info.changes > 0;
    }
  };

  return model;
}

module.exports = { crearProductosModel };
```

- [ ] **Paso 4: Correr los tests y verificar que pasan**

```bash
cd "backend" && node --test src/productos/productos_model.test.js
```

Expected: 7 tests, 0 fallos.

- [ ] **Paso 5: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: modelo de productos (CRUD + bajo-stock)`

---

### Task 7: Controller y rutas de productos

**Files:**
- Create: `backend/src/productos/productos_controller.js`
- Create: `backend/src/productos/productos_routes.js`
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: `crearProductosModel` (Task 6), `ok`/`error` (Task 3), `CATEGORIAS` (Task 3).
- Produces: `crearProductosController(productosModel) => { listar, bajoStock, crear, actualizar, eliminar }` y `crearProductosRouter(controller) => express.Router`. Monta las rutas `GET /`, `GET /bajo-stock`, `POST /`, `PUT /:id`, `DELETE /:id` bajo el prefijo `/api/productos` que se define en `server.js`.

- [ ] **Paso 1: Implementar el controller**

Crear `backend/src/productos/productos_controller.js`:

```js
const { ok } = require('../../utils/httpResponses');
const { CATEGORIAS } = require('../../utils/constants');

function crearProductosController(productosModel) {
  return {
    listar(req, res) {
      const { categoria } = req.query;
      ok(res, productosModel.getAll(categoria || null));
    },

    bajoStock(req, res) {
      const { categoria } = req.query;
      ok(res, productosModel.getBajoStock(categoria || null));
    },

    crear(req, res, next) {
      try {
        const { nombre, categoria, unidad } = req.body;
        const stock_actual = Number(req.body.stock_actual ?? 0);
        const stock_minimo = Number(req.body.stock_minimo ?? 0);

        if (!nombre || !nombre.trim()) {
          const err = new Error('El nombre es obligatorio');
          err.status = 400;
          throw err;
        }
        if (!CATEGORIAS.includes(categoria)) {
          const err = new Error(`categoria debe ser una de: ${CATEGORIAS.join(', ')}`);
          err.status = 400;
          throw err;
        }
        if (!Number.isInteger(stock_actual) || stock_actual < 0) {
          const err = new Error('stock_actual debe ser un entero mayor o igual a 0');
          err.status = 400;
          throw err;
        }
        if (!Number.isInteger(stock_minimo) || stock_minimo < 0) {
          const err = new Error('stock_minimo debe ser un entero mayor o igual a 0');
          err.status = 400;
          throw err;
        }

        const creado = productosModel.create({ nombre, categoria, stock_actual, stock_minimo, unidad });
        ok(res, creado, 201);
      } catch (err) {
        next(err);
      }
    },

    actualizar(req, res, next) {
      try {
        const { id } = req.params;
        if (req.body.stock_minimo !== undefined) {
          const stockMinimoNum = Number(req.body.stock_minimo);
          if (!Number.isInteger(stockMinimoNum) || stockMinimoNum < 0) {
            const err = new Error('stock_minimo debe ser un entero mayor o igual a 0');
            err.status = 400;
            throw err;
          }
          req.body.stock_minimo = stockMinimoNum;
        }
        const actualizado = productosModel.update(id, req.body);
        if (!actualizado) {
          const err = new Error('Producto no encontrado');
          err.status = 404;
          throw err;
        }
        ok(res, actualizado);
      } catch (err) {
        next(err);
      }
    },

    eliminar(req, res, next) {
      try {
        const { id } = req.params;
        productosModel.remove(id);
        ok(res, { id: Number(id) });
      } catch (err) {
        next(err);
      }
    }
  };
}

module.exports = { crearProductosController };
```

- [ ] **Paso 2: Implementar las rutas**

Crear `backend/src/productos/productos_routes.js`:

```js
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
```

- [ ] **Paso 3: Montar el router en `server.js`**

Modificar `backend/server.js`: agregar los `require` arriba del archivo, y montar el router donde está el comentario "Las tareas siguientes montan acá":

```js
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
```

- [ ] **Paso 4: Reiniciar el servidor y verificar manualmente con curl**

Parar el servidor (`Ctrl+C`) y volver a levantarlo:

```bash
cd "backend" && node index.js
```

En otra terminal:

```bash
curl -X POST http://localhost:4000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Papel A4","categoria":"Librería","stock_actual":10,"stock_minimo":5}'
```

Expected: `{"ok":true,"data":{"id":1,"nombre":"Papel A4","categoria":"Librería","stock_actual":10,"stock_minimo":5,...}}`

```bash
curl http://localhost:4000/api/productos
```

Expected: array con ese producto.

```bash
curl -X POST http://localhost:4000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"","categoria":"Librería"}'
```

Expected: status 400, `{"ok":false,"error":"El nombre es obligatorio"}`

- [ ] **Paso 5: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: endpoints CRUD de productos`

---

### Task 8: Modelo de movimientos

**Files:**
- Create: `backend/src/movimientos/movimientos_model.js`
- Test: `backend/src/movimientos/movimientos_model.test.js`

**Interfaces:**
- Consumes: `crearConexion` (Task 2), `crearProductosModel` (Task 6, solo en el test).
- Produces: `crearMovimientosModel(db) => { registrar({producto_id, tipo, cantidad, nota?}), listar({producto_id?, categoria?, desde?, hasta?}) }`. `registrar` corre en una transacción (`db.transaction`): valida que el producto exista, calcula el nuevo stock, y si quedaría negativo lanza `Error` con `.status = 400` **sin escribir nada**. El controller de movimientos (Task 9) usa exactamente estos dos métodos.

- [ ] **Paso 1: Escribir los tests**

Crear `backend/src/movimientos/movimientos_model.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearConexion } = require('../../config/database');
const { crearProductosModel } = require('../productos/productos_model');
const { crearMovimientosModel } = require('./movimientos_model');

function setup() {
  const db = crearConexion(':memory:');
  return { db, productos: crearProductosModel(db), movimientos: crearMovimientosModel(db) };
}

test('una entrada suma al stock_actual', () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10 });
  movimientos.registrar({ producto_id: p.id, tipo: 'entrada', cantidad: 5 });
  assert.equal(productos.getById(p.id).stock_actual, 15);
});

test('una salida resta del stock_actual', () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10 });
  movimientos.registrar({ producto_id: p.id, tipo: 'salida', cantidad: 4 });
  assert.equal(productos.getById(p.id).stock_actual, 6);
});

test('una salida que deja el stock en negativo se rechaza y no modifica nada', () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 3 });
  assert.throws(
    () => movimientos.registrar({ producto_id: p.id, tipo: 'salida', cantidad: 5 }),
    /No hay stock suficiente/
  );
  assert.equal(productos.getById(p.id).stock_actual, 3);
  assert.equal(movimientos.listar().length, 0);
});

test('registrar contra un producto inexistente lanza error', () => {
  const { movimientos } = setup();
  assert.throws(
    () => movimientos.registrar({ producto_id: 999, tipo: 'entrada', cantidad: 1 }),
    /Producto no encontrado/
  );
});

test('listar devuelve los mas recientes primero, con nombre y categoria del producto', () => {
  const { productos, movimientos } = setup();
  const p = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10 });
  movimientos.registrar({ producto_id: p.id, tipo: 'entrada', cantidad: 5 });
  movimientos.registrar({ producto_id: p.id, tipo: 'salida', cantidad: 2 });
  const lista = movimientos.listar();
  assert.equal(lista.length, 2);
  assert.equal(lista[0].tipo, 'salida');
  assert.equal(lista[0].producto_nombre, 'Papel A4');
  assert.equal(lista[0].producto_categoria, 'Librería');
});

test('listar filtra por producto_id', () => {
  const { productos, movimientos } = setup();
  const p1 = productos.create({ nombre: 'Papel A4', categoria: 'Librería', stock_actual: 10 });
  const p2 = productos.create({ nombre: 'Detergente', categoria: 'Limpieza', stock_actual: 10 });
  movimientos.registrar({ producto_id: p1.id, tipo: 'entrada', cantidad: 1 });
  movimientos.registrar({ producto_id: p2.id, tipo: 'entrada', cantidad: 1 });
  const soloP1 = movimientos.listar({ producto_id: p1.id });
  assert.equal(soloP1.length, 1);
  assert.equal(soloP1[0].producto_id, p1.id);
});
```

- [ ] **Paso 2: Correr los tests y verificar que fallan**

```bash
cd "backend" && node --test src/movimientos/movimientos_model.test.js
```

Expected: FAIL — `Cannot find module './movimientos_model'`.

- [ ] **Paso 3: Implementar `movimientos_model.js`**

Crear `backend/src/movimientos/movimientos_model.js`:

```js
function crearMovimientosModel(db) {
  const stmtGetProducto = db.prepare(`SELECT * FROM productos WHERE id = ?`);
  const stmtInsertMovimiento = db.prepare(
    `INSERT INTO movimientos (producto_id, tipo, cantidad, nota) VALUES (@producto_id, @tipo, @cantidad, @nota)`
  );
  const stmtSumarStock = db.prepare(
    `UPDATE productos SET stock_actual = stock_actual + @delta, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
  );
  const stmtGetMovimientoById = db.prepare(`SELECT * FROM movimientos WHERE id = ?`);

  const registrar = db.transaction(({ producto_id, tipo, cantidad, nota }) => {
    const producto = stmtGetProducto.get(producto_id);
    if (!producto) {
      const err = new Error('Producto no encontrado');
      err.status = 404;
      throw err;
    }
    const delta = tipo === 'entrada' ? cantidad : -cantidad;
    const stockResultante = producto.stock_actual + delta;
    if (stockResultante < 0) {
      const err = new Error(`No hay stock suficiente: quedan ${producto.stock_actual} y se intentan sacar ${cantidad}`);
      err.status = 400;
      throw err;
    }
    const info = stmtInsertMovimiento.run({ producto_id, tipo, cantidad, nota: nota ?? null });
    stmtSumarStock.run({ id: producto_id, delta });
    return stmtGetMovimientoById.get(info.lastInsertRowid);
  });

  function listar({ producto_id = null, categoria = null, desde = null, hasta = null } = {}) {
    const condiciones = ['1=1'];
    const params = {};
    if (producto_id) { condiciones.push('m.producto_id = @producto_id'); params.producto_id = producto_id; }
    if (categoria) { condiciones.push('p.categoria = @categoria'); params.categoria = categoria; }
    if (desde) { condiciones.push('m.fecha >= @desde'); params.desde = desde; }
    if (hasta) { condiciones.push('m.fecha <= @hasta'); params.hasta = hasta; }

    const sql = `
      SELECT m.*, p.nombre AS producto_nombre, p.categoria AS producto_categoria
      FROM movimientos m
      JOIN productos p ON p.id = m.producto_id
      WHERE ${condiciones.join(' AND ')}
      ORDER BY m.fecha DESC
    `;
    return db.prepare(sql).all(params);
  }

  return { registrar, listar };
}

module.exports = { crearMovimientosModel };
```

- [ ] **Paso 4: Correr los tests y verificar que pasan**

```bash
cd "backend" && node --test src/movimientos/movimientos_model.test.js
```

Expected: 6 tests, 0 fallos.

- [ ] **Paso 5: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: modelo de movimientos con actualizacion transaccional de stock`

---

### Task 9: Controller y rutas de movimientos

**Files:**
- Create: `backend/src/movimientos/movimientos_controller.js`
- Create: `backend/src/movimientos/movimientos_routes.js`
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: `crearMovimientosModel` (Task 8), `ok`/`error` (Task 3), `TIPOS_MOVIMIENTO` (Task 3).
- Produces: `crearMovimientosController(movimientosModel) => { listar, registrar }`, `crearMovimientoRegistroRouter(controller) => express.Router` (monta `POST /`, se usa bajo `/api/productos/:id/movimiento`) y `crearMovimientosRouter(controller) => express.Router` (monta `GET /`, se usa bajo `/api/movimientos`).

- [ ] **Paso 1: Implementar el controller**

Crear `backend/src/movimientos/movimientos_controller.js`:

```js
const { ok } = require('../../utils/httpResponses');
const { TIPOS_MOVIMIENTO } = require('../../utils/constants');

function crearMovimientosController(movimientosModel) {
  return {
    listar(req, res) {
      const { producto_id, categoria, desde, hasta } = req.query;
      ok(res, movimientosModel.listar({ producto_id, categoria, desde, hasta }));
    },

    registrar(req, res, next) {
      try {
        const { id } = req.params;
        const { tipo, nota } = req.body;
        const cantidad = Number(req.body.cantidad);

        if (!TIPOS_MOVIMIENTO.includes(tipo)) {
          const err = new Error(`tipo debe ser una de: ${TIPOS_MOVIMIENTO.join(', ')}`);
          err.status = 400;
          throw err;
        }
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          const err = new Error('cantidad debe ser un entero mayor a 0');
          err.status = 400;
          throw err;
        }

        const movimiento = movimientosModel.registrar({ producto_id: id, tipo, cantidad, nota });
        ok(res, movimiento, 201);
      } catch (err) {
        next(err);
      }
    }
  };
}

module.exports = { crearMovimientosController };
```

- [ ] **Paso 2: Implementar las rutas**

Crear `backend/src/movimientos/movimientos_routes.js`. Nota: `crearMovimientoRegistroRouter` usa `{ mergeParams: true }` porque se monta dentro de `/api/productos/:id/movimiento` y necesita leer ese `:id` del padre — sin esa opción, `req.params.id` llegaría `undefined` al controller.

```js
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
```

- [ ] **Paso 3: Montar los routers en `server.js`**

Modificar `backend/server.js`:

```js
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
```

- [ ] **Paso 4: Reiniciar el servidor y verificar el flujo completo con curl**

Parar el servidor (`Ctrl+C`) y volver a levantarlo:

```bash
cd "backend" && node index.js
```

Crear un producto y registrar movimientos (asume que es el producto `id=1`; si ya hiciste pruebas en la Task 7, ajustá el id):

```bash
curl -X POST http://localhost:4000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Detergente","categoria":"Limpieza","stock_actual":10,"stock_minimo":5}'
```

```bash
curl -X POST http://localhost:4000/api/productos/1/movimiento \
  -H "Content-Type: application/json" \
  -d '{"tipo":"entrada","cantidad":5,"nota":"compra inicial"}'
```

Expected: `{"ok":true,"data":{"id":1,"producto_id":1,"tipo":"entrada","cantidad":5,"nota":"compra inicial",...}}`

```bash
curl http://localhost:4000/api/movimientos
```

Expected: array con ese movimiento, incluyendo `producto_nombre` y `producto_categoria`.

```bash
curl -X POST http://localhost:4000/api/productos/1/movimiento \
  -H "Content-Type: application/json" \
  -d '{"tipo":"salida","cantidad":9999}'
```

Expected: status 400, error mencionando "No hay stock suficiente".

```bash
curl http://localhost:4000/api/productos/bajo-stock
```

Expected: array vacío o con productos cuyo stock ya esté en o bajo el mínimo, según lo que hayas cargado.

- [ ] **Paso 5: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: endpoint de registro de movimientos e historial`

---

## Checklist final del plan

- [ ] `cd backend && node --test` corre **todos** los tests del proyecto (config, utils, middlewares, ambos models) sin fallos.
- [ ] Con el servidor corriendo (`node index.js`), los 7 endpoints del spec responden como se probó en las Tasks 7 y 9: `GET /api/productos`, `GET /api/productos/bajo-stock`, `POST /api/productos`, `PUT /api/productos/:id`, `DELETE /api/productos/:id`, `POST /api/productos/:id/movimiento`, `GET /api/movimientos`.
- [ ] Nada de esto fue commiteado por el agente — queda para que el usuario revise y commitee.
