# AstraFlow v2.0 - LangGraph SDK Integration

## Architecture Overview

AstraFlow v2.0 implements a **dual-server architecture** that separates AI interactions from supporting services, with full integration of the official LangGraph SDK React hooks.

### Key Changes from v1.0

1. **All code and comments in English** ✅
2. **LangGraph for AI interactions** - Uses official `useChat` and `useStream` hooks ✅
3. **Separate chat server** - Handles history, profiles, and analysis ✅
4. **LangGraph-compatible LLM calls** - `_call_llm_with_direct_clients` works through LangGraph API ✅

## Server Architecture

### 1. LangGraph Agent (Port 2024)
**Primary AI interaction server using LangGraph workflows**

- **Purpose**: All AI interactions through LangGraph SDK
- **Graphs**:
  - `agent`: Complex search and research workflows
  - `chat`: Simple chat conversations
- **Integration**: Official `@langchain/langgraph-sdk` React hooks
- **Studio**: LangGraph Studio UI for workflow visualization

### 2. Chat Server (Port 3001)
**Supporting services for data management**

- **Purpose**: History, profiles, analysis APIs
- **Services**:
  - History management (`/api/history`)
  - Profile management (`/api/profiles`)
  - Provider configuration (`/api/providers`)
  - Analysis services (`/api/analysis`)

## Frontend Integration

### Using Official LangGraph SDK Hooks

```typescript
import { useChat, useStream } from '@langchain/langgraph-sdk/react';

// Regular chat with useChat hook
const {
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
} = useChat({
  api: 'http://127.0.0.1:2024/runs',
  graphId: 'chat', // or 'agent' for search
  config: {
    configurable: {
      llm_provider: 'auto',
      temperature: 0.7,
      session_id: 'session-123',
    },
  },
});

// Streaming chat with useStream hook
const {
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  stop,
} = useStream({
  api: 'http://127.0.0.1:2024/runs',
  graphId: 'chat',
  config: {
    configurable: {
      llm_provider: 'gemini',
      temperature: 0.8,
      session_id: 'session-456',
    },
  },
});
```

### Graph Selection

- **`chat` graph**: Simple conversations, direct LLM responses
- **`agent` graph**: Complex search workflows with web research

## API Endpoints

### LangGraph Agent (Port 2024)

#### Standard LangGraph Endpoints
- `POST /runs` - Execute graph workflows
- `GET /runs/{run_id}` - Get run status
- `GET /runs/{run_id}/stream` - Stream run results
- `GET /graphs` - List available graphs

#### Custom Endpoints
- `GET /health` - Health check
- `GET /api/providers` - Get search-specific providers

### Chat Server (Port 3001)

#### History Management
- `GET /api/history` - Get recent history
- `GET /api/history/session/{session_id}` - Get session history
- `DELETE /api/history` - Clear all history
- `DELETE /api/history/session/{session_id}` - Clear session history

#### Profile Management
- `GET /api/profiles` - Get all profiles
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/{profile_id}` - Update profile
- `DELETE /api/profiles/{profile_id}` - Delete profile

#### Provider Configuration
- `GET /api/providers` - Get available providers

## Quick Start

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
pip install -r requirements.txt

# Frontend dependencies (LangGraph SDK already included)
cd ../frontend
npm install
```

### 2. Environment Setup

Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 3. Start Servers

```bash
# Option 1: Use batch script (Windows)
./start_servers.bat

# Option 2: Manual start
# Terminal 1: LangGraph Agent
cd backend
set PYTHONPATH=./src
langgraph dev

# Terminal 2: Chat Server
cd backend/src
python chat_server.py
```

### 4. Frontend Development

```bash
cd frontend
npm run dev
```

## Component Example

```typescript
// components/ChatExample.tsx
import React from 'react';
import { useChat } from '@langchain/langgraph-sdk/react';

export function ChatExample() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: 'http://127.0.0.1:2024/runs',
    graphId: 'chat',
    config: {
      configurable: {
        llm_provider: 'auto',
        temperature: 0.7,
      },
    },
  });

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

## Benefits

### 1. Official SDK Integration
- Uses official LangGraph React hooks
- Consistent with LangGraph ecosystem
- Automatic streaming support
- Built-in error handling

### 2. Clean Architecture
- Clear separation of concerns
- Independent scaling
- Easier maintenance
- Better testing

### 3. Enhanced Developer Experience
- LangGraph Studio integration
- Real-time workflow visualization
- Consistent API patterns
- TypeScript support

## Migration from v1.0

1. **Update frontend imports**:
   ```typescript
   // Old
   import { useChat } from '@/hooks/useChat';
   
   // New
   import { useChat } from '@langchain/langgraph-sdk/react';
   ```

2. **Update API endpoints**:
   - AI interactions: Port 2024 (LangGraph)
   - History/profiles: Port 3001 (Chat Server)

3. **Update configuration**:
   - Use `configurable` parameter for LangGraph config
   - Separate history/profile API calls

## Troubleshooting

### Common Issues

1. **LangGraph SDK connection errors**:
   - Ensure port 2024 is accessible
   - Check CORS configuration
   - Verify graph IDs ('chat', 'agent')

2. **Import errors**:
   - Set `PYTHONPATH=./src` for LangGraph
   - Check all dependencies installed

3. **Provider configuration**:
   - Verify API keys in `.env`
   - Check provider availability endpoints

### Debug Tips

- Use LangGraph Studio for workflow debugging
- Check browser network tab for API calls
- Monitor both server logs simultaneously
- Use health endpoints to verify server status
