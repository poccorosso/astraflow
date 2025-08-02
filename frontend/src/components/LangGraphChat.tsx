/**
 * LangGraph Chat Component
 * 
 * This component demonstrates how to use the official LangGraph SDK
 * useChat and useStream hooks with our dual-server architecture.
 */

import React, { useState } from 'react';
import { useChat, useStream } from '@langchain/langgraph-sdk/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';

// Configuration for LangGraph connection
const LANGGRAPH_API_URL = 'http://127.0.0.1:2024';

interface ChatConfig {
  provider: string;
  model?: string;
  temperature: number;
  sessionId: string;
}

export function LangGraphChat() {
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState<ChatConfig>({
    provider: 'auto',
    temperature: 0.7,
    sessionId: `session-${Date.now()}`,
  });

  // Use the official LangGraph SDK useChat hook for regular chat
  const {
    messages: chatMessages,
    input: chatInput,
    handleInputChange: handleChatInputChange,
    handleSubmit: handleChatSubmit,
    isLoading: isChatLoading,
    error: chatError,
  } = useChat({
    api: `${LANGGRAPH_API_URL}/runs`,
    graphId: 'chat', // References our simple chat graph
    config: {
      configurable: {
        llm_provider: config.provider,
        temperature: config.temperature,
        session_id: config.sessionId,
        query_generator_model: config.model,
      },
    },
  });

  // Use the official LangGraph SDK useStream hook for streaming chat
  const {
    messages: streamMessages,
    input: streamInput,
    handleInputChange: handleStreamInputChange,
    handleSubmit: handleStreamSubmit,
    isLoading: isStreamLoading,
    error: streamError,
    stop: stopStream,
  } = useStream({
    api: `${LANGGRAPH_API_URL}/runs`,
    graphId: 'chat', // References our simple chat graph
    config: {
      configurable: {
        llm_provider: config.provider,
        temperature: config.temperature,
        session_id: config.sessionId,
        query_generator_model: config.model,
      },
    },
  });

  const handleProviderChange = (provider: string) => {
    setConfig(prev => ({ ...prev, provider }));
  };

  const handleModelChange = (model: string) => {
    setConfig(prev => ({ ...prev, model }));
  };

  const handleTemperatureChange = (temperature: number[]) => {
    setConfig(prev => ({ ...prev, temperature: temperature[0] }));
  };

  const renderMessages = (messages: any[]) => {
    return messages.map((msg, index) => (
      <div
        key={index}
        className={`mb-4 p-3 rounded-lg ${
          msg.role === 'user'
            ? 'bg-blue-100 ml-8'
            : 'bg-gray-100 mr-8'
        }`}
      >
        <div className="font-semibold text-sm mb-1">
          {msg.role === 'user' ? 'You' : 'Assistant'}
          {msg.additional_kwargs?.provider_used && (
            <span className="ml-2 text-xs text-gray-500">
              ({msg.additional_kwargs.provider_used})
            </span>
          )}
        </div>
        <div className="text-sm">{msg.content}</div>
      </div>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>LangGraph Chat Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provider</label>
              <Select value={config.provider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Model (Optional)</label>
              <Input
                value={config.model || ''}
                onChange={(e) => handleModelChange(e.target.value)}
                placeholder="e.g., gemini-1.5-flash"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature: {config.temperature}
              </label>
              <Slider
                value={[config.temperature]}
                onValueChange={handleTemperatureChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Session ID</label>
            <Input
              value={config.sessionId}
              onChange={(e) => setConfig(prev => ({ ...prev, sessionId: e.target.value }))}
              placeholder="Session identifier for conversation history"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular">Regular Chat (useChat)</TabsTrigger>
          <TabsTrigger value="streaming">Streaming Chat (useStream)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regular Chat</CardTitle>
              <p className="text-sm text-gray-600">
                Uses LangGraph SDK's useChat hook for standard request-response chat
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center">Start a conversation...</p>
                ) : (
                  renderMessages(chatMessages)
                )}
              </div>
              
              {chatError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  Error: {chatError.message}
                </div>
              )}
              
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={handleChatInputChange}
                  placeholder="Type your message..."
                  disabled={isChatLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isChatLoading}>
                  {isChatLoading ? 'Sending...' : 'Send'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="streaming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Streaming Chat</CardTitle>
              <p className="text-sm text-gray-600">
                Uses LangGraph SDK's useStream hook for real-time streaming responses
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4">
                {streamMessages.length === 0 ? (
                  <p className="text-gray-500 text-center">Start a streaming conversation...</p>
                ) : (
                  renderMessages(streamMessages)
                )}
              </div>
              
              {streamError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  Error: {streamError.message}
                </div>
              )}
              
              <form onSubmit={handleStreamSubmit} className="flex gap-2">
                <Input
                  value={streamInput}
                  onChange={handleStreamInputChange}
                  placeholder="Type your message..."
                  disabled={isStreamLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isStreamLoading}>
                  {isStreamLoading ? 'Streaming...' : 'Send'}
                </Button>
                {isStreamLoading && (
                  <Button type="button" onClick={stopStream} variant="outline">
                    Stop
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Architecture Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <ul className="list-disc list-inside space-y-1">
            <li>Both hooks connect to the LangGraph server on port 2024</li>
            <li>The 'chat' graph ID references our simple chat workflow</li>
            <li>Configuration is passed through the configurable parameter</li>
            <li>Regular chat waits for complete responses</li>
            <li>Streaming chat shows responses as they're generated</li>
            <li>Session ID enables conversation history across messages</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
