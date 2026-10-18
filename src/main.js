const { app, BrowserWindow, ipcMain, screen, Menu, shell, globalShortcut, dialog, net, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const ai = require('./ai');
const CatName = require('./cat-name');
const { pathToFileURL } = require('url');

let btnWin, overlayWin, settingsWin, dockWin, breakWin;
let activeSeconds = 0, snoozeUntil = 0, lastBreakTick = Date.now();
let playing = false;
let safetyTimer = null;
let dragStart = null;
const roamingCat = require('./roaming-cat')({app,BrowserWindow,ipcMain,screen,getDockWindow:()=>dockWin,getPersonality:()=>loadSettings().catPersonality,getCharacter:()=>loadSettings().searchCharacter,preload:path.join(__dirname,'preload.js'),page:path.join(__dirname,'roaming-cat.html')});

const DEV_MODE = !app.isPackaged || process.argv.includes('--dev');
const DEFAULTS = { searchCharacter: 'wizard-cat', characterId: 'cat-orange', duration: 4, searchDock: true, dockPos: null, aiEnabled: false, aiProvider: 'openai', breakReminderEnabled: false, breakReminderMinutes: 60, catPersonality: 'calm', catName: '', puppyName: '', pandaName: '', dockWidth: 560 };
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const charsDir = () => path.join(app.getPath('userData'), 'characters');

function loadSettings() {
  try {
    const settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) };
    settings.searchCharacter = ['wizard-cat','pomeranian','panda'].includes(settings.searchCharacter) ? settings.searchCharacter : 'wizard-cat';
    settings.catName = CatName.normalize(settings.catName);
    settings.puppyName = CatName.normalize(settings.puppyName);
    settings.pandaName = CatName.normalize(settings.pandaName);
    return settings;
  } catch {
    return { ...DEFAULTS };
  }
}
function saveSettings(s) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2));
}

// Only count active computer time. Long sleep/standby gaps are ignored.
function tickBreakReminder() {
  const now = Date.now(), elapsed = now - lastBreakTick;
  lastBreakTick = now;
  const settings = loadSettings();
  if (!settings.breakReminderEnabled || !settings.searchDock) { activeSeconds = 0; return; }
  if (elapsed > 10000 || powerMonitor.getSystemIdleTime() >= 60 || (dockWin && !dockWin.isVisible())) return;
  if (breakWin && !breakWin.isDestroyed()) return;
  if (now < snoozeUntil) return;
  activeSeconds += elapsed / 1000;
  if (activeSeconds >= settings.breakReminderMinutes * 60) {
    activeSeconds = 0;
    showBreakReminder();
  }
}
function showBreakReminder(startStretch = false) {
  if (breakWin && !breakWin.isDestroyed()) {
    if (startStretch) breakWin.webContents.send('break-start-stretch');
    breakWin.show();
    return true;
  }
  if (!dockWin || dockWin.isDestroyed()) return false;
  const b = dockWin.getBounds(), display = screen.getDisplayMatching(b), wa = display.workArea;
  const w = 360, h = 400;
  const x = Math.max(wa.x, Math.min(b.x + b.width - w, wa.x + wa.width - w));
  const y = Math.max(wa.y, Math.min(b.y - h + 65, wa.y + wa.height - h));
  breakWin = new BrowserWindow({ width:w, height:h, x:Math.round(x), y:Math.round(y), frame:false, transparent:true,
    hasShadow:false, resizable:false, skipTaskbar:true, alwaysOnTop:true, fullscreenable:false,
    webPreferences:{preload:path.join(__dirname,'preload.js')} });
  breakWin.setAlwaysOnTop(true, 'floating');
  breakWin.loadFile(path.join(__dirname,'break-reminder.html'), { query: { stretch: startStretch ? '1' : '0' } });
  breakWin.on('closed', () => { breakWin = null; });
  return true;
}
function closeBreakReminder(snooze = true) {
  if (snooze) snoozeUntil = Date.now() + 15 * 60 * 1000;
  activeSeconds = 0;
  if (breakWin && !breakWin.isDestroyed()) breakWin.close();
}
setInterval(tickBreakReminder, 1000).unref();

