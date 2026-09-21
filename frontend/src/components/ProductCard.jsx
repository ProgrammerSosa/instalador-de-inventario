import { Plus } from 'lucide-react';
import { IconoProducto } from '../iconos.jsx';

export default function ProductCard({ producto, modo, onEditar, onEntrada, onSalida }) {
  const agotado = producto.stock_actual === 0;
  const bajoStock = producto.stock_actual <= producto.stock_minimo;

  return (
    <div
      className={`group relative rounded-xl shadow-sm p-2 flex flex-col items-center h-32 justify-center border transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 ${
        agotado
          ? 'bg-red-50 border-alerta/60'
          : bajoStock
            ? 'bg-amber-50 border-amber-300'
            : 'bg-white border-gray-100'
      }`}
    >
      <button
        onClick={modo === 'edicion' ? onEditar : onSalida}
        className="flex flex-col items-center gap-1 flex-1 justify-center w-full rounded-lg"
      >
        <IconoProducto
          nombre={producto.icono}
          size={32}
          strokeWidth={1.7}
          className={`transition-transform duration-150 group-hover:scale-110 ${agotado ? 'text-alerta' : bajoStock ? 'text-amber-600' : 'text-gray-700'}`}
        />
        <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{producto.nombre}</span>
        <span className={`text-xs ${agotado ? 'text-alerta font-semibold' : 'text-gray-500'}`}>
          {producto.stock_actual} {producto.unidad}
        </span>
      </button>
      {modo === 'edicion' && (
        <button
          onClick={onEntrada}
          className="absolute top-2 right-2 bg-primario text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm transition-transform duration-150 hover:scale-110 active:scale-95"
          title="Registrar entrada de stock"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}
