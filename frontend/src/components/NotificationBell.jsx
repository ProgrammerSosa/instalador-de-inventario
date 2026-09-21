import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { getAlertas } from '../api/client.js';

export default function NotificationBell() {
  const [alertas, setAlertas] = useState([]);
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(() => {
    getAlertas()
      .then(setAlertas)
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 30000);
    window.addEventListener('inventario:cambio-stock', cargar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener('inventario:cambio-stock', cargar);
    };
  }, [cargar]);

  return (
    <div className="fixed top-4 right-4 z-40 print:hidden">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative w-11 h-11 rounded-full bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <Bell size={20} className="text-gray-700" />
        {alertas.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-alerta text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {alertas.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 p-3 animate-modal max-h-96 overflow-y-auto">
          <p className="font-semibold text-gray-800 mb-2 px-1">Alertas</p>
          {alertas.length === 0 ? (
            <p className="text-sm text-gray-400 px-1 py-2">Sin alertas por ahora.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {alertas.map((a) => (
                <li
                  key={`${a.producto_id}-${a.tipo}`}
                  className={`text-sm rounded-lg px-3 py-2 ${a.tipo === 'agotado' ? 'bg-red-50 text-alerta' : 'bg-amber-50 text-amber-700'}`}
                >
                  <span className="font-medium">{a.producto_nombre}</span> · {a.categoria} ·{' '}
                  {a.tipo === 'agotado' ? 'agotado' : `quedan ${a.stock_actual} ${a.unidad}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
