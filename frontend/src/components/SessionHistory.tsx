import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  User,
  Bot
} from "lucide-react";
import { Message } from "@/models/Message";

interface SessionHistoryProps {
  messages: Message[];
  currentSessionId: string;
}

export function SessionHistory({ messages, currentSessionId }: SessionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Group messages by conversation pairs
  const conversationPairs = [];
  for (let i = 0; i < messages.length; i += 2) {
    const userMessage = messages[i];
    const aiMessage = messages[i + 1];
    if (userMessage && userMessage.type === "human") {
      conversationPairs.push({
        id: `pair_${i}`,
        user: userMessage,
        ai: aiMessage,
        timestamp: userMessage.timestamp
      });
    }
  }

  // Get recent conversations (last 5)
  const recentConversations = conversationPairs.slice(-5);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Session History
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {recentConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No conversations yet</p>
              </div>
            ) : (
              recentConversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedMessageId === conversation.id
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-card hover:bg-muted/50 border-border'
                  }`}
                  onClick={() => setSelectedMessageId(
                    selectedMessageId === conversation.id ? null : conversation.id
                  )}
                >
                  {/* Conversation Header */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {recentConversations.length - index}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {conversation.user.content.substring(0, 40)}
                        {conversation.user.content.length > 40 ? '...' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conversation.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {selectedMessageId === conversation.id && (
                    <div className="space-y-2 border-t pt-2">
                      {/* User Message */}
                      <div className="flex items-start gap-2">
                        <User className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground break-words">
                            {conversation.user.content}
                          </p>
                        </div>
                      </div>

                      {/* AI Response */}
                      {conversation.ai && (
                        <div className="flex items-start gap-2">
                          <Bot className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground break-words">
                              {conversation.ai.content.substring(0, 100)}
                              {conversation.ai.content.length > 100 ? '...' : ''}
                            </p>
                            {conversation.ai.model && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {conversation.ai.model}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="p-2 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">
          <p>{messages.length} messages</p>
          <p className="truncate">Session: {currentSessionId.substring(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
}
