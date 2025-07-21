@echo off
echo ========================================
echo   Full Development Environment Startup
echo ========================================
echo.
echo This script will start:
echo 1. AI Chat Server (port 3000)
echo 2. Frontend Development Server (port 5173)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo Error: Virtual environment not found!
    pause
    exit /b 1
)

REM Check if backend and frontend directories exist
if not exist "backend\src\ai_chat_server.py" (
    echo Error: Backend server not found!
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo Error: Frontend package.json not found!
    pause
    exit /b 1
)

echo Starting AI Chat Server in new window...
start "AI Chat Server" cmd /k "call .venv\Scripts\activate.bat && cd backend\src && python ai_chat_server.py"

echo Waiting 3 seconds for server to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend Development Server in new window...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both services are starting in separate windows:
echo.
echo 1. AI Chat Server: http://localhost:3000
echo 2. Frontend: http://localhost:5173
echo.
echo Close the respective windows to stop the services.
echo ========================================
echo.
pause
