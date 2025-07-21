import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SquarePen,
  Brain,
  Send,
  StopCircle,
  Zap,
  Cpu,
  Bot,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Updated InputFormProps
interface InputFormProps {
  onSubmit: (
    inputValue: string,
    effort: string,
    model: string,
    provider: string,
    temperature: number
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
  hasHistory: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  hasHistory,
}) => {
  const [internalInputValue, setInternalInputValue] = useState("");
  const [effort, setEffort] = useState("medium");
  const [model, setModel] = useState("gemini-2.5-flash-preview-04-17");
  const [provider, setProvider] = useState("auto");
  const [temperature, setTemperature] = useState(0.7);

  // Update model when provider changes
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    // Set appropriate default model for the provider
    if (newProvider === "deepseek") {
      setModel("deepseek-chat");
    } else if (newProvider === "gemini") {
      setModel("gemini-1.5-flash");
    } else {
      setModel("auto"); // For auto provider
    }
  };

  const handleInternalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internalInputValue.trim()) return;
    onSubmit(internalInputValue, effort, model, provider, temperature);
    setInternalInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit with Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleInternalSubmit();
    }
  };

  const isSubmitDisabled = !internalInputValue.trim() || isLoading;

  return (
    <form
      onSubmit={handleInternalSubmit}
      className={`flex flex-col gap-2 p-3 pb-4`}
    >
      <div
        className={`flex flex-row items-center justify-between text-foreground rounded-3xl rounded-bl-sm ${
          hasHistory ? "rounded-br-sm" : ""
        } break-words min-h-7 bg-input border border-border px-4 pt-3`}
      >
        <Textarea
          value={internalInputValue}
          onChange={(e) => setInternalInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Who won the Euro 2024 and scored the most goals?"
          className="w-full text-foreground placeholder:text-muted-foreground resize-none border-0 focus:outline-none focus:ring-0 outline-none focus-visible:ring-0 shadow-none bg-transparent md:text-base min-h-[90px] max-h-[300px]"
          rows={3}
        />
        <div className="-mt-3">
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 cursor-pointer rounded-full transition-all duration-200"
              onClick={onCancel}
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="ghost"
              className={`${
                isSubmitDisabled
                  ? "text-muted-foreground"
                  : "text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
              } p-2 cursor-pointer rounded-full transition-all duration-200 text-base`}
              disabled={isSubmitDisabled}
            >
              Search
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-2 flex-wrap">
          <div className="flex flex-row gap-2 bg-muted border border-border text-muted-foreground rounded-xl rounded-t-sm pl-2 max-w-[100%] sm:max-w-[90%]">
            <div className="flex flex-row items-center text-sm">
              <Brain className="h-4 w-4 mr-2" />
              Effort
            </div>
            <Select value={effort} onValueChange={setEffort}>
              <SelectTrigger className="w-[120px] bg-transparent border-none cursor-pointer">
                <SelectValue placeholder="Effort" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground cursor-pointer">
                <SelectItem
                  value="low"
                  className="hover:bg-accent focus:bg-accent cursor-pointer"
                >
                  Low
                </SelectItem>
                <SelectItem
                  value="medium"
                  className="hover:bg-accent focus:bg-accent cursor-pointer"
                >
                  Medium
                </SelectItem>
                <SelectItem
                  value="high"
                  className="hover:bg-accent focus:bg-accent cursor-pointer"
                >
                  High
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-row gap-2 bg-muted border border-border text-muted-foreground rounded-xl rounded-t-sm pl-2 max-w-[100%] sm:max-w-[90%]">
            <div className="flex flex-row items-center text-sm ml-2">
              <Cpu className="h-4 w-4 mr-2" />
              Model
            </div>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[150px] bg-transparent border-none cursor-pointer">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground cursor-pointer">
                {provider === "deepseek" ? (
                  <>
                    <SelectItem
                      value="deepseek-chat"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Bot className="h-4 w-4 mr-2 text-green-400" /> DeepSeek
                        Chat
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="deepseek-coder"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Cpu className="h-4 w-4 mr-2 text-blue-400" /> DeepSeek
                        Coder
                      </div>
                    </SelectItem>
                  </>
                ) : provider === "gemini" ? (
                  <>
                    {/* Free Tier Models */}
                    <SelectItem
                      value="gemini-1.5-flash"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-green-400" /> 1.5
                        Flash
                        <span className="text-xs text-green-400 ml-1">
                          FREE
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="gemini-1.5-flash-8b"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-green-400" /> 1.5
                        Flash-8B
                        <span className="text-xs text-green-400 ml-1">
                          FREE
                        </span>
                      </div>
                    </SelectItem>

                    {/* Latest Paid Models - Gemini 2.5 Series */}
                    <SelectItem
                      value="gemini-2.5-pro"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Cpu className="h-4 w-4 mr-2 text-red-400" /> 2.5 Pro
                        <span className="text-xs text-yellow-400 ml-1">
                          PAID
                        </span>
                        <span className="text-xs text-red-400 ml-1">NEW</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="gemini-2.5-flash"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-red-400" /> 2.5 Flash
                        <span className="text-xs text-yellow-400 ml-1">
                          PAID
                        </span>
                        <span className="text-xs text-red-400 ml-1">NEW</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="gemini-2.5-flash-lite-preview-06-17"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-red-400" /> 2.5
                        Flash-Lite
                        <span className="text-xs text-yellow-400 ml-1">
                          PAID
                        </span>
                        <span className="text-xs text-red-400 ml-1">NEW</span>
                      </div>
                    </SelectItem>

                    {/* Gemini 2.0 Series */}
                    <SelectItem
                      value="gemini-2.0-flash"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-purple-400" /> 2.0
                        Flash
                        <span className="text-xs text-yellow-400 ml-1">
                          PAID
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="gemini-2.0-flash-lite"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-purple-400" /> 2.0
                        Flash-Lite
                        <span className="text-xs text-yellow-400 ml-1">
                          PAID
                        </span>
                      </div>
                    </SelectItem>

                    {/* Gemini 1.5 Series */}
                    <SelectItem
                      value="gemini-1.5-pro"
                      className="hover:bg-accent focus:bg-accent cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Cpu className="h-4 w-4 mr-2 text-blue-400" /> 1.5 Pro
                        <span className="text-xs text-yellow-400 ml-1">
                          PAID
                        </span>
                      </div>
                    </SelectItem>
                  </>
                ) : (
                  <SelectItem
                    value="auto"
                    className="hover:bg-accent focus:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Bot className="h-4 w-4 mr-2 text-purple-400" /> Auto
                      Select
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-row gap-2 bg-muted border border-border text-muted-foreground rounded-xl rounded-t-sm pl-2 max-w-[100%] sm:max-w-[70%]">
            <div className="flex flex-row items-center text-sm ml-2">
              <Bot className="h-4 w-4 mr-2" />
              Provider
            </div>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger className="w-[120px] bg-transparent border-none cursor-pointer">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground cursor-pointer">
                <SelectItem
                  value="auto"
                  className="hover:bg-accent focus:bg-accent cursor-pointer"
                >
                  <div className="flex items-center">
                    <Bot className="h-4 w-4 mr-2 text-blue-400" /> Auto
                  </div>
                </SelectItem>
                <SelectItem
                  value="deepseek"
                  className="hover:bg-accent focus:bg-accent cursor-pointer"
                >
                  <div className="flex items-center">
                    <Bot className="h-4 w-4 mr-2 text-green-400" /> DeepSeek
                    <span className="text-xs text-muted-foreground ml-1">
                      *
                    </span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="gemini"
                  className="hover:bg-accent focus:bg-accent cursor-pointer"
                >
                  <div className="flex items-center">
                    <Bot className="h-4 w-4 mr-2 text-purple-400" /> Gemini
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {provider === "deepseek" && (
            <div className="text-xs text-neutral-400 px-2 py-1 bg-neutral-800 rounded-md">
              <span className="text-yellow-400">*</span> Hybrid Mode: Web search
              via Gemini, analysis via DeepSeek
            </div>
          )}
          <div className="flex flex-row gap-2 bg-muted border-border text-muted-foreground focus:ring-muted rounded-xl rounded-t-sm pl-2 pr-4 max-w-[100%] sm:max-w-[90%]">
            <div className="flex flex-row items-center text-sm ml-2">
              <Zap className="h-4 w-4 mr-2" />
              Temp: {temperature.toFixed(1)}
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  temperature * 100
                }%, #4b5563 ${temperature * 100}%, #aec5e6ff 100%)`,
                marginTop: "12px",
              }}
            />
          </div>
        </div>
        {hasHistory && (
          <Button
            className="bg-neutral-700 border-neutral-600 text-neutral-300 cursor-pointer rounded-xl rounded-t-sm pl-2 "
            variant="default"
            onClick={() => window.location.reload()}
          >
            <SquarePen size={16} />
            New Search
          </Button>
        )}
      </div>
    </form>
  );
};
