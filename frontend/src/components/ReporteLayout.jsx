import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

export default function ReporteLayout({ titulo, icono: Icono, volverA = '/reportes', children }) {
  const navigate = useNavigate();
  const fechaHoy = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate(volverA)}
          className="flex items-center gap-2 text-gray-600 font-medium rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-black/5"
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primario text-white px-4 py-2.5 rounded-xl font-medium shadow-sm shadow-blue-200 transition-all hover:shadow-md active:scale-95"
        >
          <Printer size={16} /> Imprimir / Guardar como PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-8 max-w-2xl mx-auto print:shadow-none print:ring-0 print:p-0 print:max-w-none">
        <div className="flex items-center gap-3 mb-1">
          <Icono size={24} className="text-primario" />
          <h1 className="text-xl font-bold text-gray-800">{titulo}</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6 capitalize">{fechaHoy}</p>
        {children}
      </div>
    </div>
  );
}
