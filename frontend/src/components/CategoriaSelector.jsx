import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, SprayCan } from 'lucide-react';
import { getBajoStock } from '../api/client.js';

const CATEGORIAS = [
  { nombre: 'Librería', ruta: '/libreria', Icono: BookOpen, gradiente: 'from-libreria-fondo to-amber-50', acento: 'text-libreria-acento' },
  { nombre: 'Limpieza', ruta: '/limpieza', Icono: SprayCan, gradiente: 'from-limpieza-fondo to-emerald-50', acento: 'text-limpieza-acento' }
];

export default function CategoriaSelector() {
  const navigate = useNavigate();
  const [conteos, setConteos] = useState({});

  useEffect(() => {
    CATEGORIAS.forEach(({ nombre }) => {
      getBajoStock(nombre)
        .then((productos) => setConteos((prev) => ({ ...prev, [nombre]: productos.length })))
        .catch(() => {});
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center gap-10 bg-white animate-fade">
      {CATEGORIAS.map((cat) => (
        <button
          key={cat.nombre}
          onClick={() => navigate(cat.ruta)}
          className={`group relative w-64 h-64 rounded-3xl shadow-md flex flex-col items-center justify-center gap-4 bg-gradient-to-br ${cat.gradiente} ring-1 ring-black/5 transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]`}
        >
          <div className="w-20 h-20 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <cat.Icono size={40} strokeWidth={1.7} className={cat.acento} />
          </div>
          <span className="text-2xl font-bold text-gray-800">{cat.nombre}</span>
          {conteos[cat.nombre] > 0 && (
            <span className="absolute top-4 right-4 bg-alerta text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-sm shadow-red-300">
              {conteos[cat.nombre]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
