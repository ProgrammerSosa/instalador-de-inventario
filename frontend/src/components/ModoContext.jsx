import { createContext, useContext, useState, useCallback } from 'react';

const ModoContext = createContext(null);

export function ModoProvider({ children }) {
  const [modo, setModo] = useState('normal');

  const activarEdicion = useCallback(() => setModo('edicion'), []);
  const volverANormal = useCallback(() => setModo('normal'), []);

  return (
    <ModoContext.Provider value={{ modo, activarEdicion, volverANormal }}>
      {children}
    </ModoContext.Provider>
  );
}

export function useModo() {
  const contexto = useContext(ModoContext);
  if (!contexto) throw new Error('useModo debe usarse dentro de ModoProvider');
  return contexto;
}
