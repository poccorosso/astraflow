import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, X } from 'lucide-react';

interface PerformanceMetrics {
  inputLatency: number;
  memoryUsage: number;
  fps: number;
}

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export function PerformanceMonitor({ isVisible = false, onToggle }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    inputLatency: 0,
    memoryUsage: 0,
    fps: 60,
  });

  const lastInputTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const handleKeyDown = () => {
      lastInputTimeRef.current = performance.now();
    };

    const handleInput = () => {
      if (lastInputTimeRef.current > 0) {
        const latency = performance.now() - lastInputTimeRef.current;
        setMetrics(prev => ({
          ...prev,
          inputLatency: Math.round(latency * 100) / 100, // 保留2位小数
        }));
        lastInputTimeRef.current = 0;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('input', handleInput);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('input', handleInput);
    };
  }, []);

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      const now = performance.now();
      frameCountRef.current++;

      if (now - lastFrameTimeRef.current >= 1000) { // 每秒更新一次
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current));
        setMetrics(prev => ({
          ...prev,
          fps: fps,
        }));

        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    if (isVisible) {
      animationId = requestAnimationFrame(measureFPS);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({
          ...prev,
          memoryUsage: usedMB,
        }));
      }
    };

    if (isVisible) {
      updateMemoryUsage();
      const interval = setInterval(updateMemoryUsage, 2000); // 每2秒更新一次

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm border"
        title="Show performance monitor"
      >
        <Activity className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Monitor
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span>FPS:</span>
          <Badge
            className={`text-white ${getPerformanceColor(60 - metrics.fps, { good: 5, warning: 15 })}`}
          >
            {metrics.fps}
          </Badge>
        </div>

        <div className="flex justify-between items-center">
          <span>Input Latency:</span>
          <Badge
            className={`text-white ${getPerformanceColor(metrics.inputLatency, { good: 50, warning: 100 })}`}
          >
            {metrics.inputLatency.toFixed(1)}ms
          </Badge>
        </div>

        {metrics.memoryUsage > 0 && (
          <div className="flex justify-between items-center">
            <span>Memory:</span>
            <Badge
              className={`text-white ${getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })}`}
            >
              {metrics.memoryUsage}MB
            </Badge>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>🟢 Good</span>
          <span>🟡 Warning</span>
          <span>🔴 Poor</span>
        </div>
        <div className="mt-1 text-center">
          FPS: 55+ | Latency: &lt;50ms | Memory: &lt;50MB
        </div>
      </div>
    </div>
  );
}
