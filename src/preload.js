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
  searchSubmit: (q) => ipcRenderer.send('search-submit', q),
  dockDragStart: () => ipcRenderer.send('dock-drag-start'),
  dockDragMove: (dx, dy) => ipcRenderer.send('dock-drag-move', { dx, dy }),
  dockDragEnd: () => ipcRenderer.send('dock-drag-end'),
  onDockCursor: (cb) => {
    const listener = (_event, point) => cb(point);
    ipcRenderer.on('dock-cursor', listener);
    return () => ipcRenderer.removeListener('dock-cursor', listener);
  },
  onFocusInput: (cb) => ipcRenderer.on('focus-input', () => cb()),
  onPlay: (cb) => ipcRenderer.on('play', (_e, data) => cb(data)),
});
