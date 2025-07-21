import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Loader2, Search, ExternalLink, AlertCircle } from "lucide-react";
import { getApiUrl, fetchProviders, type ProvidersResponse } from "@/config/api";

interface Message {
  id: string;
  type: "human" | "ai";
  content: string;
  timestamp: Date;
  citations?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

interface AISearchProps {
  onSubmit?: (query: string) => void;
}

export function AISearch({ onSubmit }: AISearchProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Provider information for AI Search
  const [providersData, setProvidersData] = useState<ProvidersResponse | null>(null);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  // Load AI Search providers on component mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setProvidersLoading(true);
        setProvidersError(null);
        const data = await fetchProviders('ai_search');
        setProvidersData(data);
      } catch (error) {
        console.error('Failed to load AI Search providers:', error);
        setProvidersError('Failed to load AI Search providers');
      } finally {
        setProvidersLoading(false);
      }
    };
    
    loadProviders();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "human",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call AI Search API using dynamic configuration
      const searchUrl = getApiUrl('ai_search', 'search');
      
      const response = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            query: userMessage.content
          },
          config: {
            configurable: {
              model: "gemini-1.5-flash", // Default model for search
              provider: "gemini" // AI Search typically uses Gemini for tool support
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let aiResponse = "";
      let citations: Array<{title: string; url: string; snippet: string}> = [];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "",
        timestamp: new Date(),
        citations: []
      };

      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.event === 'data' && data.data) {
                // Handle different types of streaming data
                if (data.data.answer) {
                  aiResponse += data.data.answer;
                }
                if (data.data.citations) {
                  citations = data.data.citations;
                }
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }

        // Update the AI message with current response
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: aiResponse, citations }
            : msg
        ));
      }

      if (onSubmit) {
        onSubmit(userMessage.content);
      }

    } catch (error) {
      console.error("Error calling AI Search API:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `Sorry, I encountered an error while searching: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-800 text-neutral-100">
      <div className="p-4 border-b border-neutral-700">
        <h1 className="text-xl font-semibold text-neutral-100 mb-2">AI Search</h1>
        <p className="text-sm text-neutral-400">
          Powered by web search and real-time information retrieval
        </p>
        
        {/* Provider Status */}
        {providersLoading && (
          <div className="flex items-center text-neutral-400 text-xs mt-2">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Loading search capabilities...
          </div>
        )}
        
        {providersError && (
          <div className="flex items-center text-red-400 text-xs mt-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            {providersError}
          </div>
        )}
        
        {providersData && (
          <div className="text-xs text-neutral-400 mt-2">
            Using: {Object.entries(providersData.providers)
              .filter(([_, info]) => info.available)
              .map(([_, info]) => info.display_name)
              .join(', ')}
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "human" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.type === "human" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === "human"
                      ? "bg-blue-600 ml-3"
                      : "bg-neutral-600 mr-3"
                  }`}
                >
                  {message.type === "human" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.type === "human"
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-700 text-neutral-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-600">
                      <div className="text-xs text-neutral-400 mb-2">Sources:</div>
                      <div className="space-y-2">
                        {message.citations.map((citation, index) => (
                          <div key={index} className="text-xs">
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {citation.title}
                            </a>
                            <div className="text-neutral-400 mt-1">{citation.snippet}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-600 mr-3">
                  <Search className="h-4 w-4" />
                </div>
                <div className="rounded-lg p-3 bg-neutral-700 text-neutral-100">
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching and analyzing...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-neutral-700">
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... I'll search the web for current information."
            className="flex-1 bg-neutral-700 border-neutral-600 text-neutral-100 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
