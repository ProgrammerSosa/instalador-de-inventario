import { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Bot } from 'lucide-react';
import { getAlertas } from '../api/client.js';

const CLAVE_SILENCIADO = 'inventario_bot_silenciado';
const CLAVE_ANUNCIADAS = 'inventario_alertas_anunciadas';

function leerSilenciado() {
  try {
    return localStorage.getItem(CLAVE_SILENCIADO) === '1';
  } catch {
    return false;
  }
}

function leerAnunciadas() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_ANUNCIADAS) || '[]'));
  } catch {
    return new Set();
  }
}

function guardarAnunciadas(set) {
  try {
    localStorage.setItem(CLAVE_ANUNCIADAS, JSON.stringify([...set]));
  } catch {
    // si localStorage no está disponible, no persiste entre reinicios, pero no rompe nada
  }
}

export default function AlertBot() {
  const [alerta, setAlerta] = useState(null);
  const [silenciado, setSilenciado] = useState(leerSilenciado);
  const silenciadoRef = useRef(silenciado);

  useEffect(() => {
    silenciadoRef.current = silenciado;
  }, [silenciado]);

  useEffect(() => {
    function verificar() {
      getAlertas()
        .then((alertas) => {
          if (alertas.length === 0) {
            setAlerta(null);
            return;
          }
          const masUrgente = alertas.find((a) => a.tipo === 'agotado') ?? alertas[0];
          setAlerta(masUrgente);

          // Solo se anuncia una alerta la primera vez que aparece (cuando el producto
          // cruza el mínimo o se agota). Si se repone y vuelve a caer, se anuncia de nuevo.
          const clavesActivas = new Set(alertas.map((a) => `${a.producto_id}-${a.tipo}`));
          const anunciadas = leerAnunciadas();
          let cambiaron = false;

          for (const clave of [...anunciadas]) {
            if (!clavesActivas.has(clave)) {
              anunciadas.delete(clave);
              cambiaron = true;
            }
          }

          for (const a of alertas) {
            const clave = `${a.producto_id}-${a.tipo}`;
            if (!anunciadas.has(clave)) {
              anunciadas.add(clave);
              cambiaron = true;
              if (!silenciadoRef.current && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(a.mensaje);
                utterance.lang = 'es-ES';
                window.speechSynthesis.speak(utterance);
              }
            }
          }

          if (cambiaron) guardarAnunciadas(anunciadas);
        })
        .catch(() => {});
    }

    verificar();
    const intervalo = setInterval(verificar, 30000);
    window.addEventListener('inventario:cambio-stock', verificar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener('inventario:cambio-stock', verificar);
    };
  }, []);

  function alternarSilencio() {
    const nuevo = !silenciado;
    setSilenciado(nuevo);
    try {
      localStorage.setItem(CLAVE_SILENCIADO, nuevo ? '1' : '0');
    } catch {
      // si localStorage no está disponible, el silencio no persiste entre sesiones, pero no rompe nada
    }
    if (nuevo && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  if (!alerta) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-end gap-2 max-w-xs animate-fade print:hidden">
      <div className="bg-white rounded-2xl rounded-br-sm shadow-xl ring-1 ring-black/5 p-3">
        <p className="text-sm text-gray-700">{alerta.mensaje}</p>
      </div>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="w-11 h-11 rounded-full bg-primario text-white flex items-center justify-center shadow-lg shadow-blue-200">
          <Bot size={22} />
        </div>
        <button
          onClick={alternarSilencio}
          title={silenciado ? 'Activar voz' : 'Silenciar voz'}
          className="w-7 h-7 rounded-full bg-white shadow ring-1 ring-black/5 flex items-center justify-center text-gray-500 transition-colors hover:text-gray-700"
        >
          {silenciado ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    </div>
  );
}
