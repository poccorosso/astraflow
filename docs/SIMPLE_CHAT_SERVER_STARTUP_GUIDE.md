# AI Chat Server Startup Guide

## 📋 Overview

AI Chat Server is a standalone FastAPI server dedicated to handling simple AI conversation features. It's separated from complex search functionality to provide faster response times and simpler deployment.

## 🔧 System Requirements

- Python 3.11 or higher
- Project dependencies installed
- Valid API keys (Gemini or DeepSeek)

## 🚀 Startup Methods

### Method 1: Standard Startup

```powershell
# 1. Activate virtual environment
.\.venv\Scripts\activate

# 2. Navigate to backend source directory
cd backend\src

# 3. Start the server
python ai_chat_server.py
```

### Method 2: Direct uvicorn Startup

```powershell
# 1. Activate virtual environment
.\.venv\Scripts\activate

# 2. Navigate to backend source directory
cd backend\src

# 3. Start with uvicorn
uvicorn ai_chat_server:app --host 0.0.0.0 --port 3000 --reload
```

### Method 3: One-line Command

```powershell
.\.venv\Scripts\activate; cd backend\src; python ai_chat_server.py
```

## ✅ Verify Successful Startup

After successful startup, you should see output similar to this:

```
[HISTORY] Loaded 15 records
[START] Starting AI Chat Server...
[INFO] Service URL: http://localhost:3000
[INFO] API Docs: http://localhost:3000/docs
[TIP] This server handles simple AI conversations only, no search functionality

[GUIDE] How to run both services:
   1. AI Chat: python ai_chat_server.py (port 3000)
   2. AI Search: langgraph dev (port 2024)

INFO:     Uvicorn running on http://0.0.0.0:3000 (Press CTRL+C to quit)
INFO:     Started reloader process [PID] using WatchFiles
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## 🌐 Access the Service

After successful startup, you can access:

- **Server Homepage**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 🔧 Troubleshooting Common Issues

### 1. Port Already in Use

**Problem**: Seeing "Address already in use" error

**Solution**:
```powershell
# Check if port 3000 is occupied
netstat -ano | findstr :3000

# If occupied, kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### 2. Missing Dependencies

**Problem**: Import errors or module not found

**Solution**:
```powershell
# Check if required dependencies are installed
pip list | Select-String uvicorn
pip list | Select-String fastapi

# If missing, install dependencies
pip install uvicorn fastapi
```

### 3. Environment Variables Issue

**Problem**: API key related errors

**Solution**:
- Ensure `backend\.env` file exists
- Check the file contains valid API keys:
  ```
  GEMINI_API_KEY=your_gemini_api_key
  DEEPSEEK_API_KEY=your_deepseek_api_key
  ```

### 4. Python Path Issues

**Problem**: Module import failures

**Solution**:
```powershell
# Ensure starting from correct directory
cd backend\src
python ai_chat_server.py
```

## 🖥️ Starting Frontend Simultaneously

In another terminal window, start the frontend:

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Frontend typically starts at http://localhost:5173.

## 🔄 Complete Development Environment Startup

To run the complete application, you need to start two services:

1. **AI Chat Server** (port 3000) - Handles AI conversations
2. **Frontend** (port 5173) - User interface

Optional:
3. **AI Search Server** (port 2024) - Handles complex search functionality
   ```powershell
   langgraph dev
   ```

## 📝 Important Notes

- Server runs on port 3000 by default
- Auto-reload is enabled in development mode
- Ensure firewall allows access to port 3000
- Check network configuration for external access

## 🆘 Getting Help

If you encounter other issues:

1. Check error messages in terminal output
2. Review API documentation: http://localhost:3000/docs
3. Confirm all dependencies are properly installed
4. Verify environment variable configuration

---

**Note**: This server specifically handles simple AI conversations and does not include search functionality. If you need search features, please also start the LangGraph development server.
