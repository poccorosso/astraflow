import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, X } from 'lucide-react';

interface SimplePerformanceMetrics {
  inputLatency: number;
  keystrokes: number;
  avgLatency: number;
}

interface SimplePerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export function SimplePerformanceMonitor({ isVisible = false, onToggle }: SimplePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<SimplePerformanceMetrics>({
    inputLatency: 0,
    keystrokes: 0,
    avgLatency: 0,
  });

  const lastInputTimeRef = useRef<number>(0);
  const latencyHistoryRef = useRef<number[]>([]);

  // 只监控输入延迟，避免复杂的渲染监控
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只监控文本输入，忽略功能键
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
        lastInputTimeRef.current = performance.now();
      }
    };

    const handleInput = () => {
      if (lastInputTimeRef.current > 0) {
        const latency = performance.now() - lastInputTimeRef.current;
        
        // 更新延迟历史
        latencyHistoryRef.current.push(latency);
        if (latencyHistoryRef.current.length > 20) {
          latencyHistoryRef.current = latencyHistoryRef.current.slice(-20);
        }
        
        // 计算平均延迟
        const avgLatency = latencyHistoryRef.current.reduce((a, b) => a + b, 0) / latencyHistoryRef.current.length;
        
        setMetrics(prev => ({
          inputLatency: Math.round(latency * 10) / 10,
          keystrokes: prev.keystrokes + 1,
          avgLatency: Math.round(avgLatency * 10) / 10,
        }));
        
        lastInputTimeRef.current = 0;
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('input', handleInput);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('input', handleInput);
    };
  }, [isVisible]);

  const getLatencyColor = (latency: number) => {
    if (latency <= 30) return 'bg-green-500';
    if (latency <= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const resetMetrics = () => {
    setMetrics({
      inputLatency: 0,
      keystrokes: 0,
      avgLatency: 0,
    });
    latencyHistoryRef.current = [];
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm border"
        title="Show input performance monitor"
      >
        <Activity className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg min-w-[260px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Input Performance
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetMetrics}
            className="h-6 w-6 p-0 text-xs"
            title="Reset metrics"
          >
            ↻
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span>Keystrokes:</span>
          <Badge variant="outline">{metrics.keystrokes}</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Last Latency:</span>
          <Badge 
            className={`text-white ${getLatencyColor(metrics.inputLatency)}`}
          >
            {metrics.inputLatency}ms
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Avg Latency:</span>
          <Badge 
            className={`text-white ${getLatencyColor(metrics.avgLatency)}`}
          >
            {metrics.avgLatency}ms
          </Badge>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>🟢 &lt;30ms</span>
          <span>🟡 30-60ms</span>
          <span>🔴 &gt;60ms</span>
        </div>
        <div className="mt-1 text-center">
          Type in textarea to measure latency
        </div>
      </div>
    </div>
  );
}
