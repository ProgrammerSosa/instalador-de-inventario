import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DatabaseBackup, FileSpreadsheet, CheckCircle2, XCircle, Info } from 'lucide-react';

function formatearFecha(fechaSql) {
  if (!fechaSql) return null;
  const fecha = new Date(fechaSql.replace(' ', 'T'));
  return fecha.toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short' });
}

export default function Configuracion() {
  const navigate = useNavigate();
  const disponible = typeof window !== 'undefined' && !!window.electronAPI;

  const [ultimoRespaldo, setUltimoRespaldo] = useState(null);
  const [cargandoDb, setCargandoDb] = useState(false);
  const [cargandoExcel, setCargandoExcel] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (!disponible) return;
    window.electronAPI.obtenerUltimoRespaldo().then(setUltimoRespaldo);
  }, [disponible]);

  async function manejarCopiarDb() {
    setMensaje(null);
    setCargandoDb(true);
    try {
      const resultado = await window.electronAPI.copiarRespaldoDB();
      if (resultado.cancelado) {
        setMensaje({ tipo: 'info', texto: 'Cancelaste la selección de carpeta.' });
      } else {
        setMensaje({ tipo: 'exito', texto: `Base de datos copiada en: ${resultado.ruta}` });
        setUltimoRespaldo(await window.electronAPI.obtenerUltimoRespaldo());
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo copiar la base de datos.' });
    } finally {
      setCargandoDb(false);
    }
  }

  async function manejarExportarExcel() {
    setMensaje(null);
    setCargandoExcel(true);
    try {
      const resultado = await window.electronAPI.exportarExcel();
      if (resultado.cancelado) {
        setMensaje({ tipo: 'info', texto: 'Cancelaste la selección de carpeta.' });
      } else {
        setMensaje({ tipo: 'exito', texto: `Excel generado en: ${resultado.ruta}` });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo generar el Excel.' });
    } finally {
      setCargandoExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-28 animate-fade">
      <button
        onClick={() => navigate('/categorias')}
        className="flex items-center gap-2 text-gray-600 font-medium mb-6 rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-black/5"
      >
        <ArrowLeft size={18} /> Volver
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Configuración</h1>
      <p className="text-gray-500 mb-6">Respaldo y exportación del inventario.</p>

      <div className="max-w-2xl flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-gray-500">Último respaldo</p>
          <p className="font-semibold text-gray-800 mt-0.5">
            {ultimoRespaldo ? formatearFecha(ultimoRespaldo) : 'Todavía no se hizo ningún respaldo.'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Cada vez que abrís la app, si pasaron 7 días o más desde el último respaldo, se guarda uno automático
            (base de datos + Excel) sin que tengas que hacer nada.
          </p>
        </div>

        {!disponible && (
          <div className="bg-amber-50 text-amber-700 rounded-2xl p-4 flex items-center gap-2 text-sm">
            <Info size={18} className="shrink-0" />
            Esta función solo está disponible en la aplicación de escritorio instalada, no en el navegador.
          </div>
        )}

        {mensaje && (
          <div
            className={`rounded-2xl p-4 flex items-center gap-2 text-sm ${
              mensaje.tipo === 'exito'
                ? 'bg-emerald-50 text-emerald-700'
                : mensaje.tipo === 'error'
                ? 'bg-red-50 text-alerta'
                : 'bg-blue-50 text-primario'
            }`}
          >
            {mensaje.tipo === 'exito' && <CheckCircle2 size={18} className="shrink-0" />}
            {mensaje.tipo === 'error' && <XCircle size={18} className="shrink-0" />}
            {mensaje.tipo === 'info' && <Info size={18} className="shrink-0" />}
            <span className="break-all">{mensaje.texto}</span>
          </div>
        )}

        <button
          onClick={manejarCopiarDb}
          disabled={!disponible || cargandoDb}
          className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 text-left transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:shadow-sm disabled:hover:translate-y-0 flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <DatabaseBackup size={22} className="text-primario" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{cargandoDb ? 'Copiando…' : 'Copiar base de datos'}</p>
            <p className="text-sm text-gray-500 mt-1">
              Guarda una copia del archivo de la base de datos en la carpeta que elijas (por ejemplo, un pendrive).
            </p>
          </div>
        </button>

        <button
          onClick={manejarExportarExcel}
          disabled={!disponible || cargandoExcel}
          className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5 text-left transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:shadow-sm disabled:hover:translate-y-0 flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={22} className="text-limpieza-acento" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{cargandoExcel ? 'Generando…' : 'Exportar a Excel'}</p>
            <p className="text-sm text-gray-500 mt-1">Genera un .xlsx con los productos y todos los movimientos.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
