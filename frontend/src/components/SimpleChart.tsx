import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Brain, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getApiUrl } from '../config/api';
import { getCurrentSessionId } from '../utils/sessionManager';

interface ChartData {
  [key: string]: any;
}

interface SimpleChartProps {
  data: ChartData[];
  xAxis: string;
  yAxis: string;
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title: string;
  width?: number;
  height?: number;
  colors?: string[];
  allowZoom?: boolean;
}

interface UserInteraction {
  action: string;
  timestamp: Date;
  chartType: string;
  dataContext: {
    dataPoints: number;
    xAxis: string;
    yAxis: string;
    title: string;
  };
}

interface BehaviorAnalysis {
  behaviorPattern: string;
  nextQuestionPredictions: string[];
  promptSuggestions: string[];
  mindMapCode: string;
}

export function SimpleChart({
  data,
  xAxis,
  yAxis,
  type,
  title,
  width = 800,
  height = 400,
  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
  allowZoom = true
}: SimpleChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [tooltip, setTooltip] = useState<{x: number, y: number, content: string} | null>(null);

  // AI Behavior Analysis State
  const [userInteractions, setUserInteractions] = useState<UserInteraction[]>([]);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState<BehaviorAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sessionId] = useState(() => getCurrentSessionId());

  // Track user interactions
  const trackInteraction = (action: string) => {
    const interaction: UserInteraction = {
      action,
      timestamp: new Date(),
      chartType: type,
      dataContext: {
        dataPoints: data.length,
        xAxis,
        yAxis,
        title
      }
    };
    setUserInteractions(prev => [...prev, interaction]);
  };

  // Analyze user behavior with AI
  const analyzeUserBehavior = async () => {
    if (userInteractions.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    try {
      // Prepare analysis prompt based on user interactions
      const interactionSummary = userInteractions.map((interaction, index) =>
        `${index + 1}. ${interaction.action} on ${interaction.chartType} chart "${interaction.dataContext.title}" at ${interaction.timestamp.toLocaleTimeString()}`
      ).join('\n');

      const analysisPrompt = `
Analyze the following user chart interaction behavior and provide insights:

Chart Context:
- Chart Type: ${type}
- Title: ${title}
- Data Points: ${data.length}
- X-Axis: ${xAxis}
- Y-Axis: ${yAxis}

User Interactions:
${interactionSummary}

Please provide the following analysis:
1. User behavior pattern analysis based on chart interactions
2. Predict 3 actions the user might take next
3. Provide 3 suggestions to improve chart analysis workflow
4. Generate Mermaid mindmap code for interaction patterns

Return in JSON format:
{
  "behaviorPattern": "Analysis of user's chart interaction patterns",
  "nextQuestionPredictions": ["Action 1", "Action 2", "Action 3"],
  "promptSuggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "mindMapCode": "mindmap\\n  root((Chart Interaction Analysis))\\n    ..."
}
`;

      // Call AI analysis API
      const response = await fetch(`${getApiUrl("ai_chat", "chat").replace('/api/chat', '')}/analyze-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          provider: "deepseek",
          model: "",
          sessionId: sessionId
        })
      });

      if (response.ok) {
        const result = await response.json();
        setBehaviorAnalysis(result);
        setShowAnalysis(true);
      } else {
        // Fallback analysis
        setBehaviorAnalysis({
          behaviorPattern: `Based on ${userInteractions.length} interactions with the ${type} chart "${title}", you show active engagement with data visualization. Your interaction pattern suggests interest in exploring different chart perspectives and data details.`,
          nextQuestionPredictions: [
            "Explore different chart types for the same data",
            "Analyze specific data points or outliers",
            "Compare this chart with related datasets"
          ],
          promptSuggestions: [
            "Try switching between chart types to find the best visualization",
            "Use zoom controls to focus on specific data ranges",
            "Consider adding filters or grouping for deeper insights"
          ],
          mindMapCode: `mindmap
  root((Chart Interaction))
    User Behavior
      ${userInteractions.length} interactions
      ${type} chart focus
    Analysis Patterns
      Data exploration
      Visual preferences
    Next Steps
      Chart comparison
      Data filtering
      Insight generation`
        });
        setShowAnalysis(true);
      }
    } catch (error) {
      console.error('Behavior analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!data || data.length === 0 || !xAxis || !yAxis) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <p className="text-muted-foreground">No data available for chart</p>
      </div>
    );
  }

  // Process data for chart
  const processedData = data.map(item => ({
    x: item[xAxis],
    y: Number(item[yAxis]) || 0
  })).filter(item => !isNaN(item.y));

  if (processedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <p className="text-muted-foreground">No valid numeric data for Y-axis</p>
      </div>
    );
  }

  const maxY = Math.max(...processedData.map(d => d.y));
  const minY = Math.min(...processedData.map(d => d.y));
  const padding = 60;
  const chartWidth = (width - 2 * padding) * zoomLevel;
  const chartHeight = (height - 2 * padding) * zoomLevel;
  const currentColor = colors[selectedColorIndex % colors.length];

  const renderBarChart = () => {
    const barWidth = chartWidth / processedData.length * 0.8;
    const barSpacing = chartWidth / processedData.length * 0.2;

    return (
      <svg width={width} height={height} className="border rounded">
        {/* Title */}
        <text x={width / 2} y={30} textAnchor="middle" className="text-lg font-semibold fill-current">
          {title}
        </text>
        
        {/* Y-axis */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeWidth="2" />
        
        {/* X-axis */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="2" />
        
        {/* Bars */}
        {processedData.map((item, index) => {
          const barHeight = (item.y / maxY) * chartHeight;
          const x = padding + index * (chartWidth / processedData.length) + barSpacing / 2;
          const y = height - padding - barHeight;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={currentColor}
                className="hover:opacity-80 cursor-pointer"
                onClick={() => trackInteraction(`click_bar_${item.x}`)}
              />
              <text
                x={x + barWidth / 2}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-current"
              >
                {String(item.x).substring(0, 10)}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-current"
              >
                {item.y}
              </text>
            </g>
          );
        })}
        
        {/* Y-axis label */}
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 20, ${height / 2})`}
          className="text-sm fill-current"
        >
          {yAxis}
        </text>
        
        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="text-sm fill-current"
        >
          {xAxis}
        </text>
      </svg>
    );
  };

  const renderLineChart = () => {
    const points = processedData.map((item, index) => {
      const x = padding + (index / (processedData.length - 1)) * chartWidth;
      const y = height - padding - ((item.y - minY) / (maxY - minY)) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="border rounded">
        {/* Title */}
        <text x={width / 2} y={30} textAnchor="middle" className="text-lg font-semibold fill-current">
          {title}
        </text>
        
        {/* Y-axis */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeWidth="2" />
        
        {/* X-axis */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="2" />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
        />
        
        {/* Points */}
        {processedData.map((item, index) => {
          const x = padding + (index / (processedData.length - 1)) * chartWidth;
          const y = height - padding - ((item.y - minY) / (maxY - minY)) * chartHeight;
          
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="hsl(var(--primary))"
                className="hover:r-6 cursor-pointer"
                onClick={() => trackInteraction(`click_line_point_${item.x}`)}
              />
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="text-xs fill-current"
              >
                {item.y}
              </text>
            </g>
          );
        })}
        
        {/* Y-axis label */}
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 20, ${height / 2})`}
          className="text-sm fill-current"
        >
          {yAxis}
        </text>
        
        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="text-sm fill-current"
        >
          {xAxis}
        </text>
      </svg>
    );
  };

  const renderPieChart = () => {
    const total = processedData.reduce((sum, item) => sum + item.y, 0);
    let currentAngle = 0;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(chartWidth, chartHeight) / 3;

    return (
      <svg width={width} height={height} className="border rounded">
        {/* Title */}
        <text x={width / 2} y={30} textAnchor="middle" className="text-lg font-semibold fill-current">
          {title}
        </text>
        
        {processedData.map((item, index) => {
          const angle = (item.y / total) * 2 * Math.PI;
          const x1 = centerX + radius * Math.cos(currentAngle);
          const y1 = centerY + radius * Math.sin(currentAngle);
          const x2 = centerX + radius * Math.cos(currentAngle + angle);
          const y2 = centerY + radius * Math.sin(currentAngle + angle);
          
          const largeArcFlag = angle > Math.PI ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          const labelAngle = currentAngle + angle / 2;
          const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle);
          const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle);
          
          currentAngle += angle;

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    content: `${item.x}: ${item.y} (${((item.y / total) * 100).toFixed(1)}%)`
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => trackInteraction(`click_pie_segment_${item.x}`)}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                className="text-xs fill-white font-semibold pointer-events-none"
              >
                {item.y}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'bar':
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      {allowZoom && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setZoomLevel(Math.max(0.5, zoomLevel - 0.25));
                trackInteraction('zoom_out');
              }}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setZoomLevel(Math.min(3, zoomLevel + 0.25));
                trackInteraction('zoom_in');
              }}
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setZoomLevel(1);
                trackInteraction('reset_zoom');
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Color Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Color:</span>
            <div className="flex gap-1">
              {colors.map((color, index) => (
                <button
                  key={index}
                  className={`w-6 h-6 rounded border-2 ${
                    selectedColorIndex === index ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setSelectedColorIndex(index);
                    trackInteraction(`change_color_to_${color}`);
                  }}
                />
              ))}
            </div>
          </div>

          {/* AI Behavior Analysis Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeUserBehavior}
              disabled={isAnalyzing || userInteractions.length === 0}
              className="bg-purple-50 hover:bg-purple-100 border-purple-200"
            >
              {isAnalyzing ? (
                <>
                  <Brain className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analysis ({userInteractions.length})
                </>
              )}
            </Button>
            {userInteractions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {userInteractions.length} interactions tracked
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* AI Behavior Analysis Results */}
      {showAnalysis && behaviorAnalysis && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Brain className="h-5 w-5" />
              AI Behavior Analysis
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysis(false)}
                className="ml-auto h-6 w-6 p-0"
              >
                ¡Á
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Behavior Pattern */}
            <div>
              <h4 className="flex items-center gap-2 font-medium text-purple-700 mb-2">
                <TrendingUp className="h-4 w-4" />
                Behavior Pattern
              </h4>
              <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                {behaviorAnalysis.behaviorPattern}
              </p>
            </div>

            {/* Next Action Predictions */}
            <div>
              <h4 className="flex items-center gap-2 font-medium text-purple-700 mb-2">
                <TrendingUp className="h-4 w-4" />
                Predicted Next Actions
              </h4>
              <ul className="space-y-1">
                {behaviorAnalysis.nextQuestionPredictions.map((prediction, index) => (
                  <li key={index} className="text-sm text-gray-700 bg-white p-2 rounded border flex items-start gap-2">
                    <span className="text-purple-600 font-medium">{index + 1}.</span>
                    {prediction}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div>
              <h4 className="flex items-center gap-2 font-medium text-purple-700 mb-2">
                <Lightbulb className="h-4 w-4" />
                Optimization Suggestions
              </h4>
              <ul className="space-y-1">
                {behaviorAnalysis.promptSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-700 bg-white p-2 rounded border flex items-start gap-2">
                    <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Container with Scroll */}
      <div
        className="overflow-auto border rounded-lg"
        style={{
          maxWidth: width,
          maxHeight: height + 100,
          width: zoomLevel > 1 ? width : 'auto',
          height: zoomLevel > 1 ? height + 100 : 'auto'
        }}
      >
        {renderChart()}
      </div>
    </div>
  );
}
