// Patrones decorativos de fondo por categoría, como SVG codificado en un data URI.
// Nada de imágenes externas: son formas simples pero reconocibles, para darle
// "temática" a cada inventario sin depender de archivos de imagen.

function comoDataUri(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function libroSvg(x, y, escala, rotacion) {
  const t = `translate(${x} ${y}) scale(${escala}) rotate(${rotacion})`;
  return `
  <g transform="${t}" opacity="0.15">
    <rect x="3" y="1" width="16" height="24" rx="1" fill="#fdf6e8" />
    <rect x="0" y="0" width="16" height="24" rx="1.5" fill="#8b5e34" />
    <rect x="0" y="0" width="16" height="24" rx="1.5" fill="none" stroke="#6b4423" stroke-width="1" />
    <line x1="3" y1="0" x2="3" y2="24" stroke="#6b4423" stroke-width="0.8" />
    <line x1="7" y1="7" x2="13" y2="7" stroke="#6b4423" stroke-width="0.8" />
    <line x1="7" y1="10" x2="12" y2="10" stroke="#6b4423" stroke-width="0.8" />
  </g>`;
}

// Pocos libros, grandes y bien espaciados: a este tamaño de tile, muchos
// libros chicos se ven como "confeti" ilegible en vez de libros reconocibles.
const SVG_LIBRERIA = `
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
  ${libroSvg(20, 24, 2.3, -8)}
  ${libroSvg(140, 120, 2, 10)}
</svg>
`.trim();

function burbujaSvg(cx, cy, r) {
  return `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#brillo)" stroke="#1f7a48" stroke-width="0.6" stroke-opacity="0.35" />`;
}

const SVG_LIMPIEZA = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
  <defs>
    <radialGradient id="brillo" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="45%" stop-color="#2f9e5c" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#2f9e5c" stop-opacity="0.3" />
    </radialGradient>
  </defs>
  ${burbujaSvg(28, 30, 16)}
  ${burbujaSvg(95, 55, 22)}
  ${burbujaSvg(55, 110, 11)}
  ${burbujaSvg(135, 25, 10)}
  ${burbujaSvg(130, 130, 18)}
  ${burbujaSvg(15, 135, 9)}
</svg>
`.trim();

export const PATRON_LIBRERIA = comoDataUri(SVG_LIBRERIA);
export const PATRON_LIMPIEZA = comoDataUri(SVG_LIMPIEZA);
