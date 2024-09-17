const { ipcMain, app, BrowserWindow, dialog } = require('electron');
const path = require('path'); 
const fs = require('fs');
const { spawn, exec } = require('child_process');


let mainWindow;

function createWindow() {
    // Corrigido: Criação correta da nova instância de BrowserWindow
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,    // Permite usar APIs de Node.js no renderizador
            contextIsolation: false,  // Desativa o isolamento de contexto
            enableRemoteModule: true  // Necessário em algumas versões
        }
    });

    // Carrega o arquivo HTML
    mainWindow.loadFile(path.join(__dirname,'index.html'));

    // Abre as ferramentas de desenvolvedor
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);



ipcMain.handle('generate', async (event, args) => {

    console.log(args);
});


