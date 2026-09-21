import { useState } from 'react';
import { Trash2, TriangleAlert, Check } from 'lucide-react';
import { crearProducto, actualizarProducto, eliminarProducto } from '../api/client.js';
import { ICONOS_PRODUCTO, ICONOS_DISPONIBLES } from '../iconos.jsx';

const clasesInput =
  'w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 outline-none transition focus:ring-2 focus:ring-primario/30 focus:border-primario';

export default function ProductForm({ categoria, producto, onCerrar, onGuardado }) {
  const esEdicion = Boolean(producto);
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo ?? 0);
  const [unidad, setUnidad] = useState(producto?.unidad ?? 'unidad');
  const [icono, setIcono] = useState(producto?.icono ?? 'Package');
  const [stockInicial, setStockInicial] = useState(0);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

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

  async function manejarEliminar() {
    setError(null);
    setEliminando(true);
    try {
      await eliminarProducto(producto.id);
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-modal">
        {confirmandoEliminar ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <TriangleAlert size={20} className="text-alerta" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">¿Eliminar "{producto.nombre}"?</p>
                <p className="text-sm text-gray-500 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            {error && <p className="text-alerta text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setError(null); setConfirmandoEliminar(false); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={manejarEliminar}
                disabled={eliminando}
                className="flex-1 py-2.5 rounded-xl bg-alerta text-white font-medium shadow-sm shadow-red-200 transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={manejarSubmit} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-gray-800">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h2>

            <label className="text-sm font-semibold text-gray-600">
              Nombre
              <input className={clasesInput} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>

            <div className="text-sm font-semibold text-gray-600">
              Ícono
              <div className="grid grid-cols-7 gap-1.5 mt-1">
                {ICONOS_DISPONIBLES.map((nombreIcono) => {
                  const Icono = ICONOS_PRODUCTO[nombreIcono];
                  const seleccionado = icono === nombreIcono;
                  return (
                    <button
                      type="button"
                      key={nombreIcono}
                      onClick={() => setIcono(nombreIcono)}
                      title={nombreIcono}
                      className={`relative p-2 rounded-lg border-2 flex items-center justify-center transition-all ${
                        seleccionado
                          ? 'border-primario bg-blue-50 text-primario'
                          : 'border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icono size={18} />
                      {seleccionado && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primario text-white flex items-center justify-center">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!esEdicion && (
              <label className="text-sm font-semibold text-gray-600">
                Stock inicial
                <input type="number" min="0" className={clasesInput} value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} />
              </label>
            )}

            <label className="text-sm font-semibold text-gray-600">
              Stock mínimo
              <input type="number" min="0" className={clasesInput} value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
            </label>

            <label className="text-sm font-semibold text-gray-600">
              Unidad
              <input className={clasesInput} value={unidad} onChange={(e) => setUnidad(e.target.value)} />
            </label>

            {error && <p className="text-alerta text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={onCerrar}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 py-2.5 rounded-xl bg-primario text-white font-medium shadow-sm shadow-blue-200 transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
              >
                {enviando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

            {esEdicion && (
              <button
                type="button"
                onClick={() => { setError(null); setConfirmandoEliminar(true); }}
                className="flex items-center gap-1.5 text-alerta text-sm font-medium self-center mt-1 rounded-lg px-2 py-1 transition-colors hover:bg-red-50"
              >
                <Trash2 size={14} /> Eliminar producto
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
