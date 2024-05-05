import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { closeServer, createServer } from './server'
import Store from 'electron-store'

function createWindow(config?: Electron.BrowserWindowConstructorOptions, path = ''): BrowserWindow {
  // Create the browser window.
  const window = new BrowserWindow(config)
  window.on('ready-to-show', () => {
    window.show()
  })
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#${path}`)
  } else {
    window.loadFile(`${join(__dirname, '../renderer/index.html')}/${path}`)
  }

  return window
}

function createMainWindow() {
  const mainWindow = createWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createMainWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// handel open new window
ipcMain.handle('open-new-win', (_, path) => {
  createWindow(
    {
      autoHideMenuBar: true,
      show: false,
      title: path,
      parent: BrowserWindow.getFocusedWindow() ?? undefined,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: join(__dirname, '../preload/index.js')
      }
    },
    path
  )
})

ipcMain.on('close-win', () => {
  BrowserWindow.getFocusedWindow()?.close()
})

ipcMain.on('open-dev-tools', () => {
  BrowserWindow.getFocusedWindow()?.webContents.openDevTools()
})

// 转发
ipcMain.handle('forward-stream', () => {
  const port = 8080
  createServer(port)
  return port
})
ipcMain.handle('close-server', () => {
  closeServer()
})

// 持久化
const store = new Store()

ipcMain.handle('get-store', (_, key: string) => {
  return store.get(key)
})

ipcMain.handle('set-store', (_, key: string, value: unknown) => {
  store.set(key, value)
})

ipcMain.handle('delete-store', (_, key: string) => {
  store.delete(key)
})
