<h1 align="center">🎥 Frame Chopper</h1>

<div align="center">
  <img src="./src/images/framechopper.png" alt="Frame Chopper" />
</div>

## Description

Frame Chopper is a graphical interface for generating frames from an input video, offering features to extract frames and subtitles with customizable settings.

## 🔧 Building from Source

### Prerequisites

Before you start, make sure you have the following installed on your system:

- **Node.js** (version 14 or higher recommended)
- **npm** (comes with Node.js) or **yarn**
- **Git** (to clone the repository)
- **FFmpeg** - Required for video processing. The application needs FFmpeg to be installed and available in your system PATH.
  
  **Installation instructions:**
  - **Windows**: Download from [FFmpeg official website](https://ffmpeg.org/download.html) or use a package manager like [Chocolatey](https://chocolatey.org): `choco install ffmpeg`
  - **macOS**: Install via [Homebrew](https://brew.sh): `brew install ffmpeg`
  - **Linux**: Install via your distribution's package manager (e.g., `sudo apt install ffmpeg` on Ubuntu/Debian)
  
  After installation, verify FFmpeg is accessible by running `ffmpeg -version` in your terminal.

### Step-by-Step Instructions

1. **Clone the repository**
   
   Open your terminal/command prompt and run:
   ```bash
   git clone https://github.com/JavaRaf/Frame-Chopper.git
   cd Frame-Chopper
   ```

2. **Install dependencies**
   
   Install all required packages using npm:
   ```bash
   npm install
   ```
   
   This will install all the project dependencies listed in `package.json`, including Electron and electron-builder.

3. **Run in development mode**
   
   To test the application without building:
   ```bash
   npm start
   ```
   
   This will launch the Electron app in development mode using the `start` script.

4. **Build the application**
   
   To create a distributable version of the app:
   ```bash
   npm run build
   ```
   
   This command uses `electron-builder` to package the application. The built files will be created in the `dist` folder:
   - **Windows**: Generates a `.exe` installer (NSIS format) in `dist/`
   - **macOS**: Generates a `.dmg` file in `dist/` (if building on macOS)
   
   **Important**: FFmpeg must be installed on the target system where the application will run. The application does not bundle FFmpeg, so users need to install it separately before using the app.

### Build Configuration

The build configuration is located in the `package.json` file under the `build` section. It includes:
- App metadata (name, ID, icon)
- File associations for video formats
- Platform-specific settings for Windows and macOS

### Troubleshooting

- **If `npm install` fails**: Make sure you have the latest version of Node.js and npm installed.
- **If the build fails**: Ensure you have all required build tools for your platform (e.g., on Windows, you might need Visual Studio Build Tools).
- **FFmpeg not found**: The application requires FFmpeg to be installed on your system and accessible via PATH. If you get an error about FFmpeg not being found:
  - Verify FFmpeg is installed by running `ffmpeg -version` in your terminal
  - Make sure FFmpeg is added to your system PATH environment variable
  - Restart your terminal/command prompt after installing FFmpeg



## 📥 Download

- Windows: download the latest installer (.exe) directly from the Releases page:
  - Latest releases: `https://github.com/JavaRaf/Frame-Chopper/releases/latest`
  - Direct .exe link (current): `https://github.com/JavaRaf/Frame-Chopper/releases/latest/download/Frame%20Chopper%20Setup%201.2.0.exe`

## ✨ Used technologies

- [HTML, CSS, JS](https://www.w3schools.com/html/html5_video.asp) - Frontend
- [Electron](https://www.electronjs.org) - framework
- [JavaScript](https://www.javascript.com) - Backend
- [FFmpeg](https://ffmpeg.org) - The video processing tool.


Enjoy cutting frames with **Frame Chopper**! 🚀
