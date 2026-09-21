import { Routes, Route } from 'react-router-dom';
import Splash from './components/Splash.jsx';
import CategoriaSelector from './components/CategoriaSelector.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import Historial from './components/Historial.jsx';
import { ModoProvider } from './components/ModoContext.jsx';

export default function App() {
  return (
    <ModoProvider>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/categorias" element={<CategoriaSelector />} />
        <Route path="/libreria" element={<ProductGrid categoria="Librería" />} />
        <Route path="/limpieza" element={<ProductGrid categoria="Limpieza" />} />
        <Route path="/libreria/historial" element={<Historial categoria="Librería" />} />
        <Route path="/limpieza/historial" element={<Historial categoria="Limpieza" />} />
      </Routes>
    </ModoProvider>
  );
}
