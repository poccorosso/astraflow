import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Menu, X, Moon, Sun, Monitor, Heart, User, BarChart3 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentMode: "search" | "chat" | "favorites" | "profile" | "chart" | "behavior";
  onModeChange: (mode: "search" | "chat" | "favorites" | "profile" | "chart" | "behavior") => void;
}

export function Sidebar({ currentMode, onModeChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

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
          const themes: Array<typeof theme> = ['light', 'dark', 'system'];
          const currentIndex = themes.indexOf(theme);
          const nextTheme = themes[(currentIndex + 1) % themes.length];
          setTheme(nextTheme);
        }}
        className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        title={`Current theme: ${theme}. Click to cycle.`}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  };

  return (
    <div className={cn(
      "transition-all duration-300 bg-sidebar border-r border-sidebar-border",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                AI Assistant
              </h2>
            )}
            <div className="flex items-center space-x-2">
              {!isCollapsed && renderThemeButton()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800 focus:text-neutral-100"
              >
                {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <Button
              variant={currentMode === "search" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-colors",
                isCollapsed ? "px-2" : "px-4",
                currentMode === "search"
                  ? "bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white focus:text-white"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar-accent focus:text-sidebar-foreground"
              )}
              onClick={() => onModeChange("search")}
            >
              <Search className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">AI Research</span>}
            </Button>

            <Button
              variant={currentMode === "chat" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-colors",
                isCollapsed ? "px-2" : "px-4",
                currentMode === "chat"
                  ? "bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white focus:text-white"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar-accent focus:text-sidebar-foreground"
              )}
              onClick={() => onModeChange("chat")}
            >
              <MessageCircle className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">AI Chat</span>}
            </Button>

            <Button
              variant={currentMode === "favorites" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-colors",
                isCollapsed ? "px-2" : "px-4",
                currentMode === "favorites"
                  ? "bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white focus:text-white"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar-accent focus:text-sidebar-foreground"
              )}
              onClick={() => onModeChange("favorites")}
            >
              <Heart className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Favorites</span>}
            </Button>

            <Button
              variant={currentMode === "profile" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-colors",
                isCollapsed ? "px-2" : "px-4",
                currentMode === "profile"
                  ? "bg-purple-600 hover:bg-purple-700 focus:bg-purple-700 text-white focus:text-white"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar-accent focus:text-sidebar-foreground"
              )}
              onClick={() => onModeChange("profile")}
            >
              <User className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Profile Manager</span>}
            </Button>

            <Button
              variant={currentMode === "chart" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-colors",
                isCollapsed ? "px-2" : "px-4",
                currentMode === "chart"
                  ? "bg-orange-600 hover:bg-orange-700 focus:bg-orange-700 text-white focus:text-white"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar-accent focus:text-sidebar-foreground"
              )}
              onClick={() => onModeChange("chart")}
            >
              <BarChart3 className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Chart Analyzer</span>}
            </Button>
          </nav>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-neutral-700">
            <div className="text-xs text-neutral-500">
              <div className="mb-2">
                <span className="text-blue-400">AI Search:</span> Web research with citations
              </div>
              <div className="mb-2">
                <span className="text-green-400">AI Chat:</span> Direct AI conversation
              </div>
              <div className="mb-2">
                <span className="text-red-400">Favorites:</span> Saved AI responses
              </div>
              <div className="mb-2">
                <span className="text-orange-400">Chart Analyzer:</span> Excel data visualization
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
