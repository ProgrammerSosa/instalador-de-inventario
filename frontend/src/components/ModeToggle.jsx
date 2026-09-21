import { Pencil, X } from 'lucide-react';
import { useModo } from './ModoContext.jsx';

export default function ModeToggle() {
  const { modo, activarEdicion, volverANormal } = useModo();
  const enEdicion = modo === 'edicion';

  return (
    <button
      onClick={enEdicion ? volverANormal : activarEdicion}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all duration-150 hover:shadow-md active:scale-95 ${
        enEdicion ? 'bg-alerta shadow-red-200' : 'bg-primario shadow-blue-200'
      }`}
    >
      {enEdicion ? <X size={18} /> : <Pencil size={18} />}
      {enEdicion ? 'Modo Edición (tocá para salir)' : 'Activar Modo Edición'}
    </button>
  );
}
