import { useEffect, useState, useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { getMovimientos } from '../api/client.js';
import { PALETA_CATEGORICA } from './Dashboard.jsx';
import ReporteLayout from './ReporteLayout.jsx';

const RANGOS = [
  { clave: '7', etiqueta: 'Últimos 7 días', dias: 7 },
  { clave: '30', etiqueta: 'Últimos 30 días', dias: 30 },
  { clave: '90', etiqueta: 'Últimos 90 días', dias: 90 },
  { clave: '365', etiqueta: 'Último año', dias: 365 }
];

const CATEGORIAS = [
  { clave: '', etiqueta: 'Ambas categorías' },
  { clave: 'Librería', etiqueta: 'Solo Librería' },
  { clave: 'Limpieza', etiqueta: 'Solo Limpieza' }
];

const clasesSelect =
  'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primario/30 bg-white';

function fechaHaceNDias(dias) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function ReporteConsumo() {
  const [rango, setRango] = useState(RANGOS[1]);
  const [categoria, setCategoria] = useState('');
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getMovimientos({ categoria: categoria || undefined, desde: fechaHaceNDias(rango.dias) })
      .then(setMovimientos)
      .finally(() => setCargando(false));
  }, [rango, categoria]);

  const ranking = useMemo(() => {
    const porProducto = {};
    movimientos
      .filter((m) => m.tipo === 'salida')
      .forEach((m) => {
        const clave = categoria ? m.producto_nombre : `${m.producto_nombre} (${m.producto_categoria})`;
        porProducto[clave] = (porProducto[clave] || 0) + m.cantidad;
      });
    return Object.entries(porProducto)
      .map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [movimientos, categoria]);

  const maxConsumo = ranking[0]?.cantidad ?? 1;
  const total = movimientos.filter((m) => m.tipo === 'salida').reduce((s, m) => s + m.cantidad, 0);
  const categoriaEtiqueta = CATEGORIAS.find((c) => c.clave === categoria)?.etiqueta ?? 'Ambas categorías';

  return (
    <ReporteLayout titulo="Reporte de consumo" icono={TrendingDown}>
      <div className="flex gap-3 mb-2 flex-wrap print:hidden">
        <select value={rango.clave} onChange={(e) => setRango(RANGOS.find((r) => r.clave === e.target.value))} className={clasesSelect}>
          {RANGOS.map((r) => (
            <option key={r.clave} value={r.clave}>
              {r.etiqueta}
            </option>
          ))}
        </select>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={clasesSelect}>
          {CATEGORIAS.map((c) => (
            <option key={c.clave} value={c.clave}>
              {c.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {rango.etiqueta} · {categoriaEtiqueta} · <span className="font-semibold text-gray-700">{total}</span> unidades consumidas en total.
      </p>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : ranking.length === 0 ? (
        <p className="text-gray-400">Sin salidas registradas en este período.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {ranking.map((r, i) => {
            const color = PALETA_CATEGORICA[i % PALETA_CATEGORICA.length];
            return (
              <div key={r.etiqueta} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm text-gray-600 w-44 truncate shrink-0" title={r.etiqueta}>
                  {r.etiqueta}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(r.cantidad / maxConsumo) * 100}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-8 text-right">{r.cantidad}</span>
              </div>
            );
          })}
        </div>
      )}
    </ReporteLayout>
  );
}
