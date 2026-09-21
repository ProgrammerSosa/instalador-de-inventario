import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArchiveRestore } from 'lucide-react';
import { getProductosArchivados, actualizarProducto } from '../api/client.js';
import { IconoProducto } from '../iconos.jsx';

export default function Archivados({ categoria }) {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [restaurando, setRestaurando] = useState(null);

  function cargar() {
    setCargando(true);
    getProductosArchivados(categoria).then(setProductos).finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  async function desarchivar(producto) {
    setRestaurando(producto.id);
    try {
      await actualizarProducto(producto.id, { activo: true });
      cargar();
    } finally {
      setRestaurando(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-28 animate-fade">
      <button
        onClick={() => navigate(categoria === 'Librería' ? '/libreria' : '/limpieza')}
        className="flex items-center gap-2 text-gray-600 font-medium mb-4 rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-black/5"
      >
        <ArrowLeft size={18} /> Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Archivados — {categoria}</h1>
      <p className="text-sm text-gray-500 mb-4">No aparecen en el inventario, pero conservan su historial. Podés restaurarlos cuando quieras.</p>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : productos.length === 0 ? (
        <p className="text-gray-400">No hay productos archivados en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {productos.map((producto) => (
            <div key={producto.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-3 flex flex-col items-center gap-2">
              {producto.imagen ? (
                <img src={producto.imagen} alt="" className="w-9 h-9 rounded-lg object-cover opacity-70" />
              ) : (
                <IconoProducto nombre={producto.icono} size={28} strokeWidth={1.7} className="text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-600 text-center leading-tight">{producto.nombre}</span>
              <button
                onClick={() => desarchivar(producto)}
                disabled={restaurando === producto.id}
                className="flex items-center gap-1 text-xs text-primario font-medium rounded-lg px-2 py-1 transition-colors hover:bg-blue-50 disabled:opacity-50"
              >
                <ArchiveRestore size={12} /> {restaurando === producto.id ? 'Restaurando...' : 'Restaurar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
