const { ok } = require('../../utils/httpResponses');
const { CATEGORIAS } = require('../../utils/constants');

function crearProductosController(productosModel) {
  return {
    listar(req, res) {
      const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : null;
      ok(res, productosModel.getAll(categoria));
    },

    bajoStock(req, res) {
      const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : null;
      ok(res, productosModel.getBajoStock(categoria));
    },

    crear(req, res, next) {
      try {
        const { categoria, unidad } = req.body;
        const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : req.body.nombre;
        const stock_actual = Number(req.body.stock_actual ?? 0);
        const stock_minimo = Number(req.body.stock_minimo ?? 0);

        if (!nombre || typeof nombre !== 'string') {
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
        const datos = {};

        if (req.body.nombre !== undefined) {
          const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
          if (!nombre) {
            const err = new Error('El nombre no puede estar vacío');
            err.status = 400;
            throw err;
          }
          datos.nombre = nombre;
        }

        if (req.body.stock_minimo !== undefined) {
          const stockMinimoNum = Number(req.body.stock_minimo);
          if (!Number.isInteger(stockMinimoNum) || stockMinimoNum < 0) {
            const err = new Error('stock_minimo debe ser un entero mayor o igual a 0');
            err.status = 400;
            throw err;
          }
          datos.stock_minimo = stockMinimoNum;
        }

        if (req.body.unidad !== undefined) {
          datos.unidad = req.body.unidad;
        }

        const actualizado = productosModel.update(id, datos);
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
        const eliminado = productosModel.remove(id);
        if (!eliminado) {
          const err = new Error('Producto no encontrado');
          err.status = 404;
          throw err;
        }
        ok(res, { id: Number(id) });
      } catch (err) {
        next(err);
      }
    }
  };
}

module.exports = { crearProductosController };
