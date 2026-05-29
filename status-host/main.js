const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron')
const path = require('path')
const fs = require('fs')
const express = require('express')

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json')
let win = null
const expressApp = express()
const PORT = 3000

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch {}
  return { x: null, y: null, status: 0, note: '' }
}

function saveConfig(data) {
  try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(data)) } catch {}
}

expressApp.get('/api/status', (req, res) => {
  const config = loadConfig()
  res.json({
    status: config.status,
    note: config.note || ''
  })
})

expressApp.listen(PORT, '0.0.0.0')

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
    alwaysOnTopLevel: 'screen-saver',
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
  win.setAlwaysOnTop(true, 'screen-saver')

  setInterval(() => {
    if (win) win.setAlwaysOnTop(true, 'screen-saver')
  }, 1000)

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