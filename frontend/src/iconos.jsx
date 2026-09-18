import {
  Package, Book, BookOpen, Pencil, PenTool, Eraser, Folder, Scissors, Ruler,
  Droplet, SprayCan, Sparkles, Brush, Trash2
} from 'lucide-react';

export const ICONOS_PRODUCTO = {
  Package, Book, BookOpen, Pencil, PenTool, Eraser, Folder, Scissors, Ruler,
  Droplet, SprayCan, Sparkles, Brush, Trash2
};

export const ICONOS_DISPONIBLES = Object.keys(ICONOS_PRODUCTO);

export function IconoProducto({ nombre, ...props }) {
  const Icono = ICONOS_PRODUCTO[nombre] || Package;
  return <Icono {...props} />;
}
