import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Message } from "@/models/Message";

interface ThinkingStep {
  id: string;
  type: "question" | "analysis" | "reasoning" | "conclusion";
  content: string;
  timestamp: Date;
  parentId?: string;
}

interface ThinkingMindMapProps {
  messages: Message[];
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function ThinkingMindMap({ messages, isVisible, onToggleVisibility }: ThinkingMindMapProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("mindmap");
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean text for Mermaid compatibility - very strict cleaning
  const cleanTextForMermaid = (text: string, maxLength: number = 50): string => {
    if (!text || typeof text !== 'string') {
      return "Message";
    }

    const cleaned = text
      .replace(/\n/g, " ")                    // Replace newlines with spaces
      .replace(/\r/g, " ")                    // Replace carriage returns
      .replace(/['"]/g, "")                   // Remove quotes
      .replace(/[{}()\[\]]/g, "")             // Remove brackets and braces (Mermaid syntax)
      .replace(/[^\w\s\-.,!?]/g, "")          // Keep only safe characters
      .replace(/\s+/g, " ")                   // Replace multiple spaces with single space
      .replace(/^\s*[-*+]\s*/, "")            // Remove list markers
      .trim()                                 // Remove leading/trailing spaces
      .substring(0, maxLength);               // Limit length

    // Return default text if cleaned text is empty or too short
    return cleaned && cleaned.length > 2 ? cleaned : "Message";
  };

  // 分析消息并提取思考步骤
  const analyzeMessages = (messages: Message[]): ThinkingStep[] => {
    const steps: ThinkingStep[] = [];

    messages.forEach((message, index) => {
      if (message.type === "human") {
        // User question as starting node
        steps.push({
          id: `q_${message.id}`,
          type: "question",
          content: message.content.length > 50 ? message.content.substring(0, 50) + "..." : message.content,
          timestamp: message.timestamp,
        });
      } else if (message.type === "ai") {
        const messageId = message.id;
        const parentQuestionId = index > 0 ? `q_${messages[index - 1].id}` : undefined;

        // Analyze AI response structure
        const content = message.content;

        // Intelligent analysis of AI response thinking process
        const analysisKeywords = ["analyze", "analysis", "consider", "think", "understand", "first", "initially"];
        const reasoningKeywords = ["because", "therefore", "based", "reasoning", "thus", "according", "since"];


        // Check if contains analysis process
        if (analysisKeywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
          steps.push({
            id: `a_${messageId}`,
            type: "analysis",
            content: "Understanding and analyzing the problem",
            timestamp: message.timestamp,
            parentId: parentQuestionId,
          });
        }

        // Check if contains reasoning process
        if (reasoningKeywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
          steps.push({
            id: `r_${messageId}`,
            type: "reasoning",
            content: "Logical reasoning and thinking",
            timestamp: message.timestamp,
            parentId: `a_${messageId}` || parentQuestionId,
          });
        }

        // AI response as conclusion
        const shortContent = content.length > 80 ? content.substring(0, 80) + "..." : content;
        steps.push({
          id: `c_${messageId}`,
          type: "conclusion",
          content: shortContent,
          timestamp: message.timestamp,
          parentId: `r_${messageId}` || `a_${messageId}` || parentQuestionId,
        });
      }
    });

    return steps;
  };

  // Generate Mermaid mindmap code
  const generateMermaidCode = (steps: ThinkingStep[]): string => {
    if (steps.length === 0) {
      return `mindmap
  root((AI Chat))
    StartConversation
      WaitingForInput`;
    }

    let mermaidCode = "mindmap\n  root((AI Thinking Process))\n";

    // Group steps by conversation pairs (question -> response)
    const conversations: Array<{question: ThinkingStep, responses: ThinkingStep[]}> = [];
    let currentConversation: {question: ThinkingStep, responses: ThinkingStep[]} | null = null;

    steps.forEach(step => {
      if (step.type === 'question') {
        // Start new conversation
        if (currentConversation) {
          conversations.push(currentConversation);
        }
        currentConversation = { question: step, responses: [] };
      } else if (currentConversation) {
        // Add to current conversation
        currentConversation.responses.push(step);
      }
    });

    // Add the last conversation if exists
    if (currentConversation) {
      conversations.push(currentConversation);
    }

    // Generate mindmap structure - limit to last 3 conversations for readability
    const recentConversations = conversations.slice(-3);

    recentConversations.forEach((conv, index) => {
      const questionContent = cleanTextForMermaid(conv.question.content, 30);

      // Create a valid node ID (no spaces, special chars)
      const nodeId = `Q${index + 1}`;

      // Only add conversation if we have valid content
      if (questionContent && questionContent !== "Message") {
        // Use simple text format for mindmap nodes
        mermaidCode += `    ${nodeId}\n`;
        mermaidCode += `      Question: ${questionContent}\n`;

        // Add thinking process steps with proper indentation
        const analysisStep = conv.responses.find(s => s.type === 'analysis');
        const reasoningStep = conv.responses.find(s => s.type === 'reasoning');
        const conclusionStep = conv.responses.find(s => s.type === 'conclusion');

        if (analysisStep) {
          mermaidCode += `      Analysis\n`;
        }
        if (reasoningStep) {
          mermaidCode += `      Reasoning\n`;
        }
        if (conclusionStep) {
          const responseContent = cleanTextForMermaid(conclusionStep.content, 40);
          if (responseContent && responseContent !== "Message") {
            mermaidCode += `      Response: ${responseContent}\n`;
          } else {
            mermaidCode += `      AIResponse\n`;
          }
        } else {
          // Always add a response node
          mermaidCode += `      AIResponse\n`;
        }
      }
    });

    return mermaidCode;
  };



  // Generate flowchart code
  const generateFlowchartCode = (steps: ThinkingStep[]): string => {
    if (steps.length === 0) {
      return `flowchart TD
    A[Start] --> B[Waiting for user input]
    B --> C[Prepare response]`;
    }

    let flowchartCode = "flowchart TD\n";
    let nodeCounter = 1;

    // Group steps by conversation pairs for better flow
    const conversations: Array<{question: ThinkingStep, responses: ThinkingStep[]}> = [];
    let currentConversation: {question: ThinkingStep, responses: ThinkingStep[]} | null = null;

    steps.forEach(step => {
      if (step.type === 'question') {
        if (currentConversation) {
          conversations.push(currentConversation);
        }
        currentConversation = { question: step, responses: [] };
      } else if (currentConversation) {
        currentConversation.responses.push(step);
      }
    });

    if (currentConversation) {
      conversations.push(currentConversation);
    }

    // Generate flowchart for recent conversations - limit to 2 for simplicity
    const recentConversations = conversations.slice(-2);
    let previousNodeId = '';

    recentConversations.forEach((conv) => {
      const questionContent = cleanTextForMermaid(conv.question.content, 20);
      const questionNodeId = `Q${nodeCounter++}`;

      // Ensure valid content for flowchart nodes
      if (questionContent && questionContent !== "Message") {
        flowchartCode += `    ${questionNodeId}["User: ${questionContent}"]\n`;

        if (previousNodeId) {
          flowchartCode += `    ${previousNodeId} --> ${questionNodeId}\n`;
        }

        let currentNodeId = questionNodeId;

        // Add thinking process steps
        const analysisStep = conv.responses.find(s => s.type === 'analysis');
        const reasoningStep = conv.responses.find(s => s.type === 'reasoning');
        const conclusionStep = conv.responses.find(s => s.type === 'conclusion');

        if (analysisStep) {
          const analysisNodeId = `A${nodeCounter++}`;
          flowchartCode += `    ${analysisNodeId}("Analysis")\n`;
          flowchartCode += `    ${currentNodeId} --> ${analysisNodeId}\n`;
          currentNodeId = analysisNodeId;
        }

        if (reasoningStep) {
          const reasoningNodeId = `R${nodeCounter++}`;
          flowchartCode += `    ${reasoningNodeId}{"Reasoning"}\n`;
          flowchartCode += `    ${currentNodeId} --> ${reasoningNodeId}\n`;
          currentNodeId = reasoningNodeId;
        }

        // Always add a response node
        const responseNodeId = `C${nodeCounter++}`;
        if (conclusionStep) {
          const responseContent = cleanTextForMermaid(conclusionStep.content, 20);
          if (responseContent && responseContent !== "Message") {
            flowchartCode += `    ${responseNodeId}["AI: ${responseContent}"]\n`;
          } else {
            flowchartCode += `    ${responseNodeId}["AI: Response"]\n`;
          }
        } else {
          flowchartCode += `    ${responseNodeId}["AI: Response"]\n`;
        }

        flowchartCode += `    ${currentNodeId} --> ${responseNodeId}\n`;
        previousNodeId = responseNodeId;
      }
    });

    return flowchartCode;
  };

  // Render Mermaid diagrams
  const renderMermaidDiagram = async (code: string) => {
    if (!mermaidRef.current) return;

    try {
      // Dynamic import of mermaid
      const mermaid = await import('mermaid');

      // Initialize mermaid with theme
      mermaid.default.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        mindmap: {
          padding: 10,
          maxNodeWidth: 200,
        },
        flowchart: {
          padding: 10,
          nodeSpacing: 50,
          rankSpacing: 50,
        }
      });

      // Clear previous content
      mermaidRef.current.innerHTML = '';

      // Generate unique ID for this diagram
      const diagramId = `mermaid-diagram-${Date.now()}`;

      // Render the diagram
      const { svg } = await mermaid.default.render(diagramId, code);

      // Insert the SVG into the container
      mermaidRef.current.innerHTML = svg;

    } catch (error) {
      console.error('Error rendering mermaid diagram:', error);
      console.error('Mermaid code that failed:', code);

      // Show error message to user
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = `
          <div class="flex items-center justify-center h-64 text-red-500">
            <div class="text-center">
              <Brain className="mx-auto mb-4" size={48} />
              <p class="text-lg font-medium">Diagram rendering failed</p>
              <p class="text-sm">Please try refreshing or check the console for details</p>
              <button
                onclick="this.parentElement.parentElement.parentElement.style.display='none'"
                class="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
              >
                Hide
              </button>
            </div>
          </div>
        `;
      }
    }
  };

