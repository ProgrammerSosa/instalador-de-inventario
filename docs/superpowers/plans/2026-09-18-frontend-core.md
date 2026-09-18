# Frontend Core (React) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la interfaz React que consume la API del Plan 1 (backend-core, ya terminado): pantalla de bienvenida, selección de categoría, grilla de productos con Modo Edición/Normal, formularios de alta/edición y de movimientos de stock, e historial — todo corriendo con `npm run dev` contra el backend en `localhost:4000`, verificable en un navegador real antes de empaquetarlo en Electron (Plan 3).

**Architecture:** React + Vite, `react-router-dom` para las rutas, Tailwind para estilos. Una capa `api/client.js` centraliza todas las llamadas fetch al backend (equivalente a los "models" del backend: es la única parte con lógica pura, así que es la única con tests automatizados). Un `ModoContext` (React Context) mantiene si la categoría actual está en Modo Edición o Modo Normal, compartido entre los componentes de esa vista.

**Tech Stack:** React 18 (Vite), react-router-dom, Tailwind CSS `^3` (fijado a v3 — v4 cambia el mecanismo de configuración y rompe los pasos de este plan), Vitest (solo para `api/client.js`).

## Roadmap general (dónde encaja este plan)

**Plan 2 de 4:**
1. Backend core — **terminado** (`docs/superpowers/plans/2026-09-18-backend-core.md`).
2. **Frontend core (este plan).**
3. Electron + empaquetado — envuelve el resultado de este plan en el instalador `.exe`.
4. Alertas (campanita + bot de voz), Respaldo/Exportación, y Estadísticas — capa de valor agregado sobre esta base.

Este plan **no** incluye: campanita/bot de voz, botones de respaldo/exportar, ni el Dashboard de estadísticas — todo eso es Plan 4. Tampoco incluye el empaquetado en Electron — eso es Plan 3. Lo que sí incluye es todo el flujo de uso diario: entrar, elegir categoría, ver/agregar/editar productos, registrar entradas y salidas con nota, y ver el historial.

## Global Constraints

- El frontend usa **ES Modules** (`import`/`export`) — a diferencia del backend, que usa CommonJS. Es lo que Vite genera por default (`"type": "module"` en `package.json`) y no hay que pelear contra eso.
- Tailwind fijado a la serie `^3` (no `^4`) — este plan asume `tailwind.config.js` + `postcss.config.js`, que es como funciona v3. Si `npm install` trae v4 por no estar pineado, romperá los pasos de configuración (mismo tipo de sorpresa que tuvimos con Express 5 en el Plan 1 — por eso acá se fija explícitamente).
- Categorías exactamente `'Librería'` y `'Limpieza'` (con tilde), igual que el backend.
- La URL del backend está fija en `http://localhost:4000/api` dentro de `api/client.js`, para desarrollo con `npm run dev`. El Plan 3 (Electron) puede necesitar ajustar esto para el build empaquetado — queda anotado, no es un olvido de este plan.
- Testing acotado, mismo criterio que el backend: **solo `api/client.js` lleva tests automatizados** (Vitest) — es la única capa de lógica pura (arma URLs, interpreta `{ok,data}`/`{ok,error}`). Los componentes React se verifican corriendo la app de verdad en un navegador, no con tests de componentes.
- No ejecutar `git commit` ni `git push` — cada tarea termina con un paso "dejar preparado para commit" con el mensaje sugerido, pero el commit real lo hace quien controla la ejecución, con mensaje **sin ninguna mención a Claude/IA**, y nunca se hace push.
- Se trabaja directo sobre la rama actual (`master`), sin crear ramas nuevas.

---

### Task 1: Scaffolding del frontend (Vite + React + Tailwind + Router)

**Files:**
- Create: `frontend/` (via `npm create vite@latest`)
- Create/overwrite: `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/src/index.css`

**Interfaces:**
- Consumes: nada (primera tarea de este plan).
- Produces: proyecto Vite+React funcionando con Tailwind activo y `react-router-dom` instalado. Las siguientes tareas asumen `frontend/src/` como raíz de código, y las clases `primario`, `alerta`, `libreria-fondo`, `limpieza-fondo` disponibles en Tailwind.

- [ ] **Paso 1: Scaffolding de Vite (plantilla React, JavaScript, no TypeScript)**

