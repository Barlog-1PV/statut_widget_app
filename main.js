const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron')
const path = require('path')
const fs = require('fs')

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json')
let win = null

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch {}
  return { x: null, y: null, status: 0, note: '' }
}

function saveConfig(data) {
  try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(data)) } catch {}
}

function createWindow() {
  const config = loadConfig()
  const { width } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: 220,
    height: 60,
    x: config.x ?? (width - 240),
    y: config.y ?? 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')

  win.on('moved', () => {
    const [x, y] = win.getPosition()
    saveConfig({ ...loadConfig(), x, y })
  })
}

app.whenReady().then(() => {
  createWindow()
  globalShortcut.register('Alt+S', () => {
    if (!win) return
    win.isVisible() ? win.hide() : win.show()
  })
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

ipcMain.handle('get-config', () => loadConfig())
ipcMain.on('save-config', (_, data) => saveConfig({ ...loadConfig(), ...data }))
ipcMain.on('resize', (_, h) => { if (win) win.setSize(220, h, false) })
ipcMain.on('quit', () => app.quit())
