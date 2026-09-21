import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Filter } from 'lucide-react';
import { getMovimientos } from '../api/client.js';

const clasesInputFecha =
  'block border border-gray-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none transition focus:ring-2 focus:ring-primario/30 focus:border-primario';

export default function Historial({ categoria }) {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [cargando, setCargando] = useState(true);

  function cargar() {
    setCargando(true);
    getMovimientos({ categoria, desde: desde || undefined, hasta: hasta || undefined })
      .then(setMovimientos)
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-28 animate-fade">
      <button
        onClick={() => navigate(categoria === 'Librería' ? '/libreria' : '/limpieza')}
        className="flex items-center gap-2 text-gray-600 font-medium mb-4 rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-black/5"
      >
        <ArrowLeft size={18} /> Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Historial — {categoria}</h1>

      <div className="flex gap-3 mb-4 items-end bg-white rounded-xl p-3 shadow-sm ring-1 ring-black/5 w-fit">
        <label className="text-sm text-gray-600">
          Desde
          <input type="date" className={clasesInputFecha} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="text-sm text-gray-600">
          Hasta
          <input type="date" className={clasesInputFecha} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <button
          onClick={cargar}
          className="flex items-center gap-1.5 bg-primario text-white px-4 py-2 rounded-lg font-medium shadow-sm shadow-blue-200 transition-all hover:shadow-md active:scale-95"
        >
          <Filter size={14} /> Filtrar
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-black/5 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-100 text-gray-500">
                <th className="py-3 px-4 font-medium">Fecha</th>
                <th className="font-medium">Producto</th>
                <th className="font-medium">Tipo</th>
                <th className="font-medium">Cantidad</th>
                <th className="font-medium">Nota</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">{m.fecha}</td>
                  <td className="font-medium text-gray-800">{m.producto_nombre}</td>
                  <td>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.tipo === 'entrada' ? 'bg-blue-50 text-primario' : 'bg-red-50 text-alerta'
                      }`}
                    >
                      {m.tipo === 'entrada' ? <ArrowDownToLine size={12} /> : <ArrowUpFromLine size={12} />}
                      {m.tipo}
                    </span>
                  </td>
                  <td className="text-gray-700">{m.cantidad}</td>
                  <td className="text-gray-500">{m.nota || '—'}</td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">Sin movimientos en este rango.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
