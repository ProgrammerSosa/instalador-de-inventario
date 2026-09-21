import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { getMovimientos } from '../api/client.js';

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
    <div className="min-h-screen bg-white p-6">
      <button
        onClick={() => navigate(categoria === 'Librería' ? '/libreria' : '/limpieza')}
        className="flex items-center gap-2 text-gray-700 font-semibold mb-4"
      >
        <ArrowLeft size={18} /> Volver
      </button>
      <h1 className="text-2xl font-bold mb-4">Historial — {categoria}</h1>

      <div className="flex gap-3 mb-4 items-end">
        <label className="text-sm">
          Desde
          <input type="date" className="block border rounded px-2 py-1" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="text-sm">
          Hasta
          <input type="date" className="block border rounded px-2 py-1" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <button onClick={cargar} className="bg-primario text-white px-4 py-2 rounded">
          Filtrar
        </button>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-2">{m.fecha}</td>
                <td>{m.producto_nombre}</td>
                <td className={`flex items-center gap-1 ${m.tipo === 'entrada' ? 'text-green-600' : 'text-alerta'}`}>
                  {m.tipo === 'entrada' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                  {m.tipo}
                </td>
                <td>{m.cantidad}</td>
                <td>{m.nota || '—'}</td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-400">Sin movimientos en este rango.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
