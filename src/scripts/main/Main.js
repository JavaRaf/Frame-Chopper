const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');


let mainWindow;

function createWindow() {
    // Corrigido: Criação correta da nova instância de BrowserWindow
    mainWindow = new BrowserWindow({
        width: 350,
        height: 350,
        frame: false,
        icon: path.resolve(__dirname, '..', '..', 'images', 'icon.ico'),
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,    // Permite usar APIs de Node.js no renderizador
            contextIsolation: false,  // Desativa o isolamento de contexto
            enableRemoteModule: true  // Necessário em algumas versões
        }
    });
    
    mainWindow.setMenu(null);
    mainWindow.loadFile(path.resolve(__dirname, '..', '..', 'html', 'index.html'));
    mainWindow.setResizable(false);

    //mainWindow.webContents.openDevTools({ mode: 'detach' });

}


// padrao do sistema
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});


// quando o app estiver fechado
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Verifica se o FFmpeg está instalado
ipcMain.handle('check-ffmpeg', async () => {
    return new Promise((resolve, reject) => {
        const ffmpegCheck = spawn('ffmpeg', ['-version']);
        
        // Se ocorrer um erro, significa que o FFmpeg não está instalado
        ffmpegCheck.on('error', () => {
            resolve(false); // FFmpeg não encontrado
        });
        
        // Se o FFmpeg estiver instalado, capturamos a saída padrão
        ffmpegCheck.stdout.on('data', (data) => {
            resolve(true); // FFmpeg encontrado
        });
    });
});



ipcMain.on('request-file-path', (event) => {
    const args = process.argv.slice(1); // Ignora o primeiro argumento
    console.log("Todos os argumentos recebidos:", args); // Log todos os argumentos

    if (args.length > 0) {
        const filePath = args[1] || args[0]; // Pega o segundo argumento ou, se não existir, pega o primeiro
        console.log("Arquivo recebido ao iniciar:", filePath);

        // Envia o caminho do arquivo para o renderer process
        event.sender.send('file-opened', filePath);
    } else {
        console.log("Nenhum arquivo recebido ao iniciar.");
        event.sender.send('file-opened', null); // Envia null ou uma mensagem indicando que nenhum arquivo foi recebido
    }
});


ipcMain.handle('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.handle('window-close', () => {
    mainWindow.close();
});

let ffmpegProcess = null; // Variável global para armazenar o processo do FFmpeg

ipcMain.handle('generate', async (event, args) => {
    const { filePath, dist, subtitles, fps, quality } = args;
    const framesDir = path.join(path.dirname(filePath), dist);

    // Verifica se o processo já está rodando
    if (ffmpegProcess) {
        console.log('FFmpeg já está rodando, aguardando o término.');
        event.sender.send('ffmpeg-status', 'Já está em execução.');
        return; // Evita iniciar um novo processo
    }

    if (subtitles === true) {
        extractSubtitle(filePath);
    }

    // Criar o diretório de frames, se não existir
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
        console.log(`Create Frames Directory: ${framesDir}`);
    }

    const ffmpegArgs = [
        '-i', filePath,                                 // Arquivo de entrada (vídeo)
        '-vf', `fps=${fps}`,                            // Filtro de frames por segundo (FPS)
        '-fps_mode', 'vfr',                             // Sincronização de vídeo variável
        '-q:v', `${quality}`,                           // Qualidade dos frames
        `${path.join(framesDir, 'frame_%00d.jpg')}`     // Arquivo de saída (frames)
    ];

    // Inicia o processo do FFmpeg
    ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stderr.on('data', (data) => {
        const message = `stderr: ${data}`;
        console.log(message);

        // Enviar dados de erro para o renderer
        event.sender.send('ffmpeg-progress', message);
    });

    // Quando o processo termina, envia uma mensagem para o renderer
    ffmpegProcess.on('close', (code) => {
        const message = `Processo FFmpeg finalizado com o código ${code}`;
        console.log(message);

        // Enviar dados de finalização para o renderer
        event.sender.send('ffmpeg-status', message);
        ffmpegProcess = null; // Libera a variável
    });
});


function extractSubtitle(filePath) {
    
    const subsDir = path.join(path.dirname(filePath), 'Subtitles');
    if (!fs.existsSync(subsDir)) {
        fs.mkdirSync(subsDir, { recursive: true });
        console.log(`Create Subtitles Directory: ${subsDir}`);
    }

    const outputSubtitlePath = path.join(subsDir, `${path.basename(filePath, path.extname(filePath))}.ass`);

    if (!fs.existsSync(outputSubtitlePath)) {

        const subtitleArgs = [
            '-i', filePath,                                 // Arquivo de entrada (vídeo)
            '-map', '0:s:m:language:eng',                   // Mapeia a faixa de legendas em inglês (usando idioma)
            '-c:s', 'ass',                                  // Define o codec de legendas para 'ass'
            outputSubtitlePath                              // Caminho do arquivo .ass de saída
        ];

        // Usando spawn para maior segurança
        const ffmpegProcess = spawn('ffmpeg', subtitleArgs);

        ffmpegProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        ffmpegProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`Subtitles generated at ${outputSubtitlePath}`);
            } else {
                console.error(`Process exited with code: ${code}`);
            }
        });
    }

}

ipcMain.on('cancel-progress', () => {
    if (ffmpegProcess !== null) {
        ffmpegProcess.kill('SIGINT');
    }
})

ipcMain.on('reload-window', () => {
    if(mainWindow) {
        mainWindow.reload();
    }
})