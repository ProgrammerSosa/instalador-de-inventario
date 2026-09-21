import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, SprayCan, History, Search, X, Archive, BarChart3 } from 'lucide-react';
import { getProductos } from '../api/client.js';
import { useModo } from './ModoContext.jsx';
import ModeToggle from './ModeToggle.jsx';
import ProductCard from './ProductCard.jsx';
import ProductForm from './ProductForm.jsx';
import StockMovementForm from './StockMovementForm.jsx';
import { PATRON_LIBRERIA, PATRON_LIMPIEZA } from '../utils/patrones.js';

const TEMAS = {
  'Librería': { gradiente: 'from-libreria-fondo to-amber-50', Icono: BookOpen, ruta: '/libreria', patron: PATRON_LIBRERIA },
  'Limpieza': { gradiente: 'from-limpieza-fondo to-emerald-50', Icono: SprayCan, ruta: '/limpieza', patron: PATRON_LIMPIEZA }
};

const CASILLEROS_MINIMOS = 12;

export default function ProductGrid({ categoria }) {
  const navigate = useNavigate();
  const { modo, volverANormal } = useModo();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [productoParaEditar, setProductoParaEditar] = useState(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [movimiento, setMovimiento] = useState(null);

  const recargar = useCallback(() => {
    setCargando(true);
    getProductos(categoria).then(setProductos).finally(() => setCargando(false));
  }, [categoria]);

  useEffect(() => {
    volverANormal();
    setBusqueda('');
    recargar();
  }, [categoria, volverANormal, recargar]);

  const tema = TEMAS[categoria];
  const hayBusqueda = busqueda.trim().length > 0;
  const productosFiltrados = useMemo(() => {
    if (!hayBusqueda) return productos;
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((p) => p.nombre.toLowerCase().includes(texto));
  }, [productos, busqueda, hayBusqueda]);
  const casillerosVacios = hayBusqueda ? 0 : Math.max(CASILLEROS_MINIMOS - productos.length, 4);

  return (
    <div className={`relative min-h-screen bg-gradient-to-b ${tema.gradiente} p-6 animate-fade overflow-hidden`}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: tema.patron, backgroundRepeat: 'repeat' }} />
      <div className="relative">
      <div className="flex items-center justify-between mb-4 bg-white/70 backdrop-blur rounded-2xl px-4 py-3 shadow-sm ring-1 ring-black/5">
        <button
          onClick={() => navigate('/categorias')}
          className="flex items-center gap-2 text-gray-700 font-semibold rounded-lg px-2 py-1 transition-colors hover:bg-black/5"
        >
          <tema.Icono size={20} />
          {categoria}
        </button>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => navigate(`${tema.ruta}/estadisticas`)}
            title="Estadísticas"
            className="p-2.5 rounded-lg text-gray-600 transition-colors hover:bg-black/5"
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={() => navigate(`${tema.ruta}/historial`)}
            title="Historial"
            className="p-2.5 rounded-lg text-gray-600 transition-colors hover:bg-black/5"
          >
            <History size={18} />
          </button>
          <button
            onClick={() => navigate(`${tema.ruta}/archivados`)}
            title="Archivados"
            className="p-2.5 rounded-lg text-gray-600 transition-colors hover:bg-black/5"
          >
            <Archive size={18} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <ModeToggle />
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full bg-white/80 backdrop-blur rounded-xl pl-9 pr-9 py-2.5 text-sm shadow-sm ring-1 ring-black/5 outline-none transition focus:ring-2 focus:ring-primario/30"
        />
        {hayBusqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Limpiar búsqueda"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : hayBusqueda && productosFiltrados.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">Ningún producto coincide con "{busqueda}".</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {productosFiltrados.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
              modo={modo}
              onEditar={() => setProductoParaEditar(producto)}
              onEntrada={() => setMovimiento({ producto, tipoFijo: 'entrada' })}
              onSalida={() => setMovimiento({ producto, tipoFijo: 'salida' })}
            />
          ))}
          {Array.from({ length: casillerosVacios }).map((_, i) => (
            <button
              key={`vacio-${i}`}
              onClick={() => modo === 'edicion' && setMostrarAlta(true)}
              disabled={modo !== 'edicion'}
              className="rounded-xl border-2 border-dashed border-gray-300/80 bg-white/30 h-32 flex items-center justify-center text-gray-300 transition-all duration-150 disabled:cursor-default enabled:hover:border-primario enabled:hover:text-primario enabled:hover:bg-white/70 enabled:hover:scale-[1.02]"
            >
              <Plus size={28} />
            </button>
          ))}
        </div>
      )}

      {mostrarAlta && (
        <ProductForm categoria={categoria} onCerrar={() => setMostrarAlta(false)} onGuardado={() => { setMostrarAlta(false); recargar(); }} />
      )}

      {productoParaEditar && (
        <ProductForm
          categoria={categoria}
          producto={productoParaEditar}
          onCerrar={() => setProductoParaEditar(null)}
          onGuardado={() => { setProductoParaEditar(null); recargar(); }}
        />
      )}

      {movimiento && (
        <StockMovementForm
          producto={movimiento.producto}
          tipoFijo={movimiento.tipoFijo}
          onCerrar={() => setMovimiento(null)}
          onGuardado={() => { setMovimiento(null); recargar(); }}
        />
      )}
      </div>
    </div>
  );
}
