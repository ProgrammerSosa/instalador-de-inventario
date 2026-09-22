const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  copiarRespaldoDB: () => ipcRenderer.invoke('respaldo:copiar-db'),
  exportarExcel: () => ipcRenderer.invoke('respaldo:exportar-excel'),
  obtenerUltimoRespaldo: () => ipcRenderer.invoke('respaldo:ultimo')
});