```bash
cd "C:\instalador de inventario"
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

- [ ] **Paso 2: Instalar router y Tailwind (fijando la versión de Tailwind a la serie 3)**

```bash
cd "C:\instalador de inventario\frontend"
npm install react-router-dom
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Paso 3: Sobrescribir `tailwind.config.js` con la paleta del proyecto**

El comando anterior genera un archivo base — reemplazá su contenido completo por este (nota la sintaxis `export default`, no `module.exports`, porque el proyecto es ES Modules):

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primario: '#2563eb',
        alerta: '#dc2626',
        libreria: { fondo: '#f5ead6', acento: '#8b5e34' },
        limpieza: { fondo: '#e6f3ea', acento: '#2f9e5c' }
      }
    }
  },
  plugins: []
}
```

- [ ] **Paso 4: Sobrescribir `postcss.config.js`**

Reemplazá su contenido completo por (misma razón, ES Modules):

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

- [ ] **Paso 5: Reemplazar `src/index.css`**

Borrá el contenido que trae por defecto y dejalo así:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Paso 6: Verificar que todo el toolchain funciona junto**

```bash
cd "C:\instalador de inventario\frontend"
npm run build
```

Expected: termina sin errores y crea una carpeta `dist/`. Si falla por Tailwind/PostCSS, es casi seguro un problema de sintaxis ESM vs CommonJS en los archivos de configuración — revisar que ambos usen `export default`.

- [ ] **Paso 7: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `chore: scaffolding del frontend (Vite + React + Tailwind + Router)`

---

### Task 2: Cliente de API (`api/client.js`)

**Files:**
- Create: `frontend/src/api/client.js`
- Test: `frontend/src/api/client.test.js`

**Interfaces:**
- Consumes: el backend del Plan 1 corriendo en `http://localhost:4000` (para las pruebas, se mockea `global.fetch`, no hace falta el backend real corriendo).
- Produces: `getProductos(categoria?)`, `getBajoStock(categoria?)`, `crearProducto(datos)`, `actualizarProducto(id, datos)`, `eliminarProducto(id)`, `registrarMovimiento(productoId, datos)`, `getMovimientos(filtros?)` — todas funciones `async` que devuelven `data` directamente (no la envoltura `{ok,data}`) y lanzan `Error(mensaje)` cuando el backend responde `{ok:false}`. Todas las tareas de componentes (3 en adelante) importan de acá, nunca llaman `fetch` directamente.

- [ ] **Paso 1: Instalar Vitest y configurarlo**

```bash
cd "C:\instalador de inventario\frontend"
npm install -D vitest
```

Editar `frontend/vite.config.js` para que quede así (agrega el bloque `test`):

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node'
  }
})
```

Editar `frontend/package.json`, agregar dentro de `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Paso 2: Escribir los tests**

Crear `frontend/src/api/client.test.js`:

```js
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getProductos, crearProducto, registrarMovimiento } from './client.js';

function mockearFetch(cuerpo) {
  global.fetch = vi.fn().mockResolvedValue({ json: async () => cuerpo });
}

describe('api/client', () => {
  beforeEach(() => {
    global.fetch = undefined;
  });

  test('getProductos arma la URL con categoria y devuelve data', async () => {
    mockearFetch({ ok: true, data: [{ id: 1, nombre: 'Papel A4' }] });
    const resultado = await getProductos('Librería');
    expect(resultado).toEqual([{ id: 1, nombre: 'Papel A4' }]);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/productos?categoria=Librer%C3%ADa');
  });

  test('getProductos sin categoria no agrega query string', async () => {
    mockearFetch({ ok: true, data: [] });
    await getProductos();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/productos');
  });

  test('lanza un Error con el mensaje del backend cuando ok es false', async () => {
    mockearFetch({ ok: false, error: 'El nombre es obligatorio' });
    await expect(crearProducto({ nombre: '' })).rejects.toThrow('El nombre es obligatorio');
  });

  test('crearProducto hace POST con el body en JSON', async () => {
    mockearFetch({ ok: true, data: { id: 1 } });
    await crearProducto({ nombre: 'Tijera', categoria: 'Librería' });
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/productos', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Tijera', categoria: 'Librería' })
    }));
  });

  test('registrarMovimiento hace POST a la ruta anidada del producto', async () => {
    mockearFetch({ ok: true, data: { id: 1, tipo: 'salida' } });
    await registrarMovimiento(5, { tipo: 'salida', cantidad: 2, nota: 'para Juan' });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/productos/5/movimiento',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
```

