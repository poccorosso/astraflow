/**
 * useStream Hook
 * 
 * A React hook for handling streaming AI chat functionality.
 * This hook manages streaming responses using Server-Sent Events (SSE).
 */

import { useState, useCallback, useRef } from 'react';

export interface StreamMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
  isStreaming?: boolean;
}

export interface StreamOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  sessionId?: string;
  profileId?: string;
}

export interface StreamChunk {
  type: 'start' | 'chunk' | 'end' | 'error';
  content: string;
  provider_used?: string;
  model_used?: string;
  timestamp: string;
}

export interface UseStreamReturn {
  messages: StreamMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string, options?: StreamOptions) => Promise<void>;
  stopStream: () => void;
  clearMessages: () => void;
  clearError: () => void;
}

const CHAT_API_BASE = 'http://127.0.0.1:3001/api';

export function useStream(initialOptions?: StreamOptions): UseStreamReturn {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAssistantMessageRef = useRef<string>('');

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (message: string, options?: StreamOptions) => {
    if (!message.trim()) return;

    // Stop any existing stream
    stopStream();

    const userMessage: StreamMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    currentAssistantMessageRef.current = '';

    try {
      const requestOptions = { ...initialOptions, ...options };
      
      const response = await fetch(`${CHAT_API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          provider: requestOptions.provider || 'auto',
          model: requestOptions.model,
          temperature: requestOptions.temperature || 0.7,
          session_id: requestOptions.sessionId,
          profile_id: requestOptions.profileId,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Create initial assistant message
      const assistantMessageId = generateId();
      let assistantMessage: StreamMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: StreamChunk = JSON.parse(line.slice(6));
                
                switch (data.type) {
                  case 'start':
                    // Stream started
                    break;
                    
                  case 'chunk':
                    currentAssistantMessageRef.current += data.content;
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { 
                            ...msg, 
                            content: currentAssistantMessageRef.current,
                            provider: data.provider_used,
                            model: data.model_used,
                          }
                        : msg
                    ));
                    break;
                    
                  case 'end':
                    // Stream completed
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { 
                            ...msg, 
                            isStreaming: false,
                            provider: data.provider_used,
                            model: data.model_used,
                            timestamp: data.timestamp,
                          }
                        : msg
                    ));
                    setIsStreaming(false);
                    return;
                    
                  case 'error':
                    throw new Error(data.content);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', line, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream was aborted, this is expected
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: StreamMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [initialOptions, stopStream]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStream,
    clearMessages,
    clearError,
  };
}
