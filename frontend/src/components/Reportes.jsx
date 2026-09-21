import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PackageX, TrendingDown, BarChart3 } from 'lucide-react';

const OPCIONES = [
  {
    titulo: 'Stock faltante',
    desc: 'Productos bajo el mínimo o agotados, listos para mandar.',
    icono: PackageX,
    ruta: '/reportes/faltantes',
    color: 'text-alerta',
    fondo: 'bg-red-50'
  },
  {
    titulo: 'Consumo',
    desc: 'Qué se gastó más, eligiendo el período y la categoría.',
    icono: TrendingDown,
    ruta: '/reportes/consumo',
    color: 'text-primario',
    fondo: 'bg-blue-50'
  },
  {
    titulo: 'Estadísticas completas',
    desc: 'Consumo por mes y ranking de productos, todo junto.',
    icono: BarChart3,
    ruta: '/reportes/estadisticas',
    color: 'text-limpieza-acento',
    fondo: 'bg-emerald-50'
  }
];

export default function Reportes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade">
      <button
        onClick={() => navigate('/categorias')}
        className="flex items-center gap-2 text-gray-600 font-medium mb-6 rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-black/5"
      >
        <ArrowLeft size={18} /> Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Reportes</h1>
      <p className="text-gray-500 mb-6">Elegí qué reporte generar para revisar, imprimir o compartir.</p>

      <div className="grid grid-cols-3 gap-4 max-w-3xl">
        {OPCIONES.map((op) => (
          <button
            key={op.ruta}
            onClick={() => navigate(op.ruta)}
            className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 text-left transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className={`w-11 h-11 rounded-xl ${op.fondo} flex items-center justify-center mb-3`}>
              <op.icono size={22} className={op.color} />
            </div>
            <p className="font-semibold text-gray-800">{op.titulo}</p>
            <p className="text-sm text-gray-500 mt-1">{op.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
