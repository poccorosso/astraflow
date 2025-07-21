# Server Startup Guide

## Overview

This project now has two independent services, each with different purposes and startup methods:

### AI Search Service
- **Function**: Complex web search and research functionality
- **Tech Stack**: LangGraph + FastAPI
- **Port**: 2024
- **Startup**: `langgraph dev`

### AI Chat Service  
- **Function**: Direct AI conversation, no search functionality
- **Tech Stack**: FastAPI + Native LLM clients
- **Port**: 3000
- **Startup**: `python ai_chat_server.py`

---

## Startup Steps

### Prerequisites

1. **Environment Variables Configuration**
   ```bash
   # Configure in backend/.env file
   GEMINI_API_KEY=your_gemini_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   ```

2. **Dependencies Installation**
   ```bash
   # Backend dependencies
   cd backend
   pip install -r requirements.txt
   
   # Frontend dependencies  
   cd frontend
   npm install
   ```

### Option 1: Full Features (Recommended)

Start both services for complete functionality:

#### Step 1: Start AI Chat Service
```bash
cd backend/src
python ai_chat_server.py

# Expected output:
# [START] Starting AI Chat Server...
# [INFO] Service URL: http://localhost:3000
```

#### Step 2: Start AI Search Service
```bash
# Open a new terminal
cd backend
langgraph dev

# Expected output:
# Welcome to LangGraph
# API: http://127.0.0.1:2024
```

#### Step 3: Start Frontend
```bash
# Open a new terminal
cd frontend
npm run dev

# Expected output:
# Local: http://localhost:5174/app/
```

### Option 2: AI Chat Only

If you only need conversation functionality:

```bash
# Start AI Chat service
cd backend/src
python ai_chat_server.py

# Start frontend
cd frontend
npm run dev
```

---

## Service Details

### AI Chat Service (Port 3000)

**Startup Command:**
```bash
cd backend/src
python ai_chat_server.py
```

**Features:**
- Direct AI conversation, fast response
- Support multiple AI model selection
- Adjustable temperature parameter
- Intelligent provider switching
- No web search overhead

**API Endpoints:**
- `GET /` - Service information
- `POST /api/chat` - Chat API
- `GET /api/providers` - Available providers
- `GET /health` - Health check

**Use Cases:**
- Daily conversation
- Code explanation and help
- Creative writing
- Quick Q&A

### AI Search Service (Port 2024)

**Startup Command:**
```bash
cd backend
langgraph dev
```

**Features:**
- Web search and real-time information retrieval
- Multi-round research and knowledge integration  
- Intelligent reflection and query optimization
- Citations and source tracking
- Complex LangGraph workflows

**API Endpoints:**
- `GET /` - LangGraph Studio interface
- `POST /runs/stream` - Streaming research API
- `GET /docs` - API documentation

**Use Cases:**
- Academic research
- Market research  
- News and current events
- Professional Q&A requiring citations

---

## Frontend Interface

After visiting `http://localhost:5174/app/`, you will see:

### Sidebar
- **AI Search**: Web search and research functionality
- **AI Chat**: Simple AI conversation functionality

### Feature Switching
- Click sidebar buttons to switch between two modes
- Each mode connects to the corresponding backend service

---

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check port usage
netstat -ano | findstr :3000
netstat -ano | findstr :2024

# Solution: Close processes using the ports or modify port configuration
```

#### 2. API Key Issues
```bash
# Ensure .env file is in correct location
ls backend/.env

# Check if API keys are set
cat backend/.env | grep API_KEY
```

#### 3. Dependency Issues
```bash
# Reinstall dependencies
pip install -r backend/requirements.txt
npm install --prefix frontend
```

#### 4. Service Connection Issues
```bash
# Test service health
curl http://localhost:3000/health  # AI Chat
curl http://localhost:2024/health  # AI Search
```

---

## Testing

Use the provided test scripts to verify the system:

```bash
# Test all functionality
cd backend
python test/test_all.py

# Individual tests
python test/test_imports.py      # Module import tests
python test/test_simple_chat.py  # AI Chat tests
python test/test_ai_search.py    # AI search tests
```

---

## Performance Comparison

| Feature | AI Search | AI Chat |
|---------|-----------|-------------|
| **Response Time** | 10-30s | 1-5s |
| **Complexity** | High | Low |
| **Resource Usage** | High | Low |
| **Information Accuracy** | High (real-time) | Medium (training data) |
| **Citations Support** | ✓ | ✗ |
| **Multi-round Research** | ✓ | ✗ |

---

## Best Practices

### Development Environment
1. Use both services for complete functionality experience
2. Enable auto-reload for easier debugging
3. Monitor log output for troubleshooting

### Production Environment  
1. Choose services to start based on requirements
2. Configure appropriate resource limits
3. Set up health checks and monitoring

### Cost Optimization
- Use AI Chat for daily conversations (lower cost)
- Use AI Search for research tasks (more powerful)
- Configure reasonable API call rate limits

---

**Last Updated**: December 2024
**Document Version**: 2.0
