const { app, BrowserWindow } = require('electron');
const ws = require('ws');
const server = require('./server');
const path = require('path');

// try {
//   require('electron-reloader')(module)
// } catch (_) { }

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      autoHideMenuBar: true,
    },
  });
  // and load the index.html of the app.
  mainWindow.removeMenu()
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.loadURL(`http://localhost:8080/search`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function () {
    //mainWindow = null
  })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('show', () => {
  setTimeout(() => {
    app.focus();
  }, 200);
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    process.exit(1);
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