- [ ] **Paso 3: Correr los tests y verificar que fallan**

```bash
cd "C:\instalador de inventario\frontend"
npm test
```

Expected: FAIL — `Cannot find module './client.js'` (o similar, el archivo no existe todavía).

- [ ] **Paso 4: Implementar `client.js`**

Crear `frontend/src/api/client.js`:

```js
const API_BASE = 'http://localhost:4000/api';

async function manejarRespuesta(res) {
  const cuerpo = await res.json();
  if (!cuerpo.ok) {
    throw new Error(cuerpo.error || 'Error desconocido');
  }
  return cuerpo.data;
}

export async function getProductos(categoria) {
  const url = categoria ? `${API_BASE}/productos?categoria=${encodeURIComponent(categoria)}` : `${API_BASE}/productos`;
  const res = await fetch(url);
  return manejarRespuesta(res);
}

export async function getBajoStock(categoria) {
  const url = categoria ? `${API_BASE}/productos/bajo-stock?categoria=${encodeURIComponent(categoria)}` : `${API_BASE}/productos/bajo-stock`;
  const res = await fetch(url);
  return manejarRespuesta(res);
}

export async function crearProducto(datos) {
  const res = await fetch(`${API_BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return manejarRespuesta(res);
}

export async function actualizarProducto(id, datos) {
  const res = await fetch(`${API_BASE}/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return manejarRespuesta(res);
}

export async function eliminarProducto(id) {
  const res = await fetch(`${API_BASE}/productos/${id}`, { method: 'DELETE' });
  return manejarRespuesta(res);
}

export async function registrarMovimiento(productoId, datos) {
  const res = await fetch(`${API_BASE}/productos/${productoId}/movimiento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return manejarRespuesta(res);
}

export async function getMovimientos(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.producto_id) params.set('producto_id', filtros.producto_id);
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.desde) params.set('desde', filtros.desde);
  if (filtros.hasta) params.set('hasta', filtros.hasta);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/movimientos${qs ? `?${qs}` : ''}`);
  return manejarRespuesta(res);
}
```

- [ ] **Paso 5: Correr los tests y verificar que pasan**

```bash
cd "C:\instalador de inventario\frontend"
npm test
```

Expected: 5 tests, 0 fallos.

- [ ] **Paso 6: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: cliente de API del frontend (fetch wrapper)`

---

### Task 3: Contexto de Modo (Edición / Normal)

**Files:**
- Create: `frontend/src/components/ModoContext.jsx`
- Create: `frontend/src/components/ModeToggle.jsx`

**Interfaces:**
- Consumes: nada.
- Produces: `<ModoProvider>` (envuelve la app), y el hook `useModo()` que devuelve `{ modo, activarEdicion, volverANormal }` donde `modo` es `'normal'` o `'edicion'`. `ModeToggle` es un botón listo para usar que llama a `activarEdicion`/`volverANormal`. Las tareas 9 (ProductGrid) y 4 (App) consumen esto.

No hay test automatizado para esta tarea (es UI/estado de React, se verifica corriendo la app en tareas posteriores) — sí hay una verificación mecánica de que el archivo exporta lo esperado.

- [ ] **Paso 1: Implementar `ModoContext.jsx`**

Crear `frontend/src/components/ModoContext.jsx`:

```jsx
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
```

- [ ] **Paso 2: Implementar `ModeToggle.jsx`**

Crear `frontend/src/components/ModeToggle.jsx`:

```jsx
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
```

- [ ] **Paso 3: Verificar que no hay errores de sintaxis**

```bash
cd "C:\instalador de inventario\frontend"
npm run build
```

Expected: build exitoso (estos componentes no se usan todavía en ningún lado, pero deben compilar sin errores de sintaxis JSX).

- [ ] **Paso 4: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: contexto de Modo Edicion/Normal`

---

### Task 4: Splash, enrutamiento (`App.jsx`) y `main.jsx`

**Files:**
- Create: `frontend/src/components/Splash.jsx`
- Modify: `frontend/src/App.jsx` (reemplazar el contenido de ejemplo de Vite)
- Modify: `frontend/src/main.jsx` (agregar `BrowserRouter`)
- Delete (si existen, son del template de Vite y no se usan): `frontend/src/App.css`, `frontend/src/assets/react.svg`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: rutas `/` (Splash) registradas; las tareas 5, 9 y 10 agregan las rutas `/categorias`, `/libreria`, `/limpieza`, `/libreria/historial`, `/limpieza/historial` a este mismo `App.jsx`.

