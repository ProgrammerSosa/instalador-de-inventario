const API_BASE = 'http://localhost:4000/api';

async function manejarRespuesta(res) {
  const cuerpo = await res.json();
  if (!cuerpo.ok) {
    throw new Error(cuerpo.error || 'Error desconocido');
  }
  return cuerpo.data;
}

export async function getProductos(categoria) {
  const url = categoria ? `${API_BASE}/productos?categoria=${encodeURIComponent(categoria)}` : `${API_BASE}/productos`;
  const res = await fetch(url);
  return manejarRespuesta(res);
}

export async function getBajoStock(categoria) {
  const url = categoria ? `${API_BASE}/productos/bajo-stock?categoria=${encodeURIComponent(categoria)}` : `${API_BASE}/productos/bajo-stock`;
  const res = await fetch(url);
  return manejarRespuesta(res);
}

export async function getProductosArchivados(categoria) {
  const url = categoria ? `${API_BASE}/productos/archivados?categoria=${encodeURIComponent(categoria)}` : `${API_BASE}/productos/archivados`;
  const res = await fetch(url);
  return manejarRespuesta(res);
}

export async function getAlertas() {
  const res = await fetch(`${API_BASE}/alertas`);
  return manejarRespuesta(res);
}

export async function crearProducto(datos) {
  const res = await fetch(`${API_BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return manejarRespuesta(res);
}

export async function actualizarProducto(id, datos) {
  const res = await fetch(`${API_BASE}/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return manejarRespuesta(res);
}

export async function eliminarProducto(id) {
  const res = await fetch(`${API_BASE}/productos/${id}`, { method: 'DELETE' });
  return manejarRespuesta(res);
}

export async function registrarMovimiento(productoId, datos) {
  const res = await fetch(`${API_BASE}/productos/${productoId}/movimiento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const resultado = await manejarRespuesta(res);
  // avisa a la campanita/bot para que revisen alertas al instante, sin esperar el sondeo de 30s
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('inventario:cambio-stock'));
  }
  return resultado;
}

export async function getMovimientos(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.producto_id) params.set('producto_id', filtros.producto_id);
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.desde) params.set('desde', filtros.desde);
  if (filtros.hasta) params.set('hasta', filtros.hasta);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/movimientos${qs ? `?${qs}` : ''}`);
  return manejarRespuesta(res);
}
