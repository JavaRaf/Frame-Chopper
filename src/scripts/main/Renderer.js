// renderer.js (processo de renderização)
import{ uploadArea, uploadInput, uploadText, uploadImg, generateButton, distInput, fpsInput, qualityInput, checkBoxInput } from '../others/ElementImports.js';
const { ipcRenderer, webUtils } = require('electron');
const path = require('path'); 

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
    videoProps.dist = path.dirname(filePath);


    const distPaste = videoProps.filePath.match(/\d+/);
    if (distPaste) {
        distInput.value = 'EP ' + distPaste[0]
    }
    else {
        distInput.value = path.basename(videoProps.filePath);
    }

    fpsInput.value = videoProps.fps;
    
    qualityInput.value = videoProps.quality;
    
}
// -------------------------------------------------

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
        uploadText.innerText = path.basename(filePath);
        uploadText.style.color = '#007bff';
        uploadImg.src = path.resolve(__dirname, '../', 'images', 'video-icon.png');
    } else {
        uploadArea.style.borderColor = '#ff4c4c';
        uploadText.innerText = 'file not supported';
        uploadText.style.color = '#ff4c4c';

        setTimeout(() => {
            uploadArea.style.borderColor = originalBorderColor;
            uploadText.style.color = originalTextColor;
            uploadText.innerText = originalInnerText;
        }, 1500);
    }
}

// input video -----------------------------------------------------------------
uploadInput.addEventListener('change', (event) => {
    const filePath = webUtils.getPathForFile(event.target.files[0]);
    
    styleInput(filePath);
    setProps(filePath)

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

    const filePath = webUtils.getPathForFile(event.dataTransfer.files[0]);
    styleInput(filePath);
    setProps(filePath)
    
});


// button
generateButton.addEventListener('click', async (event) => {
    event.preventDefault();

    videoProps.dist = distInput.value;
    videoProps.fps = parseInt(fpsInput.value, 10);
    videoProps.quality = parseInt(qualityInput.value, 10);
    videoProps.subtitles = checkBoxInput.checked;

    if (videoProps.dist && videoProps.fps && videoProps.quality && videoProps.filePath) {
        const response = await ipcRenderer.invoke('generate', videoProps)
        console.log(response);
    }

    
});


