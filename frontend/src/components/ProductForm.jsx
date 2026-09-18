import { useState } from 'react';
import { crearProducto, actualizarProducto } from '../api/client.js';

export default function ProductForm({ categoria, producto, onCerrar, onGuardado }) {
  const esEdicion = Boolean(producto);
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo ?? 0);
  const [unidad, setUnidad] = useState(producto?.unidad ?? 'unidad');
  const [icono, setIcono] = useState(producto?.icono ?? '📦');
  const [stockInicial, setStockInicial] = useState(0);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (esEdicion) {
        await actualizarProducto(producto.id, { nombre, stock_minimo: Number(stockMinimo), unidad, icono });
      } else {
        await crearProducto({
          nombre,
          categoria,
          stock_actual: Number(stockInicial),
          stock_minimo: Number(stockMinimo),
          unidad,
          icono
        });
      }
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={manejarSubmit} className="bg-white rounded-xl p-6 w-80 flex flex-col gap-3">
        <h2 className="text-lg font-bold">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h2>

        <label className="text-sm font-semibold">
          Nombre
          <input className="w-full border rounded px-3 py-2 mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>

        <label className="text-sm font-semibold">
          Ícono (emoji)
          <input className="w-full border rounded px-3 py-2 mt-1" value={icono} onChange={(e) => setIcono(e.target.value)} maxLength={4} />
        </label>

        {!esEdicion && (
          <label className="text-sm font-semibold">
            Stock inicial
            <input type="number" min="0" className="w-full border rounded px-3 py-2 mt-1" value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} />
          </label>
        )}

        <label className="text-sm font-semibold">
          Stock mínimo
          <input type="number" min="0" className="w-full border rounded px-3 py-2 mt-1" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
        </label>

        <label className="text-sm font-semibold">
          Unidad
          <input className="w-full border rounded px-3 py-2 mt-1" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
        </label>

        {error && <p className="text-alerta text-sm">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onCerrar} className="flex-1 py-2 rounded border">Cancelar</button>
          <button type="submit" disabled={enviando} className="flex-1 py-2 rounded bg-primario text-white disabled:opacity-50">
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
