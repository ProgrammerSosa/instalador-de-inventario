import { Routes, Route } from 'react-router-dom';
import Splash from './components/Splash.jsx';
import { ModoProvider } from './components/ModoContext.jsx';

export default function App() {
  return (
    <ModoProvider>
      <Routes>
        <Route path="/" element={<Splash />} />
      </Routes>
    </ModoProvider>
  );
}
