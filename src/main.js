const { app, BrowserWindow, ipcMain, screen, Menu, shell, globalShortcut, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

let btnWin, overlayWin, settingsWin, dockWin;
let playing = false;
let safetyTimer = null;
let dragStart = null;

const DEFAULTS = { characterId: 'cat-orange', duration: 4, searchDock: true, dockPos: null };
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const charsDir = () => path.join(app.getPath('userData'), 'characters');

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}
function saveSettings(s) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2));
}

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
const DOCK_W = 560, DOCK_H = 270;
const SEARCH_URL = 'https://www.google.com/search?q=';

function createDock() {
  const s = loadSettings();
  const wa = screen.getPrimaryDisplay().workArea;
  let pos = { x: Math.round(wa.x + (wa.width - DOCK_W) / 2), y: wa.y + wa.height - DOCK_H - 10 };
  if (s.dockPos && screen.getAllDisplays().some((d) => {
    const b = d.bounds;
    return s.dockPos.x >= b.x && s.dockPos.x < b.x + b.width - 100 && s.dockPos.y >= b.y && s.dockPos.y < b.y + b.height - 100;
  })) pos = s.dockPos;

  dockWin = new BrowserWindow({
    width: DOCK_W,
    height: DOCK_H,
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
  dockWin.on('closed', () => { dockWin = null; });
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

ipcMain.on('search-submit', (_e, q) => {
  const query = String(q || '').trim().slice(0, 500);
  if (query) shell.openExternal(SEARCH_URL + encodeURIComponent(query));
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
ipcMain.on('summon', (_e, id) => summon(id));
ipcMain.on('overlay-done', finishPlayback);
ipcMain.handle('get-settings', () => loadSettings());
ipcMain.handle('set-settings', (_e, patch) => {
  const next = { ...loadSettings(), ...patch };
  saveSettings(next);
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
