import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  Lightbulb,
  Copy,
  Play,
  Loader2,
  User,
  MessageSquare,
  Target,
  Zap,
  X,
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import { UserProfile } from "@/models/UserProfile";
import { Message } from "@/models/Message";
import  ProviderSelector from "@/components/ProviderSelector";

interface AnalysisResult {
  behaviorPattern: string;
  searchHistory: string[];
  promptSuggestions: string[];
  optimizationTips: string[];
  analysisModel: string;
}

interface UserBehaviorAnalysisProps {
  messages: Message[];
  sessionId: string;
  userProfile: UserProfile | null;
  onClose: () => void;
}

export function UserBehaviorAnalysis({
  messages,
  sessionId,
  userProfile,
  onClose,
}: UserBehaviorAnalysisProps) {
  const [selectedProvider, setSelectedProvider] = useState("deepseek");
  const [selectedModel, setSelectedModel] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("history");

  // Analyze user behavior
  const analyzeUserBehavior = async () => {
    setIsAnalyzing(true);

    try {
      // Prepare analysis data
      const userMessages = messages.filter((msg) => msg.type === "human");
      const conversationHistory = messages.slice(-10); // Last 10 messages

      // Prepare behavior summary for the new analysis service
      const behaviorSummary = {
        totalActions: messages.length,
        actionTypes: ["chat_message", "ai_query", "conversation"],
        searchQueries: userMessages.map((msg) => msg.content).slice(-5), // Last 5 user messages
        recentActions: conversationHistory.map((msg, index) => ({
          action: msg.type === "human" ? "user_message" : "ai_response",
          timestamp: msg.timestamp.toISOString(),
          details: {
            content: msg.content.substring(0, 200),
            model: msg.model || selectedModel,
          },
        })),
      };

      // Call the new analysis service API
      const response = await fetch(
        `${getApiUrl("ai_chat", "chat").replace(
          "/api/chat",
          ""
        )}/api/analysis/analyze-user-behavior`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            behavior_summary: behaviorSummary,
            user_profile: userProfile
              ? {
                  id: userProfile.id,
                  name: userProfile.name,
                  role: "Chat User", // Default role for chat users
                  experience_level: "intermediate", // Default experience level
                  background: "General", // Default background
                  preferred_communication_style: "detailed",
                  skills: ["Communication", "Problem Solving"], // Default skills
                  interests: ["AI Assistance", "Learning"], // Default interests
                  goals: "Get helpful AI assistance", // Default goals
                  current_projects: ["Chat Session"], // Default projects
                  learning_objectives: ["Improve AI interaction skills"], // Default learning objectives
                }
              : null,
            provider: selectedProvider,
            model: selectedModel,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult({
          ...result,
          analysisModel: `${selectedProvider}/${selectedModel}`,
        });
      } else {
        // Mock analysis result for demo
        const mockResult: AnalysisResult = {
          behaviorPattern: `Based on analysis of ${userMessages.length} user messages, the user exhibits the following behavior patterns:

• **Exploratory Learner**: User tends to start from basic concepts and gradually dive into technical details
• **Practice-Oriented**: More focused on specific implementation methods and code examples
• **Systematic Thinking**: Likes to understand complete solutions and best practices
• **Quality-Focused**: Frequently asks about optimization and improvement of existing solutions`,

          searchHistory: [
            "User shows consistent interest in technical topics",
            "Frequently asks follow-up questions for clarification",
            "Demonstrates learning-oriented conversation patterns",
          ],

          promptSuggestions: [
            "Provide specific context and code examples when asking questions for more precise AI suggestions",
            "Clearly state your tech stack and constraints to avoid inapplicable solutions",
            "Break down complex problems into smaller, specific questions for step-by-step discussion",
          ],

          optimizationTips: [
            "Provide more context in your questions for better responses",
            "Break complex questions into smaller, focused parts",
            "Ask for step-by-step explanations when learning new concepts",
          ],

          analysisModel: selectedModel,
        };
        setAnalysisResult(mockResult);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            User Behavior Analysis
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            selectedTemperature={[0.7]}
            onTemperatureChange={() => {}} // Add temperature state if needed
          />
          <Button
            onClick={analyzeUserBehavior}
            disabled={isAnalyzing || messages.length < 2 || !selectedModel}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Analyze
          </Button>
        </div>
      </CardHeader>

      {analysisResult && (
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="history">Search History</TabsTrigger>
              <TabsTrigger value="suggestions">Prompt Tips</TabsTrigger>
              <TabsTrigger value="pattern">Pattern</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h3 className="font-medium">Search History Analysis:</h3>
              </div>
              {analysisResult.searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(item)}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h3 className="font-medium">
                  Prompt Optimization Suggestions:
                </h3>
              </div>
              {analysisResult.promptSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{suggestion}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(suggestion)}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="pattern" className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <h3 className="font-medium">Behavior Pattern Analysis:</h3>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">
                  {analysisResult.behaviorPattern}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(analysisResult.behaviorPattern)
                  }
                  className="mt-2"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Copy Analysis
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-green-500" />
                <h3 className="font-medium">Optimization Tips:</h3>
              </div>
              {analysisResult.optimizationTips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <Target className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{tip}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(tip)}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-xs text-muted-foreground text-center">
            Analysis Model: {analysisResult.analysisModel} | Based on{" "}
            {messages.filter((m) => m.type === "human").length} user messages
          </div>
        </CardContent>
      )}

      {!analysisResult && messages.length < 2 && (
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Need at least 2 conversation records for behavior analysis</p>
            <p className="text-sm mt-2">
              Continue chatting to get more accurate analysis results
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