- [ ] **Paso 1: Implementar `Splash.jsx`**

Crear `frontend/src/components/Splash.jsx`:

```jsx
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
      <div className="text-6xl">📋</div>
      <h1 className="text-3xl font-bold text-gray-800">Sistema de Inventario</h1>
      <button
        onClick={() => navigate('/categorias')}
        className="px-8 py-3 bg-primario text-white rounded-lg text-lg font-semibold hover:opacity-90"
      >
        Ingresar
      </button>
    </div>
  );
}
```

- [ ] **Paso 2: Reemplazar `App.jsx` completo**

```jsx
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
```

(Las rutas de categoría, producto e historial se agregan en las tareas 5, 9 y 10 — este archivo se vuelve a editar ahí.)

- [ ] **Paso 3: Actualizar `main.jsx` para envolver todo en `BrowserRouter`**

Reemplazar `frontend/src/main.jsx` completo:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Paso 4: Borrar archivos de ejemplo que ya no se usan**

```bash
cd "C:\instalador de inventario\frontend"
rm -f src/App.css
rm -f src/assets/react.svg
```

(Si `src/App.jsx` original importaba `./App.css` o el logo, ya quedó reemplazado en el Paso 2 — no debería quedar ninguna importación rota.)

- [ ] **Paso 5: Verificar en el navegador**

```bash
cd "C:\instalador de inventario\frontend"
npm run dev
```

Abrir `http://localhost:5173` — debe verse la pantalla de bienvenida (📋, título, botón "Ingresar"). El botón puede no llevar a ningún lado todavía (la ruta `/categorias` no existe hasta la Task 5) — con que no tire error en consola alcanza. Parar el servidor (`Ctrl+C`) al terminar de verificar.

- [ ] **Paso 6: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: pantalla de bienvenida y enrutamiento base`

---

### Task 5: Selección de categoría

**Files:**
- Create: `frontend/src/components/CategoriaSelector.jsx`
- Modify: `frontend/src/App.jsx` (agregar la ruta `/categorias`)

**Interfaces:**
- Consumes: `getBajoStock` de `api/client.js` (Task 2).
- Produces: ruta `/categorias` con 2 tarjetas que navegan a `/libreria` y `/limpieza` (esas rutas todavía no existen — se agregan en la Task 9 — está bien que por ahora no lleven a ningún lado).

- [ ] **Paso 1: Implementar `CategoriaSelector.jsx`**

Crear `frontend/src/components/CategoriaSelector.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBajoStock } from '../api/client.js';

const CATEGORIAS = [
  { nombre: 'Librería', ruta: '/libreria', emoji: '📚', clases: 'bg-libreria-fondo' },
  { nombre: 'Limpieza', ruta: '/limpieza', emoji: '🧼', clases: 'bg-limpieza-fondo' }
];

