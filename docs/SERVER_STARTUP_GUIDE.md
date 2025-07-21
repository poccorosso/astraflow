# Server Startup Guide / 服务器启动指南

## Language Versions / 语言版本

Please choose your preferred language:

- **[English Version](SERVER_STARTUP_GUIDE_EN.md)** - Complete English documentation
- **[中文版本](SERVER_STARTUP_GUIDE_CN.md)** - 完整中文文档

---

## Quick Start / 快速开始

### For English Users
1. Read the [English Guide](SERVER_STARTUP_GUIDE_EN.md)
2. Start AI Chat: `cd backend/src && python ai_chat_server.py`
3. Start Frontend: `cd frontend && npm run dev`
4. Visit: http://localhost:5174/app/

### 中文用户
1. 阅读[中文指南](SERVER_STARTUP_GUIDE_CN.md)
2. 启动简单聊天: `cd backend/src && python simpai_chat_server
3. 启动前端: `cd frontend && npm run dev`
4. 访问: http://localhost:5174/app/

---

## Overview / 概述

This project has two independent services:

### 🔍 AI Search Service (AI搜索服务)
- **功能 / Function**: 复杂的网络搜索和研究功能
- **技术栈 / Tech Stack**: LangGraph + FastAPI
- **端口 / Port**: 2024
- **启动方式 / Startup**: `langgraph dev`

### 💬 AI Chat Service (简单聊天服务)  
- **功能 / Function**: 直接的AI对话，无搜索功能
- **技术栈 / Tech Stack**: FastAPI + 原生LLM客户端
- **端口 / Port**: 3000
- **启动方式 / Startup**: `python siai_chat_servery`

---

## 🚀 启动步骤 / Startup Steps

### 前提条件 / Prerequisites

1. **环境变量配置 / Environment Variables**
   ```bash
   # 在 backend/.env 文件中配置 / Configure in backend/.env file
   GEMINI_API_KEY=your_gemini_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   ```

2. **依赖安装 / Dependencies Installation**
   ```bash
   # 后端依赖 / Backend dependencies
   cd backend
   pip install -r requirements.txt
   
   # 前端依赖 / Frontend dependencies  
   cd frontend
   npm install
   ```

### 方案1: 完整功能 (推荐) / Option 1: Full Features (Recommended)

同时启动两个服务，获得完整功能：
Start both services for full functionality:

#### 步骤1: 启动AI Search服务 / Step 1: Start AI Search Service
```bash
# 在项目根目录 / In project root directory
cd backend
langgraph dev

# 输出示例 / Expected output:
# ✅ LangGraph服务启动在端口2024
# ✅ LangGraph service started on port 2024
# 🌐 访问地址: http://localhost:2024
```

#### 步骤2: 启动Simple Chat服务 / Step 2: Start SimAI Chatrvice
```bash
# 新开一个终端 / Open a new terminal
cd backend/src
python ai_chat_server.py

# 输出示例 / Expected output:
# ✅ Simple Chat服务启动在端口3000
# ✅ SAI Chatservice started on port 3000
# 🌐 访问地址: http://localhost:3000
```

#### 步骤3: 启动前端 / Step 3: Start Frontend
```bash
# 新开一个终端 / Open a new terminal
cd frontend
npm run dev

# 输出示例 / Expected output:
# ✅ 前端服务启动在端口5174
# ✅ Frontend service started on port 5174
# 🌐 访问地址: http://localhost:5174/app/
```

### 方案2: 仅AI Search / Option 2: AI Search Only

如果只需要搜索功能：
If you only need search functionality:

```bash
# 启动LangGraph服务 / Start LangGraph service
cd backend
langgraph dev

# 启动前端 / Start frontend
cd frontend
npm run dev
```

### 方案3: 仅Simple Chat / Option 3: SAI ChatOnly

如果只需要简单对话功能：
If you only need AI chat functionality:

```bash
# 启动Simple Chat服务 / Start SiAI Chatervice
cd backend/src
python ai_chat_server.py

