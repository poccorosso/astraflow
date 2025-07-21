# 服务器启动指南

## 概述

这个项目现在有两个独立的服务，每个服务有不同的用途和启动方式：

### AI搜索服务 (AI Search Service)
- **功能**: 复杂的网络搜索和研究功能
- **技术栈**: LangGraph + FastAPI
- **端口**: 2024
- **启动方式**: `langgraph dev`

### 简单聊天服务 (AI Chat Service)  
- **功能**: 直接的AI对话，无搜索功能
- **技术栈**: FastAPI + 原生LLM客户端
- **端口**: 3000
- **启动方式**: `python siai_chat_servery`

---

## 启动步骤

### 前提条件

1. **环境变量配置**
   ```bash
   # 在 backend/.env 文件中配置
   GEMINI_API_KEY=your_gemini_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   ```

2. **依赖安装**
   ```bash
   # 后端依赖
   cd backend
   pip install -r requirements.txt
   
   # 前端依赖
   cd frontend
   npm install
   ```

### 方案1: 完整功能 (推荐)

同时启动两个服务，获得完整功能：

#### 步骤1: 启动简单聊天服务
```bash
cd backend/src
python ai_chat_server.py

# 预期输出:
# [START] Starting AI Chat Server...
# [INFO] Service URL: http://localhost:3000
```

#### 步骤2: 启动AI搜索服务
```bash
# 新开一个终端
cd backend
langgraph dev

# 预期输出:
# Welcome to LangGraph
# API: http://127.0.0.1:2024
```

#### 步骤3: 启动前端
```bash
# 新开一个终端
cd frontend
npm run dev

# 预期输出:
# Local: http://localhost:5174/app/
```

### 方案2: 仅简单聊天

如果只需要对话功能：

```bash
# 启动简单聊天服务
cd backend/src
python ai_chat_server.py

# 启动前端
cd frontend
npm run dev
```

---

## 服务详细说明

### 简单聊天服务 (端口3000)

**启动命令:**
```bash
cd backend/src
python ai_chat_server.py
```

**功能特点:**
- 直接AI对话，响应快速
- 支持多种AI模型选择
- 温度参数可调
- 智能提供商切换
- 无网络搜索开销

**API端点:**
- `GET /` - 服务信息
- `POST /api/chat` - 聊天API
- `GET /api/providers` - 可用提供商
- `GET /health` - 健康检查

**适用场景:**
- 日常对话
- 代码解释和帮助
- 创意写作
- 快速问答

### AI搜索服务 (端口2024)

**启动命令:**
```bash
cd backend
langgraph dev
```

**功能特点:**
- 网络搜索和实时信息获取
- 多轮研究和知识整合
- 智能反思和查询优化
- 引用和来源追踪
- 复杂的LangGraph工作流

**API端点:**
- `GET /` - LangGraph Studio界面
- `POST /runs/stream` - 流式研究API
- `GET /docs` - API文档

**适用场景:**
- 学术研究
- 市场调研
- 新闻和时事查询
- 需要引用的专业问答

---

## 前端界面说明

访问 `http://localhost:5174/app/` 后，你会看到：

### 侧边栏
- **AI Search**: 网络搜索和研究功能
- **AI Chat**: 简单AI对话功能

### 功能切换
- 点击侧边栏按钮可以在两种模式间切换
- 每种模式连接到对应的后端服务

---

## 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口使用情况
netstat -ano | findstr :3000
netstat -ano | findstr :2024

# 解决方案: 关闭占用端口的进程或修改配置中的端口号
```

#### 2. API密钥问题
```bash
# 确保.env文件在正确位置
ls backend/.env

# 检查API密钥是否设置
cat backend/.env | grep API_KEY
```

#### 3. 依赖问题
```bash
# 重新安装依赖
pip install -r backend/requirements.txt
npm install --prefix frontend
```

#### 4. 服务连接问题
```bash
# 测试服务健康状态
curl http://localhost:3000/health  # 简单聊天
curl http://localhost:2024/health  # AI搜索
```

---

## 测试

使用提供的测试脚本验证系统：

```bash
# 测试所有功能
cd backend
python test/test_all.py

# 单独测试
python test/test_imports.py      # 模块导入测试
python test/test_simple_chat.py  # 简单聊天测试
python test/test_ai_search.py    # AI搜索测试
```

---

## 性能对比

| 特性 | AI搜索 | 简单聊天 |
|------|--------|----------|
| **响应时间** | 10-30秒 | 1-5秒 |
| **功能复杂度** | 高 | 低 |
| **资源消耗** | 高 | 低 |
| **信息准确性** | 高 (实时搜索) | 中 (训练数据) |
| **引用支持** | ✓ | ✗ |
| **多轮研究** | ✓ | ✗ |

---

## 最佳实践

### 开发环境
1. 使用两个服务获得完整功能体验
2. 开启自动重载便于调试
3. 监控日志输出排查问题

### 生产环境
1. 根据需求选择启动的服务
2. 配置适当的资源限制
3. 设置健康检查和监控

### 成本优化
- 日常对话使用简单聊天 (成本更低)
- 研究任务使用AI搜索 (功能更强)
- 合理配置API调用频率限制

---

**最后更新**: 2024年12月
**文档版本**: 2.0
