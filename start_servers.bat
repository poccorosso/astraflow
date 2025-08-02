@echo off
echo ========================================
echo    AstraFlow v2.0 - Dual Server Setup
echo ========================================
echo.
echo Architecture:
echo - LangGraph Agent (Port 2024): AI Search + Chat with useChat/useStream
echo - Chat Server (Port 3001): History, Profiles, Analysis APIs
echo.

echo [1/2] Starting LangGraph Agent (Port 2024)...
echo      - AI Search workflows
echo      - Simple chat with LangGraph SDK hooks
echo      - LangGraph Studio integration
start "LangGraph Agent" cmd /k "cd backend && set PYTHONPATH=./src && langgraph dev"

echo Waiting 5 seconds for LangGraph to initialize...
timeout /t 5 /nobreak >nul

echo [2/2] Starting Chat Server (Port 3001)...
echo      - History management APIs
echo      - Profile management APIs
echo      - Analysis services
start "Chat Server" cmd /k "cd backend\src && python chat_server.py"

echo.
echo ========================================
echo    Servers Started Successfully!
echo ========================================
echo.
echo LangGraph Agent:
echo   - API: http://127.0.0.1:2024
echo   - Studio: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
echo   - Graphs: 'agent' (search), 'chat' (simple chat)
echo.
echo Chat Server:
echo   - API: http://127.0.0.1:3001
echo   - Health: http://127.0.0.1:3001/health
echo   - Docs: http://127.0.0.1:3001/docs
echo.
echo Frontend Integration:
echo   - Use @langchain/langgraph-sdk useChat/useStream hooks
echo   - Connect to port 2024 for AI interactions
echo   - Connect to port 3001 for history/profiles
echo.
echo Press any key to exit...
pause >nul
