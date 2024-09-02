const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 385,
        height: 385,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true, // Habilita integração com Node.js
            contextIsolation: false, // Desabilita isolamento de contexto
            enableRemoteModule: true // Habilita módulos remotos     
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


// abri o file browser com um click
ipcMain.handle('select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog( mainWindow, {
        properties: ['openFile'],
        title: 'Select your video file',
        filters: [
            { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] }
        ]
    });
    return canceled ? null : filePaths[0];
});

