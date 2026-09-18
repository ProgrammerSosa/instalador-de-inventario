import { Routes, Route } from 'react-router-dom';
import Splash from './components/Splash.jsx';
import CategoriaSelector from './components/CategoriaSelector.jsx';
import { ModoProvider } from './components/ModoContext.jsx';

export default function App() {
  return (
    <ModoProvider>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/categorias" element={<CategoriaSelector />} />
      </Routes>
    </ModoProvider>
  );
}
