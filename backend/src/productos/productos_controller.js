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
