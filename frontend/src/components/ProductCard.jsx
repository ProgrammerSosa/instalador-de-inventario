export default function ProductCard({ producto, modo, onEditar, onEntrada, onSalida }) {
  const agotado = producto.stock_actual === 0;
  const bajoStock = producto.stock_actual <= producto.stock_minimo;

  return (
    <div
      className={`relative rounded-xl shadow p-2 flex flex-col items-center h-32 justify-center border-2 ${
        agotado ? 'bg-red-100 border-alerta' : bajoStock ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'
      }`}
    >
      <button onClick={modo === 'edicion' ? onEditar : onSalida} className="flex flex-col items-center gap-1 flex-1 justify-center w-full">
        <span className="text-4xl">{producto.icono}</span>
        <span className="text-sm font-semibold text-gray-800 text-center">{producto.nombre}</span>
        <span className="text-xs text-gray-500">{producto.stock_actual} {producto.unidad}</span>
      </button>
      {modo === 'edicion' && (
        <button
          onClick={onEntrada}
          className="absolute top-2 right-2 bg-primario text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
          title="Registrar entrada de stock"
        >
          +
        </button>
      )}
    </div>
  );
}