ipcMain.handle('is-dev-mode', (event) => !!(DEV_MODE && settingsWin && event.sender === settingsWin.webContents));
ipcMain.handle('dev-cat-action', (event, action, value) => {
  if (!DEV_MODE || !settingsWin || event.sender !== settingsWin.webContents) return false;
  if (action === 'break' || action === 'stretch') return showBreakReminder(action === 'stretch');
  if (!dockWin || dockWin.isDestroyed()) return false;
  if (action === 'mood' && ['normal','bored','sleepy','auto'].includes(value)) dockWin.webContents.send('cat-dev-mood', value);
  else if (action === 'wave') dockWin.webContents.send('cat-dev-wave');
  else if (action === 'puppy' && ['idle','welcome','water','snack','play','sit','sleep','wake','blink'].includes(value) && loadSettings().searchCharacter === 'pomeranian') dockWin.webContents.send('companion-dev-action', value);
  else if (action === 'panda' && ['idle','welcome','water','snack','play','sit','sleep','wake','blink'].includes(value) && loadSettings().searchCharacter === 'panda') dockWin.webContents.send('panda-dev-action', value);
  else return false;
  return true;
});
// ---------- custom characters (gif / png / svg / lottie json) ----------
function ensureCharsDir() {
  fs.mkdirSync(charsDir(), { recursive: true });
  const readme = path.join(charsDir(), 'README.txt');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      'Drop your own characters here: .gif .png .webp .svg or Lottie .json files.\n' +
        'Then reopen "Choose character" - they appear under "My characters".\n' +
        'Tip: use transparent backgrounds, roughly square images, character at the bottom.\n'
    );
  }
}

function scanDir(dir, idPrefix, group) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const file of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, file);
    const ext = path.extname(file).toLowerCase();
    const name = path.basename(file, ext);
    const id = idPrefix + file;
    if (['.gif', '.png', '.webp', '.svg', '.jpg', '.jpeg'].includes(ext)) {
      out.push({ id, name, group, type: 'image', url: pathToFileURL(full).href });
    } else if (ext === '.json') {
      try {
        const data = JSON.parse(fs.readFileSync(full, 'utf8'));
        if (data && data.layers) out.push({ id, name, group, type: 'lottie', data });
      } catch (e) {
        console.warn('Bad lottie file', file, e.message);
      }
    }
  }
  return out;
}

function listCustom() {
  ensureCharsDir();
  return [
    ...scanDir(path.join(__dirname, 'characters'), 'bundled:', 'More characters'), // ships with the app
    ...scanDir(charsDir(), 'custom:', 'My characters'), // user's own folder
  ];
}

