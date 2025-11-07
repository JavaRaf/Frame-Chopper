<h1 align="center">Frame Chopper</h1>

<div align="center">
  <img src="./src/images/Frame-Chopper.png" alt="Frame Chopper" />
</div>

## Description

<h3 align="center">
  Frame Chopper is a graphical interface for cutting frames from an input video<br>with the ability to extract subtitles and set the desired FPS and quality.
</h3>

## Building from Source

### Prerequisites

Before you start, make sure you have the following installed on your system:

**Node.js** (version 14 or higher recommended)

**npm** (comes with Node.js) or **yarn**

**Git** (to clone the repository)

**FFmpeg** - Required for video processing. The application needs FFmpeg to be installed and available in your system PATH.

**FFmpeg installation instructions:**
  You can install FFmpeg using the following methods or seach for your distribution's package manager:

   **Windows**:
   ```bash
   winget install --id=Gyan.FFmpeg  -e
   ```
   or
   **macOS**:
   ```bash
   brew install ffmpeg
   ```
   or
   **Linux**:
   ```bash
   sudo apt install ffmpeg
   ```

  
After installation, verify FFmpeg is accessible by running `ffmpeg -version` in your terminal. If you get an error, make sure FFmpeg is added to your system PATH environment variable.

### Step-by-Step Instructions

**Step 1:** Clone the repository

   Open your terminal/command prompt and run:
   ```bash
   git clone https://github.com/JavaRaf/Frame-Chopper.git
       
   cd Frame-Chopper
   ```

---

---
**Step 2:** Install dependencies
   
   Install all required packages using npm:
   ```javascript
   npm install
   ```

---


---
**Step 3:** Build the application
   
   To create a distributable version of the app:
   ```javascript
   npm run build
   ```
   This command uses `electron-builder` to package the application. The built files will be created in the `dist` folder:


### Troubleshooting

**If `npm install` fails**: Make sure you have the a valid version of Node.js and npm installed.
**If the build fails**: Ensure you have all required build tools for your platform.


### Download (direct link) [Frame Chopper Setup releases page](https://github.com/JavaRaf/Frame-Chopper/releases)

**Windows**: `.exe` <br>
**macOS**: `.dmg` <br>
**Linux**: `.AppImage` <br>






