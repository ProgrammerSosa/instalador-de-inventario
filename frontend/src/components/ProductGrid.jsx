import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, SprayCan } from 'lucide-react';
import { getProductos } from '../api/client.js';
import { useModo } from './ModoContext.jsx';
import ModeToggle from './ModeToggle.jsx';
import ProductCard from './ProductCard.jsx';
import ProductForm from './ProductForm.jsx';
import StockMovementForm from './StockMovementForm.jsx';

const TEMAS = {
  'Librería': { fondo: 'bg-libreria-fondo', Icono: BookOpen, ruta: '/libreria' },
  'Limpieza': { fondo: 'bg-limpieza-fondo', Icono: SprayCan, ruta: '/limpieza' }
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
    <div className={`min-h-screen ${tema.fondo} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/categorias')} className="flex items-center gap-2 text-gray-700 font-semibold">
          <tema.Icono size={20} />
          {categoria}
        </button>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate(`${tema.ruta}/historial`)} className="text-gray-700 underline">
            Historial
          </button>
          <ModeToggle />
        </div>
      </div>

      {cargando ? (
        <p>Cargando...</p>
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
              className="rounded-xl border-2 border-dashed border-gray-300 h-32 flex items-center justify-center text-gray-300 disabled:cursor-default enabled:hover:border-primario enabled:hover:text-primario"
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
