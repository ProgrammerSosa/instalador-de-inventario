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

