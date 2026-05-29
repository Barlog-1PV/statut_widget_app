const { app, BrowserWindow, screen, ipcMain, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const CONFIG_PATH = path.join(app.getPath('userData'), 'config-client.json')
let win = null

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch {}
  return { serverIp: '127.0.0.1' }
}

function createWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: 220,
    height: 85,
    x: width - 240,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    alwaysOnTopLevel: 'screen-saver',
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    thickFrame: false,
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
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

ipcMain.handle('get-ip', () => {
  return loadConfig().serverIp
})

ipcMain.on('window-drag', (event, pos) => {
  if (win) {
    const cursor = screen.getCursorScreenPoint()
    win.setPosition(cursor.x - pos.mouseX, cursor.y - pos.mouseY)
  }
})

ipcMain.on('show-context-menu', (event) => {
  const template = [
    {
      label: "Quitter l'application",
      click: () => { app.quit() }
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  menu.popup(BrowserWindow.fromWebContents(event.sender))
})