# 启动前端 / Start frontend
cd frontend
npm run dev
```

---

## 🔧 服务详细说明 / Service Details

### AI Search Service (端口2024)

**启动命令 / Startup Command:**
```bash
langgraph dev
```

**功能特点 / Features:**
- ✅ 网络搜索和实时信息获取 / Web search and real-time information
- ✅ 多轮研究和知识整合 / Multi-round research and knowledge integration  
- ✅ 智能反思和查询优化 / Intelligent reflection and query optimization
- ✅ 引用和来源追踪 / Citations and source tracking
- ✅ 复杂的LangGraph工作流 / Complex LangGraph workflows

**API端点 / API Endpoints:**
- `GET /` - LangGraph Studio界面
- `POST /runs/stream` - 流式研究API
- `GET /docs` - API文档

**适用场景 / Use Cases:**
- 学术研究 / Academic research
- 市场调研 / Market research  
- 新闻和时事查询 / News and current events
- 需要引用的专业问答 / Professional Q&A requiring citations

### AI Chat Service (端口3000)

**启动命令 / Startup Command:**
```bash
python ai_chat_server.py
```

**功能特点 / Features:**
- ✅ 直接AI对话，响应快速 / Direct AI conversation, fast response
- ✅ 支持多种AI模型选择 / Support multiple AI model selection
- ✅ 温度参数可调 / Adjustable temperature parameter
- ✅ 智能提供商切换 / Intelligent provider switching
- ✅ 无网络搜索开销 / No web search overhead

**API端点 / API Endpoints:**
- `GET /` - 服务信息
- `POST /api/chat` - 聊天API
- `GET /api/providers` - 可用提供商
- `GET /health` - 健康检查
- `GET /docs` - API文档

**适用场景 / Use Cases:**
- 日常对话 / Daily conversation
- 代码解释和帮助 / Code explanation and help
- 创意写作 / Creative writing
- 快速问答 / Quick Q&A

---

## 🌐 前端界面说明 / Frontend Interface

访问 `http://localhost:5174/app/` 后，你会看到：
After visiting `http://localhost:5174/app/`, you will see:

### 侧边栏 / Sidebar
- **AI Search**: 网络搜索和研究功能
- **AI Chat**: 简单AI对话功能

### 功能切换 / Feature Switching
- 点击侧边栏按钮可以在两种模式间切换
- Click sidebar buttons to switch between two modes
- 每种模式连接到对应的后端服务
- Each mode connects to the corresponding backend service

---

## 🔍 故障排除 / Troubleshooting

### 常见问题 / Common Issues

#### 1. 端口冲突 / Port Conflicts
```bash
# 检查端口使用情况 / Check port usage
netstat -ano | findstr :2024
netstat -ano | findstr :3000
netstat -ano | findstr :5174

# 解决方案 / Solution
# 关闭占用端口的进程或修改配置中的端口号
```

#### 2. API密钥问题 / API Key Issues
```bash
# 检查环境变量 / Check environment variables
echo $GEMINI_API_KEY
echo $DEEPSEEK_API_KEY

# 确保.env文件在正确位置 / Ensure .env file is in correct location
ls backend/.env
```

#### 3. 依赖问题 / Dependency Issues
```bash
# 重新安装依赖 / Reinstall dependencies
pip install -r backend/requirements.txt
npm install --prefix frontend
```

#### 4. 服务连接问题 / Service Connection Issues
```bash
# 测试服务健康状态 / Test service health
curl http://localhost:2024/health  # AI Search
curl http://localhost:3000/health  # AI Chat
```

### 调试模式 / Debug Mode

启用详细日志：
Enable verbose logging:

```bash
# AI Search服务 / AI Search Service
LANGCHAIN_TRACING_V2=true langgraph dev

# Simple Chat服务 / SAI ChatService  
python ai_chat_server.py --log-level debug
```

---

## 📊 性能对比 / Performance Comparison

| 特性 / Feature | AI Search | SiAI Chat
|----------------|-----------|-------------|
| **响应时间 / Response Time** | 10-30秒 / 10-30s | 1-5秒 / 1-5s |
| **功能复杂度 / Complexity** | 高 / High | 低 / Low |
| **资源消耗 / Resource Usage** | 高 / High | 低 / Low |
| **信息准确性 / Accuracy** | 高 (实时搜索) / High (real-time) | 中 (训练数据) / Medium (training data) |
| **引用支持 / Citations** | ✅ | ❌ |
| **多轮研究 / Multi-round** | ✅ | ❌ |

---

## 🎯 最佳实践 / Best Practices

### 开发环境 / Development Environment
1. 使用两个服务获得完整功能体验
2. 开启自动重载便于调试
3. 监控日志输出排查问题

### 生产环境 / Production Environment  
1. 根据需求选择启动的服务
2. 配置适当的资源限制
3. 设置健康检查和监控
4. 使用反向代理统一入口

### 成本优化 / Cost Optimization
- 日常对话使用Simple Chat (成本更低)
- 研究任务使用AI Search (功能更强)
- 合理配置API调用频率限制

---

**最后更新 / Last Updated**: 2024年12月
**文档版本 / Document Version**: 1.0
