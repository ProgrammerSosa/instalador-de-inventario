function crearProductosModel(db) {
  const stmtGetAll = db.prepare(
    `SELECT * FROM productos WHERE activo = 1 AND (@categoria IS NULL OR categoria = @categoria) ORDER BY nombre`
  );
  const stmtGetById = db.prepare(`SELECT * FROM productos WHERE id = ?`);
  const stmtGetBajoStock = db.prepare(
    `SELECT * FROM productos WHERE activo = 1 AND stock_actual <= stock_minimo AND (@categoria IS NULL OR categoria = @categoria) ORDER BY nombre`
  );
  const stmtGetArchivados = db.prepare(
    `SELECT * FROM productos WHERE activo = 0 AND (@categoria IS NULL OR categoria = @categoria) ORDER BY nombre`
  );
  const stmtInsert = db.prepare(
    `INSERT INTO productos (nombre, categoria, stock_actual, stock_minimo, unidad, icono, imagen)
     VALUES (@nombre, @categoria, @stock_actual, @stock_minimo, @unidad, @icono, @imagen)`
  );
  const stmtUpdate = db.prepare(
    `UPDATE productos SET nombre = @nombre, stock_minimo = @stock_minimo, unidad = @unidad, icono = @icono, imagen = @imagen, activo = @activo, updated_at = datetime('now','localtime')
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

    getArchivados(categoria = null) {
      return stmtGetArchivados.all({ categoria });
    },

    create({ nombre, categoria, stock_actual = 0, stock_minimo = 0, unidad = 'unidad', icono = 'Package', imagen = null }) {
      const info = stmtInsert.run({ nombre, categoria, stock_actual, stock_minimo, unidad, icono, imagen });
      return model.getById(info.lastInsertRowid);
    },

    update(id, { nombre, stock_minimo, unidad, icono, imagen, activo } = {}) {
      const actual = model.getById(id);
      if (!actual) return null;
      stmtUpdate.run({
        id,
        nombre: nombre ?? actual.nombre,
        stock_minimo: stock_minimo ?? actual.stock_minimo,
        unidad: unidad ?? actual.unidad,
        icono: icono ?? actual.icono,
        imagen: imagen !== undefined ? imagen : actual.imagen,
        activo: (activo ?? actual.activo) ? 1 : 0
      });
      return model.getById(id);
    },

    remove(id) {
      const { total } = stmtContarMovimientos.get(id);
      if (total > 0) {
        const err = new Error('No se puede eliminar un producto con movimientos registrados. Podés archivarlo para que no aparezca en el inventario.');
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
