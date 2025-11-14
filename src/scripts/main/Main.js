const { ipcMain, app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');


let mainWindow;
let settingsWindow;

function createWindow() {
    // Corrigido: Criação correta da nova instância de BrowserWindow
    mainWindow = new BrowserWindow({
        width: 360,
        height: 370,
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


// App ready lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});


// Quit app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});



ipcMain.on('request-file-path', (event) => {
    const args = process.argv.slice(1); // Ignora o primeiro argumento
    console.log("Todos os argumentos recebidos:", args); // Log todos os argumentos

    if (args.length > 0) {
        const filePath = args[1] || args[0];
        if ( filePath !== '.' ) {
            console.log("Arquivo recebido ao iniciar:", filePath);
            event.sender.send('file-opened', filePath);
        }
        
    } 
    else {
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

let ffmpegProcess = null; // Global handler for FFmpeg process

// Settings window and persistence ---------------------------------------------
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function readSettings() {
    // Default settings - these are used for new users when settings file doesn't exist
    const defaults = { fps: 3.5, quality: 1, subtitles: false, filenamePattern: 'frame_%00d.jpg' };
    
    try {
        // Only read settings if file exists (file is only created when user explicitly saves)
        if (fs.existsSync(settingsPath)) {
            const content = fs.readFileSync(settingsPath, 'utf-8');
            const parsed = JSON.parse(content);
            // Merge with defaults to ensure all properties exist and validate values
            return {
                fps: (parsed?.fps != null && parsed.fps >= 1 && parsed.fps <= 60) ? Number(parsed.fps) : defaults.fps,
                quality: (parsed?.quality != null && parsed.quality >= 1 && parsed.quality <= 30) ? Number(parsed.quality) : defaults.quality,
                subtitles: parsed?.subtitles === true || parsed?.subtitles === 'true' ? true : defaults.subtitles,
                filenamePattern: (typeof parsed?.filenamePattern === 'string' && parsed.filenamePattern.trim() !== '') 
                    ? String(parsed.filenamePattern).trim() 
                    : defaults.filenamePattern
            };
        }
    } catch (err) {
        // If there's any error reading the file, return defaults and log the error
        console.error('Failed to read settings:', err);
        // Optionally, delete corrupted settings file to start fresh
        try {
            if (fs.existsSync(settingsPath)) {
                fs.unlinkSync(settingsPath);
            }
        } catch (unlinkErr) {
            console.error('Failed to delete corrupted settings file:', unlinkErr);
        }
    }
    // Return defaults for new users or when file doesn't exist
    return defaults;
}

function writeSettings(settings) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Failed to write settings:', err);
        return false;
    }
}

function openSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 360,
        height: 370,
        frame: false, // Custom titlebar; disables the native one
        resizable: false,
        minimizable: false,
        maximizable: false,
        modal: false,
        parent: mainWindow,
        icon: path.resolve(__dirname, '..', '..', 'images', 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    settingsWindow.setMenu(null);
    settingsWindow.loadFile(path.resolve(__dirname, '..', '..', 'html', 'settings.html'));

    // Position near the top-right of the main window
    if (mainWindow && !mainWindow.isDestroyed()) {
        const parent = mainWindow.getBounds();
        const desiredWidth = 360;
        const desiredHeight = 370;
        const marginRight = 8;
        const marginTop = 44;
        const x = Math.max(parent.x + parent.width - desiredWidth - marginRight, 0);
        const y = Math.max(parent.y + marginTop, 0);
        settingsWindow.setBounds({ x, y, width: desiredWidth, height: desiredHeight });
    }

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

ipcMain.handle('open-settings', () => {
    openSettingsWindow();
});

ipcMain.handle('settings-load', () => {
    return readSettings();
});

ipcMain.handle('settings-save', (event, payload) => {
    const safe = {
        fps: Number(payload?.fps) >= 1 && Number(payload?.fps) <= 60 ? Number(payload.fps) : 2,
        quality: Number(payload?.quality) >= 1 && Number(payload?.quality) <= 30 ? Number(payload.quality) : 3,
        subtitles: Boolean(payload?.subtitles),
        filenamePattern: typeof payload?.filenamePattern === 'string' && payload.filenamePattern.trim() !== ''
            ? String(payload.filenamePattern).trim()
            : 'frame_%00d.jpg'
    };
    const ok = writeSettings(safe);
    return { ok };
});

ipcMain.handle('settings-window-minimize', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.minimize();
    }
});

ipcMain.handle('settings-window-close', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.close();
    }
});

ipcMain.handle('generate', async (event, args) => {
    const { filePath, dist, subtitles, fps, quality } = args;
    const framesDir = path.join(path.dirname(filePath), dist);
    const currentSettings = readSettings();
    const filenamePattern = currentSettings?.filenamePattern || 'frame_%00d.jpg';

    // Avoid starting another FFmpeg instance while one is running
    if (ffmpegProcess) {
        console.log('FFmpeg já está rodando, aguardando o término.');
        event.sender.send('ffmpeg-status', 'Já está em execução.');
        return; // Evita iniciar um novo processo
    }

    if (subtitles === true) {
        extractSubtitle(filePath);
    }

    // Ensure frames output directory exists
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
        console.log(`Create Frames Directory: ${framesDir}`);
    }

    const ffmpegArgs = [
        '-i', filePath,                                 // Arquivo de entrada (vídeo)
        '-vf', `fps=${fps}`,                            // Filtro de frames por segundo (FPS)
        '-fps_mode', 'vfr',                             // Sincronização de vídeo variável
        '-q:v', `${quality}`,                           // Qualidade dos frames
        `${path.join(framesDir, filenamePattern)}`      // Arquivo de saída (frames)
    ];


    // Start FFmpeg process
    try {
        ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
    } catch (err) {
        console.error('FFmpeg spawn failed:', err);
        event.sender.send('ffmpeg-status', 'FFmpeg not found. Please install FFmpeg and ensure it is in PATH.');
        ffmpegProcess = null;
        return;
    }

    ffmpegProcess.on('error', (err) => {
        // ENOENT typically means ffmpeg is not found
        console.error('FFmpeg process error:', err);
        event.sender.send('ffmpeg-status', 'FFmpeg not found. Please install FFmpeg and ensure it is in PATH.');
    });

    ffmpegProcess.stderr.on('data', (data) => {
        const message = `stderr: ${data}`;
        console.log(message);

        // Forward stderr to renderer as progress info
        event.sender.send('ffmpeg-progress', message);
    });

    // Notify renderer when process finishes
    ffmpegProcess.on('close', (code) => {
        const message = `Processo FFmpeg finalizado com o código ${code}`;
        console.log(message);

        // Enviar dados de finalização para o renderer
        event.sender.send('ffmpeg-status', message);
        ffmpegProcess = null; // Libera a variável
    });
});


/**
 * Probe available subtitle streams using ffprobe.
 * Returns an array of { index: number, language?: string }.
 */
function probeSubtitleStreams(filePath) {
    return new Promise((resolve) => {
        const args = [
            '-loglevel', 'error',
            '-select_streams', 's',
            '-show_entries', 'stream=index:stream_tags=language',
            '-of', 'json',
            filePath
        ];

        let stdout = '';
        let stderr = '';
        let result = [];

        try {
            const proc = spawn('ffprobe', args);

            proc.stdout.on('data', (data) => { stdout += data.toString(); });
            proc.stderr.on('data', (data) => { stderr += data.toString(); });
            proc.on('close', () => {
                try {
                    const json = JSON.parse(stdout || '{}');
                    const streams = Array.isArray(json.streams) ? json.streams : [];
                    result = streams.map((s) => ({ index: Number(s.index), language: s?.tags?.language })).filter((s) => Number.isFinite(s.index));
                } catch (e) {
                    console.error('Failed to parse ffprobe output:', e);
                }
                if (result.length === 0) {
                    // Fallback: try assume at least one subtitle track at index 0
                    result = [{ index: 0 }];
                }
                resolve(result);
            });
        } catch (err) {
            console.error('ffprobe invocation failed, falling back to index 0:', err);
            resolve([{ index: 0 }]);
        }
    });
}

/**
 * Extract all subtitle streams from input video.
 * One .ass file per stream: <basename>_sub<index>_<lang>.ass
 */
async function extractSubtitle(filePath) {
    const subsDir = path.join(path.dirname(filePath), 'Subtitles');
    if (!fs.existsSync(subsDir)) {
        fs.mkdirSync(subsDir, { recursive: true });
        console.log(`Created Subtitles Directory: ${subsDir}`);
    }

    // Discover subtitle streams
    const streams = await probeSubtitleStreams(filePath);

    // Spawn one ffmpeg extraction per stream
    streams.forEach((stream, relativeIdx) => {
        const baseName = path.basename(filePath, path.extname(filePath));
        const langSuffix = stream.language ? `_${String(stream.language).toLowerCase()}` : '';
        const outputSubtitlePath = path.join(subsDir, `${baseName}_sub${stream.index}${langSuffix}.ass`);

        if (fs.existsSync(outputSubtitlePath)) {
            console.log(`Subtitle already exists, skipping: ${outputSubtitlePath}`);
            return;
        }

        const subtitleArgs = [
            '-y',
            '-i', filePath,                 // input video
            '-map', `0:s:${relativeIdx}`,    // map by relative subtitle index (robust across containers)
            '-c:s', 'ass',                  // convert to ASS
            outputSubtitlePath
        ];

        try {
            const p = spawn('ffmpeg', subtitleArgs);
            p.stderr.on('data', (data) => console.log(`[subs s:${stream.index}] ${data}`));
            p.on('close', (code) => {
                if (code === 0) {
                    console.log(`Subtitle extracted: ${outputSubtitlePath}`);
                } else {
                    console.error(`Subtitle extraction failed for stream ${stream.index} (code ${code})`);
                }
            });
        } catch (err) {
            console.error(`Failed to spawn ffmpeg for subtitle stream ${stream.index}:`, err);
        }
    });
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