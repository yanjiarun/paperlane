@echo off
setlocal
set "PROJECT_DIR=%~dp0"
set "PORT=8765"

set "PYTHON_EXE="
set "PYTHON_PREFIX="

where python >nul 2>nul
if not errorlevel 1 (
  python --version >nul 2>nul
  if not errorlevel 1 set "PYTHON_EXE=python"
)

if not defined PYTHON_EXE (
  where py >nul 2>nul
  if not errorlevel 1 (
    py -3 --version >nul 2>nul
    if not errorlevel 1 (
      set "PYTHON_EXE=py"
      set "PYTHON_PREFIX=-3"
    )
  )
)

if not defined PYTHON_EXE (
  echo Python 3 was not found.
  echo Install Python 3, then double-click this file again.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = %PORT%; if (-not (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)) { $launchArgs = @(); if ('%PYTHON_PREFIX%') { $launchArgs += '%PYTHON_PREFIX%' }; $launchArgs += @('paperlane_server.py','--port','%PORT%'); Start-Process -FilePath '%PYTHON_EXE%' -ArgumentList $launchArgs -WorkingDirectory '%PROJECT_DIR%' -WindowStyle Hidden }"
powershell -NoProfile -Command "Start-Sleep -Seconds 2"
start "" "http://localhost:%PORT%"
exit /b 0
