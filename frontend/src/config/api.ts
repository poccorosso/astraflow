/**
 * API Configuration
 * Centralized configuration for different API endpoints and services
 */

// API Service Types
export type ServiceType = "ai_chat" | "ai_search";

// API Endpoints Configuration
export interface ApiEndpoint {
  baseUrl: string;
  port: number;
  service: ServiceType;
  endpoints: Record<string, string>;
}

// Environment-based API configuration
const isDevelopment = import.meta.env.DEV;

export const API_CONFIG: Record<ServiceType, ApiEndpoint> = {
  ai_chat: {
    baseUrl: isDevelopment ? "http://localhost:3000" : "http://localhost:3000",
    port: 3000,
    service: "ai_chat",
    endpoints: {
      chat: "/api/chat",
      providers: "/api/providers",
      health: "/health",
      history: "/api/history",
      historySearch: "/api/history/search",
      historySessions: "/api/history/sessions",
      analyzeChartData: "/api/analysis/analyze-chart-data",
      analyzeUserBehavior: "/api/analysis/analyze-user-behavior",
      profile:"/api/profile/",
      profiles:"/api/profiles",
      analyzeSearchQuery:"/api/analysis/analyze-search-query"
    },
  },
  ai_search: {
    baseUrl: isDevelopment ? "http://localhost:2024" : "http://localhost:2024",
    port: 2024,
    service: "ai_search",
    endpoints: {
      search: "/runs/stream",
      providers: "/api/providers",
      health: "/health",
      get:"/"
    },
  },
};

// Helper functions to get full URLs
export const getApiUrl = (
  service: ServiceType,
  endpoint: keyof ApiEndpoint["endpoints"]
): string => {
  const config = API_CONFIG[service];
  const endpointPath = config.endpoints[endpoint];

  if (!endpointPath) {
    throw new Error(
      `Endpoint '${endpoint}' not found for service '${service}'`
    );
  }

  return `${config.baseUrl}${endpointPath}`;
};

// Service health check
export const checkServiceHealth = async (
  service: ServiceType
): Promise<boolean> => {
  try {
    const healthUrl = getApiUrl(service, "health");
    const response = await fetch(healthUrl, {
      method: "GET",
      timeout: 5000,
    } as RequestInit);
    return response.ok;
  } catch (error) {
    console.warn(`Health check failed for ${service}:`, error);
    return false;
  }
};

// Provider and model types
export interface ModelInfo {
  id: string;
  name: string;
  tier: "free" | "paid";
  description: string;
  icon: string;
  badge?: string;
}

export interface ProviderInfo {
  available: boolean;
  display_name: string;
  models?: ModelInfo[];
  default_model?: string;
  supported_features?: string[];
  limitations?: string[];
}

export interface ProvidersResponse {
  providers: Record<string, ProviderInfo>;
  default_provider: string;
  service_type?: string;
  auto_selection_strategy?: string;
  note?: string;
}

// Fetch providers for a specific service
export const fetchProviders = async (
  service: ServiceType
): Promise<ProvidersResponse> => {
  try {
    const providersUrl = getApiUrl(service, "providers");
    const response = await fetch(providersUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching providers for ${service}:`, error);
    throw error;
  }
};

// Default fallback configuration when API is unavailable
export const DEFAULT_PROVIDERS: ProvidersResponse = {
  providers: {
    gemini: {
      available: true,
      display_name: "Google Gemini",
      models: [
        {
          id: "gemini-1.5-flash",
          name: "1.5 Flash",
          tier: "free",
          description: "Fast multimodal model",
          icon: "zap",
        },
      ],
    },
    deepseek: {
      available: true,
      display_name: "DeepSeek AI",
      models: [
        {
          id: "deepseek-chat",
          name: "DeepSeek Chat",
          tier: "paid",
          description: "General conversation model",
          icon: "cpu",
        },
      ],
    },
  },
  default_provider: "auto",
};

export default API_CONFIG;