  // Update thinking steps
  useEffect(() => {
    const steps = analyzeMessages(messages);
    setThinkingSteps(steps);
  }, [messages]);

  // Render diagrams
  useEffect(() => {
    const renderDiagram = async () => {
      if (isVisible) {
        if (thinkingSteps.length > 0) {
          const code = activeTab === "mindmap"
            ? generateMermaidCode(thinkingSteps)
            : generateFlowchartCode(thinkingSteps);
          await renderMermaidDiagram(code);
        } else {
          // Show empty state with a simple default diagram
          const defaultCode = activeTab === "mindmap"
            ? `mindmap
  root((AI Thinking Process))
    StartConversation
      WaitingForInput
      ReadyToAnalyze`
            : `flowchart TD
    A["Start Conversation"] --> B["AI Ready"]
    B --> C["Waiting for Input"]`;

          await renderMermaidDiagram(defaultCode);
        }
      }
    };

    renderDiagram();
  }, [isVisible, thinkingSteps, activeTab, theme]);



  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  // Download diagram
  const downloadDiagram = () => {
    if (!mermaidRef.current) return;

    const svg = mermaidRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = `thinking-mindmap-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Render the component
  return (
    <div className={`${
      isExpanded
        ? 'fixed inset-4 z-50 bg-background border rounded-lg shadow-2xl'
        : 'w-full h-full'
    } transition-all duration-300 flex flex-col`}>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">AI Thinking Process</h3>
          <span className="text-sm text-muted-foreground">
            ({thinkingSteps.length} steps detected)
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="sm"
            title="Zoom Out"
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-xs text-muted-foreground px-2 min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="sm"
            title="Zoom In"
            disabled={zoomLevel >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleResetView}
            variant="ghost"
            size="sm"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Refresh */}
          <Button
            onClick={async () => {
              const code = activeTab === "mindmap"
                ? generateMermaidCode(thinkingSteps)
                : generateFlowchartCode(thinkingSteps);
              await renderMermaidDiagram(code);
            }}
            variant="ghost"
            size="sm"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Download */}
          <Button
            onClick={downloadDiagram}
            variant="ghost"
            size="sm"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Expand/Collapse */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            title={isExpanded ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* Close */}
          <Button
            onClick={onToggleVisibility}
            variant="ghost"
            size="sm"
            title="Close"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
            <TabsTrigger value="flowchart">Flowchart</TabsTrigger>
          </TabsList>

          <TabsContent value="mindmap" className="flex-1 m-4 mt-2">
            <div
              ref={containerRef}
              className={`w-full h-full border rounded-lg overflow-hidden ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div
                ref={mermaidRef}
                className="w-full h-full p-4 overflow-auto"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease-out'
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="flowchart" className="flex-1 m-4 mt-2">
            <div
              ref={containerRef}
              className={`w-full h-full border rounded-lg overflow-hidden ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div
                ref={mermaidRef}
                className="w-full h-full p-4 overflow-auto"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease-out'
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        {thinkingSteps.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Detected {thinkingSteps.length} thinking steps</span>
              <div className="flex gap-3">
                <span>🟦 Questions</span>
                <span>🟡 Analysis</span>
                <span>🟢 Reasoning</span>
                <span>🟣 Responses</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
