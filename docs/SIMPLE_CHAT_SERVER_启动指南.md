# AI Chat Server 启动指南

## 📋 概述

AI Chat Server 是一个独立的 FastAPI 服务器，专门处理简单的 AI 对话功能。它与复杂的搜索功能分离，提供更快的响应时间和更简单的部署。

## 🔧 系统要求

- Python 3.11 或更高版本
- 已安装项目依赖
- 有效的 API 密钥（Gemini 或 DeepSeek）

## 🚀 启动方法

### 方法 1: 标准启动方式

```powershell
# 1. 激活虚拟环境
.\.venv\Scripts\activate

# 2. 进入后端源码目录
cd backend\src

# 3. 启动服务器
python ai_chat_server.py
```

### 方法 2: 使用 uvicorn 直接启动

```powershell
# 1. 激活虚拟环境
.\.venv\Scripts\activate

# 2. 进入后端源码目录
cd backend\src

# 3. 使用 uvicorn 启动
uvicorn ai_chat_server:app --host 0.0.0.0 --port 3000 --reload
```

### 方法 3: 一行命令启动

```powershell
.\.venv\Scripts\activate; cd backend\src; python ai_chat_server.py
```

## ✅ 验证启动成功

启动成功后，你应该看到类似这样的输出：

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

## 🌐 访问服务

启动成功后，可以访问以下地址：

- **服务器主页**: http://localhost:3000
- **API 文档**: http://localhost:3000/docs
- **健康检查**: http://localhost:3000/health

## 🔧 常见问题排查

### 1. 端口被占用

**问题**: 看到 "Address already in use" 错误

**解决方案**:
```powershell
# 检查端口 3000 是否被占用
netstat -ano | findstr :3000

# 如果被占用，杀掉进程（替换 <进程ID> 为实际的 PID）
taskkill /PID <进程ID> /F
```

### 2. 依赖缺失

**问题**: 导入错误或模块未找到

**解决方案**:
```powershell
# 检查是否安装了必要依赖
pip list | Select-String uvicorn
pip list | Select-String fastapi

# 如果缺失，安装依赖
pip install uvicorn fastapi
```

### 3. 环境变量问题

**问题**: API 密钥相关错误

**解决方案**:
- 确保 `backend\.env` 文件存在
- 检查文件中包含有效的 API 密钥：
  ```
  GEMINI_API_KEY=your_gemini_api_key
  DEEPSEEK_API_KEY=your_deepseek_api_key
  ```

### 4. Python 路径问题

**问题**: 模块导入失败

**解决方案**:
```powershell
# 确保在正确的目录中启动
cd backend\src
python ai_chat_server.py
```

## 🖥️ 同时启动前端

在另一个终端窗口启动前端：

```powershell
# 进入前端目录
cd frontend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

前端通常会在 http://localhost:5173 启动。

## 🔄 完整的开发环境启动

要运行完整的应用程序，你需要启动两个服务：

1. **AI Chat Server** (端口 3000) - 处理 AI 对话
2. **Frontend** (端口 5173) - 用户界面

可选：
3. **AI Search Server** (端口 2024) - 处理复杂搜索功能
   ```powershell
   langgraph dev
   ```

## 📝 注意事项

- 服务器默认运行在端口 3000
- 开发模式下启用了自动重载
- 确保防火墙允许端口 3000 的访问
- 如果需要外部访问，请检查网络配置

## 🆘 获取帮助

如果遇到其他问题：

1. 检查终端输出中的错误信息
2. 查看 API 文档：http://localhost:3000/docs
3. 确认所有依赖都已正确安装
4. 验证环境变量配置

---

**提示**: 这个服务器专门处理简单的 AI 对话，不包含搜索功能。如果需要搜索功能，请同时启动 LangGraph 开发服务器。
