import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, SprayCan } from 'lucide-react';
import { getBajoStock } from '../api/client.js';

const CATEGORIAS = [
  { nombre: 'Librería', ruta: '/libreria', Icono: BookOpen, clases: 'bg-libreria-fondo' },
  { nombre: 'Limpieza', ruta: '/limpieza', Icono: SprayCan, clases: 'bg-limpieza-fondo' }
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
    <div className="min-h-screen flex items-center justify-center gap-8 bg-white">
      {CATEGORIAS.map((cat) => (
        <button
          key={cat.nombre}
          onClick={() => navigate(cat.ruta)}
          className={`relative w-64 h-64 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4 ${cat.clases} hover:scale-105 transition`}
        >
          <cat.Icono size={64} className="text-gray-700" />
          <span className="text-2xl font-bold text-gray-800">{cat.nombre}</span>
          {conteos[cat.nombre] > 0 && (
            <span className="absolute top-3 right-3 bg-alerta text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
              {conteos[cat.nombre]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
