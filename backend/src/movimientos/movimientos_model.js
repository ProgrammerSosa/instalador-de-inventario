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
      ORDER BY m.fecha DESC, m.id DESC
    `;
    return db.prepare(sql).all(params);
  }

  return { registrar, listar };
}

module.exports = { crearMovimientosModel };
