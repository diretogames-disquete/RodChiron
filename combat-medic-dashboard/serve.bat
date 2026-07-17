@echo off
REM Double-click launcher for Windows. Starts the local server and opens the
REM dashboard in your browser. Keep this window open while you use it; close
REM it to stop.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install it once from https://nodejs.org ^(LTS^), then double-click this again.
  pause
  exit /b 1
)
node serve.mjs
pause
