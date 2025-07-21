pip@echo off
echo ========================================
echo    AI Chat Server Startup Script
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo Error: Virtual environment not found!
    echo Please make sure .venv directory exists.
    pause
    exit /b 1
)

REM Check if backend source directory exists
if not exist "backend\src\ai_chat_server.py" (
    echo Error: ai_chat_server.py not found!
    echo Please make sure you're in the correct directory.
    pause
    exit /b 1
)

echo [1/3] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [2/3] Changing to backend source directory...
cd backend\src

echo [3/3] Starting AI Chat Server...
echo.
echo Server will start at: http://localhost:3000
echo API Documentation: http://localhost:3000/docs
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python ai_chat_server.py

echo.
echo Server stopped.
pause
