// renderer.js (processo de renderização)
const { ipcRenderer, webUtils } = require('electron');
const path = require('path');


// input video and dropArea ----------------------------------------
const uploadSection = document.querySelector('.upload-section');

const inputVideo = uploadSection.getElementsByTagName('input')[0];
const inputText = uploadSection.getElementsByTagName('p')[0];
const inputImg = uploadSection.getElementsByTagName('img')[0];
// -----------------------------------------------------------------

// destination and FPS ----------------------------------------------------
const destination = document.querySelector('.div-1');

const inputDist = destination.getElementsByTagName('input')[0];
const inputFps = destination.getElementsByTagName('input')[1];
// ------------------------------------------------------------------------


// midlle div------------------------------------------------------------------------
const div2 = document.querySelector('.div-2');
const imgTips = div2.getElementsByTagName('img')[0];

const divtips = document.querySelector('.div-tips');
const divtipsP = divtips.getElementsByTagName('p')[0];
// ------------------------------------------------------------------------


// extract subtitle and quality ----------------------------------------------------
const subtitles = document.querySelector('.div-3');

const inputSubs = subtitles.getElementsByTagName('input')[0];
const inputQuality = subtitles.getElementsByTagName('input')[1];
// ------------------------------------------------------------------------


// button ----------------------------------------------------
const generateButton =  document.getElementById('button')
// -----------------------------------------------------------

// Função para desabilitar drag and drop  dos inputs de texto--------------
function disableDragAndDrop(input) {
    input.ondragenter = function(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'none';
    };
    
    input.ondragover = function(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'none';
    };
    
    input.ondrop = function(event) {
      event.preventDefault();
    };
}
  
// Aplicar a função a cada input
disableDragAndDrop(inputDist);
disableDragAndDrop(inputFps);
disableDragAndDrop(inputQuality);
// -----------------------------------------------------------------------


const videoProps = {
    filePath: '',
    dist: '',
    subtitles: false,
    fps: 2,
    quality: 2
}


// div tips ---------------------------------------
imgTips.addEventListener('click', (event) => {
    if(divtips.style.visibility === 'hidden') {divtips.style.visibility = 'visible'; }
    else {divtips.style.visibility = 'hidden';}
     
});

imgTips.addEventListener('mouseleave', (event) => {
    divtips.style.visibility = 'hidden';  
});
// -------------------------------------------------


// funcoes da interface ----------------------------
function setProps(filePath) {
    videoProps.filePath = filePath;
    videoProps.dist = path.dirname(filePath);


    const distPaste = videoProps.filePath.match(/\d+/);
    if (distPaste) {
        inputDist.value = 'EP ' + distPaste[0]
    }
    else {
        inputDist.value = path.basename(videoProps.filePath);
    }

    inputFps.value = videoProps.fps;
    
    inputQuality.value = videoProps.quality;
    
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
    const originalBorderColor = uploadSection.style.borderColor;
    const originalTextColor = inputText.style.color;
    const originalInnerText = inputText.innerText;

    if (VideoExtensions.includes(fileExtension)) {
        uploadSection.style.borderColor = '#007bff';
        inputText.innerText = path.basename(filePath);
        inputText.style.color = '#007bff';
        inputImg.src = 'videoIcon.png';
    } else {
        uploadSection.style.borderColor = '#ff4c4c';
        inputText.innerText = 'file not supported';
        inputText.style.color = '#ff4c4c';

        setTimeout(() => {
            uploadSection.style.borderColor = originalBorderColor;
            inputText.style.color = originalTextColor;
            inputText.innerText = originalInnerText;
        }, 1500);
    }
}
// -------------------------------------------------


// input as button
inputVideo.addEventListener('change', (event) => {
    const filePath = webUtils.getPathForFile(event.target.files[0]);
    
    styleInput(filePath);
    setProps(filePath)


    // Redefine o valor do input para garantir que o evento change seja disparado novamente
    inputVideo.value = '';
});
// ------------------------------------------------


// drag and drop functionality
uploadSection.addEventListener('dragover', (event) => {
    event.preventDefault();

    inputText.style.color = '#007bff';
    uploadSection.style.borderColor = '#007bff';

});

uploadSection.addEventListener('dragleave', (event) => {
    event.preventDefault();

    inputText.style.color = 'gray';
    uploadSection.style.borderColor = 'gray';
});

uploadSection.addEventListener('drop', (event) => {
    event.preventDefault();

    const filePath = webUtils.getPathForFile(event.dataTransfer.files[0]);
    styleInput(filePath);
    setProps(filePath)
    
});
// -------------------------------------------------------


// button
generateButton.addEventListener('click', async (event) => {
    event.preventDefault();

    videoProps.dist = inputDist.value;
    videoProps.fps = parseInt(inputFps.value, 10);
    videoProps.quality = parseInt(inputQuality.value, 10);
    videoProps.subtitles = inputSubs.checked;


    if (videoProps.dist && videoProps.fps && videoProps.quality && videoProps.filePath) {
        const response = await ipcRenderer.invoke('generate', videoProps)


    }

});

// ------------------------------------------------------------------

ipcRenderer.on('generate-progress', (event, progressData) => {

    const frameMatch = progressData.match(/frame=\s*(\d+)/);
    console.log('Progress:', frameMatch[1]);

    if (divtips.style.visibility === 'hidden') {
        divtips.style.visibility = 'visible';
        
        const img = document.createElement('img');
        img.src = path.join(__dirname, 'x.png');
        divtips.appendChild(img);
    }

    divtipsP.innerText = 'Cutting Frames... '+ frameMatch[1];

});



