// Quick test to verify URL construction
const API_CONFIG = {
  ai_chat: {
    baseUrl: "http://localhost:3000",
    port: 3000,
    service: "ai_chat",
    endpoints: {
      chat: "/api/chat",
      providers: "/api/providers",
      health: "/health",
      history: "/api/history",
    },
  },
};

const getApiUrl = (service, endpoint) => {
  const config = API_CONFIG[service];
  const endpointPath = config.endpoints[endpoint];
  return `${config.baseUrl}${endpointPath}`;
};

// Test the URL construction
const chatUrl = getApiUrl("ai_chat", "chat");
console.log("Chat URL:", chatUrl);

// Old method (incorrect)
const oldAnalyzeUrl = `${chatUrl.replace('/chat', '')}/analyze-behavior`;
console.log("Old analyze URL:", oldAnalyzeUrl);

// New method (correct)
const newAnalyzeUrl = `${chatUrl.replace('/api/chat', '')}/analyze-behavior`;
console.log("New analyze URL:", newAnalyzeUrl);
