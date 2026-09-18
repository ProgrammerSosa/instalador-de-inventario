import { useState } from 'react';
import { registrarMovimiento } from '../api/client.js';

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={manejarSubmit} className="bg-white rounded-xl p-6 w-80 flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          {tipo === 'entrada' ? '📥 Entrada de stock' : '📤 Salida de stock'} — {producto.nombre}
        </h2>
        <p className="text-sm text-gray-500">Stock actual: {producto.stock_actual} {producto.unidad}</p>

        {!tipoFijo && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setTipo('entrada')} className={`flex-1 py-2 rounded ${tipo === 'entrada' ? 'bg-primario text-white' : 'bg-gray-100'}`}>
              Entrada
            </button>
            <button type="button" onClick={() => setTipo('salida')} className={`flex-1 py-2 rounded ${tipo === 'salida' ? 'bg-primario text-white' : 'bg-gray-100'}`}>
              Salida
            </button>
          </div>
        )}

        <label className="text-sm font-semibold">
          Cantidad
          <input type="number" min="1" className="w-full border rounded px-3 py-2 mt-1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
        </label>

        <label className="text-sm font-semibold">
          Nota {notaObligatoria ? '(obligatoria: ¿a quién/para qué?)' : '(opcional)'}
          <input className="w-full border rounded px-3 py-2 mt-1" value={nota} onChange={(e) => setNota(e.target.value)} required={notaObligatoria} />
        </label>

        {error && <p className="text-alerta text-sm">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onCerrar} className="flex-1 py-2 rounded border">Cancelar</button>
          <button type="submit" disabled={enviando} className="flex-1 py-2 rounded bg-primario text-white disabled:opacity-50">
            {enviando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  );
}
