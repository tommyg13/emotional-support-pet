const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  isDevMode: () => ipcRenderer.invoke('is-dev-mode'),
  devCatAction: (action, value) => ipcRenderer.invoke('dev-cat-action', action, value),
  dismissBreak: (snooze = true) => ipcRenderer.send('break-dismiss', snooze),
  summon: (id) => ipcRenderer.send('summon', id),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragMove: (dx, dy) => ipcRenderer.send('drag-move', { dx, dy }),
  buttonMenu: () => ipcRenderer.send('button-menu'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (patch) => ipcRenderer.invoke('set-settings', patch),
  listCustom: () => ipcRenderer.invoke('list-custom'),
  openCharactersFolder: () => ipcRenderer.send('open-characters-folder'),
  overlayDone: () => ipcRenderer.send('overlay-done'),
  aiModels: (provider) => ipcRenderer.invoke('ai-models', provider),
  aiStatus: (provider) => ipcRenderer.invoke('ai-status', provider),
  aiSave: (provider, key) => ipcRenderer.invoke('ai-save', provider, key),
  aiChat: (messages) => ipcRenderer.invoke('ai-chat', messages),
  aiPanel: (open) => ipcRenderer.invoke('ai-panel', open),
  openSettings: () => ipcRenderer.send('open-settings'),
  searchSubmit: (q) => ipcRenderer.send('search-submit', q),
  dockDragStart: () => ipcRenderer.send('dock-drag-start'),
  dockDragMove: (dx, dy) => ipcRenderer.send('dock-drag-move', { dx, dy }),
  dockDragEnd: () => ipcRenderer.send('dock-drag-end'),
  onCatPersonality: (cb) => {
    const listener = (_event, value) => cb(value);
    ipcRenderer.on('cat-personality', listener);
    return () => ipcRenderer.removeListener('cat-personality', listener);
  },
  onDevCatAction: (cb) => {
    const mood = (_event, value) => cb('mood', value);
    const wave = () => cb('wave');
    ipcRenderer.on('cat-dev-mood', mood);
    ipcRenderer.on('cat-dev-wave', wave);
    return () => { ipcRenderer.removeListener('cat-dev-mood', mood); ipcRenderer.removeListener('cat-dev-wave', wave); };
  },
  onDockCursor: (cb) => {
    const listener = (_event, point) => cb(point);
    ipcRenderer.on('dock-cursor', listener);
    return () => ipcRenderer.removeListener('dock-cursor', listener);
  },
  onFocusInput: (cb) => ipcRenderer.on('focus-input', () => cb()),
  onPlay: (cb) => ipcRenderer.on('play', (_e, data) => cb(data)),
});
