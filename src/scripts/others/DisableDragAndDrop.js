import { textNumberInputs } from "./ElementImports.js";



// Função para desabilitar drag and drop dos inputs de texto e numero
async function disableDragAndDrop(input) {

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

textNumberInputs.forEach(input => disableDragAndDrop(input));