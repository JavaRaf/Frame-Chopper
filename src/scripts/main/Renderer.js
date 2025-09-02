import{ minimize, close, uploadArea, uploadInput, uploadText, uploadImg, generateButton, distInput, fpsInput, qualityInput, checkBoxInput, progressStatus, progressStatusParagraph, progressStatusImg } from '../others/ElementImports.js';

const { tauri, event, window: tauriWindow, dialog } = window.__TAURI__ || {};
const invoke = tauri?.invoke;
const listen = event?.listen;
const appWindow = tauriWindow?.appWindow;


// extract the ffmpeg binaries
window.onload = async () => {
    try {
        await invoke('extract_ffmpeg');
    } catch (error) {    
        console.log(error);
    }
};


// Escuta o arquivo aberto via protocolo/file association
listen('file-opened', (event) => {
    const filePath = event.payload;
    if (filePath && filePath.length !== '.') {
        const isVideoSuported = styleInput(filePath);
        if(isVideoSuported) {
            setProps(filePath)
        }
    } else {
        console.log("Nenhum arquivo foi recebido ao iniciar.");
    }
});


// minimize and close functionality --------------------------------------------
minimize.addEventListener('click', () => {
    appWindow.minimize();
});

close.addEventListener('click', () => {
    appWindow.close();
});

// init video props
const videoProps = {
    filePath: '',
    dist: '',
    subtitles: false,
    fps: 2,
    quality: 3
}

function setProps(filePath) {
    videoProps.filePath = filePath;

    const baseName = getFileNameWithoutExt(videoProps.filePath);
    const distPaste = baseName.match(/\d+/);

    if (distPaste) {
        videoProps.dist = `EP ${distPaste[0]}`;
        distInput.value =  videoProps.dist;
    }
    else {
        videoProps.dist = baseName; 
        distInput.value =  videoProps.dist;
    }
    
    fpsInput.value = videoProps.fps;
    qualityInput.value = videoProps.quality;
}

// styles ------------------------------------------
function styleInput(filePath) {

    const fileExtension = filePath.split('.').pop().toLowerCase();
    const VideoExtensions = [
        'mp4',
        'mkv',
        'avi',
        'mov',
        'wmv',
        'flv',
        'webm',
        'm4v',
        'mpg',
        'mpeg',
        '3gp',
        'ogv',
        'ts',
        'vob',
        'rm',
        'rmvb',
        'f4v'
    ];

    // Salvando os estilos originais
    const originalBorderColor = uploadArea.style.borderColor;
    const originalTextColor = uploadText.style.color;
    const originalInnerText = uploadText.innerText;

    if (VideoExtensions.includes(fileExtension)) {
        uploadArea.style.borderColor = '#007bff';
        uploadText.innerText = getBaseName(filePath);
        uploadText.style.color = '#007bff';
        uploadImg.src = '../images/video-icon.png';

        return true;
    } else {
        uploadArea.style.borderColor = '#ff4c4c';
        uploadText.innerText = 'file not supported';
        uploadText.style.color = '#ff4c4c';

        setTimeout(() => {
            uploadArea.style.borderColor = originalBorderColor;
            uploadText.style.color = originalTextColor;
            uploadText.innerText = originalInnerText;
        }, 1500);

        return false;
    }
}

// input video -----------------------------------------------------------------
uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const filePath = file && (file.path || file.name);
    
    const isVideoSuported = styleInput(filePath);
    if(isVideoSuported) {
        setProps(filePath)
    }

    // Redefine o valor do input para garantir que o evento change seja disparado novamente
    uploadInput.value = '';
});

// drag and drop functionality -------------------------------------------------
uploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();

    uploadText.style.color = '#007bff';
    uploadArea.style.borderColor = '#007bff';

});

uploadArea.addEventListener('dragleave', (event) => {
    event.preventDefault();

    uploadText.style.color = 'gray';
    uploadArea.style.borderColor = 'gray';
});

uploadArea.addEventListener('drop', (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files[0];
    const filePath = file && (file.path || file.name);
    const isVideoSuported = styleInput(filePath);

    if(isVideoSuported) {
        setProps(filePath)
    }
  
});

// button
generateButton.addEventListener('click', async (event) => {
    event.preventDefault();

    if(fpsInput.value < 1 || fpsInput.value > 60) {
        fpsInput.value = 2;
    }
    if(qualityInput.value < 1 || qualityInput.value > 5) {
        qualityInput.value = 3;
    }

    videoProps.dist = distInput.value;
    videoProps.fps = parseFloat(fpsInput.value.replace(',', '.'));
    videoProps.quality = parseFloat(qualityInput.value.replace(',', '.'));
    videoProps.subtitles = checkBoxInput.checked;

    if (videoProps.dist && videoProps.fps && videoProps.quality && videoProps.filePath) {
        await invoke('generate', videoProps);
    }
});

// Escutando as atualizações de progresso do FFmpeg
listen('ffmpeg-progress', ({ payload: message }) => {
    progressStatus.style.visibility = 'visible';

    const regex = /frame=\s*(\d+)\s.*time=\s*([^\s]+)/;
    const match = message.match(regex);

    if (match && message.includes('stderr:')) {
        const frame = match[1];
        const time = match[2];
        progressStatusParagraph.innerText = `FramesCutted: ${frame} \n Video Time: ${time}`;
        generateButton.disabled = true;
    }
});

// Escutando a mensagem de status do FFmpeg
listen('ffmpeg-status', ({ payload: message }) => {
    console.log(`Status do FFmpeg: ${message}`);

    if (message.includes('0')) {

        progressStatusParagraph.style.color = '#4d9460';
        progressStatusParagraph.innerText = 'Process Finished';

        setTimeout(() => {
            generateButton.disabled = false;
            progressStatus.style.visibility = 'hidden';
            window.location.reload();
        }, 3000);
    }
    else {
        generateButton.disabled = false;
        progressStatus.style.visibility = 'hidden';
    }
});

progressStatusImg.addEventListener('click', async (event) => {
    await invoke('cancel_progress');
    progressStatusParagraph.innerText = 'FramesCutted: 00 \n Video Time: 00:00:00:00';
});

// Helpers ----------------------------------------------------------------------
function getBaseName(filePath) {
    const parts = (filePath || '').split(/[\\/]/);
    return parts[parts.length - 1] || '';
}

function getFileNameWithoutExt(filePath) {
    const base = getBaseName(filePath);
    const idx = base.lastIndexOf('.');
    return idx > 0 ? base.substring(0, idx) : base;
}