// ---------- windows ----------
function createOverlay() {
  overlayWin = new BrowserWindow({
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    fullscreenable: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
  }
  overlayWin.setIgnoreMouseEvents(true);
  overlayWin.loadFile(path.join(__dirname, 'overlay.html'));
}

function createButton() {
  const wa = screen.getPrimaryDisplay().workArea;
  btnWin = new BrowserWindow({
    width: 96,
    height: 96,
    x: wa.x + wa.width - 130,
    y: wa.y + wa.height - 150,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    focusable: false,
    skipTaskbar: true,
    fullscreenable: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  btnWin.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    btnWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
  }
  btnWin.loadFile(path.join(__dirname, 'button.html'));
}

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 620,
    height: 720,
    title: 'Choose your support buddy',
    backgroundColor: '#fff7f2',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  settingsWin.removeMenu();
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
}

// ---------- search dock (cat + search bar) ----------
let dockDrag = null;
const DOCK_W = 560, DOCK_H = 270, DOCK_MIN_W = 400;
let dockPanelOpen = false;
function dockWidth(value) { return Number.isFinite(value) ? Math.max(DOCK_MIN_W, Math.min(DOCK_W, Math.round(value))) : DOCK_W; }
function dockHeight(width) { return Math.round(DOCK_H * width / DOCK_W); }
function resizeDock(width) {
  if (!dockWin || dockWin.isDestroyed()) return;
  width = dockWidth(width);
  const b = dockWin.getBounds(), wa = screen.getDisplayMatching(b).workArea;
  const height = Math.min(dockHeight(width) + (dockPanelOpen ? 330 : 0), wa.height);
  dockWin.setBounds({ x: Math.max(wa.x, Math.min(b.x, wa.x + wa.width - width)), y: Math.max(wa.y, Math.min(b.y + b.height - height, wa.y + wa.height - height)), width, height });
}
ipcMain.on('dock-resize', (event, width) => {
  if (!dockWin || event.sender !== dockWin.webContents || !Number.isFinite(width)) return;
  resizeDock(width);
});
ipcMain.on('dock-resize-end', event => {
  if (!dockWin || dockWin.isDestroyed() || event.sender !== dockWin.webContents) return;
  const b = dockWin.getBounds();
  saveSettings({ ...loadSettings(), dockWidth: b.width, dockPos: { x:b.x, y:b.y } });
});
const SEARCH_URL = 'https://www.google.com/search?q=';

function createDock() {
  const s = loadSettings();
  const wa = screen.getPrimaryDisplay().workArea;
  const width = dockWidth(s.dockWidth), height = dockHeight(width);
  dockPanelOpen = false;
  let pos = { x: Math.round(wa.x + (wa.width - width) / 2), y: wa.y + wa.height - height - 10 };
  if (s.dockPos && screen.getAllDisplays().some((d) => {
    const b = d.bounds;
    return s.dockPos.x >= b.x && s.dockPos.x < b.x + b.width - 100 && s.dockPos.y >= b.y && s.dockPos.y < b.y + b.height - 100;
  })) pos = s.dockPos;

  dockWin = new BrowserWindow({
    width,
    height,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    fullscreenable: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  dockWin.setAlwaysOnTop(true, 'floating');
  if (process.platform === 'darwin') {
    dockWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
  }
  dockWin.loadFile(path.join(__dirname, 'dock.html'));
  dockWin.on('moved', () => {
    if (dockWin && !dockWin.isDestroyed()) {
      const [x, y] = dockWin.getPosition();
      saveSettings({ ...loadSettings(), dockPos: { x, y } });
    }
  });
  // Screen coordinates keep tracking outside the draggable transparent dock.
  const cursorTimer = setInterval(() => {
    if (!dockWin || dockWin.isDestroyed() || !dockWin.isVisible() || dockWin.webContents.isLoading()) return;
    const cursor = screen.getCursorScreenPoint();
    const bounds = dockWin.getContentBounds();
    dockWin.webContents.send('dock-cursor', { clientX: cursor.x - bounds.x, clientY: cursor.y - bounds.y, dragging: !!dockDrag });
  }, 33);
  dockWin.on('closed', () => { clearInterval(cursorTimer); dockDrag = null; dockWin = null; });
}

function applySearchDock() {
  const on = loadSettings().searchDock;
  if (on) {
    if (!dockWin || dockWin.isDestroyed()) createDock();
    else dockWin.show();
  } else if (dockWin && !dockWin.isDestroyed()) {
    dockWin.close();
  }
}

function toggleSearchDock() {
  saveSettings({ ...loadSettings(), searchDock: !loadSettings().searchDock });
  applySearchDock();
}

function focusSearchDock() {
  if (!dockWin || dockWin.isDestroyed()) return;
  if (process.platform === 'darwin') app.focus({ steal: true });
  dockWin.show();
  dockWin.focus();
  dockWin.webContents.send('focus-input');
}

ipcMain.on('dock-drag-start', (event) => {
  if (!dockWin || event.sender !== dockWin.webContents) return;
  const [x, y] = dockWin.getPosition();
  dockDrag = { x, y };
});
ipcMain.on('dock-drag-move', (event, { dx, dy }) => {
  if (!dockWin || event.sender !== dockWin.webContents || !dockDrag || !Number.isFinite(dx) || !Number.isFinite(dy)) return;
  dockWin.setPosition(Math.round(dockDrag.x + dx), Math.round(dockDrag.y + dy));
});
ipcMain.on('dock-drag-end', (event) => {
  if (dockWin && event.sender === dockWin.webContents) dockDrag = null;
});

ipcMain.on('search-submit', (_e, q) => {
  const query = String(q || '').trim().slice(0, 500);
  if (query) shell.openExternal(SEARCH_URL + encodeURIComponent(query));
});

// AI keys stay in the main process; renderer receives only configured status.
let aiBusy = false;
ipcMain.on('open-settings', openSettings);
ipcMain.handle('ai-models', (event, provider) => {
  if (!settingsWin || event.sender !== settingsWin.webContents) throw Error('Open Settings first.');
  return ai.listModels(provider);
});
ipcMain.handle('ai-status', (_event, provider) => ai.status(provider));
ipcMain.handle('ai-save', (event, provider, key) => {
  if (!settingsWin || event.sender !== settingsWin.webContents) throw Error('Open Settings to save a key.');
  return ai.saveKey(provider, key);
});
ipcMain.handle('ai-chat', async (event, messages) => {
  if (!dockWin || event.sender !== dockWin.webContents || !loadSettings().aiEnabled) throw Error('Enable AI first.');
  if (aiBusy) throw Error('Please wait for the current reply.');
  aiBusy = true;
  try { return await ai.chat(loadSettings().aiProvider, messages, loadSettings().aiModels?.[loadSettings().aiProvider]); }
  finally { aiBusy = false; }
});
ipcMain.handle('ai-panel', (event, open) => {
  if (!dockWin || event.sender !== dockWin.webContents) return;
  const b = dockWin.getBounds();
  const wa = screen.getDisplayMatching(b).workArea;
  dockPanelOpen = !!open;
  const width = dockWidth(b.width);
  const height = Math.min(dockHeight(width) + (dockPanelOpen ? 330 : 0), wa.height);
  dockWin.setBounds({ x: b.x, y: Math.max(wa.y, Math.min(b.y, wa.y + wa.height - height)), width, height });
});

// ---------- summon ----------
function finishPlayback() {
  clearTimeout(safetyTimer);
  playing = false;
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.hide();
}

function summon(characterId) {
  if (playing || !overlayWin) return;
  playing = true;
  const s = loadSettings();
  const display = screen.getDisplayMatching(btnWin.getBounds());
  overlayWin.setBounds(display.bounds);
  overlayWin.showInactive();
  overlayWin.webContents.send('play', {
    characterId: characterId || s.characterId,
    duration: s.duration,
  });
  safetyTimer = setTimeout(finishPlayback, (s.duration + 6) * 1000);
}

// ---------- IPC ----------
ipcMain.on('break-dismiss', (event, snooze) => { if (breakWin && event.sender === breakWin.webContents) closeBreakReminder(snooze !== false); });
ipcMain.on('summon', (_e, id) => summon(id));
ipcMain.on('overlay-done', finishPlayback);
ipcMain.handle('get-settings', () => loadSettings());
ipcMain.handle('set-settings', (_e, patch) => {
  const next = { ...loadSettings(), ...patch };
  next.breakReminderEnabled = !!next.breakReminderEnabled;
  next.breakReminderMinutes = [30,45,60,90,120].includes(Number(next.breakReminderMinutes)) ? Number(next.breakReminderMinutes) : 60;
  next.catPersonality = ['calm', 'playful', 'sleepy'].includes(next.catPersonality) ? next.catPersonality : 'calm';
  next.searchCharacter = ['wizard-cat','pomeranian','panda'].includes(next.searchCharacter) ? next.searchCharacter : 'wizard-cat';
  next.catName = CatName.normalize(next.catName);
  next.puppyName = CatName.normalize(next.puppyName);
  next.pandaName = CatName.normalize(next.pandaName);
  saveSettings(next);
  if ('searchCharacter' in patch) {
    roamingCat.home();
    if (dockWin && !dockWin.isDestroyed()) dockWin.webContents.send('search-character', next.searchCharacter);
  }
  if ('catName' in patch) {
    for (const win of [dockWin, breakWin]) if (win && !win.isDestroyed()) win.webContents.send('cat-name', next.catName);
  }
  if ('puppyName' in patch && dockWin && !dockWin.isDestroyed()) dockWin.webContents.send('puppy-name', next.puppyName);
  if ('pandaName' in patch && dockWin && !dockWin.isDestroyed()) dockWin.webContents.send('panda-name', next.pandaName);
  if ('catPersonality' in patch && dockWin && !dockWin.isDestroyed()) dockWin.webContents.send('cat-personality', next.catPersonality);
  if (!next.breakReminderEnabled) closeBreakReminder(false);
  if ('searchDock' in patch) applySearchDock();
  return next;
});
ipcMain.handle('list-custom', () => listCustom());
ipcMain.on('open-characters-folder', () => {
  ensureCharsDir();
  shell.openPath(charsDir());
});

ipcMain.on('drag-start', () => {
  const [x, y] = btnWin.getPosition();
  dragStart = { x, y };
});
ipcMain.on('drag-move', (_e, { dx, dy }) => {
  if (dragStart) btnWin.setPosition(Math.round(dragStart.x + dx), Math.round(dragStart.y + dy));
});

ipcMain.on('button-menu', () => {
  Menu.buildFromTemplate([
    { label: 'Summon now', click: () => summon() },
    { label: 'Choose character…', click: openSettings },
    { label: 'Search dock', type: 'checkbox', checked: loadSettings().searchDock, click: toggleSearchDock },
    { type: 'separator' },
    { label: `Check for updates… (v${app.getVersion()})`, click: () => checkForUpdates(true) },
    { label: 'Quit', click: () => app.quit() },
  ]).popup({ window: btnWin });
});

// ---------- updates ----------
// Windows: electron-updater (auto download + install on restart).
// macOS (unsigned app): can't self-install, so we check GitHub and point to the download page.
const publishCfg = require('./update-config.json');
let winUpdaterReady = false;
let manualCheck = false;

function versionIsNewer(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(Number);
  const pb = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

function setupWinUpdater() {
  if (winUpdaterReady) return;
  winUpdaterReady = true;
  const { autoUpdater } = require('electron-updater');
  autoUpdater.on('update-available', (info) => {
    if (manualCheck) dialog.showMessageBox({ message: `Version ${info.version} found. Downloading in the background…` });
  });
  autoUpdater.on('update-not-available', () => {
    if (manualCheck) dialog.showMessageBox({ message: 'You are on the latest version.' });
    manualCheck = false;
  });
  autoUpdater.on('error', (e) => {
    if (manualCheck) dialog.showMessageBox({ type: 'error', message: 'Update check failed: ' + e.message });
    manualCheck = false;
  });
  autoUpdater.on('update-downloaded', async (info) => {
    manualCheck = false;
    const r = await dialog.showMessageBox({
      message: `Version ${info.version} is ready to install.`,
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
    });
    if (r.response === 0) autoUpdater.quitAndInstall();
  });
}

async function checkForUpdates(manual = false) {
  manualCheck = manual;
  if (!app.isPackaged) {
    if (manual) dialog.showMessageBox({ message: 'Updates only work in the installed app, not in dev mode.' });
    return;
  }
  try {
    if (process.platform === 'win32') {
      setupWinUpdater();
      require('electron-updater').autoUpdater.checkForUpdates();
      return;
    }
    const url = `https://api.github.com/repos/${publishCfg.owner}/${publishCfg.repo}/releases/latest`;
    const res = await net.fetch(url, { headers: { 'User-Agent': 'emotional-support-pet' } });
    if (!res.ok) throw new Error('GitHub answered ' + res.status);
    const rel = await res.json();
    if (versionIsNewer(rel.tag_name, app.getVersion())) {
      const r = await dialog.showMessageBox({
        message: `Version ${rel.tag_name.replace(/^v/, '')} is available (you have ${app.getVersion()}).`,
        detail: 'Download the new .dmg and drag the app into Applications to replace the old one.',
        buttons: ['Open download page', 'Later'],
        defaultId: 0,
      });
      if (r.response === 0) shell.openExternal(rel.html_url);
    } else if (manual) {
      dialog.showMessageBox({ message: 'You are on the latest version.' });
    }
  } catch (e) {
    if (manual) dialog.showMessageBox({ type: 'error', message: 'Update check failed: ' + e.message });
  }
}

// ---------- lifecycle ----------
app.whenReady().then(() => {
  ensureCharsDir();
  createOverlay();
  createButton();
  globalShortcut.register('CommandOrControl+Shift+H', () => summon());
  globalShortcut.register('CommandOrControl+Shift+S', focusSearchDock);
  applySearchDock();
  setTimeout(() => checkForUpdates(false), 5000);
});
app.on('activate', openSettings);
app.on('window-all-closed', () => {});
app.on('will-quit', () => globalShortcut.unregisterAll());
