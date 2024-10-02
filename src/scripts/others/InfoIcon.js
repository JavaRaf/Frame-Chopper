import { infoIcon } from "./ElementImports.js";

async function createDivInfo(htmlText) {
    // Cria a div principal
    const divTips = document.createElement('div');
    divTips.className = 'div-tips'; // Atribui a classe CSS

    // Adiciona estilos diretamente
    divTips.style.visibility = 'visible';
    divTips.style.minWidth = '330px';
    divTips.style.backgroundColor = 'white';
    divTips.style.zIndex = '10';
    divTips.style.position = 'fixed';
    divTips.style.top = '38%';
    divTips.style.left = '50%';
    divTips.style.transform = 'translate(-50%, -50%)';
    divTips.style.display = 'flex';
    divTips.style.alignItems = 'center';
    divTips.style.justifyContent = 'center';
    divTips.style.border = '2px solid #ccc';
    divTips.style.borderRadius = '10px';
    divTips.style.boxShadow = '5px 5px 10px gray';

    // Cria o parágrafo que conterá o HTML
    const paragraph = document.createElement('p');
    paragraph.innerHTML = htmlText; // Define o HTML do parágrafo

    // Adiciona estilos ao parágrafo
    paragraph.style.textAlign = 'center';
    paragraph.style.color = 'gray';
    paragraph.style.fontSize = '14px';
    paragraph.style.margin = '5px';

    // Adiciona o parágrafo à div principal
    divTips.appendChild(paragraph);

    // Opcional: Adiciona a div ao corpo do documento ou a um contêiner específico
    document.body.appendChild(divTips); // Adiciona ao corpo (ou use outro contêiner)

    // Retorna a div criada, caso você precise usá-la mais tarde
    return divTips;
}

infoIcon.addEventListener("click", async (event) => {
    event.preventDefault();

    // Remove qualquer div anterior para evitar duplicação
    const divExist = document.querySelector('.div-tips');

    if (divExist) {
        divExist.remove();
    } else {
        createDivInfo(`
            <strong>Destination Path:</strong> Specifies the folder where the extracted frames will be saved. A new folder will be created if it doesn't already exist.<br>
            <strong>Extract Subtitles:</strong> Extracts English subtitles from the video, if available.<br>
            <strong>FPS:</strong> Sets the number of frames to extract per second. The default value is 2.<br>
            <strong>Quality:</strong> Defines the quality of the extracted frames, where 1 is the highest quality and 5 is the lowest.
        `);
    }
});

infoIcon.addEventListener("mouseleave", async (event) => {
    event.preventDefault();

    const existingDiv = document.querySelector('.div-tips');
    if (existingDiv) {
        existingDiv.remove();
    }
});
