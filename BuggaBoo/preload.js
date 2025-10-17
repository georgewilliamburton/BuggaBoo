const { contextBridge, ipcRenderer } = require('electron');

// Minimal safe API - expand later if you need native features
contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping')
});
