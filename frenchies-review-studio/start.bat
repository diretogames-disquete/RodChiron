@echo off
REM Frenchies Review Studio - double-click launcher (Windows).
REM Double-click this file to start the app. No terminal needed.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed.
  echo   Get it from https://nodejs.org  ^(choose the "LTS" download^),
  echo   then double-click this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Frenchies Review Studio  -^>  http://localhost:3000
echo   Keep this window open while you use the app.
echo   To stop: close this window, or press Ctrl-C.
echo.

REM Open the browser a couple seconds after the server starts.
start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & explorer http://localhost:3000"

node server.js

echo.
echo   Server stopped.
pause
