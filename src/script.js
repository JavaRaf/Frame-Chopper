const { ipcRenderer } = require('electron');

const uploadSection = document.querySelector('.upload-section');
const pElement = uploadSection.querySelector('p');
const img = uploadSection.querySelector('img');
const questionIcon = document.querySelector('#question-icon');
const divTips = document.querySelector('.info');

questionIcon.addEventListener('click', function (e) {
    e.preventDefault();
    divTips.style.visibility = divTips.style.visibility === 'visible' ? 'hidden' : 'visible';
});

questionIcon.addEventListener('mouseleave', function (e) {
    e.preventDefault();
    divTips.style.visibility = 'hidden';
});

uploadSection.addEventListener('dragover', event => {
    event.preventDefault();
    event.stopPropagation();

    uploadSection.style.borderColor = '#007bff';
    pElement.style.color = '#007bff';
    pElement.textContent = 'Drop';
}) 

uploadSection.addEventListener('dragleave',  event => {
    event.preventDefault();
    event.stopPropagation();

    uploadSection.style.borderColor = 'gray';
    pElement.style.color = 'gray';
    pElement.textContent = 'Drag and drop your video here';

})

uploadSection.addEventListener('drop', async event => {
    event.preventDefault();
    event.stopPropagation();
    

})


uploadSection.addEventListener('click', async () => {
    // Usa o 'invoke' para solicitar o caminho do arquivo ao processo principal
    const filePath = await ipcRenderer.invoke('select-file');
    if (filePath) {
        console.log('Arquivo selecionado:', filePath);
    }
});


