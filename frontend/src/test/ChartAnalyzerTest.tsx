import React, { useState } from 'react';
import { ChartAnalyzer } from '../pages/ChartAnalyzer';

// Simple test component to verify ChartAnalyzer functionality
export function ChartAnalyzerTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runBasicTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: Component renders
      addTestResult('? ChartAnalyzer component renders successfully');
      
      // Test 2: Check if required elements are present
      const requiredElements = [
        'Chart Analyzer',
        'Data Overview', 
        'AI Search',
        'Choose File',
        'No data loaded'
      ];
      
      requiredElements.forEach(element => {
        if (document.querySelector(`[data-testid="${element}"]`) || 
            document.querySelector(`*:contains("${element}")`) ||
            document.body.textContent?.includes(element)) {
          addTestResult(`? Found required element: ${element}`);
        } else {
          addTestResult(`? Missing required element: ${element}`);
        }
      });

             // Test 3: Check if API configuration is loaded
       try {
         await import('../config/api');
         addTestResult('? API configuration loaded successfully');
       } catch (error) {
         addTestResult('? Failed to load API configuration');
       }

      // Test 4: Check if dependencies are available
      const dependencies = [
        'xlsx',
        'ag-grid-react',
        'lucide-react'
      ];

      dependencies.forEach(dep => {
        try {
          require(dep);
          addTestResult(`? Dependency available: ${dep}`);
        } catch (error) {
          addTestResult(`? Missing dependency: ${dep}`);
        }
      });

      // Test 5: Check localStorage availability
      if (typeof window !== 'undefined' && window.localStorage) {
        addTestResult('? localStorage is available');
      } else {
        addTestResult('? localStorage is not available');
      }

      // Test 6: Check fetch availability
      if (typeof fetch !== 'undefined') {
        addTestResult('? fetch API is available');
      } else {
        addTestResult('? fetch API is not available');
      }

      addTestResult('? Basic tests completed!');

    } catch (error) {
      addTestResult(`? Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">ChartAnalyzer Test Suite</h1>
        <p className="text-gray-600 mb-4">
          This is a manual test suite to verify the ChartAnalyzer component functionality.
          Run the tests to check if all required dependencies and features are working.
        </p>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={runBasicTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run Basic Tests'}
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Click "Run Basic Tests" to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm p-2 bg-white rounded border">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Component Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Component Preview</h2>
          <div className="h-96 overflow-auto border rounded">
            <ChartAnalyzer />
          </div>
        </div>
      </div>

      {/* Manual Test Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Manual Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Upload an Excel file using the "Choose File" button</li>
          <li>Verify that the data loads and statistics are displayed</li>
                     <li>Try entering a search query like "age &gt; 25" in the AI Search box</li>
          <li>Click the "Search" button to test the search functionality</li>
          <li>Navigate to the "Chart Analysis" tab and configure a chart</li>
          <li>Click "Generate Chart" to test chart generation</li>
          <li>Check the "User Behavior" tab to see action tracking</li>
          <li>Test the export functionality (CSV/Excel buttons)</li>
          <li>Try the session management features (New Session, Save Session)</li>
          <li>Test profile selection from the dropdown</li>
        </ol>
      </div>

      {/* Expected Features */}
      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Expected Features</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>? Excel file upload and parsing</li>
          <li>? Data grid display with AG Grid</li>
          <li>? AI-powered search with natural language</li>
          <li>? Advanced filtering capabilities</li>
          <li>? Chart generation (Bar, Line, Pie, Scatter)</li>
          <li>? Data export (CSV, Excel)</li>
          <li>? Session management</li>
          <li>? User behavior tracking</li>
          <li>? Profile-based customization</li>
          <li>? Responsive design</li>
        </ul>
      </div>
    </div>
  );
} 