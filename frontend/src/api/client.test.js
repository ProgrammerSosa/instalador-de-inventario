import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getProductos, crearProducto, registrarMovimiento, getAlertas, getProductosArchivados } from './client.js';

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

  test('getAlertas pide /api/alertas sin parametros', async () => {
    mockearFetch({ ok: true, data: [{ tipo: 'agotado', producto_id: 1 }] });
    const resultado = await getAlertas();
    expect(resultado).toEqual([{ tipo: 'agotado', producto_id: 1 }]);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/alertas');
  });

  test('getProductosArchivados arma la URL con categoria', async () => {
    mockearFetch({ ok: true, data: [] });
    await getProductosArchivados('Limpieza');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/productos/archivados?categoria=Limpieza');
  });
});
