const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');


let mainWindow;

function createWindow() {
    // Corrigido: Criação correta da nova instância de BrowserWindow
    mainWindow = new BrowserWindow({
        width: 400,
        height: 400,
        icon: path.resolve(__dirname, '..', '..', 'images', 'icon.png'),
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,    // Permite usar APIs de Node.js no renderizador
            contextIsolation: false,  // Desativa o isolamento de contexto
            enableRemoteModule: true  // Necessário em algumas versões
        }
    });

    mainWindow.setMenu(null);
    mainWindow.loadFile(path.resolve(__dirname, '..', '..', 'html', 'index.html'));

}

app.whenReady().then(createWindow);



let ffmpegProcess = null; // Variável global para armazenar o processo

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
        '-vsync', 'vfr',                                // Sincronização de vídeo variável
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