import { Routes, Route } from 'react-router-dom';
import Splash from './components/Splash.jsx';
import CategoriaSelector from './components/CategoriaSelector.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import Historial from './components/Historial.jsx';
import Archivados from './components/Archivados.jsx';
import Dashboard from './components/Dashboard.jsx';
import Reportes from './components/Reportes.jsx';
import ReporteFaltantes from './components/ReporteFaltantes.jsx';
import ReporteConsumo from './components/ReporteConsumo.jsx';
import ReporteEstadisticas from './components/ReporteEstadisticas.jsx';
import NotificationBell from './components/NotificationBell.jsx';
import AlertBot from './components/AlertBot.jsx';
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
        <Route path="/libreria/archivados" element={<Archivados categoria="Librería" />} />
        <Route path="/limpieza/archivados" element={<Archivados categoria="Limpieza" />} />
        <Route path="/libreria/estadisticas" element={<Dashboard categoria="Librería" />} />
        <Route path="/limpieza/estadisticas" element={<Dashboard categoria="Limpieza" />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/reportes/faltantes" element={<ReporteFaltantes />} />
        <Route path="/reportes/consumo" element={<ReporteConsumo />} />
        <Route path="/reportes/estadisticas" element={<ReporteEstadisticas />} />
      </Routes>
      <NotificationBell />
      <AlertBot />
    </ModoProvider>
  );
}
