// Modules to control application life and create native browser window
const path = require('path');
import { app, BrowserWindow, ipcMain } from 'electron';
import { dbHelper, initHandles } from './IPCHandle';
import { CreateAllTables } from './createTables';

const { UMI_ENV } = process.env;

function createWindow() {
  console.log('init window');
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
  });

  if (UMI_ENV == 'dev') {
    // http://localhost:8000
    mainWindow.loadURL('http://localhost:8000/');
    // mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // and load the index.html of the app.
    // todo production use static files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // ipc handles
  const IPCHandle = initHandles();
  for (let [name, fn] of IPCHandle) {
    ipcMain.handle(name, (e, ...args) => {
      return fn(...args);
    });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // init db helper
  let err = await dbHelper.init();
  if (err) {
    console.error('init sqlite db failed');
    return;
  }
  console.log('init sqlite db success');

  err = await CreateAllTables(dbHelper);
  if (err) {
    console.error(`create all tables error ${err.message}`);
    return;
  }
  console.log(`create all tables done`);

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
