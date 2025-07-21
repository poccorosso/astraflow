import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { OptimizedTextarea } from "@/components/ui/optimized-textarea";
import {
  Send,
  Bot,
  User,
  Loader2,
  RotateCcw,
  History,
  Plus,
  Copy,
  FileDown,
  Check,
  Heart,
  Brain,
  X,
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/hooks/useTheme";
import HistorySidebar from "@/components/HistorySidebar";
import ProfileSelector from "@/components/ProfileSelector";
import {
  getCurrentSessionId,
  startNewSession,
  formatSessionId,
  updateSessionActivity,
} from "../utils/sessionManager";
import { FavoriteItem } from "@/models/FavoriteItem";
import { Message } from "@/models/Message";
import ProviderSelector from "@/components/ProviderSelector";
import { useOptimizedInput } from "@/hooks/useOptimizedInput";
import { SimplePerformanceMonitor } from "@/components/SimplePerformanceMonitor";
import ThinkingProcess from "@/components/ThinkingProcess";

interface AIChatProps {
  onSubmit?: (
    message: string,
    provider: string,
    model: string,
    temperature: number
  ) => void;
  onShowFavorites?: () => void;
  onShowProfiles?: () => void;
}

export function AIChat({
  onSubmit,
  onShowFavorites,
  onShowProfiles,
}: AIChatProps) {
  const { theme } = useTheme();

  // Load messages from localStorage on component mount
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("ai_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error("Failed to load saved messages:", error);
    }
    return [];
  });

  const inputManager = useOptimizedInput({
    initialValue: "",
    maxLength: 10000, 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState("auto");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState([0.7]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Session and History management
  const [sessionId, setSessionId] = useState<string>(() =>
    getCurrentSessionId()
  );
  const [historyOpen, setHistoryOpen] = useState(() => {
    const saved = localStorage.getItem("history_sidebar_open");
    return saved ? JSON.parse(saved) : true;
  });

  // Dynamic provider/model loading
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // User Profile state
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  // AI Thinking Process state - now using tabs
  const [thinkingProcessVisible, setThinkingProcessVisible] = useState(false);

  // Performance monitoring state
  const [performanceMonitorVisible, setPerformanceMonitorVisible] =
    useState(false);

  const [containerHeight, setContainerHeight] = useState(
    "calc(100vh - 180px - 132px)"
  );

  const updateContainerHeight = useCallback(() => {
    if (textareaRef.current) {
      const height = `calc(100vh - 180px - ${
        textareaRef.current.offsetHeight + 32
      }px)`;
      setContainerHeight(height);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const resizeObserver = new ResizeObserver(() => {
      updateContainerHeight();
    });

    resizeObserver.observe(textarea);
    updateContainerHeight(); // ³õÊ¼¼ÆËã

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateContainerHeight]);

  useEffect(() => {
    const scrollWithRAF = () => {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    };

    scrollWithRAF();
  }, [messages, isLoading, scrollToBottom]);

  const handleSubmit = async () => {
    if (!inputManager.value.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "human",
      content: inputManager.value.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    inputManager.reset();
    setIsLoading(true);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Update session activity time
    updateSessionActivity(sessionId);

    const startTime = Date.now();

    try {
      // AI Chat API / Call AI Chat API
      // Note: AI Chat uses separate server on port 3000
      // Call AI Chat API using dynamic configuration
      const chatUrl = getApiUrl("ai_chat", "chat");

      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage.content,
          provider: provider,
          model: model,
          temperature: temperature[0],
          session_id: sessionId,
          profile_id: currentProfileId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      const responseTime = new Date();
      const timeString = responseTime.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `${
          data.response || "Sorry, I couldn't generate a response."
        }\n\n*Response time: ${duration}s | ${timeString}*`,
        model: `${data.provider_used ?? ""} ${data.model_used ?? ""}`,
        timestamp: responseTime,
      };

      const newMessages = [...messages, userMessage, aiMessage];
      setMessages(newMessages);

      // Update session activity time after receiving response
      updateSessionActivity(sessionId);

      // Save messages to localStorage
      try {
        localStorage.setItem("ai_chat_messages", JSON.stringify(newMessages));
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
    } catch (error: any) {
      console.error("Error:", error);

      let errorContent =
        "Sorry, there was an error processing your request. Please try again.";

      // Handle abort error
      if (error.name === "AbortError") {
        errorContent = "Request was cancelled by user.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setAbortController(null);

      // Scroll to bottom after response
      scrollToBottom();
    }

    // Optional callback
    if (onSubmit) {
      onSubmit(userMessage.content, provider, model, temperature[0]);
    }
  };

  const handleAbort = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Function to start a new clean session
  const startNewCleanSession = () => {
    // Generate new session ID
    const newSessionId = startNewSession();

    // Clear messages
    setMessages([]);

    // Clear localStorage for messages
    localStorage.removeItem("ai_chat_messages");

    // Update session ID
    setSessionId(newSessionId);

    // Scroll to top since messages are cleared
    scrollToTop();

    console.log(`Started new clean session: ${newSessionId}`);
  };

  // Function to copy message content
  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("ai_chat_favorites");
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(
          parsed.map((fav: any) => ({
            ...fav,
            timestamp: new Date(fav.timestamp),
          }))
        );
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: FavoriteItem[]) => {
    localStorage.setItem("ai_chat_favorites", JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  };

  // Check if a message is favorited
  const isFavorited = (messageId: string): boolean => {
    return favorites.some((fav) => fav.messageId === messageId);
  };

  // Toggle favorite status
  const toggleFavorite = (
    messageId: string,
    userPrompt: string,
    aiResponse: string,
    model?: string
  ) => {
    const existingIndex = favorites.findIndex(
      (fav) => fav.messageId === messageId
    );

    if (existingIndex >= 0) {
      // Remove from favorites
      const newFavorites = favorites.filter(
        (fav) => fav.messageId !== messageId
      );
      saveFavorites(newFavorites);
    } else {
      // Add to favorites
      const newFavorite: FavoriteItem = {
        id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        messageId,
        sessionId,
        userPrompt,
        aiResponse,
        model,
        timestamp: new Date(),
      };
      const newFavorites = [newFavorite, ...favorites];
      saveFavorites(newFavorites);
    }
  };

  // Function to export conversation as Markdown (better for Chinese text)
  const exportToMarkdown = (
    _messageId: string, // Prefix with underscore to indicate intentionally unused
    userPrompt: string,
    aiResponse: string,
    model?: string
  ) => {
    const timestamp = new Date().toLocaleString();
    const sessionDisplay = formatSessionId(sessionId);

    const markdownContent = `# AI Chat Conversation

**Session:** ${sessionDisplay}
**Exported:** ${timestamp}
${model ? `**Model:** ${model}` : ""}

---

## User Prompt

${userPrompt}

---

## AI Response

${aiResponse}

---

*Exported from AI Chat Application*
`;

    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-${sessionDisplay}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load session history
  const loadSessionHistory = async (selectedSessionId: string) => {
    try {
      const response = await fetch(
        `${getApiUrl("ai_chat", "history")}/session/${selectedSessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        const sessionRecords = data.records || [];

        // Convert session records to messages
        const sessionMessages: Message[] = [];
        sessionRecords.forEach((record: any) => {
          // Add user message
          sessionMessages.push({
            id: `${record.id}_user`,
            type: "human",
            content: record.query,
            timestamp: new Date(record.timestamp),
          });

          // Add AI response
          sessionMessages.push({
            id: `${record.id}_ai`,
            type: "ai",
            content: record.response,
            timestamp: new Date(record.timestamp),
            model: `${record.provider_used ?? ""} ${record.model_used ?? ""}`,
          });
        });

        // Sort by timestamp and set as current messages
        sessionMessages.sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        setMessages(sessionMessages);

        // Switch to the selected session
        setSessionId(selectedSessionId);

        // Update session activity time when switching to it
        updateSessionActivity(selectedSessionId);

        // Save to localStorage
        try {
          localStorage.setItem(
            "ai_chat_messages",
            JSON.stringify(sessionMessages)
          );
        } catch (error) {
          console.error("Failed to save messages:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const renderHeader = useMemo(() => {
    return (
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground">AI Chat</h1>
          <div className="flex items-center space-x-3">
            {/* New Session Button */}
            <Button
              onClick={startNewCleanSession}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
            {/* Session ID Display */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Session:</span>
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">
                {formatSessionId(sessionId)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewCleanSession}
                className="text-muted-foreground hover:text-foreground p-1"
                title="Start new clean session"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* AI Thinking Process Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setThinkingProcessVisible(!thinkingProcessVisible)}
              className="text-muted-foreground hover:text-foreground"
              title={
                thinkingProcessVisible
                  ? "Hide AI thinking process"
                  : "Show AI thinking process"
              }
            >
              <Brain className="h-4 w-4" />
            </Button>

            {/* History Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newState = !historyOpen;
                setHistoryOpen(newState);
                localStorage.setItem(
                  "history_sidebar_open",
                  JSON.stringify(newState)
                );
              }}
              className="text-muted-foreground hover:text-foreground"
              title={historyOpen ? "Hide history" : "Show history"}
            >
              <History className="h-4 w-4" />
            </Button>

            {/* Favorites Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowFavorites}
              className="text-muted-foreground hover:text-foreground"
              title="View favorites"
            >
              <Heart className="h-4 w-4" />
              <span className="ml-1 text-xs">({favorites.length})</span>
            </Button>
          </div>
        </div>

        {/* Profile Selection */}
        <div className="mb-4">
          <ProfileSelector
            selectedProfileId={currentProfileId}
            onProfileChange={(profile) => {
              if (profile) {
                setCurrentProfile(profile);
                setCurrentProfileId(profile?.id);
              } else {
                setCurrentProfileId(null);
                setCurrentProfile(null);
              }
            }}
            onManageProfiles={onShowProfiles}
            selectedProfile={currentProfile}
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Provider Selection */}
          <ProviderSelector
            selectedTemperature={temperature}
            selectedModel={model}
            selectedProvider={provider}
            onProviderChange={setProvider}
            onModelChange={setModel}
            onTemperatureChange={setTemperature}
          />
        </div>
      </div>
    );
  }, [currentProfileId,currentProfile]);

  const renderMessage = useMemo(() => {
    return (
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 min-h-0"
        style={{ maxHeight: containerHeight }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
            <p className="text-sm text-center">
              Ask me anything! This is a direct chat without web search.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "human"
                    ? "justify-end"
                    : "justify-start text-md"
                }`}
              >
                <div
                  className={`flex max-w-[40%] ${
                    message.type === "human" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "human"
                        ? "bg-blue-600 ml-2"
                        : "bg-muted mr-2"
                    }`}
                  >
                    {message.type === "human" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.type === "human"
                        ? "bg-blue-600 text-white"
                        : "bg-card text-card-foreground border border-border bg-muted"
                    }`}
                  >
                    <div className="max-h-96 overflow-y-auto">
                      {message.type === "ai" ? (
                        <ReactMarkdown
                          className="prose prose-sm prose-invert max-w-[30vw] w-[30vw]"
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0 ">{children}</p>
                            ),
                            code: ({ className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );
                              const language = match ? match[1] : "";
                              const inline = props.inline;

                              if (!inline && language) {
                                // Code block with syntax highlighting
                                return (
                                  <SyntaxHighlighter
                                    style={theme === "dark" ? vscDarkPlus : vs}
                                    language={language}
                                    PreTag="div"
                                    className="my-2 rounded-lg text-sm"
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                );
                              }

                              // Inline code
                              return (
                                <code className="bg-muted px-1 py-0.5 rounded text-sm">
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ children }) => (
                              <div className="my-2">{children}</div>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div
                        className={`text-xs ${
                          message.type === "human"
                            ? "text-blue-200"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.timestamp)} {message.model}
                      </div>
                      {}
                      {message.type === "ai" && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyMessage(message.id, message.content)
                            }
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            title="Copy response"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Find the corresponding user message
                              const messageIndex = messages.findIndex(
                                (m) => m.id === message.id
                              );
                              const userMessage =
                                messageIndex > 0
                                  ? messages[messageIndex - 1]
                                  : null;
                              const userPrompt =
                                userMessage?.content || "No prompt found";
                              toggleFavorite(
                                message.id,
                                userPrompt,
                                message.content,
                                message.model
                              );
                            }}
                            className={`h-6 w-6 p-0 ${
                              isFavorited(message.id)
                                ? "text-red-500 hover:text-red-600"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={
                              isFavorited(message.id)
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                          >
                            {isFavorited(message.id) ? (
                              <Heart className="h-3 w-3 fill-current" />
                            ) : (
                              <Heart className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Find the corresponding user message
                              const messageIndex = messages.findIndex(
                                (m) => m.id === message.id
                              );
                              const userMessage =
                                messageIndex > 0
                                  ? messages[messageIndex - 1]
                                  : null;
                              const userPrompt =
                                userMessage?.content || "No prompt found";
                              exportToMarkdown(
                                message.id,
                                userPrompt,
                                message.content,
                                message.model
                              );
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            title="Export as Markdown"
                          >
                            <FileDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex flex-row">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted mr-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="rounded-lg p-3 bg-card text-card-foreground border border-border dark:bg-muted light:bg-muted">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [messages, isLoading]);

  return (
    <div className="flex h-full bg-background">
      {/* Main Sidebar - Fixed 300px */}
      {historyOpen && (
        <div className="w-[300px] border-r border-border bg-card flex-shrink-0">
          <HistorySidebar
            isOpen={historyOpen}
            onClose={() => {
              setHistoryOpen(false);
              localStorage.setItem(
                "history_sidebar_open",
                JSON.stringify(false)
              );
            }}
            onSelectSession={(selectedSessionId) => {
              setSessionId(selectedSessionId);
              loadSessionHistory(selectedSessionId);
            }}
            width={300}
            onWidthChange={() => {}} // No-op since width is fixed
            currentSessionId={sessionId}
          />
        </div>
      )}

      {/* Main Content Area - Remaining space with multiple sections */}
      <div className="flex-1 flex flex-col">
        {/* Chat and Thinking Process Area */}
        <div className="flex-1 flex">
          {/* AI Chat Area - Fixed width based on thinking process visibility */}
          <div
            className={`${
              thinkingProcessVisible ? "w-[59%]" : "w-full"
            } flex flex-col border-r border-border transition-all duration-300 h-full`}
          >
            {/* Header */}
            {renderHeader}
            {/* Messages - Scrollable area that fills remaining space */}
            {renderMessage}
            {/* Input Area - Fixed at bottom */}
            <div className="border-t border-border p-4 bg-background flex-shrink-0">
              <div className="flex space-x-2">
                <OptimizedTextarea
                  ref={textareaRef}
                  value={inputManager.value}
                  onValueChange={inputManager.updateValue}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={inputManager.handleCompositionStart}
                  onCompositionEnd={inputManager.handleCompositionEnd}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-input border-border text-foreground resize-none min-h-[100px] max-h-[200px] overflow-y-auto"
                  rows={6}
                />
                {isLoading ? (
                  <Button
                    onClick={handleAbort}
                    className="bg-red-600 hover:bg-red-700"
                    title="Stop generation"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!inputManager.value.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* AI Thinking Process - 40% of remaining space with tabs */}
          {thinkingProcessVisible && (
            <ThinkingProcess
              messages={messages}
              sessionId={sessionId}
              userProfile={currentProfile}
              visible={thinkingProcessVisible}
              onVisibleChange={(visible: boolean) => {
                setThinkingProcessVisible(visible);
              }}
            />
          )}
        </div>
      </div>

      {/* Simple Performance Monitor */}
      <SimplePerformanceMonitor
        isVisible={performanceMonitorVisible}
        onToggle={() =>
          setPerformanceMonitorVisible(!performanceMonitorVisible)
        }
      />
    </div>
  );
}

export default AIChat;
