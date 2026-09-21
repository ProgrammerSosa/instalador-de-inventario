import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ClipboardList } from 'lucide-react';
import { getAlertas } from '../api/client.js';

const CATEGORIAS = ['Librería', 'Limpieza'];

export default function Reporte() {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getAlertas()
      .then(setAlertas)
      .finally(() => setCargando(false));
  }, []);

  const porCategoria = {
    'Librería': alertas.filter((a) => a.categoria === 'Librería'),
    'Limpieza': alertas.filter((a) => a.categoria === 'Limpieza')
  };

  const fechaHoy = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate('/categorias')}
          className="flex items-center gap-2 text-gray-600 font-medium rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-black/5"
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primario text-white px-4 py-2.5 rounded-xl font-medium shadow-sm shadow-blue-200 transition-all hover:shadow-md active:scale-95"
        >
          <Printer size={16} /> Imprimir / Guardar como PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-8 max-w-2xl mx-auto print:shadow-none print:ring-0 print:p-0 print:max-w-none">
        <div className="flex items-center gap-3 mb-1">
          <ClipboardList size={24} className="text-primario" />
          <h1 className="text-xl font-bold text-gray-800">Reporte de stock faltante</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6 capitalize">{fechaHoy}</p>

        {cargando ? (
          <p className="text-gray-500">Cargando...</p>
        ) : alertas.length === 0 ? (
          <p className="text-gray-400">No hay productos bajo el mínimo en este momento. Todo el inventario está en orden.</p>
        ) : (
          CATEGORIAS.map((cat) =>
            porCategoria[cat].length > 0 ? (
              <div key={cat} className="mb-6 last:mb-0">
                <h2 className="font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-2">{cat}</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 font-medium">Producto</th>
                      <th className="font-medium">Estado</th>
                      <th className="font-medium text-right">Stock actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porCategoria[cat].map((a) => (
                      <tr key={`${a.producto_id}-${a.tipo}`} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 text-gray-800">{a.producto_nombre}</td>
                        <td className={a.tipo === 'agotado' ? 'text-alerta font-medium' : 'text-amber-600 font-medium'}>
                          {a.tipo === 'agotado' ? 'Agotado' : 'Bajo mínimo'}
                        </td>
                        <td className="text-right text-gray-600">
                          {a.stock_actual} {a.unidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
}
