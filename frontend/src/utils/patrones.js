// Patrones decorativos de fondo por categoría, como SVG codificado en un data URI.
// Nada de imágenes externas: son formas simples y sutiles para darle "tematica"
// a cada inventario sin depender de archivos de imagen.

function comoDataUri(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const SVG_LIBRERIA = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
  <g fill="none" stroke="#8b5e34" stroke-width="2" opacity="0.12">
    <rect x="14" y="18" width="20" height="26" rx="2" />
    <line x1="24" y1="18" x2="24" y2="44" />
    <rect x="112" y="24" width="20" height="26" rx="2" transform="rotate(10 122 37)" />
    <line x1="122" y1="24" x2="122" y2="50" transform="rotate(10 122 37)" />
    <rect x="60" y="92" width="18" height="24" rx="2" transform="rotate(-8 69 104)" />
    <line x1="69" y1="92" x2="69" y2="116" transform="rotate(-8 69 104)" />
    <rect x="118" y="110" width="20" height="26" rx="2" />
    <line x1="128" y1="110" x2="128" y2="136" />
  </g>
</svg>
`.trim();

const SVG_LIMPIEZA = `
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
  <g fill="#2f9e5c" opacity="0.12">
    <circle cx="22" cy="24" r="7" />
    <circle cx="76" cy="52" r="11" />
    <circle cx="44" cy="96" r="5" />
    <circle cx="112" cy="20" r="6" />
    <circle cx="108" cy="112" r="9" />
    <circle cx="18" cy="120" r="4" />
  </g>
</svg>
`.trim();

export const PATRON_LIBRERIA = comoDataUri(SVG_LIBRERIA);
export const PATRON_LIMPIEZA = comoDataUri(SVG_LIMPIEZA);
