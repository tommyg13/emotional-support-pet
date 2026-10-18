const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  isDevMode: () => ipcRenderer.invoke('is-dev-mode'),
  devCatAction: (action, value) => ipcRenderer.invoke('dev-cat-action', action, value),
  onStartStretch: (cb) => {
    const listener = () => cb();
    ipcRenderer.on('break-start-stretch', listener);
    return () => ipcRenderer.removeListener('break-start-stretch', listener);
  },
  dismissBreak: (snooze = true) => ipcRenderer.send('break-dismiss', snooze),
  summon: (id) => ipcRenderer.send('summon', id),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragMove: (dx, dy) => ipcRenderer.send('drag-move', { dx, dy }),
  buttonMenu: () => ipcRenderer.send('button-menu'),
  onSearchCharacter: cb => {const fn=(_e,id)=>cb(id);ipcRenderer.on('search-character',fn);return()=>ipcRenderer.removeListener('search-character',fn);},
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
  releaseCat: () => ipcRenderer.invoke('cat-release'),
  returnCat: () => ipcRenderer.invoke('cat-home'),
  searchTyping:()=>ipcRenderer.send('cat-search-typing'),
  onRoamCurious:cb=>{const fn=(_e,value)=>cb(value);ipcRenderer.on('cat-roam-curious',fn);return()=>ipcRenderer.removeListener('cat-roam-curious',fn);},
  roamCommand: command => ipcRenderer.invoke('cat-roam-command',command),
  onRoamCommand: cb => {const fn=(_e,value)=>cb(value);ipcRenderer.on('cat-roam-command',fn);return()=>ipcRenderer.removeListener('cat-roam-command',fn);},
  roamHomeArrived: () => ipcRenderer.send('cat-home-arrived'),
  roamHomeCancelled: () => ipcRenderer.send('cat-home-cancelled'),
  onRoamHome: cb => {const fn=(_e,p)=>cb(p);ipcRenderer.on('cat-roam-home',fn);return()=>ipcRenderer.removeListener('cat-roam-home',fn);},
  onRoamTarget: cb => {const fn=(_e,p)=>cb(p);ipcRenderer.on('cat-roam-target',fn);return()=>ipcRenderer.removeListener('cat-roam-target',fn);},
  onRoamClicks: cb => {const fn=(_e,value)=>cb(value);ipcRenderer.on('cat-roam-clicks',fn);return()=>ipcRenderer.removeListener('cat-roam-clicks',fn);},
  roamHit: rect => ipcRenderer.send('cat-roam-hit',rect),
  roamHeld: held => ipcRenderer.send('cat-roam-held',held),
  onCatRoaming: cb => { const listener=(_event,value)=>cb(value);ipcRenderer.on('cat-roaming',listener);return()=>ipcRenderer.removeListener('cat-roaming',listener); },
  searchSubmit: (q) => ipcRenderer.send('search-submit', q),
  dockResize: width => ipcRenderer.send('dock-resize', width),
  dockResizeEnd: () => ipcRenderer.send('dock-resize-end'),
  dockDragStart: () => ipcRenderer.send('dock-drag-start'),
  dockDragMove: (dx, dy) => ipcRenderer.send('dock-drag-move', { dx, dy }),
  dockDragEnd: () => ipcRenderer.send('dock-drag-end'),
  onPandaName: cb => {
    const listener=(_event,name)=>cb(name);ipcRenderer.on('panda-name',listener);return ()=>ipcRenderer.removeListener('panda-name',listener);
  },
  onPuppyName: cb => {
    const listener = (_event, name) => cb(name);
    ipcRenderer.on('puppy-name', listener);
    return () => ipcRenderer.removeListener('puppy-name', listener);
  },
  onCatName: (cb) => {
    const listener = (_event, name) => cb(name);
    ipcRenderer.on('cat-name', listener);
    return () => ipcRenderer.removeListener('cat-name', listener);
  },
  onCatPersonality: (cb) => {
    const listener = (_event, value) => cb(value);
    ipcRenderer.on('cat-personality', listener);
    return () => ipcRenderer.removeListener('cat-personality', listener);
  },
  onDevCatAction: (cb) => {
    const mood = (_event, value) => cb('mood', value);
    const wave = () => cb('wave');
    const companion = (_event, value) => cb('puppy', value);
    const panda=(_event,value)=>cb('panda',value);
    ipcRenderer.on('cat-dev-mood', mood);
    ipcRenderer.on('cat-dev-wave', wave);
    ipcRenderer.on('companion-dev-action', companion);
    ipcRenderer.on('panda-dev-action',panda);
    return () => { ipcRenderer.removeListener('cat-dev-mood', mood); ipcRenderer.removeListener('cat-dev-wave', wave); ipcRenderer.removeListener('companion-dev-action', companion);ipcRenderer.removeListener('panda-dev-action',panda); };
  },
  onDockCursor: (cb) => {
    const listener = (_event, point) => cb(point);
    ipcRenderer.on('dock-cursor', listener);
    return () => ipcRenderer.removeListener('dock-cursor', listener);
  },
  onFocusInput: (cb) => ipcRenderer.on('focus-input', () => cb()),
  onPlay: (cb) => ipcRenderer.on('play', (_e, data) => cb(data)),
});
