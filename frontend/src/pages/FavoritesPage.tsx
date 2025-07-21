import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart,
  Trash2,
  FileDown,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatSessionId } from "../utils/sessionManager";
import { FavoriteItem } from "@/models/FavoriteItem";

interface FavoritesPageProps {
  onBack: () => void;
}

export default function FavoritesPage({ onBack }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const toggleExpanded = (favoriteId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(favoriteId)) {
      newExpanded.delete(favoriteId);
    } else {
      newExpanded.add(favoriteId);
    }
    setExpandedItems(newExpanded);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const removeFavorite = (favoriteId: string) => {
    const newFavorites = favorites.filter((fav) => fav.id !== favoriteId);
    saveFavorites(newFavorites);
  };

  const exportToMarkdown = (favorite: FavoriteItem) => {
    const timestamp = favorite.timestamp.toLocaleString();
    const sessionDisplay = formatSessionId(favorite.sessionId);

    const markdownContent = `# AI Chat Favorite

**Session:** ${sessionDisplay}  
**Saved:** ${timestamp}  
${favorite.model ? `**Model:** ${favorite.model}` : ""}

---

## User Prompt

${favorite.userPrompt}

---

## AI Response

${favorite.aiResponse}

---

*Exported from AI Chat Favorites*
`;

    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-favorite-${sessionDisplay}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToHTML = (favorite: FavoriteItem) => {
    const timestamp = favorite.timestamp.toLocaleString();
    const sessionDisplay = formatSessionId(favorite.sessionId);

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat Favorite - ${sessionDisplay}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #333;
            background-color: #fff;
        }
        .header { 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .message { 
            margin-bottom: 30px; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .user-message { 
            background-color: #e3f2fd; 
            border-left: 4px solid #2196f3; 
        }
        .ai-message { 
            background-color: #f5f5f5; 
            border-left: 4px solid #4caf50; 
        }
        .label { 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 10px; 
            font-size: 16px;
        }
        .content { 
            white-space: pre-wrap; 
            word-wrap: break-word;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Chat Favorite</h1>
        <p><strong>Session:</strong> ${sessionDisplay}</p>
        <p><strong>Saved:</strong> ${timestamp}</p>
        ${
          favorite.model
            ? `<p><strong>Model:</strong> ${favorite.model}</p>`
            : ""
        }
    </div>
    <div class="message user-message">
        <div class="label">User Prompt:</div>
        <div class="content">${favorite.userPrompt
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</div>
    </div>
    <div class="message ai-message">
        <div class="label">AI Response:</div>
        <div class="content">${favorite.aiResponse
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</div>
    </div>
    <div class="footer">
        <p>Exported from AI Chat Favorites</p>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-favorite-${sessionDisplay}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllToMarkdown = () => {
    if (favorites.length === 0) return;

    const timestamp = new Date().toLocaleString();
    let markdownContent = `# AI Chat Favorites Export

**Exported:** ${timestamp}  
**Total Favorites:** ${favorites.length}

---

`;

    favorites.forEach((favorite, index) => {
      const sessionDisplay = formatSessionId(favorite.sessionId);
      const favoriteTimestamp = favorite.timestamp.toLocaleString();

      markdownContent += `## Favorite ${index + 1}

**Session:** ${sessionDisplay}  
**Saved:** ${favoriteTimestamp}  
${favorite.model ? `**Model:** ${favorite.model}` : ""}

### User Prompt

${favorite.userPrompt}

### AI Response

${favorite.aiResponse}

---

`;
    });

    markdownContent += `*Exported from AI Chat Favorites*`;

    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-all-favorites-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
              <h1 className="text-xl font-semibold text-foreground flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                Favorites ({favorites.length})
              </h1>
            </div>
            {favorites.length > 0 && (
              <Button
                onClick={exportAllToMarkdown}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All as Markdown
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {favorites.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
                <p>Click the heart icon on AI responses to save them here</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {favorites.map((favorite) => {
                  const isExpanded = expandedItems.has(favorite.id);
                  return (
                    <div
                      key={favorite.id}
                      className="bg-card rounded-lg border border-border shadow-sm"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(favorite.id)}
                            className="h-auto p-0 text-left flex-1 text-foreground hover:text-muted-foreground"
                          >
                            <div className="flex items-start w-full">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium mb-1">
                                  {favorite.userPrompt.length > 100
                                    ? favorite.userPrompt.substring(0, 100) +
                                      "..."
                                    : favorite.userPrompt}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatSessionId(favorite.sessionId)} •{" "}
                                  {formatDate(favorite.timestamp)}
                                  {favorite.model && ` • ${favorite.model}`}
                                </div>
                              </div>
                            </div>
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <div className="text-sm font-medium text-foreground mb-2">
                                User Prompt:
                              </div>
                              <div className="text-sm text-muted-foreground bg-muted p-3 rounded border">
                                {favorite.userPrompt}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground mb-2">
                                AI Response:
                              </div>
                              <div className="text-sm bg-muted p-3 rounded border max-h-96 overflow-y-auto">
                                <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                                  {favorite.aiResponse}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2 border-t border-border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(
                                    `${favorite.userPrompt}\n\n---\n\n${favorite.aiResponse}`,
                                    favorite.id
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground"
                                title="Copy conversation"
                              >
                                {copiedId === favorite.id ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-1" />
                                )}
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportToMarkdown(favorite)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Export as Markdown"
                              >
                                <FileDown className="h-4 w-4 mr-1" />
                                MD
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportToHTML(favorite)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Export as HTML"
                              >
                                <FileDown className="h-4 w-4 mr-1" />
                                HTML
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFavorite(favorite.id)}
                                className="text-muted-foreground hover:text-red-500"
                                title="Remove from favorites"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
