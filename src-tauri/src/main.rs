#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use anyhow::{anyhow, Context, Result};
use once_cell::sync::Lazy;
use serde::Deserialize;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{Manager, Window};

static FFMPEG_CHILD: Lazy<Mutex<Option<Child>>> = Lazy::new(|| Mutex::new(None));

#[derive(Deserialize, Debug)]
struct GenerateArgs {
    filePath: String,
    dist: String,
    subtitles: bool,
    fps: f32,
    quality: u8,
}

#[tauri::command]
fn extract_ffmpeg(window: Window) -> Result<(), String> {
    // Determine resource locations
    let app_handle = window.app_handle();
    let resolver = app_handle.path_resolver();

    let archive_path = resolver
        .resolve_resource("../src/tools/ffmpeg.7z")
        .or_else(|| resolver.resolve_resource("ffmpeg.7z"))
        .ok_or_else(|| "ffmpeg.7z not found in resources".to_string())?;

    let resource_dir = resolver
        .resource_dir()
        .ok_or_else(|| "resource_dir not available".to_string())?;

    let ffmpeg_bin = ffmpeg_binary_path(&resource_dir);

    if ffmpeg_bin.exists() {
        return Ok(());
    }

    // Extract 7z archive into the resource directory
    sevenz_rust::decompress_file(&archive_path, &resource_dir)
        .map_err(|e| format!("failed to extract ffmpeg: {e}"))
}

#[tauri::command]
fn cancel_progress() -> Result<(), String> {
    if let Some(mut child) = FFMPEG_CHILD.lock().unwrap().take() {
        let _ = child.kill();
    }
    Ok(())
}

#[tauri::command]
fn generate(window: Window, args: GenerateArgs) -> Result<(), String> {
    let input_path = PathBuf::from(&args.filePath);
    let parent = input_path
        .parent()
        .ok_or_else(|| "invalid input path".to_string())?;

    let frames_dir = parent.join(&args.dist);
    std::fs::create_dir_all(&frames_dir)
        .map_err(|e| format!("failed to create frames dir: {e}"))?;

    let resource_dir = window
        .app_handle()
        .path_resolver()
        .resource_dir()
        .ok_or_else(|| "resource_dir not available".to_string())?;

    let ffmpeg_path = ffmpeg_binary_path(&resource_dir);
    if !ffmpeg_path.exists() {
        return Err(format!(
            "ffmpeg not found at {}",
            ffmpeg_path.to_string_lossy()
        ));
    }

    let output_pattern = frames_dir.join("frame_%00d.jpg");

    let mut cmd = Command::new(&ffmpeg_path);
    cmd.arg("-i")
        .arg(&args.filePath)
        .arg("-vf")
        .arg(format!("fps={}", args.fps))
        .arg("-fps_mode")
        .arg("vfr")
        .arg("-q:v")
        .arg(args.quality.to_string())
        .arg(output_pattern);

    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("failed to spawn ffmpeg: {e}"))?;

    // Store child for cancellation
    {
        let mut slot = FFMPEG_CHILD.lock().unwrap();
        *slot = Some(child);
    }

    // Read stderr lines and emit progress
    let stderr = FFMPEG_CHILD
        .lock()
        .unwrap()
        .as_mut()
        .and_then(|c| c.stderr.take())
        .ok_or_else(|| "failed to capture ffmpeg stderr".to_string())?;

    let window_clone = window.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() {
            let _ = window_clone.emit("ffmpeg-progress", format!("stderr: {}", line));
        }

        // Wait for process to finish
        let status_msg = {
            let mut child_opt = FFMPEG_CHILD.lock().unwrap();
            if let Some(child) = child_opt.as_mut() {
                match child.wait() {
                    Ok(status) => format!("Processo FFmpeg finalizado com o código {}", status.code().unwrap_or(-1)),
                    Err(e) => format!("ffmpeg wait error: {e}"),
                }
            } else {
                "FFmpeg cancelado".to_string()
            }
        };

        let _ = window_clone.emit("ffmpeg-status", status_msg);

        // Clear handle
        let _ = FFMPEG_CHILD.lock().unwrap().take();
    });

    // Optionally extract subtitles in parallel
    if args.subtitles {
        let ffmpeg_path_clone = ffmpeg_path.clone();
        let file_path = args.filePath.clone();
        std::thread::spawn(move || {
            let subs_dir = Path::new(&file_path)
                .parent()
                .map(|p| p.join("Subtitles"))
                .unwrap_or_else(|| PathBuf::from("Subtitles"));
            let _ = std::fs::create_dir_all(&subs_dir);

            let output = subs_dir.join(format!(
                "{}.ass",
                Path::new(&file_path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("subtitles")
            ));

            if !output.exists() {
                let _ = Command::new(&ffmpeg_path_clone)
                    .arg("-i")
                    .arg(&file_path)
                    .arg("-map")
                    .arg("0:s:m:language:eng")
                    .arg("-c:s")
                    .arg("ass")
                    .arg(output)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status();
            }
        });
    }

    Ok(())
}

fn ffmpeg_binary_path(resource_dir: &Path) -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        resource_dir.join("ffmpeg").join("bin").join("ffmpeg.exe")
    }
    #[cfg(not(target_os = "windows"))]
    {
        // On non-Windows, expect ffmpeg in ffmpeg/bin/ffmpeg
        resource_dir.join("ffmpeg").join("bin").join("ffmpeg")
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![extract_ffmpeg, generate, cancel_progress])
        .on_open(|app, payload| {
            if let Some(path) = payload
                .urls
                .first()
                .and_then(|u| u.to_file_path().ok())
                .and_then(|p| p.to_str().map(|s| s.to_string()))
            {
                if let Some(win) = app.get_window("main") {
                    let _ = win.emit("file-opened", path);
                }
            } else {
                if let Some(win) = app.get_window("main") {
                    let _ = win.emit("file-opened", "");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

