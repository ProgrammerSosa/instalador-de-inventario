import { useEffect, useState } from 'react';
import { PackageX } from 'lucide-react';
import { getAlertas } from '../api/client.js';
import ReporteLayout from './ReporteLayout.jsx';

const CATEGORIAS = ['Librería', 'Limpieza'];

export default function ReporteFaltantes() {
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

  return (
    <ReporteLayout titulo="Reporte de stock faltante" icono={PackageX}>
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
    </ReporteLayout>
  );
}
