import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { getMovimientos } from '../api/client.js';

const PERIODOS = [
  { clave: '7', etiqueta: 'Semana', dias: 7 },
  { clave: '30', etiqueta: 'Mes', dias: 30 },
  { clave: '365', etiqueta: 'Año', dias: 365 }
];

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_A_MOSTRAR = 6;

// Paleta categórica validada (orden fijo, apta para daltonismo) — skill de dataviz.
// El color va SIEMPRE por posición/entidad, nunca por "quién ganó" — eso se indica aparte.
export const PALETA_CATEGORICA = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

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

// Cada porción tiene un color fijo por posición (mes 1, mes 2...), no por magnitud:
// el mes "ganador" se señala aparte (centro + leyenda en negrita), no repintando la porción.
export function armarGradienteDonut(datos, paleta) {
  const total = datos.reduce((s, d) => s + d.valor, 0);
  if (total === 0) return 'conic-gradient(#e5e7eb 0% 100%)';
  let acumulado = 0;
  const partes = datos.map((d, i) => {
    const inicio = (acumulado / total) * 100;
    acumulado += d.valor;
    const fin = (acumulado / total) * 100;
    return `${paleta[i % paleta.length]} ${inicio}% ${fin}%`;
  });
  return `conic-gradient(${partes.join(', ')})`;
}

export default function Dashboard({ categoria }) {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(PERIODOS[1]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [movimientosPorMes, setMovimientosPorMes] = useState([]);

  useEffect(() => {
    setCargando(true);
    getMovimientos({ categoria, desde: fechaHaceNDias(periodo.dias) })
      .then(setMovimientos)
      .finally(() => setCargando(false));
  }, [categoria, periodo]);

  useEffect(() => {
    getMovimientos({ categoria, desde: fechaHaceNDias(MESES_A_MOSTRAR * 31) })
      .then(setMovimientosPorMes)
      .catch(() => {});
  }, [categoria]);

  const datosPorMes = useMemo(() => {
    const totalesPorClave = {};
    movimientosPorMes
      .filter((m) => m.tipo === 'salida')
      .forEach((m) => {
        const clave = m.fecha.slice(0, 7);
        totalesPorClave[clave] = (totalesPorClave[clave] || 0) + m.cantidad;
      });
    return ultimosMeses(MESES_A_MOSTRAR).map((m) => ({ ...m, valor: totalesPorClave[m.clave] || 0 }));
  }, [movimientosPorMes]);

  const mesConMasConsumo = useMemo(
    () => datosPorMes.reduce((top, d) => (d.valor > top.valor ? d : top), datosPorMes[0] ?? { valor: 0, etiqueta: '—' }),
    [datosPorMes]
  );
  const gradienteDonut = useMemo(() => armarGradienteDonut(datosPorMes, PALETA_CATEGORICA), [datosPorMes]);

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
    <div className="min-h-screen bg-gray-50 p-6 pb-28 animate-fade">
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
              <PieChart size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-800">Consumo por mes (últimos {MESES_A_MOSTRAR} meses)</h2>
            </div>
            <div className="flex items-center gap-8 flex-wrap justify-center">
              <div className="relative w-36 h-36 shrink-0">
                <div className="w-36 h-36 rounded-full" style={{ background: gradienteDonut }} />
                <div className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-[10px] text-gray-400 uppercase">Más consumo</span>
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
                {ranking.map((r, i) => {
                  const color = PALETA_CATEGORICA[i % PALETA_CATEGORICA.length];
                  return (
                    <div key={r.nombre} className="flex items-center gap-3">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-600 w-28 truncate shrink-0" title={r.nombre}>
                        {r.nombre}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(r.cantidad / maxRanking) * 100}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{r.cantidad}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
