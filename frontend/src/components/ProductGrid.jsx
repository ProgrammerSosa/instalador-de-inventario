import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, SprayCan, History } from 'lucide-react';
import { getProductos } from '../api/client.js';
import { useModo } from './ModoContext.jsx';
import ModeToggle from './ModeToggle.jsx';
import ProductCard from './ProductCard.jsx';
import ProductForm from './ProductForm.jsx';
import StockMovementForm from './StockMovementForm.jsx';

const TEMAS = {
  'Librería': { gradiente: 'from-libreria-fondo to-amber-50', Icono: BookOpen, ruta: '/libreria' },
  'Limpieza': { gradiente: 'from-limpieza-fondo to-emerald-50', Icono: SprayCan, ruta: '/limpieza' }
};

const CASILLEROS_MINIMOS = 12;

export default function ProductGrid({ categoria }) {
  const navigate = useNavigate();
  const { modo, volverANormal } = useModo();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [productoParaEditar, setProductoParaEditar] = useState(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [movimiento, setMovimiento] = useState(null);

  const recargar = useCallback(() => {
    setCargando(true);
    getProductos(categoria).then(setProductos).finally(() => setCargando(false));
  }, [categoria]);

  useEffect(() => {
    volverANormal();
    recargar();
  }, [categoria, volverANormal, recargar]);

  const tema = TEMAS[categoria];
  const casillerosVacios = Math.max(CASILLEROS_MINIMOS - productos.length, 3);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${tema.gradiente} p-6 animate-fade`}>
      <div className="flex items-center justify-between mb-6 bg-white/70 backdrop-blur rounded-2xl px-4 py-3 shadow-sm ring-1 ring-black/5">
        <button
          onClick={() => navigate('/categorias')}
          className="flex items-center gap-2 text-gray-700 font-semibold rounded-lg px-2 py-1 transition-colors hover:bg-black/5"
        >
          <tema.Icono size={20} />
          {categoria}
        </button>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => navigate(`${tema.ruta}/historial`)}
            className="flex items-center gap-1.5 text-gray-600 font-medium rounded-lg px-3 py-2 transition-colors hover:bg-black/5"
          >
            <History size={16} /> Historial
          </button>
          <ModeToggle />
        </div>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {productos.map((producto) => (
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
  );
}
