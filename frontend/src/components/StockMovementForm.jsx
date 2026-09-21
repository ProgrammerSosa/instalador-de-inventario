import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { registrarMovimiento } from '../api/client.js';

const clasesInput =
  'w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 outline-none transition focus:ring-2 focus:ring-primario/30 focus:border-primario';

export default function StockMovementForm({ producto, tipoFijo, onCerrar, onGuardado }) {
  const [tipo, setTipo] = useState(tipoFijo ?? 'salida');
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const notaObligatoria = tipo === 'salida';

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(null);
    if (notaObligatoria && !nota.trim()) {
      setError('Contá para qué o a quién se lo diste');
      return;
    }
    setEnviando(true);
    try {
      await registrarMovimiento(producto.id, { tipo, cantidad: Number(cantidad), nota: nota.trim() || undefined });
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={manejarSubmit} className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-modal flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tipo === 'entrada' ? 'bg-blue-50' : 'bg-red-50'}`}>
            {tipo === 'entrada' ? (
              <ArrowDownToLine className="text-primario" size={20} />
            ) : (
              <ArrowUpFromLine className="text-alerta" size={20} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 leading-tight">{tipo === 'entrada' ? 'Entrada de stock' : 'Salida de stock'}</h2>
            <p className="text-sm text-gray-500">{producto.nombre} · {producto.stock_actual} {producto.unidad} disponibles</p>
          </div>
        </div>

        {!tipoFijo && (
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setTipo('entrada')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${tipo === 'entrada' ? 'bg-white text-primario shadow-sm' : 'text-gray-500'}`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setTipo('salida')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${tipo === 'salida' ? 'bg-white text-alerta shadow-sm' : 'text-gray-500'}`}
            >
              Salida
            </button>
          </div>
        )}

        <label className="text-sm font-semibold text-gray-600">
          Cantidad
          <input type="number" min="1" className={clasesInput} value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
        </label>

        <label className="text-sm font-semibold text-gray-600">
          Nota {notaObligatoria ? '(obligatoria: ¿a quién/para qué?)' : '(opcional)'}
          <input className={clasesInput} value={nota} onChange={(e) => setNota(e.target.value)} required={notaObligatoria} />
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
            className={`flex-1 py-2.5 rounded-xl text-white font-medium shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50 ${
              tipo === 'entrada' ? 'bg-primario shadow-blue-200' : 'bg-alerta shadow-red-200'
            }`}
          >
            {enviando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  );
}
