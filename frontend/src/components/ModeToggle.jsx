import { useModo } from './ModoContext.jsx';

export default function ModeToggle() {
  const { modo, activarEdicion, volverANormal } = useModo();
  const enEdicion = modo === 'edicion';

  return (
    <button
      onClick={enEdicion ? volverANormal : activarEdicion}
      className={`px-4 py-2 rounded-lg font-semibold text-white ${enEdicion ? 'bg-alerta' : 'bg-primario'}`}
    >
      {enEdicion ? '✏️ Modo Edición (tocá para salir)' : 'Activar Modo Edición'}
    </button>
  );
}
