const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { crearConexion } = require('../backend/config/database');
const { crearApp } = require('../backend/server');
const { crearProductosModel } = require('../backend/src/productos/productos_model');
const { crearMovimientosModel } = require('../backend/src/movimientos/movimientos_model');
const { crearConfigModel } = require('../backend/src/config/config_model');
const { generarExcelBuffer } = require('../backend/src/exportar/exportar_service');
const { construirAlertaRespaldo } = require('../backend/src/alertas/alertas_model');

const PUERTO = 4000;
const DIAS_RESPALDO_AUTOMATICO = 7;
const MAX_RESPALDOS_AUTOMATICOS = 10;

let modelos;
let dbPath;

function pad(n) {
  return String(n).padStart(2, '0');
}

function marcaDeTiempo() {
  const ahora = new Date();
  return `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}-${pad(ahora.getHours())}${pad(ahora.getMinutes())}`;
}

function fechaLocalSql() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())} ${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
}

function carpetaRespaldosAutomaticos() {
  const carpeta = path.join(app.getPath('userData'), 'respaldos-automaticos');
  fs.mkdirSync(carpeta, { recursive: true });
  return carpeta;
}

// Los respaldos automaticos no tienen limpieza manual (corren solos, sin
// supervision), asi que se podan solos para no llenar el disco con años de uso.
function limpiarRespaldosViejos(carpeta) {
  const archivos = fs
    .readdirSync(carpeta)
    .map((nombre) => {
      const ruta = path.join(carpeta, nombre);
      return { ruta, mtime: fs.statSync(ruta).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  for (const archivo of archivos.slice(MAX_RESPALDOS_AUTOMATICOS)) {
    fs.unlinkSync(archivo.ruta);
  }
}

async function respaldoAutomaticoSiCorresponde() {
  const ultimoRespaldo = modelos.config.obtener('ultimo_respaldo_fecha');
  const alerta = construirAlertaRespaldo(ultimoRespaldo, DIAS_RESPALDO_AUTOMATICO);
  if (!alerta) return;

  try {
    const carpeta = carpetaRespaldosAutomaticos();
    const sello = marcaDeTiempo();
    fs.copyFileSync(dbPath, path.join(carpeta, `inventario-${sello}.db`));
    const buffer = await generarExcelBuffer(modelos.productos, modelos.movimientos);
    fs.writeFileSync(path.join(carpeta, `inventario-${sello}.xlsx`), buffer);
    modelos.config.guardar('ultimo_respaldo_fecha', fechaLocalSql());
    limpiarRespaldosViejos(carpeta);
  } catch (err) {
    console.error('No se pudo hacer el respaldo automatico:', err);
  }
}

function registrarHandlersIpc() {
  ipcMain.handle('respaldo:copiar-db', async () => {
    const resultado = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (resultado.canceled || resultado.filePaths.length === 0) return { ok: false, cancelado: true };

    const destino = path.join(resultado.filePaths[0], `inventario-${marcaDeTiempo()}.db`);
    fs.copyFileSync(dbPath, destino);
    modelos.config.guardar('ultimo_respaldo_fecha', fechaLocalSql());
    return { ok: true, ruta: destino };
  });

  ipcMain.handle('respaldo:exportar-excel', async () => {
    const resultado = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (resultado.canceled || resultado.filePaths.length === 0) return { ok: false, cancelado: true };

    const destino = path.join(resultado.filePaths[0], `inventario-${marcaDeTiempo()}.xlsx`);
    const buffer = await generarExcelBuffer(modelos.productos, modelos.movimientos);
    fs.writeFileSync(destino, buffer);
    return { ok: true, ruta: destino };
  });

  ipcMain.handle('respaldo:ultimo', () => {
    return modelos.config.obtener('ultimo_respaldo_fecha');
  });
}

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    title: 'Gestor de Inventario',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  ventana.loadURL(`http://localhost:${PUERTO}`);
}

app.whenReady().then(async () => {
  dbPath = path.join(app.getPath('userData'), 'inventario.db');
  const db = crearConexion(dbPath);

  modelos = {
    productos: crearProductosModel(db),
    movimientos: crearMovimientosModel(db),
    config: crearConfigModel(db)
  };

  const expressApp = crearApp(db, { staticDir: path.join(__dirname, '..', 'frontend', 'dist') });
  expressApp.listen(PUERTO, '0.0.0.0', () => {
    console.log(`Backend escuchando en http://0.0.0.0:${PUERTO}`);
  });

  registrarHandlersIpc();
  await respaldoAutomaticoSiCorresponde();
  crearVentana();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
