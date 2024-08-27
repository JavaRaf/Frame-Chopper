const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Função para criar a janela
function createWindow() {
    const win = new BrowserWindow({
        width: 550,
        height: 335,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    win.loadFile(path.join(__dirname, 'public', 'index.html')); 
}

// Quando o app estiver pronto, cria a janela
app.whenReady().then(createWindow);

// Trata o fechamento da janela principal
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Cria uma nova janela se o app for ativado e não houver janelas abertas
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


app.on()
