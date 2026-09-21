function crearConfigModel(db) {
  const stmtObtener = db.prepare(`SELECT valor FROM app_config WHERE clave = ?`);
  const stmtGuardar = db.prepare(
    `INSERT INTO app_config (clave, valor) VALUES (@clave, @valor)
     ON CONFLICT(clave) DO UPDATE SET valor = @valor`
  );

  return {
    obtener(clave) {
      const fila = stmtObtener.get(clave);
      return fila ? fila.valor : null;
    },

    guardar(clave, valor) {
      stmtGuardar.run({ clave, valor });
    }
  };
}

module.exports = { crearConfigModel };
