import React, { useState } from 'react';
import { SimpleChart } from './SimpleChart';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, BarChart3, LineChart, PieChart } from 'lucide-react';

// Sample data for demonstration
const sampleData = [
  { month: 'Jan', sales: 4000, profit: 2400 },
  { month: 'Feb', sales: 3000, profit: 1398 },
  { month: 'Mar', sales: 2000, profit: 9800 },
  { month: 'Apr', sales: 2780, profit: 3908 },
  { month: 'May', sales: 1890, profit: 4800 },
  { month: 'Jun', sales: 2390, profit: 3800 },
];

const productData = [
  { product: 'Product A', revenue: 12000 },
  { product: 'Product B', revenue: 8500 },
  { product: 'Product C', revenue: 6200 },
  { product: 'Product D', revenue: 4800 },
  { product: 'Product E', revenue: 3200 },
];

export function ChartBehaviorDemo() {
  const [currentChart, setCurrentChart] = useState<'sales' | 'products'>('sales');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const getCurrentData = () => {
    return currentChart === 'sales' ? sampleData : productData;
  };

  const getCurrentXAxis = () => {
    return currentChart === 'sales' ? 'month' : 'product';
  };

  const getCurrentYAxis = () => {
    return currentChart === 'sales' ? 'sales' : 'revenue';
  };

  const getCurrentTitle = () => {
    return currentChart === 'sales' ? 'Monthly Sales Data' : 'Product Revenue Analysis';
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            AI-Powered Chart Behavior Analysis Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Interact with the chart below (zoom, change colors, click on data points) and then use the AI Analysis button to get insights about your behavior patterns.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={currentChart === 'sales' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentChart('sales')}
            >
              Sales Data
            </Button>
            <Button
              variant={currentChart === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentChart('products')}
            >
              Product Data
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Bar
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <LineChart className="h-4 w-4 mr-1" />
              Line
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
            >
              <PieChart className="h-4 w-4 mr-1" />
              Pie
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to test AI behavior analysis:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Interact with the chart: zoom in/out, change colors, click on data points</li>
              <li>Switch between different chart types and datasets</li>
              <li>Click the "AI Analysis" button to get insights about your interaction patterns</li>
              <li>The AI will analyze your behavior and provide suggestions for better data exploration</li>
            </ol>
          </div>

          {/* Chart Component */}
          <SimpleChart
            data={getCurrentData()}
            xAxis={getCurrentXAxis()}
            yAxis={getCurrentYAxis()}
            type={chartType}
            title={getCurrentTitle()}
            width={800}
            height={400}
            allowZoom={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
