import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 via-white to-white gap-8 animate-fade">
      <div className="w-28 h-28 rounded-3xl bg-white shadow-lg shadow-blue-100 flex items-center justify-center ring-1 ring-gray-100">
        <ClipboardList size={56} strokeWidth={1.7} className="text-primario" />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Sistema de Inventario</h1>
        <p className="text-gray-400 mt-2">Librería &amp; Limpieza</p>
      </div>
      <button
        onClick={() => navigate('/categorias')}
        className="px-10 py-3.5 bg-primario text-white rounded-xl text-lg font-semibold shadow-lg shadow-blue-200 transition-all duration-150 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
      >
        Ingresar
      </button>
    </div>
  );
}
