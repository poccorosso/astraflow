#!/usr/bin/env node

/**
 * Simple test runner for ChartAnalyzer component
 * This script checks basic functionality without requiring Jest
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('? ChartAnalyzer Test Runner');
console.log('============================\n');

// Test 1: Check if component file exists
console.log('Test 1: Component file existence');
const componentPath = path.join(__dirname, '../components/ChartAnalyzer.tsx');
if (fs.existsSync(componentPath)) {
  console.log('? ChartAnalyzer.tsx exists');
} else {
  console.log('? ChartAnalyzer.tsx not found');
  process.exit(1);
}

// Test 2: Check if required dependencies are in package.json
console.log('\nTest 2: Required dependencies');
const packageJsonPath = path.join(__dirname, '../../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const allDeps = { ...dependencies, ...devDependencies };

  const requiredDeps = [
    'react',
    'ag-grid-react',
    'xlsx',
    'lucide-react',
    'echarts',
    'echarts-for-react'
  ];

  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`? ${dep}: ${allDeps[dep]}`);
    } else {
      console.log(`? ${dep}: missing`);
    }
  });
} else {
  console.log('? package.json not found');
}

// Test 3: Check if component exports correctly
console.log('\nTest 3: Component structure');
try {
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  
  // Check for required imports
  const requiredImports = [
    'useState',
    'useMemo', 
    'useEffect',
    'AgGridReact',
    'XLSX',
    'SimpleChart'
  ];

  requiredImports.forEach(importName => {
    if (componentContent.includes(importName)) {
      console.log(`? Import found: ${importName}`);
    } else {
      console.log(`? Import missing: ${importName}`);
    }
  });

  // Check for component export
  if (componentContent.includes('export function ChartAnalyzer')) {
    console.log('? Component export found');
  } else {
    console.log('? Component export not found');
  }

  // Check for required features
  const requiredFeatures = [
    'handleFileUpload',
    'handleAISearch',
    'applyFilters',
    'exportToCSV',
    'exportToExcel',
    'saveSession',
    'loadSession'
  ];

  requiredFeatures.forEach(feature => {
    if (componentContent.includes(feature)) {
      console.log(`? Feature found: ${feature}`);
    } else {
      console.log(`? Feature missing: ${feature}`);
    }
  });

} catch (error) {
  console.log(`? Error reading component: ${error.message}`);
}

// Test 4: Check if UI components exist
console.log('\nTest 4: UI Components');
const uiComponents = [
  '../components/ui/card',
  '../components/ui/button',
  '../components/ui/input',
  '../components/ui/select',
  '../components/ui/tabs',
  '../components/ui/textarea'
];

uiComponents.forEach(component => {
  const componentPath = path.join(__dirname, component + '.tsx');
  if (fs.existsSync(componentPath)) {
    console.log(`? UI component exists: ${component}`);
  } else {
    console.log(`? UI component missing: ${component}`);
  }
});

// Test 5: Check if SimpleChart component exists
console.log('\nTest 5: Chart Components');
const chartComponentPath = path.join(__dirname, '../components/SimpleChart.tsx');
if (fs.existsSync(chartComponentPath)) {
  console.log('? SimpleChart component exists');
} else {
  console.log('? SimpleChart component missing');
}

// Test 6: Check if FilterManager component exists
const filterManagerPath = path.join(__dirname, '../components/FilterManager.tsx');
if (fs.existsSync(filterManagerPath)) {
  console.log('? FilterManager component exists');
} else {
  console.log('? FilterManager component missing');
}

// Test 7: Check API configuration
console.log('\nTest 6: API Configuration');
const apiConfigPath = path.join(__dirname, '../config/api.ts');
if (fs.existsSync(apiConfigPath)) {
  console.log('? API configuration exists');
  try {
    const apiContent = fs.readFileSync(apiConfigPath, 'utf8');
    if (apiContent.includes('getApiUrl') && apiContent.includes('fetchProviders')) {
      console.log('? API functions found');
    } else {
      console.log('? API functions missing');
    }
  } catch (error) {
    console.log(`? Error reading API config: ${error.message}`);
  }
} else {
  console.log('? API configuration missing');
}

console.log('\n? Test runner completed!');
console.log('\nTo run the interactive test component:');
console.log('1. Start the development server: npm run dev');
console.log('2. Navigate to the test page in your browser');
console.log('3. Use the ChartAnalyzerTest component to verify functionality'); 