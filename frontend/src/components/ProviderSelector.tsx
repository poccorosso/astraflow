import { fetchProviders, ModelInfo, ProvidersResponse } from "@/config/api";
import { Zap, Cpu, AlertCircle } from "lucide-react";
import { memo, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ProviderSelectorProps {
  selectedProvider?: string;
  onProviderChange: (provider: string) => void;
  selectedModel?: string;
  onModelChange: (model: string) => void;
  selectedTemperature?: number[];
  onTemperatureChange: (temperature: number[]) => void;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  selectedModel,
  onModelChange,
  selectedTemperature,
  onTemperatureChange,
}) => {
  const [provider, setProvider] = useState(selectedProvider ?? "auto");
  const [model, setModel] = useState(selectedModel ?? "");
  const [temperature, setTemperature] = useState(selectedTemperature ?? [0.7]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [providersData, setProvidersData] = useState<ProvidersResponse | null>(
    null
  );

  // Sync local state with props
  useEffect(() => {
    if (selectedProvider !== undefined) {
      setProvider(selectedProvider);
    }
  }, [selectedProvider]);

  useEffect(() => {
    if (selectedModel !== undefined) {
      setModel(selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (selectedTemperature !== undefined) {
      setTemperature(selectedTemperature);
    }
  }, [selectedTemperature]);

  // Update model when provider changes
  useEffect(() => {
    if (providersData && provider !== "auto") {
      const providerData = providersData.providers[provider];
      if (providerData?.models && providerData.models.length > 0) {
        const currentModelValid = providerData.models.some(
          (m) => m.id === model
        );
        if (!currentModelValid) {
          const newModel = providerData.models[0].id;
          setModel(newModel);
          onModelChange(newModel);
        }
      }
    } else if (provider === "auto") {
      setModel("");
      onModelChange("");
    }
  }, [provider, providersData, model, onModelChange]);

  // Load providers on component mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setProvidersLoading(true);
        setProvidersError(null);
        const data = await fetchProviders("ai_chat");
        setProvidersData(data);

        // Set default provider and model
        if (data.default_provider && data.default_provider !== "auto") {
          setProvider(data.default_provider);
          const defaultProviderData = data.providers[data.default_provider];
          if (
            defaultProviderData?.models &&
            defaultProviderData.models.length > 0
          ) {
            setModel(defaultProviderData.models[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load providers:", error);
        setProvidersError("Failed to load AI providers");
      } finally {
        setProvidersLoading(false);
      }
    };

    loadProviders();
  }, []);

  return (
    <div className="flex gap-4">
      {providersError && (
        <div className="flex items-center text-red-400 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          {providersError}
        </div>
      )}
      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          AI Provider
        </label>
        <Select
          value={provider}
          onValueChange={(value) => {
            setProvider(value);
            onProviderChange(value);
          }}
          disabled={providersLoading}
        >
          <SelectTrigger className="bg-input border-border text-foreground">
            <SelectValue
              placeholder={providersLoading ? "Loading..." : "Select provider"}
            />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem
              value="auto"
              className="text-popover-foreground hover:bg-accent"
            >
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-green-400" />
                Auto (Smart Selection)
              </div>
            </SelectItem>
            {providersData &&
              Object.entries(providersData.providers).map(
                ([key, providerInfo]) =>
                  providerInfo.available && (
                    <SelectItem
                      key={key}
                      value={key}
                      className="text-popover-foreground hover:bg-accent"
                    >
                      <div className="flex items-center">
                        {key === "gemini" ? (
                          <Zap className="h-4 w-4 mr-2 text-blue-400" />
                        ) : (
                          <Cpu className="h-4 w-4 mr-2 text-purple-400" />
                        )}
                        {providerInfo.display_name}
                      </div>
                    </SelectItem>
                  )
              )}
          </SelectContent>
        </Select>
        {providersError && (
          <div className="flex items-center text-red-400 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {providersError}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Model</label>
        <Select
          value={model}
          onValueChange={(value) => {
            setModel(value);
            onModelChange(value);
          }}
          disabled={providersLoading || provider === "auto"}
        >
          <SelectTrigger className="bg-input border-border text-foreground">
            <SelectValue
              placeholder={
                provider === "auto"
                  ? "Auto-selected"
                  : providersLoading
                  ? "Loading..."
                  : "Select model"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {provider !== "auto" &&
              providersData &&
              providersData.providers[provider]?.models?.map(
                (modelInfo: ModelInfo) => (
                  <SelectItem
                    key={modelInfo.id}
                    value={modelInfo.id}
                    className="text-popover-foreground hover:bg-accent"
                  >
                    <div className="flex items-center">
                      {modelInfo.icon === "zap" ? (
                        <Zap
                          className={`h-4 w-4 mr-2 ${
                            modelInfo.tier === "free"
                              ? "text-green-400"
                              : "text-blue-400"
                          }`}
                        />
                      ) : (
                        <Cpu
                          className={`h-4 w-4 mr-2 ${
                            modelInfo.tier === "free"
                              ? "text-green-400"
                              : "text-purple-400"
                          }`}
                        />
                      )}
                      {modelInfo.name}
                      <span
                        className={`text-xs ml-1 ${
                          modelInfo.tier === "free"
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {modelInfo.tier.toUpperCase()}
                      </span>
                      {modelInfo.badge && (
                        <span className="text-xs text-red-400 ml-1">
                          {modelInfo.badge}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                )
              )}
          </SelectContent>
        </Select>
      </div>
      {/* Temperature */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Temperature: {temperature[0].toFixed(1)}
        </label>
        <Slider
          value={temperature}
          onValueChange={(value) => {
            setTemperature(value);
            onTemperatureChange(value);
          }}
          max={1}
          min={0}
          step={0.1}
          className="w-[200px] m-3"
        />
      </div>
    </div>
  );
};

export default memo(ProviderSelector);
