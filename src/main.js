const { ipcMain, app, BrowserWindow, dialog } = require('electron');
const path = require('path'); 
const fs = require('fs');
const { spawn } = require('child_process');


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


function extractSubtitle(filePath) {
    // Corrigido: Nome fixo do diretório de legendas
    const subsDir = path.join(path.dirname(filePath), 'Subtitles');

    // Cria o diretório para legendas
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


function generateFrames(framesDir, filePath, fps, quality, webContents) {

    // Criar o diretório de frames, se não existir
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
        console.log(`Create Frames Directory: ${framesDir}`);
    }

    const ffmpegArgs = [
        '-i', filePath,                                 // Arquivo de entrada (vídeo)
        '-vf', `fps=${fps}`,                            // Filtro de frames por segundo (FPS)
        '-vsync', 'vfr',                                // Sincronização de vídeo variável
        '-q:v', `${quality}`,                           // Qualidade dos frames
        `${path.join(framesDir, 'frame_%00d.jpg')}`     // Arquivo de saída (frames)
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();

        if (output.includes('frame=')) {
            // Enviar atualizações de progresso ao front-end
            webContents.send('generate-progress', output);
        } else {
            // Enviar erros ao front-end
            webContents.send('generate-error', output);
        }

    });

    ipcMain.handle('stop-generate', (event) => {
        if (ffmpegProcess) {
            ffmpegProcess.kill('SIGINT'); // Envia o sinal para interromper o processo
            webContents.send('generate-stopped', 'Process was stopped.');
        } else {
            webContents.send('generate-error', 'No process to stop.');
        }
    });
}

ipcMain.handle('generate', async (event, args) => {

    const { filePath, dist, subtitles, fps, quality } = args;
    const framesDir = path.join(path.dirname(filePath), dist);

    // Extrai a legenda em ingles
    if (subtitles === true) {
        extractSubtitle(filePath);
    }

    generateFrames(framesDir, filePath, fps, quality, event.sender);

});


