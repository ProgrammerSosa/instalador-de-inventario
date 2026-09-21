import { useState } from 'react';
import { Trash2, Archive, TriangleAlert, Check, ImagePlus, X } from 'lucide-react';
import { crearProducto, actualizarProducto, eliminarProducto } from '../api/client.js';
import { ICONOS_PRODUCTO, ICONOS_DISPONIBLES } from '../iconos.jsx';
import { redimensionarImagen } from '../utils/imagen.js';

const clasesInput =
  'w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 outline-none transition focus:ring-2 focus:ring-primario/30 focus:border-primario';

const ACCIONES = {
  eliminar: {
    titulo: (nombre) => `¿Eliminar "${nombre}"?`,
    subtitulo: 'Esta acción no se puede deshacer.',
    boton: 'Sí, eliminar'
  },
  archivar: {
    titulo: (nombre) => `¿Archivar "${nombre}"?`,
    subtitulo: 'Deja de aparecer en el inventario, pero conserva su historial. Podés pedirme más adelante una forma de desarchivarlo.',
    boton: 'Sí, archivar'
  }
};

export default function ProductForm({ categoria, producto, onCerrar, onGuardado }) {
  const esEdicion = Boolean(producto);
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo ?? 0);
  const [unidad, setUnidad] = useState(producto?.unidad ?? 'unidad');
  const [icono, setIcono] = useState(producto?.icono ?? 'Package');
  const [imagen, setImagen] = useState(producto?.imagen ?? null);
  const [cargandoImagen, setCargandoImagen] = useState(false);
  const [stockInicial, setStockInicial] = useState(0);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [accion, setAccion] = useState(null); // null | 'eliminar' | 'archivar'
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (esEdicion) {
        await actualizarProducto(producto.id, { nombre, stock_minimo: Number(stockMinimo), unidad, icono, imagen });
      } else {
        await crearProducto({
          nombre,
          categoria,
          stock_actual: Number(stockInicial),
          stock_minimo: Number(stockMinimo),
          unidad,
          icono,
          imagen
        });
      }
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function manejarSeleccionImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setCargandoImagen(true);
    try {
      setImagen(await redimensionarImagen(archivo));
    } catch {
      setError('No se pudo procesar la imagen, probá con otra.');
    } finally {
      setCargandoImagen(false);
      e.target.value = '';
    }
  }

  async function confirmarAccion() {
    setError(null);
    setProcesandoAccion(true);
    try {
      if (accion === 'eliminar') {
        await eliminarProducto(producto.id);
      } else {
        await actualizarProducto(producto.id, { activo: false });
      }
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoAccion(false);
    }
  }

  if (accion) {
    const info = ACCIONES[accion];
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-modal flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accion === 'eliminar' ? 'bg-red-50' : 'bg-amber-50'}`}>
              {accion === 'eliminar' ? <TriangleAlert size={20} className="text-alerta" /> : <Archive size={20} className="text-amber-600" />}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{info.titulo(producto.nombre)}</p>
              <p className="text-sm text-gray-500 mt-0.5">{info.subtitulo}</p>
            </div>
          </div>

          {error && <p className="text-alerta text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setError(null); setAccion(null); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarAccion}
              disabled={procesandoAccion}
              className={`flex-1 py-2.5 rounded-xl text-white font-medium shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50 ${
                accion === 'eliminar' ? 'bg-alerta shadow-red-200' : 'bg-amber-500 shadow-amber-200'
              }`}
            >
              {procesandoAccion ? 'Un momento...' : info.boton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-modal">
        <form onSubmit={manejarSubmit} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-800">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h2>

          <label className="text-sm font-semibold text-gray-600">
            Nombre
            <input className={clasesInput} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>

          <div className="text-sm font-semibold text-gray-600">
            Imagen (opcional, reemplaza al ícono)
            <div className="flex items-center gap-3 mt-1">
              {imagen ? (
                <div className="relative">
                  <img src={imagen} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => setImagen(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-900"
                    title="Quitar imagen"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-pointer transition-colors hover:border-primario hover:text-primario">
                  <ImagePlus size={16} />
                  {cargandoImagen ? 'Procesando...' : 'Subir foto'}
                  <input type="file" accept="image/*" className="hidden" onChange={manejarSeleccionImagen} disabled={cargandoImagen} />
                </label>
              )}
            </div>
          </div>

          <div className={`text-sm font-semibold text-gray-600 ${imagen ? 'opacity-40' : ''}`}>
            Ícono {imagen && '(no se usa mientras haya una imagen)'}
            <div className="grid grid-cols-7 gap-1.5 mt-1">
              {ICONOS_DISPONIBLES.map((nombreIcono) => {
                const Icono = ICONOS_PRODUCTO[nombreIcono];
                const seleccionado = icono === nombreIcono;
                return (
                  <button
                    type="button"
                    key={nombreIcono}
                    onClick={() => setIcono(nombreIcono)}
                    disabled={Boolean(imagen)}
                    title={nombreIcono}
                    className={`relative p-2 rounded-lg border-2 flex items-center justify-center transition-all disabled:cursor-default ${
                      seleccionado
                        ? 'border-primario bg-blue-50 text-primario'
                        : 'border-gray-100 text-gray-500 enabled:hover:border-gray-300 enabled:hover:bg-gray-50'
                    }`}
                  >
                    <Icono size={18} />
                    {seleccionado && !imagen && (
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
              disabled={enviando || cargandoImagen}
              className="flex-1 py-2.5 rounded-xl bg-primario text-white font-medium shadow-sm shadow-blue-200 transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {enviando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {esEdicion && (
            <div className="flex items-center justify-center gap-4 mt-1">
              <button
                type="button"
                onClick={() => { setError(null); setAccion('archivar'); }}
                className="flex items-center gap-1.5 text-amber-600 text-sm font-medium rounded-lg px-2 py-1 transition-colors hover:bg-amber-50"
              >
                <Archive size={14} /> Archivar
              </button>
              <button
                type="button"
                onClick={() => { setError(null); setAccion('eliminar'); }}
                className="flex items-center gap-1.5 text-alerta text-sm font-medium rounded-lg px-2 py-1 transition-colors hover:bg-red-50"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
