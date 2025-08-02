# AstraFlow Architecture v2.0

## Overview

AstraFlow now uses a **dual-server architecture** that separates concerns for better maintainability, performance, and scalability.

## Architecture Components

### 1. Chat Server (`chat_server.py`)
- **Port**: 3001
- **Purpose**: Handles simple AI conversations, history, profiles, and provider management
- **Features**:
  - Regular chat API (`/api/chat`)
  - Streaming chat API (`/api/chat/stream`)
  - History management (`/api/history`)
  - Profile management (`/api/profiles`)
  - Provider configuration (`/api/providers`)
  - Analysis services (`/api/analysis`)

### 2. Search Agent (`langgraph dev`)
- **Port**: 2024
- **Purpose**: Handles complex AI search and research workflows using LangGraph
- **Features**:
  - Web search with citations
  - Multi-step research workflows
  - LangGraph Studio integration
  - Advanced reasoning and reflection

## Frontend Integration

### React Hooks

#### `useChat` Hook
```typescript
import { useChat } from '@/hooks/useChat';

const { messages, isLoading, sendMessage } = useChat({
  provider: 'auto',
  sessionId: 'session-123'
});

// Send a message
await sendMessage('Hello, how are you?');
```

#### `useStream` Hook
```typescript
import { useStream } from '@/hooks/useStream';

const { messages, isStreaming, sendMessage, stopStream } = useStream({
  provider: 'gemini',
  temperature: 0.7
});

// Send a streaming message
await sendMessage('Tell me a story...');

// Stop streaming if needed
stopStream();
```

## API Endpoints

### Chat Server (Port 3001)

#### Chat Endpoints
- `POST /api/chat` - Regular chat
- `POST /api/chat/stream` - Streaming chat

#### History Endpoints
- `GET /api/history` - Get recent history
- `GET /api/history/session/{session_id}` - Get session history
- `DELETE /api/history` - Clear all history
- `DELETE /api/history/session/{session_id}` - Clear session history

#### Profile Endpoints
- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/{profile_id}` - Get specific profile
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/{profile_id}` - Update profile
- `DELETE /api/profiles/{profile_id}` - Delete profile

#### Provider Endpoints
- `GET /api/providers` - Get available providers

### Search Agent (Port 2024)

#### LangGraph Endpoints
- `POST /runs` - Execute search workflow
- `GET /runs/{run_id}` - Get run status
- `GET /runs/{run_id}/stream` - Stream run results

#### Agent Endpoints
- `GET /health` - Health check
- `GET /api/providers` - Get search-specific providers

## Starting the Servers

### Option 1: Batch Script (Windows)
```bash
./start_servers.bat
```

### Option 2: Manual Start

#### Start Chat Server
```bash
cd backend/src
python chat_server.py
```

#### Start Search Agent
```bash
cd backend
set PYTHONPATH=./src
langgraph dev
```

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Required for both servers
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Optional
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_TRACING_V2=true
```

## Benefits of This Architecture

### 1. Separation of Concerns
- **Chat Server**: Simple, fast AI conversations
- **Search Agent**: Complex research workflows

### 2. Independent Scaling
- Scale chat and search services independently
- Different resource requirements

### 3. Technology Optimization
- Chat: FastAPI with streaming support
- Search: LangGraph with advanced workflows

### 4. Development Experience
- Faster development cycles
- Easier debugging and testing
- Clear service boundaries

### 5. Frontend Simplicity
- Unified hooks (`useChat`, `useStream`)
- Consistent API patterns
- Better error handling

## Migration Guide

### From v1.0 to v2.0

1. **Update Frontend Code**:
   - Replace direct API calls with `useChat` or `useStream` hooks
   - Update API endpoints to use port 3001 for chat

2. **Update Server Startup**:
   - Use `start_servers.bat` or start both servers manually
   - Ensure both ports (3001, 2024) are available

3. **Environment Setup**:
   - Move `.env` file to `backend` directory
   - Ensure all required API keys are set

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   - Chat Server: Change port in `chat_server.py`
   - Search Agent: Use `--port` flag with `langgraph dev`

2. **Import Errors**:
   - Ensure `PYTHONPATH=./src` is set for LangGraph
   - Check that all dependencies are installed

3. **CORS Issues**:
   - Update CORS origins in both servers
   - Ensure frontend URLs are whitelisted

### Logs and Debugging

- **Chat Server**: Check console output on port 3001
- **Search Agent**: Check LangGraph logs and Studio UI
- **Frontend**: Use browser dev tools for network requests
