import {
    minimize, close, uploadArea, uploadInput,
    uploadText, uploadImg, generateButton, distInput, fpsInput,
    qualityInput, checkBoxInput, progressStatus, progressStatusParagraph,
    progressStatusImg, configs
} from '../others/ElementImports.js';

const { ipcRenderer, webUtils } = require('electron');
const path = require('path');




// Load default settings when page loads (wait for DOM to be ready)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDefaultSettings);
} else {
    // DOM is already ready
    loadDefaultSettings();
}

// Ask main process for initial file path (when opened via OS association)
ipcRenderer.send('request-file-path');

// Listen for main process file-opened response
ipcRenderer.on('file-opened', (event, filePath) => {
    if (filePath && filePath.length !== '.') {

        const isVideoSuported = styleInput(filePath);
        if (isVideoSuported) {
            setProps(filePath)
        }

    } else {
        console.log("No file was received at startup.");
    }
});


// Minimize and close functionality --------------------------------------------
minimize.addEventListener('click', () => {
    ipcRenderer.invoke('window-minimize');
});

close.addEventListener('click', () => {
    ipcRenderer.invoke('window-close');
});

// Open settings window ---------------------------------------------------------
if (configs) {
    configs.addEventListener('click', () => {
        ipcRenderer.invoke('open-settings');
    });
}

// Init video props
const videoProps = {
    filePath: '',
    dist: '',
    subtitles: false,
    fps: 3.5,
    quality: 1
}

// Load default settings from saved configuration
async function loadDefaultSettings() {
    try {
        const settings = await ipcRenderer.invoke('settings-load');
        // Apply saved settings to initial values
        if (settings) {
            videoProps.fps = Number(settings.fps) || videoProps.fps;
            videoProps.quality = Number(settings.quality) || videoProps.quality;
            videoProps.subtitles = settings.subtitles === true || settings.subtitles === 'true';
            
            // Update UI elements with saved settings (only if elements exist)
            if (fpsInput) fpsInput.value = videoProps.fps;
            if (qualityInput) qualityInput.value = videoProps.quality;
            if (checkBoxInput) checkBoxInput.checked = videoProps.subtitles;
        }
    } catch (e) {
        console.error('Failed to load default settings:', e);
    }
}

function setProps(filePath) {
    videoProps.filePath = filePath;

    let distPaste = path.parse(videoProps.filePath).name.match(/\d+/);

    if (distPaste) {
        videoProps.dist = `EP ${distPaste[0]}`;
        distInput.value = videoProps.dist;
    }
    else {
        videoProps.dist = path.parse(videoProps.filePath).name;
        distInput.value = videoProps.dist;
    }

    fpsInput.value = videoProps.fps;
    qualityInput.value = videoProps.quality;
    // Update checkbox state when setting props
    checkBoxInput.checked = videoProps.subtitles;
}

// Styles helpers ----------------------------------
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

    // Backup original styles
    const originalBorderColor = uploadArea.style.borderColor;
    const originalTextColor = uploadText.style.color;
    const originalInnerText = uploadText.innerText;

    if (VideoExtensions.includes(fileExtension)) {
        uploadArea.style.borderColor = '#007bff';
        uploadText.innerText = path.basename(filePath);
        uploadText.style.color = '#007bff';
        uploadImg.src = path.resolve(__dirname, '../', 'images', 'video-icon.png');

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

// File input change ------------------------------------------------------------
uploadInput.addEventListener('change', (event) => {
    const filePath = webUtils.getPathForFile(event.target.files[0]);

    const isVideoSuported = styleInput(filePath);
    if (isVideoSuported) {
        setProps(filePath)
    }

    // Reset input value to allow repeated change events
    uploadInput.value = '';
});

// Drag and drop functionality -------------------------------------------------
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

    const filePath = webUtils.getPathForFile(event.dataTransfer.files[0]);
    const isVideoSuported = styleInput(filePath);

    if (isVideoSuported) {
        setProps(filePath)
    }

});

// Generate button
generateButton.addEventListener('click', async (event) => {
    event.preventDefault();

    if (fpsInput.value < 1 || fpsInput.value > 60) {
        fpsInput.value = 2;
    }
    if (qualityInput.value < 1 || qualityInput.value > 5) {
        qualityInput.value = 3;
    }

    videoProps.dist = distInput.value;
    videoProps.fps = parseFloat(fpsInput.value.replace(',', '.'));
    videoProps.quality = parseFloat(qualityInput.value.replace(',', '.'));
    videoProps.subtitles = checkBoxInput.checked;

    if (videoProps.dist && videoProps.fps && videoProps.quality && videoProps.filePath) {
        const response = await ipcRenderer.invoke('generate', videoProps)
    }
});

// Listen FFmpeg progress updates
ipcRenderer.on('ffmpeg-progress', (event, message) => {
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

// Listen FFmpeg status message
ipcRenderer.on('ffmpeg-status', (event, message) => {
    console.log(`FFmpeg status: ${message}`);

    if (message.includes('0')) {

        progressStatusParagraph.style.color = '#4d9460';
        progressStatusParagraph.innerText = 'Process Finished';

        setTimeout(() => {
            generateButton.disabled = false;
            progressStatus.style.visibility = 'hidden';
            ipcRenderer.send('reload-window');
        }, 3000);
    }
    else {
        generateButton.disabled = false;
        progressStatus.style.visibility = 'hidden';
    }
});

progressStatusImg.addEventListener('click', (event) => {
    ipcRenderer.send('cancel-progress');
    progressStatusParagraph.innerText = 'FramesCutted: 00 \n Video Time: 00:00:00:00';
});