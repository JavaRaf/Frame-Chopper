// Settings window renderer
// Purpose: Load and save user default settings through IPC.

const { ipcRenderer } = require('electron');

// Elements
const minimizeBtn = document.querySelector('#settings-minimize-btn');
const closeBtn = document.querySelector('#settings-close-btn');
const settingsFps = document.querySelector('#settings-fps');
const settingsQuality = document.querySelector('#settings-quality');
const settingsPattern = document.querySelector('#settings-pattern');
const settingsSubtitles = document.querySelector('#settings-subtitles');
const settingsSave = document.querySelector('#settings-save');
const settingsStatus = document.querySelector('#settings-status');

async function loadSettings() {
    try {
        const loaded = await ipcRenderer.invoke('settings-load');
        settingsFps.value = String(Number(loaded?.fps) || 3.5);
        settingsQuality.value = String(Number(loaded?.quality) || 1);
        settingsPattern.value = String(loaded?.filenamePattern || '%04d.jpg');
        // Explicitly check if subtitles is true (handle both boolean true and string "true")
        settingsSubtitles.checked = loaded?.subtitles === true || loaded?.subtitles === 'true';
    } catch (e) {
        settingsStatus.innerText = 'Failed to load';
        console.error(e);
    }
}

async function saveSettings() {
    // Convert comma to dot for Brazilian locale support before parsing to number
    const fps = Number(String(settingsFps.value || 2).replace(',', '.'));
    const quality = Number(String(settingsQuality.value || 3).replace(',', '.'));
    const subtitles = Boolean(settingsSubtitles.checked);
    const filenamePattern = String(settingsPattern.value || 'frame_%00d.jpg');

    const { ok } = await ipcRenderer.invoke('settings-save', { fps, quality, subtitles, filenamePattern });
    if (ok) {
        settingsStatus.innerText = 'Saved';
        setTimeout(() => { settingsStatus.innerText = ''; }, 1000);
    } else {
        settingsStatus.innerText = 'Error';
    }
}

// Convert comma to dot in number inputs in real-time (for Brazilian locale support)
// This ensures the input type="number" accepts the value correctly
if (settingsFps) {
    settingsFps.addEventListener('input', (event) => {
        if (event.target.value.includes(',')) {
            event.target.value = event.target.value.replace(',', '.');
        }
    });
}

if (settingsQuality) {
    settingsQuality.addEventListener('input', (event) => {
        if (event.target.value.includes(',')) {
            event.target.value = event.target.value.replace(',', '.');
        }
    });
}

if (settingsSave) {
    settingsSave.addEventListener('click', saveSettings);
}

loadSettings();


if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('settings-window-close');
    });
}


