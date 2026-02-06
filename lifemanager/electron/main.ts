// electron/main.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupDB } from './db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open the DevTools.
    win.webContents.openDevTools()
  } else {
    win.loadFile('dist/index.html');
  }
}

app.whenReady().then(async () => {
  await setupDB();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
