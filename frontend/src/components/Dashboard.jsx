import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import { getMovimientos } from '../api/client.js';

const PERIODOS = [
  { clave: '7', etiqueta: 'Semana', dias: 7 },
  { clave: '30', etiqueta: 'Mes', dias: 30 },
  { clave: '365', etiqueta: 'Año', dias: 365 }
];

function fechaHaceNDias(dias) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function Dashboard({ categoria }) {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(PERIODOS[1]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getMovimientos({ categoria, desde: fechaHaceNDias(periodo.dias) })
      .then(setMovimientos)
      .finally(() => setCargando(false));
  }, [categoria, periodo]);

  const { totalSalidas, totalEntradas, ranking } = useMemo(() => {
    const salidas = movimientos.filter((m) => m.tipo === 'salida');
    const entradas = movimientos.filter((m) => m.tipo === 'entrada');
    const porProducto = {};
    salidas.forEach((m) => {
      porProducto[m.producto_nombre] = (porProducto[m.producto_nombre] || 0) + m.cantidad;
    });
    const ranking = Object.entries(porProducto)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);
    return {
      totalSalidas: salidas.reduce((s, m) => s + m.cantidad, 0),
      totalEntradas: entradas.reduce((s, m) => s + m.cantidad, 0),
      ranking
    };
  }, [movimientos]);

  const maxRanking = ranking[0]?.cantidad ?? 1;

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade">
      <button
        onClick={() => navigate(categoria === 'Librería' ? '/libreria' : '/limpieza')}
        className="flex items-center gap-2 text-gray-600 font-medium mb-4 rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-black/5"
      >
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Estadísticas — {categoria}</h1>
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm ring-1 ring-black/5">
          {PERIODOS.map((p) => (
            <button
              key={p.clave}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                periodo.clave === p.clave ? 'bg-primario text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <TrendingDown size={22} className="text-alerta" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalSalidas}</p>
                <p className="text-sm text-gray-500">unidades de salida</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp size={22} className="text-primario" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalEntradas}</p>
                <p className="text-sm text-gray-500">unidades de entrada</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-800">Productos más consumidos</h2>
            </div>
            {ranking.length === 0 ? (
              <p className="text-sm text-gray-400">Sin salidas registradas en este período.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {ranking.map((r) => (
                  <div key={r.nombre} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-32 truncate shrink-0" title={r.nombre}>
                      {r.nombre}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primario h-full rounded-full transition-all duration-500"
                        style={{ width: `${(r.cantidad / maxRanking) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">{r.cantidad}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
