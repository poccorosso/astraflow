/**
 * useChat Hook
 * 
 * A React hook for handling regular (non-streaming) AI chat functionality.
 * This hook manages chat state, sends messages, and handles responses.
 */

import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
}

export interface ChatOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  sessionId?: string;
  profileId?: string;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, options?: ChatOptions) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

const CHAT_API_BASE = 'http://127.0.0.1:3001/api';

export function useChat(initialOptions?: ChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const sendMessage = useCallback(async (message: string, options?: ChatOptions) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const requestOptions = { ...initialOptions, ...options };
      
      const response = await fetch(`${CHAT_API_BASE}/chat`, {
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        provider: data.provider_used,
        model: data.model_used,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [initialOptions]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    clearError,
  };
}
