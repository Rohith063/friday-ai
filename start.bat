@echo off
title F.R.I.D.A.Y. — AI Assistant
color 0B

echo.
echo   ╔══════════════════════════════════════════════════╗
echo   ║                                                  ║
echo   ║     F.R.I.D.A.Y. — AI ASSISTANT                 ║
echo   ║     Powered by Google Gemini + Edge-TTS          ║
echo   ║                                                  ║
echo   ╚══════════════════════════════════════════════════╝
echo.

:: Check if .env file exists
if not exist "backend\.env" (
    echo   [ERROR] backend\.env file not found!
    echo.
    echo   Please create it:
    echo     1. Copy backend\.env.example to backend\.env
    echo     2. Add your Gemini API key from https://aistudio.google.com/apikey
    echo.
    pause
    exit /b
)

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] Python not found! Please install Python 3.10+.
    echo   Download: https://www.python.org/downloads/
    pause
    exit /b
)

echo   [1/2] Installing dependencies...
pip install -r backend\requirements.txt --quiet >nul 2>&1
echo   [OK]  Dependencies installed.
echo.

echo   [2/2] Starting F.R.I.D.A.Y. server...
echo.
echo   ══════════════════════════════════════════════════
echo     Open your browser:  http://localhost:8000
echo   ══════════════════════════════════════════════════
echo.

cd backend
python main.py
