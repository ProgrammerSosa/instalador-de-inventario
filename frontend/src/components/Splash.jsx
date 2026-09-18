import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
      <ClipboardList size={64} className="text-primario" />
      <h1 className="text-3xl font-bold text-gray-800">Sistema de Inventario</h1>
      <button
        onClick={() => navigate('/categorias')}
        className="px-8 py-3 bg-primario text-white rounded-lg text-lg font-semibold hover:opacity-90"
      >
        Ingresar
      </button>
    </div>
  );
}
