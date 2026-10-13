const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  summon: (id) => ipcRenderer.send('summon', id),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragMove: (dx, dy) => ipcRenderer.send('drag-move', { dx, dy }),
  buttonMenu: () => ipcRenderer.send('button-menu'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (patch) => ipcRenderer.invoke('set-settings', patch),
  listCustom: () => ipcRenderer.invoke('list-custom'),
  openCharactersFolder: () => ipcRenderer.send('open-characters-folder'),
  overlayDone: () => ipcRenderer.send('overlay-done'),
  onPlay: (cb) => ipcRenderer.on('play', (_e, data) => cb(data)),
});
