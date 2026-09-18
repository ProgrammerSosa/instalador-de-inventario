import { Pencil, X } from 'lucide-react';
import { useModo } from './ModoContext.jsx';

export default function ModeToggle() {
  const { modo, activarEdicion, volverANormal } = useModo();
  const enEdicion = modo === 'edicion';

  return (
    <button
      onClick={enEdicion ? volverANormal : activarEdicion}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white ${enEdicion ? 'bg-alerta' : 'bg-primario'}`}
    >
      {enEdicion ? <X size={18} /> : <Pencil size={18} />}
      {enEdicion ? 'Modo Edición (tocá para salir)' : 'Activar Modo Edición'}
    </button>
  );
}
