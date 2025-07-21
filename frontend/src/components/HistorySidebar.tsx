import React, { useState, useEffect } from "react";
import { getApiUrl } from "../config/api";
import { Moon, Sun, Monitor, Trash2, AlertTriangle, X } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { Button } from "./ui/button";

interface SessionSummary {
  session_id: string;
  last_query: string;
  last_timestamp: string;
  total_messages: number;
  service_type: string;
  last_provider: string;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
  currentSessionId?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onSelectSession,
  width,
  onWidthChange,
  currentSessionId,
}) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SessionSummary[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const { theme, setTheme } = useTheme();

  // Load sessions
  const loadSessions = async () => {
    setLoading(true);
    try {
      const sessionsUrl = getApiUrl("ai_chat", "historySessions");
      const response = await fetch(sessionsUrl);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    if (!confirm(`Are you sure you want to delete this session? This action cannot be undone.`)) {
      return;
    }

    try {
      const deleteUrl = `${getApiUrl("ai_chat", "chat").replace('/api/chat', '')}/api/history/session/${sessionId}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setSessions(prev => prev.filter(session => session.session_id !== sessionId));

        // If deleted session was selected, clear selection
        if (currentSessionId === sessionId) {
          onSelectSession('');
        }
      } else {
        alert('Failed to delete session. Please try again.');
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      alert('Failed to delete session. Please try again.');
    }
  };

  // Search sessions
  const searchSessions = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = sessions.filter(
      (session) =>
        session.last_query.toLowerCase().includes(query.toLowerCase()) ||
        session.session_id.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchSessions(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, sessions]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const renderThemeButton = () => {
    const themeIcons = {
      light: Sun,
      dark: Moon,
      system: Monitor,
    };

    const Icon = themeIcons[theme];

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const themes: Array<typeof theme> = ["light", "dark", "system"];
          const currentIndex = themes.indexOf(theme);
          const nextTheme = themes[(currentIndex + 1) % themes.length];
          setTheme(nextTheme);
        }}
        className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
        title={`Current theme: ${theme}. Click to cycle.`}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  };

  const sessionsToShow = searchQuery ? searchResults : sessions;

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 450;
      const maxWidth = 600;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  if (!isOpen) return null;

  return (
    <div
      className="bg-sidebar border-r border-sidebar-border shadow-xl flex h-full relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize transition-colors z-10 bg-border hover:bg-blue-600"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />

      {/* Content */}
      <div className="flex-1 flex flex-col ml-2 bg-sidebar border-l border-sidebar-border">
        {/* Header */}
        <div className="p-4 border-b bg-sidebar border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Session History
            </h2>
          </div>
          <p className="text-xs mt-1 text-sidebar-foreground/70">
            Click a session to load conversation
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : sessionsToShow.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery
                ? "No matching sessions found"
                : "No conversation sessions yet"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessionsToShow.map((session) => {
                const isCurrentSession =
                  currentSessionId === session.session_id;
                return (
                  <div
                    key={session.session_id}
                    onClick={() => onSelectSession(session.session_id)}
                    className={`p-3 cursor-pointer transition-colors border-l-4 ${
                      isCurrentSession
                        ? "bg-sidebar-accent border-blue-500 shadow-sm"
                        : "border-transparent hover:bg-sidebar-accent hover:border-blue-500"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50">
                        {session.service_type.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(session.last_timestamp)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.session_id);
                          }}
                          className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm font-medium mb-1 line-clamp-2 text-sidebar-foreground">
                        {truncateText(session.last_query, 80)}
                      </p>
                      <p className="text-xs font-mono px-2 py-1 rounded text-muted-foreground bg-muted">
                        ID: {session.session_id.split("_").pop()?.toUpperCase()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-1 rounded text-muted-foreground bg-muted  text-xs">
                        {session.last_provider}
                      </span>
                      <span className="px-2 py-1  text-xs rounded  bg-green-200/50 text-green-900 dark:bg-green-900/50 dark:text-green-300 light:bg-grey-200 light:text-green-900">
                        {session.total_messages} msgs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-sidebar border-sidebar-border">
          <Button
            onClick={loadSessions}
            variant="ghost"
            className="w-full text-sm transition-colors text-blue-400 hover:text-blue-300 hover:bg-sidebar-accent"
          >
            Refresh Sessions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistorySidebar;
