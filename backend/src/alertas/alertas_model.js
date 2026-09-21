function construirAlertas(productosBajoStock) {
  return productosBajoStock.map((p) => {
    const agotado = p.stock_actual === 0;
    return {
      tipo: agotado ? 'agotado' : 'bajo-minimo',
      producto_id: p.id,
      producto_nombre: p.nombre,
      categoria: p.categoria,
      stock_actual: p.stock_actual,
      unidad: p.unidad,
      mensaje: agotado
        ? `Atención: ${p.nombre} está agotado, no queda stock. Hay que reponerlo con urgencia.`
        : `Atención: quedan ${p.stock_actual} ${p.unidad} de ${p.nombre}, está bajo el mínimo. Hay que reponer stock.`
    };
  });
}

// ultimoRespaldoFecha viene en formato 'YYYY-MM-DD HH:MM:SS' (hora local, igual
// que el resto de las fechas de la base) o null si nunca se hizo un respaldo.
function construirAlertaRespaldo(ultimoRespaldoFecha, diasLimite = 7, ahora = new Date()) {
  if (!ultimoRespaldoFecha) {
    return {
      tipo: 'respaldo-pendiente',
      mensaje: 'Todavía no hiciste ningún respaldo del inventario.'
    };
  }

  const fecha = new Date(ultimoRespaldoFecha.replace(' ', 'T'));
  const dias = Math.floor((ahora - fecha) / (1000 * 60 * 60 * 24));

  if (dias < diasLimite) return null;

  return {
    tipo: 'respaldo-pendiente',
    mensaje: `Hace ${dias} días que no hacés un respaldo del inventario.`
  };
}

module.exports = { construirAlertas, construirAlertaRespaldo };
