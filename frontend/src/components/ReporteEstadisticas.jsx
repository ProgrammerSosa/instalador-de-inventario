import { useEffect, useState, useMemo } from 'react';
import { BarChart3, PieChart, TrendingDown, TrendingUp } from 'lucide-react';
import { getMovimientos } from '../api/client.js';
import { PALETA_CATEGORICA, armarGradienteDonut } from './Dashboard.jsx';
import ReporteLayout from './ReporteLayout.jsx';

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_A_MOSTRAR = 6;

function fechaHaceNDias(dias) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function ultimosMeses(cantidad) {
  const hoy = new Date();
  const meses = [];
  for (let i = cantidad - 1; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      clave: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
      etiqueta: MESES_CORTOS[fecha.getMonth()]
    });
  }
  return meses;
}

export default function ReporteEstadisticas() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getMovimientos({ desde: fechaHaceNDias(MESES_A_MOSTRAR * 31) })
      .then(setMovimientos)
      .finally(() => setCargando(false));
  }, []);

  const movimientosDelMes = useMemo(() => movimientos.filter((m) => m.fecha >= fechaHaceNDias(30)), [movimientos]);

  const { totalSalidas, totalEntradas, ranking } = useMemo(() => {
    const salidas = movimientosDelMes.filter((m) => m.tipo === 'salida');
    const entradas = movimientosDelMes.filter((m) => m.tipo === 'entrada');
    const porProducto = {};
    salidas.forEach((m) => {
      const clave = `${m.producto_nombre} (${m.producto_categoria})`;
      porProducto[clave] = (porProducto[clave] || 0) + m.cantidad;
    });
    const ranking = Object.entries(porProducto)
      .map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);
    return {
      totalSalidas: salidas.reduce((s, m) => s + m.cantidad, 0),
      totalEntradas: entradas.reduce((s, m) => s + m.cantidad, 0),
      ranking
    };
  }, [movimientosDelMes]);

  const datosPorMes = useMemo(() => {
    const totalesPorClave = {};
    movimientos
      .filter((m) => m.tipo === 'salida')
      .forEach((m) => {
        const clave = m.fecha.slice(0, 7);
        totalesPorClave[clave] = (totalesPorClave[clave] || 0) + m.cantidad;
      });
    return ultimosMeses(MESES_A_MOSTRAR).map((m) => ({ ...m, valor: totalesPorClave[m.clave] || 0 }));
  }, [movimientos]);

  const mesConMasConsumo = useMemo(
    () => datosPorMes.reduce((top, d) => (d.valor > top.valor ? d : top), datosPorMes[0] ?? { valor: 0, etiqueta: '—' }),
    [datosPorMes]
  );
  const gradienteDonut = useMemo(() => armarGradienteDonut(datosPorMes, PALETA_CATEGORICA), [datosPorMes]);
  const maxRanking = ranking[0]?.cantidad ?? 1;

  return (
    <ReporteLayout titulo="Reporte de estadísticas" icono={BarChart3}>
      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">Librería y Limpieza combinadas · últimos 30 días</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl bg-red-50 p-4 flex items-center gap-3">
              <TrendingDown size={20} className="text-alerta shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-800">{totalSalidas}</p>
                <p className="text-xs text-gray-500">unidades de salida</p>
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 flex items-center gap-3">
              <TrendingUp size={20} className="text-primario shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-800">{totalEntradas}</p>
                <p className="text-xs text-gray-500">unidades de entrada</p>
              </div>
            </div>
          </div>

          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <PieChart size={16} className="text-gray-400" />
            Consumo por mes (últimos {MESES_A_MOSTRAR} meses)
          </h2>
          <div className="flex items-center gap-6 flex-wrap justify-center mb-6">
            <div className="relative w-32 h-32 shrink-0">
              <div className="w-32 h-32 rounded-full" style={{ background: gradienteDonut }} />
              <div className="absolute inset-0 m-auto w-[4.5rem] h-[4.5rem] bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-[9px] text-gray-400 uppercase">Más consumo</span>
                <span className="text-sm font-bold text-gray-800 capitalize">{mesConMasConsumo.etiqueta}</span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              {datosPorMes.map((d, i) => (
                <div
                  key={d.clave}
                  className={`text-center min-w-[2.5rem] ${
                    d.clave === mesConMasConsumo.clave && d.valor > 0 ? 'font-bold text-gray-800' : 'text-gray-400'
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mb-1"
                    style={{ backgroundColor: PALETA_CATEGORICA[i % PALETA_CATEGORICA.length] }}
                  />
                  <p className="text-xs uppercase">{d.etiqueta}</p>
                  <p className="text-sm">{d.valor}</p>
                </div>
              ))}
            </div>
          </div>

          <h2 className="font-semibold text-gray-700 mb-3">Productos más consumidos (últimos 30 días)</h2>
          {ranking.length === 0 ? (
            <p className="text-sm text-gray-400">Sin salidas registradas en este período.</p>
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
                        style={{ width: `${(r.cantidad / maxRanking) * 100}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">{r.cantidad}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </ReporteLayout>
  );
}
