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

module.exports = { construirAlertas };