export default function CategoriaSelector() {
  const navigate = useNavigate();
  const [conteos, setConteos] = useState({});

  useEffect(() => {
    CATEGORIAS.forEach(({ nombre }) => {
      getBajoStock(nombre)
        .then((productos) => setConteos((prev) => ({ ...prev, [nombre]: productos.length })))
        .catch(() => {});
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center gap-8 bg-white">
      {CATEGORIAS.map((cat) => (
        <button
          key={cat.nombre}
          onClick={() => navigate(cat.ruta)}
          className={`relative w-64 h-64 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4 ${cat.clases} hover:scale-105 transition`}
        >
          <span className="text-6xl">{cat.emoji}</span>
          <span className="text-2xl font-bold text-gray-800">{cat.nombre}</span>
          {conteos[cat.nombre] > 0 && (
            <span className="absolute top-3 right-3 bg-alerta text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
              {conteos[cat.nombre]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Paso 2: Agregar la ruta en `App.jsx`**

Editar `frontend/src/App.jsx`, agregar el import y la ruta:

```jsx
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
```

- [ ] **Paso 3: Verificar en el navegador**

Con el backend corriendo (`cd "C:\instalador de inventario\backend" && node index.js`, en una terminal aparte) y el frontend (`npm run dev` desde `frontend/`), abrir `http://localhost:5173`, tocar "Ingresar", confirmar que aparecen las 2 tarjetas (Librería y Limpieza) sin errores en la consola del navegador. Si hay productos bajo mínimo cargados de antes, debería verse el número en el círculo rojo — si la base está vacía no debería verse el círculo. Parar ambos servidores al terminar.

- [ ] **Paso 4: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: pantalla de seleccion de categoria`

---

### Task 6: Tarjeta de producto (`ProductCard`)

**Files:**
- Create: `frontend/src/components/ProductCard.jsx`

**Interfaces:**
- Consumes: nada (componente de presentación puro).
- Produces: `<ProductCard producto={...} modo={...} onEditar={fn} onEntrada={fn} onSalida={fn} />`. `producto` es una fila tal cual la devuelve `GET /api/productos` (tiene `id, nombre, categoria, stock_actual, stock_minimo, unidad, icono`). En `modo="edicion"`, tocar la tarjeta llama a `onEditar` y aparece un botón chico "+" que llama a `onEntrada`; en cualquier otro modo, tocar la tarjeta llama a `onSalida` y el botón "+" no aparece. La Task 9 (ProductGrid) es quien la usa.

- [ ] **Paso 1: Implementar `ProductCard.jsx`**

Crear `frontend/src/components/ProductCard.jsx`:

```jsx
export default function ProductCard({ producto, modo, onEditar, onEntrada, onSalida }) {
  const agotado = producto.stock_actual === 0;
  const bajoStock = producto.stock_actual <= producto.stock_minimo;

  return (
    <div
      className={`relative rounded-xl shadow p-2 flex flex-col items-center h-32 justify-center border-2 ${
        agotado ? 'bg-red-100 border-alerta' : bajoStock ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'
      }`}
    >
      <button onClick={modo === 'edicion' ? onEditar : onSalida} className="flex flex-col items-center gap-1 flex-1 justify-center w-full">
        <span className="text-4xl">{producto.icono}</span>
        <span className="text-sm font-semibold text-gray-800 text-center">{producto.nombre}</span>
        <span className="text-xs text-gray-500">{producto.stock_actual} {producto.unidad}</span>
      </button>
      {modo === 'edicion' && (
        <button
          onClick={onEntrada}
          className="absolute top-2 right-2 bg-primario text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
          title="Registrar entrada de stock"
        >
          +
        </button>
      )}
    </div>
  );
}
```

- [ ] **Paso 2: Verificar que compila**

```bash
cd "C:\instalador de inventario\frontend"
npm run build
```

Expected: build exitoso (el componente no se usa todavía en ningún lado, pero debe compilar).

- [ ] **Paso 3: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: componente ProductCard`

---

### Task 7: Formulario de producto (`ProductForm`)

**Files:**
- Create: `frontend/src/components/ProductForm.jsx`

**Interfaces:**
- Consumes: `crearProducto`, `actualizarProducto` de `api/client.js` (Task 2).
- Produces: `<ProductForm categoria={...} producto={...opcional...} onCerrar={fn} onGuardado={fn} />`. Sin `producto`, es alta (pide stock inicial); con `producto`, es edición (no pide stock inicial, ese solo se toca vía movimientos). Llama a `onGuardado()` después de guardar con éxito, a `onCerrar()` si se cancela. La Task 9 lo usa.

- [ ] **Paso 1: Implementar `ProductForm.jsx`**

Crear `frontend/src/components/ProductForm.jsx`:

```jsx
import { useState } from 'react';
import { crearProducto, actualizarProducto } from '../api/client.js';

export default function ProductForm({ categoria, producto, onCerrar, onGuardado }) {
  const esEdicion = Boolean(producto);
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo ?? 0);
  const [unidad, setUnidad] = useState(producto?.unidad ?? 'unidad');
  const [icono, setIcono] = useState(producto?.icono ?? '📦');
  const [stockInicial, setStockInicial] = useState(0);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (esEdicion) {
        await actualizarProducto(producto.id, { nombre, stock_minimo: Number(stockMinimo), unidad, icono });
      } else {
        await crearProducto({
          nombre,
          categoria,
          stock_actual: Number(stockInicial),
          stock_minimo: Number(stockMinimo),
          unidad,
          icono
        });
      }
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={manejarSubmit} className="bg-white rounded-xl p-6 w-80 flex flex-col gap-3">
        <h2 className="text-lg font-bold">{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h2>

        <label className="text-sm font-semibold">
          Nombre
          <input className="w-full border rounded px-3 py-2 mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>

        <label className="text-sm font-semibold">
          Ícono (emoji)
          <input className="w-full border rounded px-3 py-2 mt-1" value={icono} onChange={(e) => setIcono(e.target.value)} maxLength={4} />
        </label>

        {!esEdicion && (
          <label className="text-sm font-semibold">
            Stock inicial
            <input type="number" min="0" className="w-full border rounded px-3 py-2 mt-1" value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} />
          </label>
        )}

        <label className="text-sm font-semibold">
          Stock mínimo
          <input type="number" min="0" className="w-full border rounded px-3 py-2 mt-1" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
        </label>

        <label className="text-sm font-semibold">
          Unidad
          <input className="w-full border rounded px-3 py-2 mt-1" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
        </label>

        {error && <p className="text-alerta text-sm">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onCerrar} className="flex-1 py-2 rounded border">Cancelar</button>
          <button type="submit" disabled={enviando} className="flex-1 py-2 rounded bg-primario text-white disabled:opacity-50">
            {enviando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Paso 2: Verificar que compila**

```bash
cd "C:\instalador de inventario\frontend"
npm run build
```

Expected: build exitoso.

- [ ] **Paso 3: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: formulario de alta y edicion de producto`

---

### Task 8: Formulario de movimiento de stock (`StockMovementForm`)

**Files:**
- Create: `frontend/src/components/StockMovementForm.jsx`

**Interfaces:**
- Consumes: `registrarMovimiento` de `api/client.js` (Task 2).
- Produces: `<StockMovementForm producto={...} tipoFijo={'entrada'|'salida'} onCerrar={fn} onGuardado={fn} />`. Si `tipoFijo` es `'salida'`, la nota es obligatoria (valida antes de enviar). La Task 9 lo usa.

- [ ] **Paso 1: Implementar `StockMovementForm.jsx`**

Crear `frontend/src/components/StockMovementForm.jsx`:

```jsx
import { useState } from 'react';
import { registrarMovimiento } from '../api/client.js';

export default function StockMovementForm({ producto, tipoFijo, onCerrar, onGuardado }) {
  const [tipo, setTipo] = useState(tipoFijo ?? 'salida');
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const notaObligatoria = tipo === 'salida';

  async function manejarSubmit(e) {
    e.preventDefault();
    setError(null);
    if (notaObligatoria && !nota.trim()) {
      setError('Contá para qué o a quién se lo diste');
      return;
    }
    setEnviando(true);
    try {
      await registrarMovimiento(producto.id, { tipo, cantidad: Number(cantidad), nota: nota.trim() || undefined });
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={manejarSubmit} className="bg-white rounded-xl p-6 w-80 flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          {tipo === 'entrada' ? '📥 Entrada de stock' : '📤 Salida de stock'} — {producto.nombre}
        </h2>
        <p className="text-sm text-gray-500">Stock actual: {producto.stock_actual} {producto.unidad}</p>

        {!tipoFijo && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setTipo('entrada')} className={`flex-1 py-2 rounded ${tipo === 'entrada' ? 'bg-primario text-white' : 'bg-gray-100'}`}>
              Entrada
            </button>
            <button type="button" onClick={() => setTipo('salida')} className={`flex-1 py-2 rounded ${tipo === 'salida' ? 'bg-primario text-white' : 'bg-gray-100'}`}>
              Salida
            </button>
          </div>
        )}

        <label className="text-sm font-semibold">
          Cantidad
          <input type="number" min="1" className="w-full border rounded px-3 py-2 mt-1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
        </label>

        <label className="text-sm font-semibold">
          Nota {notaObligatoria ? '(obligatoria: ¿a quién/para qué?)' : '(opcional)'}
          <input className="w-full border rounded px-3 py-2 mt-1" value={nota} onChange={(e) => setNota(e.target.value)} required={notaObligatoria} />
        </label>

        {error && <p className="text-alerta text-sm">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onCerrar} className="flex-1 py-2 rounded border">Cancelar</button>
          <button type="submit" disabled={enviando} className="flex-1 py-2 rounded bg-primario text-white disabled:opacity-50">
            {enviando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Paso 2: Verificar que compila**

```bash
cd "C:\instalador de inventario\frontend"
npm run build
```

Expected: build exitoso.

- [ ] **Paso 3: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: formulario de registro de entrada y salida de stock`

---

### Task 9: Grilla de productos (`ProductGrid`) — une todo lo anterior

**Files:**
- Create: `frontend/src/components/ProductGrid.jsx`
- Modify: `frontend/src/App.jsx` (agregar rutas `/libreria` y `/limpieza`)

**Interfaces:**
- Consumes: `getProductos` (Task 2), `useModo` (Task 3), `ModeToggle` (Task 3), `ProductCard` (Task 6), `ProductForm` (Task 7), `StockMovementForm` (Task 8).
- Produces: rutas `/libreria` y `/limpieza`, cada una mostrando la grilla temática de esa categoría con el flujo completo de alta/edición/movimiento funcionando de punta a punta.

- [ ] **Paso 1: Implementar `ProductGrid.jsx`**

Crear `frontend/src/components/ProductGrid.jsx`:

```jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos } from '../api/client.js';
import { useModo } from './ModoContext.jsx';
import ModeToggle from './ModeToggle.jsx';
import ProductCard from './ProductCard.jsx';
import ProductForm from './ProductForm.jsx';
import StockMovementForm from './StockMovementForm.jsx';

const TEMAS = {
  'Librería': { fondo: 'bg-libreria-fondo', emoji: '📚', ruta: '/libreria' },
  'Limpieza': { fondo: 'bg-limpieza-fondo', emoji: '🧼', ruta: '/limpieza' }
};

const CASILLEROS_MINIMOS = 12;

export default function ProductGrid({ categoria }) {
  const navigate = useNavigate();
  const { modo, volverANormal } = useModo();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [productoParaEditar, setProductoParaEditar] = useState(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [movimiento, setMovimiento] = useState(null);

  const recargar = useCallback(() => {
    setCargando(true);
    getProductos(categoria).then(setProductos).finally(() => setCargando(false));
  }, [categoria]);

  useEffect(() => {
    volverANormal();
    recargar();
  }, [categoria, volverANormal, recargar]);

  const tema = TEMAS[categoria];
  const casillerosVacios = Math.max(CASILLEROS_MINIMOS - productos.length, 3);

  return (
    <div className={`min-h-screen ${tema.fondo} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/categorias')} className="text-gray-700 font-semibold">
          ← {tema.emoji} {categoria}
        </button>
        <div className="flex gap-3 items-center">
          <button onClick={() => navigate(`${tema.ruta}/historial`)} className="text-gray-700 underline">
            Historial
          </button>
          <ModeToggle />
        </div>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {productos.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
              modo={modo}
              onEditar={() => setProductoParaEditar(producto)}
              onEntrada={() => setMovimiento({ producto, tipoFijo: 'entrada' })}
              onSalida={() => setMovimiento({ producto, tipoFijo: 'salida' })}
            />
          ))}
          {Array.from({ length: casillerosVacios }).map((_, i) => (
            <button
              key={`vacio-${i}`}
              onClick={() => modo === 'edicion' && setMostrarAlta(true)}
              disabled={modo !== 'edicion'}
              className="rounded-xl border-2 border-dashed border-gray-300 h-32 flex items-center justify-center text-3xl text-gray-300 disabled:cursor-default enabled:hover:border-primario enabled:hover:text-primario"
            >
              +
            </button>
          ))}
        </div>
      )}

      {mostrarAlta && (
        <ProductForm categoria={categoria} onCerrar={() => setMostrarAlta(false)} onGuardado={() => { setMostrarAlta(false); recargar(); }} />
      )}

      {productoParaEditar && (
        <ProductForm
          categoria={categoria}
          producto={productoParaEditar}
          onCerrar={() => setProductoParaEditar(null)}
          onGuardado={() => { setProductoParaEditar(null); recargar(); }}
        />
      )}

      {movimiento && (
        <StockMovementForm
          producto={movimiento.producto}
          tipoFijo={movimiento.tipoFijo}
          onCerrar={() => setMovimiento(null)}
          onGuardado={() => { setMovimiento(null); recargar(); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Paso 2: Agregar las rutas en `App.jsx`**

```jsx
import { Routes, Route } from 'react-router-dom';
import Splash from './components/Splash.jsx';
import CategoriaSelector from './components/CategoriaSelector.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import { ModoProvider } from './components/ModoContext.jsx';

export default function App() {
  return (
    <ModoProvider>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/categorias" element={<CategoriaSelector />} />
        <Route path="/libreria" element={<ProductGrid categoria="Librería" />} />
        <Route path="/limpieza" element={<ProductGrid categoria="Limpieza" />} />
      </Routes>
    </ModoProvider>
  );
}
```

- [ ] **Paso 3: Verificar en el navegador — flujo completo**

Con el backend corriendo (`cd backend && node index.js`) y el frontend (`npm run dev` desde `frontend/`):
1. Entrar, elegir "Librería" → debe verse la grilla vacía con casilleros "+".
2. Los "+" no deben hacer nada en Modo Normal (default). Tocar "Activar Modo Edición".
3. Con Modo Edición activo, tocar un "+" → se abre el formulario de alta. Cargar un producto (ej. nombre "Cuaderno", stock inicial 10, mínimo 3) y guardar → debe aparecer la tarjeta en la grilla.
4. Tocar el botón "+" chico de esa tarjeta → se abre el formulario de entrada, registrar una entrada de 5 → el stock de la tarjeta debe subir a 15.
5. Volver a Modo Normal. Tocar la tarjeta del producto → se abre el formulario de salida con nota obligatoria. Intentar guardar sin nota → debe mostrar error y no cerrar. Completar la nota y guardar → el stock debe bajar.
6. Navegar a Limpieza y volver a Librería — confirmar que el modo vuelve solo a Normal al cambiar de categoría.

Si algo no funciona, revisar la consola del navegador y la terminal del backend antes de dar la tarea por terminada. Parar ambos servidores al terminar.

- [ ] **Paso 4: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: grilla de productos con modo edicion y normal`

---

### Task 10: Historial de movimientos

**Files:**
- Create: `frontend/src/components/Historial.jsx`
- Modify: `frontend/src/App.jsx` (agregar rutas `/libreria/historial` y `/limpieza/historial`)

**Interfaces:**
- Consumes: `getMovimientos` de `api/client.js` (Task 2).
- Produces: rutas `/libreria/historial` y `/limpieza/historial` con tabla de movimientos filtrable por fecha.

- [ ] **Paso 1: Implementar `Historial.jsx`**

Crear `frontend/src/components/Historial.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovimientos } from '../api/client.js';

export default function Historial({ categoria }) {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [cargando, setCargando] = useState(true);

  function cargar() {
    setCargando(true);
    getMovimientos({ categoria, desde: desde || undefined, hasta: hasta || undefined })
      .then(setMovimientos)
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  return (
    <div className="min-h-screen bg-white p-6">
      <button onClick={() => navigate(categoria === 'Librería' ? '/libreria' : '/limpieza')} className="text-gray-700 font-semibold mb-4">
        ← Volver
      </button>
      <h1 className="text-2xl font-bold mb-4">Historial — {categoria}</h1>

      <div className="flex gap-3 mb-4 items-end">
        <label className="text-sm">
          Desde
          <input type="date" className="block border rounded px-2 py-1" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="text-sm">
          Hasta
          <input type="date" className="block border rounded px-2 py-1" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <button onClick={cargar} className="bg-primario text-white px-4 py-2 rounded">Filtrar</button>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-2">{m.fecha}</td>
                <td>{m.producto_nombre}</td>
                <td className={m.tipo === 'entrada' ? 'text-green-600' : 'text-alerta'}>{m.tipo}</td>
                <td>{m.cantidad}</td>
                <td>{m.nota || '—'}</td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-400">Sin movimientos en este rango.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Paso 2: Agregar las rutas en `App.jsx`**

```jsx
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
```

- [ ] **Paso 3: Verificar en el navegador**

Con backend y frontend corriendo: desde la grilla de Librería, tocar "Historial" — debe verse la tabla con los movimientos registrados en la Task 9 (entrada de 5, salida con nota). Probar el filtro por fecha con el rango de hoy. Parar ambos servidores al terminar.

- [ ] **Paso 4: Dejar preparado para commit (no ejecutar)**

Mensaje sugerido: `feat: vista de historial de movimientos`

---

## Checklist final del plan

- [ ] `cd frontend && npm test` corre y pasa (tests de `api/client.js`).
- [ ] `cd frontend && npm run build` compila sin errores.
- [ ] Con el backend corriendo y `npm run dev` en el frontend, el flujo completo funciona en un navegador real: Splash → Ingresar → elegir categoría → activar Modo Edición → agregar producto → registrar entrada → volver a Modo Normal → registrar salida con nota → ver el historial reflejando todo.
- [ ] Nada de esto fue commiteado por quien ejecuta el plan — queda para que el usuario revise y commitee.
