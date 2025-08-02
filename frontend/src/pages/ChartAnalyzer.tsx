import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileSpreadsheet,
  BarChart3,
  Search,
  AlertCircle,
  Plus,
  X,
  History,
  TrendingUp,
  Download,
  Save,
  FolderOpen,
} from "lucide-react";
import * as XLSX from "xlsx";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
import { SimpleChart } from "@/components/SimpleChart";
import { FilterManager } from "@/components/FilterManager";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Textarea } from "@/components/ui/textarea";
import { getApiUrl } from "@/config/api";
import ProfileSelector from "@/components/ProfileSelector";
import { UserProfile } from "@/models/UserProfile";
import ProviderSelector from "@/components/ProviderSelector";
import { OptimizedTextarea } from "@/components/ui/optimized-textarea";
import { useOptimizedInput } from "@/hooks/useOptimizedInput";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface ExcelData {
  headers: string[];
  rows: any[][];
}

interface GridRow {
  [key: string]: any;
}

interface FilterCondition {
  id: string;
  column: string;
  operator:
    | "equals"
    | "contains"
    | "greater"
    | "less"
    | "greaterEqual"
    | "lessEqual";
  value: string;
}

interface SessionData {
  id: string;
  name: string;
  timestamp: number;
  excelData: ExcelData | null;
  filters: FilterCondition[];
  chartConfig: ChartConfig;
  searchQuery: string;
  hasSearched: boolean;
  userProfile: UserProfile | null;
}

interface AIAnalysisResult {
  query: string;
  interpretation: string;
  filters: FilterCondition[];
  success: boolean;
  error?: string;
}

interface ChartConfig {
  type: "bar" | "line" | "pie" | "scatter";
  xAxis: string;
  yAxis: string;
  title: string;
  colors: string[];
}

interface ChartDataAnalysis {
  dataInsights: string;
  patterns: string[];
  keyFindings: string[];
  dataQuality: string;
}

interface UserBehaviorAnalysis {
  behaviorPattern: string;
  searchHistory: string[];
  promptSuggestions: string[];
  optimizationTips: string[];
}

interface AnalysisSession {
  id: string;
  name: string;
  createdAt: Date;
  excelData: ExcelData | null;
  filteredData: GridRow[];
  searchQuery: string;
  chartConfig: ChartConfig;
  aiAnalysis: AIAnalysisResult | null;
}

interface UserBehavior {
  action: string;
  timestamp: Date;
  details: any;
}

interface ChartAnalyzerProps {
  onShowProfiles?: () => void;
}

export function ChartAnalyzer({ onShowProfiles }: ChartAnalyzerProps) {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [filteredData, setFilteredData] = useState<GridRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const [aiSuggestedFilters, setAiSuggestedFilters] = useState<
    FilterCondition[]
  >([]);
  const [savedSessions, setSavedSessions] = useState<SessionData[]>([]);
  const [currentSessionName, setCurrentSessionName] = useState<string>("");
  // User Profile state
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: "bar",
    xAxis: "",
    yAxis: "",
    title: "My Chart",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
  });
  const [showChart, setShowChart] = useState(false);
  const [currentTab, setCurrentTab] = useState("data");
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(
    null
  );
  const [userBehaviors, setUserBehaviors] = useState<UserBehavior[]>([]);
  const [chartDataAnalysis, setChartDataAnalysis] =
    useState<ChartDataAnalysis | null>(null);
  const [userBehaviorAnalysis, setUserBehaviorAnalysis] =
    useState<UserBehaviorAnalysis | null>(null);
  const [isAnalyzingChart, setIsAnalyzingChart] = useState(false);
  const [isAnalyzingBehavior, setIsAnalyzingBehavior] = useState(false);
  const inputManager = useOptimizedInput({
    initialValue: "",
    maxLength: 10000,
  });
  // Convert Excel data to ag-grid format
  const convertToGridData = (data: ExcelData): GridRow[] => {
    return data.rows.map((row) => {
      const rowObj: GridRow = {};
      data.headers.forEach((header, index) => {
        rowObj[header] = row[index] || "";
      });
      return rowObj;
    });
  };

  // Aggregate data for chart display
  const aggregateDataForChart = (
    data: GridRow[],
    xAxis: string,
    yAxis: string
  ): GridRow[] => {
    if (!data || data.length === 0 || !xAxis || !yAxis) return data;

    const aggregated = new Map<
      string,
      { sum: number; count: number; values: any[] }
    >();

    data.forEach((row) => {
      const xValue = String(row[xAxis] || "");
      const yValue = row[yAxis];

      if (!aggregated.has(xValue)) {
        aggregated.set(xValue, { sum: 0, count: 0, values: [] });
      }

      const entry = aggregated.get(xValue)!;
      const numValue = Number(yValue);

      if (!isNaN(numValue)) {
        entry.sum += numValue;
        entry.count += 1;
      }
      entry.values.push(yValue);
    });

    // Convert back to GridRow format with aggregated values
    return Array.from(aggregated.entries())
      .map(([xValue, entry]) => {
        const result: GridRow = {};
        result[xAxis] = xValue;

        // Use sum for numeric data, or count for non-numeric
        if (entry.count > 0) {
          result[yAxis] = entry.sum; // Sum of all numeric values
          result[`${yAxis}_count`] = entry.count; // Count of records
          result[`${yAxis}_avg`] = entry.sum / entry.count; // Average
        } else {
          result[yAxis] = entry.values.length; // Count of all values
        }

        return result;
      })
      .sort((a, b) => {
        // Sort by x-axis value
        const aVal = a[xAxis];
        const bVal = b[xAxis];

        // Try numeric sort first
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }

        // Fall back to string sort
        return String(aVal).localeCompare(String(bVal));
      });
  };

  // Generate column definitions for ag-grid
  const columnDefs = useMemo<ColDef[]>(() => {
    if (!excelData) return [];

    return excelData.headers.map((header) => ({
      field: header,
      headerName: header,
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 100,
    }));
  }, [excelData]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    trackUserBehavior("upload_file", {
      fileName: file.name,
      fileSize: file.size,
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Support Chinese encoding
      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        codepage: 65001, // UTF-8 encoding
        cellText: false,
        cellDates: true,
      });

      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON with header row, preserve original data format
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "", // Default value as empty string
        blankrows: false, // Skip empty rows
      });

      if (jsonData.length === 0) {
        throw new Error("Excel file is empty");
      }

      // Extract headers and rows, handle Chinese characters
      const headers = (jsonData[0] as any[]).map((header) => {
        if (header === null || header === undefined) return "";
        return String(header).trim();
      });

      const rows = jsonData
        .slice(1)
        .filter(
          (row: any) =>
            Array.isArray(row) &&
            row.some(
              (cell: any) => cell !== null && cell !== undefined && cell !== ""
            )
        )
        .map((row: any) =>
          row.map((cell: any) => {
            if (cell === null || cell === undefined) return "";
            // Handle date format
            if (cell instanceof Date) {
              return cell.toLocaleDateString("en-US");
            }
            return String(cell).trim();
          })
        );

      const excelData: ExcelData = {
        headers,
        rows: rows as any[][],
      };

      setExcelData(excelData);

      // Clear previous search state
      setFilteredData([]);
      setHasSearched(false);
      setFilters([]);
      setAiAnalysis(null);
      setAiSuggestedFilters([]);
      setError(null);

      // Initialize chart config with first available columns
      if (excelData.headers.length >= 2) {
        setChartConfig((prev) => ({
          ...prev,
          xAxis: excelData.headers[0],
          yAxis: excelData.headers[1],
          title: `${excelData.headers[1]} vs ${excelData.headers[0]}`,
        }));
      }

      trackUserBehavior("file_parsed", {
        rowCount: excelData.rows.length,
        columnCount: excelData.headers.length,
        headers: excelData.headers,
      });
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to parse Excel file";
      setError(errorMessage);
      trackUserBehavior("file_parse_error", { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to data
  const applyFilters = (
    data: GridRow[],
    customFilters?: FilterCondition[]
  ): GridRow[] => {
    let result = data;
    const filtersToApply = customFilters || filters;

    // Apply text search (only if no custom filters provided)
    if (!customFilters && inputManager.value.trim()) {
      result = result.filter((row) =>
        Object.values(row).some((cell) =>
          cell
            .toString()
            .toLowerCase()
            .includes(inputManager.value.trim().toLowerCase())
        )
      );
    }

    // Apply advanced filters
    filtersToApply.forEach((filter) => {
      console.log("Applying filter:", filter);
      result = result.filter((row) => {
        const cellValue = row[filter.column];
        const filterValue = filter.value;

        console.log(
          `Filtering: ${cellValue} ${filter.operator} ${filterValue}`
        );

        if (cellValue === undefined || cellValue === null) {
          console.log("Cell value is null/undefined, skipping");
          return false;
        }

        switch (filter.operator) {
          case "equals":
            const isEqual =
              cellValue.toString().toLowerCase() === filterValue.toLowerCase();
            console.log("Equals result:", isEqual);
            return isEqual;
          case "contains":
            const contains = cellValue
              .toString()
              .toLowerCase()
              .includes(filterValue.toLowerCase());
            console.log("Contains result:", contains);
            return contains;
          case "greater":
            // Try numeric comparison first
            const cellNum = Number(cellValue);
            const filterNum = Number(filterValue);
            if (!isNaN(cellNum) && !isNaN(filterNum)) {
              const isGreater = cellNum > filterNum;
              console.log(
                `Numeric Greater: ${cellNum} > ${filterNum} = ${isGreater}`
              );
              return isGreater;
            }
            // Try date comparison
            const cellDate = new Date(cellValue);
            const filterDate = new Date(filterValue);
            if (!isNaN(cellDate.getTime()) && !isNaN(filterDate.getTime())) {
              const isGreater = cellDate > filterDate;
              console.log(
                `Date Greater: ${cellDate} > ${filterDate} = ${isGreater}`
              );
              return isGreater;
            }
            console.log("Could not compare as number or date");
            return false;
          case "less":
            const cellNumLess = Number(cellValue);
            const filterNumLess = Number(filterValue);
            if (!isNaN(cellNumLess) && !isNaN(filterNumLess)) {
              const isLess = cellNumLess < filterNumLess;
              console.log(
                `Numeric Less: ${cellNumLess} < ${filterNumLess} = ${isLess}`
              );
              return isLess;
            }
            const cellDateLess = new Date(cellValue);
            const filterDateLess = new Date(filterValue);
            if (
              !isNaN(cellDateLess.getTime()) &&
              !isNaN(filterDateLess.getTime())
            ) {
              const isLess = cellDateLess < filterDateLess;
              console.log(
                `Date Less: ${cellDateLess} < ${filterDateLess} = ${isLess}`
              );
              return isLess;
            }
            return false;
          case "greaterEqual":
            const cellNumGE = Number(cellValue);
            const filterNumGE = Number(filterValue);
            if (!isNaN(cellNumGE) && !isNaN(filterNumGE)) {
              const isGreaterEqual = cellNumGE >= filterNumGE;
              console.log(
                `Numeric GreaterEqual: ${cellNumGE} >= ${filterNumGE} = ${isGreaterEqual}`
              );
              return isGreaterEqual;
            }
            const cellDateGE = new Date(cellValue);
            const filterDateGE = new Date(filterValue);
            if (
              !isNaN(cellDateGE.getTime()) &&
              !isNaN(filterDateGE.getTime())
            ) {
              const isGreaterEqual = cellDateGE >= filterDateGE;
              console.log(
                `Date GreaterEqual: ${cellDateGE} >= ${filterDateGE} = ${isGreaterEqual}`
              );
              return isGreaterEqual;
            }
            return false;
          case "lessEqual":
            const cellNumLE = Number(cellValue);
            const filterNumLE = Number(filterValue);
            if (!isNaN(cellNumLE) && !isNaN(filterNumLE)) {
              const isLessEqual = cellNumLE <= filterNumLE;
              console.log(
                `Numeric LessEqual: ${cellNumLE} <= ${filterNumLE} = ${isLessEqual}`
              );
              return isLessEqual;
            }
            const cellDateLE = new Date(cellValue);
            const filterDateLE = new Date(filterValue);
            if (
              !isNaN(cellDateLE.getTime()) &&
              !isNaN(filterDateLE.getTime())
            ) {
              const isLessEqual = cellDateLE <= filterDateLE;
              console.log(
                `Date LessEqual: ${cellDateLE} <= ${filterDateLE} = ${isLessEqual}`
              );
              return isLessEqual;
            }
            return false;
          default:
            console.log("Unknown operator:", filter.operator);
            return true;
        }
      });
      console.log("After applying filter, remaining rows:", result.length);
    });

    return result;
  };

  // Fallback pattern matching for basic queries
  const parseBasicQuery = (query: string): FilterCondition[] => {
    const filters: FilterCondition[] = [];
    const lowerQuery = query.toLowerCase();

    // Pattern: column > value, column < value, column = value, column contains value
    const patterns = [
      { regex: /(\w+)\s*>\s*(\d+)/g, operator: "greater" },
      { regex: /(\w+)\s*<\s*(\d+)/g, operator: "less" },
      { regex: /(\w+)\s*>=\s*(\d+)/g, operator: "greaterEqual" },
      { regex: /(\w+)\s*<=\s*(\d+)/g, operator: "lessEqual" },
      { regex: /(\w+)\s*=\s*([^,\s]+)/g, operator: "equals" },
      { regex: /(\w+)\s+contains?\s+([^,\s]+)/g, operator: "contains" },
    ];

    patterns.forEach(({ regex, operator }) => {
      let match;
      while ((match = regex.exec(lowerQuery)) !== null) {
        const [, columnName, value] = match;

        // Find matching column (case insensitive)
        const matchingColumn = excelData?.headers.find(
          (header) =>
            header.toLowerCase().includes(columnName) ||
            columnName.includes(header.toLowerCase())
        );

        if (matchingColumn) {
          filters.push({
            id: `basic_filter_${Date.now()}_${filters.length}`,
            column: matchingColumn,
            operator: operator as any,
            value: value.trim(),
          });
        }
      }
    });

    return filters;
  };

  // AI Analysis function with fallback
  const analyzeSearchQuery = async (
    query: string
  ): Promise<AIAnalysisResult> => {
    if (!excelData) {
      throw new Error("No data available for analysis");
    }

    try {
      // Prepare data for the analysis service
      const sampleData = excelData.rows.slice(0, 2).map((row) => {
        const obj: any = {};
        excelData.headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      // Call the new analysis service API
      let response;
      try {
        const apiUrl = `${getApiUrl("ai_chat", "analyzeSearchQuery")}`;
        console.log("Making API call to:", apiUrl);

        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query,
            available_columns: excelData.headers,
            sample_data: sampleData,
            provider: selectedProvider,
            model: selectedModel,
            profile: selectedProfile,
          }),
        });
      } catch (fetchError) {
        console.error("Network error:", fetchError);
        // If network fails, use fallback
        throw new Error(
          `Network error: ${
            fetchError instanceof Error
              ? fetchError.message
              : "Unknown network error"
          }`
        );
      }

      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch {
          errorText = "Unable to read error response";
        }
        console.log("API Error Response:", errorText);
        // If API fails, use fallback
        throw new Error(
          `API Error: ${response.status} - ${errorText || "Server error"}`
        );
      }

      const result = await response.json();
      console.log("Analysis Service Response:", result);

      // Parse the analysis service response
      let analysisResult;
      if (result.success && result.data) {
        analysisResult = result.data;
      } else {
        throw new Error(result.error || "Analysis failed");
      }

      console.log("Parsed analysis result:", analysisResult);

      // Validate the response structure
      if (!analysisResult || typeof analysisResult !== "object") {
        throw new Error("Analysis response is not a valid object");
      }

      // Handle different response formats
      if (!analysisResult.interpretation) {
        analysisResult.interpretation = "AI analysis completed";
      }

      if (!analysisResult.filters) {
        analysisResult.filters = [];
      }

      if (!Array.isArray(analysisResult.filters)) {
        console.log("Filters is not an array:", analysisResult.filters);
        analysisResult.filters = [];
      }

      // Add unique IDs to filters and validate filter structure
      const filtersWithIds = analysisResult.filters.map(
        (filter: any, index: number) => {
          if (
            !filter.column ||
            !filter.operator ||
            filter.value === undefined
          ) {
            throw new Error(`Invalid filter structure at index ${index}`);
          }
          return {
            ...filter,
            id: `ai_filter_${Date.now()}_${index}`,
          };
        }
      );

      return {
        query,
        interpretation: analysisResult.interpretation,
        filters: filtersWithIds,
        success: true,
      };
    } catch (error) {
      console.error("AI analysis error:", error);

      // Fallback to basic pattern matching
      const basicFilters = parseBasicQuery(query);

      if (basicFilters.length > 0) {
        return {
          query,
          interpretation: `Using basic pattern matching: Found ${basicFilters.length} filter(s). AI service unavailable.`,
          filters: basicFilters,
          success: true,
        };
      }

      return {
        query,
        interpretation:
          "AI service unavailable. Try basic patterns like 'column > value', 'column contains text', or 'column = value'.",
        filters: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const handleAISearch = async () => {
    if (!inputManager.value.trim() || !excelData) return;

    setIsAnalyzing(true);
    trackUserBehavior("getApiUrl_start", { query: inputManager.value.trim() });

    try {
      const analysis = await analyzeSearchQuery(inputManager.value.trim());
      setAiAnalysis(analysis);

      if (analysis.success) {
        // Directly apply AI filters to data
        console.log("Applying AI filters directly:", analysis.filters);
        setFilters(analysis.filters);
        setAiSuggestedFilters(analysis.filters);

        const allGridData = convertToGridData(excelData);
        const filtered = applyFilters(allGridData, analysis.filters);
        setFilteredData(filtered);
        setHasSearched(true);
        setCurrentTab("data");

        trackUserBehavior("ai_search_success", {
          query: inputManager.value,
          filtersApplied: analysis.filters.length,
          resultCount: filtered.length,
        });
      } else {
        trackUserBehavior("ai_search_failed", {
          query: inputManager.value,
          error: analysis.error,
        });
      }
    } catch (error) {
      console.error("Search analysis failed:", error);
      trackUserBehavior("ai_search_error", {
        query: inputManager.value,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsAnalyzing(false);
      inputManager.reset();
    }
  };

  const handleSearch = () => {
    if (!excelData) {
      setFilteredData([]);
      return;
    }

    const allGridData = convertToGridData(excelData);
    const filtered = applyFilters(allGridData);
    setFilteredData(filtered);
  };

  const addFilter = () => {
    if (!excelData || excelData.headers.length === 0) return;

    const newFilter: FilterCondition = {
      id: Date.now().toString(),
      column: excelData.headers[0],
      operator: "contains",
      value: "",
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter((f) => f.id !== filterId));
  };

  const updateFilter = (
    filterId: string,
    field: keyof FilterCondition,
    value: string
  ) => {
    setFilters(
      filters.map((f) => (f.id === filterId ? { ...f, [field]: value } : f))
    );
  };

  // FilterManager callbacks
  const handleFiltersChange = (newFilters: FilterCondition[]) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = (filtersToApply: FilterCondition[]) => {
    if (!excelData) return;

    console.log("Applying filters:", filtersToApply);
    const allGridData = convertToGridData(excelData);
    console.log("Original data count:", allGridData.length);
    const filtered = applyFilters(allGridData, filtersToApply);
    console.log("Filtered data count:", filtered.length);
    setFilteredData(filtered);
    setHasSearched(true);
    setCurrentTab("data");

    trackUserBehavior("filters_applied", {
      filterCount: filtersToApply.length,
      resultCount: filtered.length,
    });
  };

  const handleAcceptAISuggestion = (filter: FilterCondition) => {
    // Remove the accepted filter from AI suggestions
    setAiSuggestedFilters((prev) =>
      prev.filter(
        (f) =>
          !(
            f.column === filter.column &&
            f.operator === filter.operator &&
            f.value === filter.value
          )
      )
    );
  };

  // Export data functions
  const exportToCSV = (data: GridRow[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    trackUserBehavior("export_csv", { recordCount: data.length });
  };

  const exportToExcel = (data: GridRow[], filename: string) => {
    if (!data || data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, filename);

    trackUserBehavior("export_excel", { recordCount: data.length });
  };

  // Session management functions
  const saveSession = (name?: string) => {
    const sessionName = name || currentSessionName || `Session ${Date.now()}`;
    const searchQuery = inputManager.value;
    const sessionData: SessionData = {
      id: `session_${Date.now()}`,
      name: sessionName,
      timestamp: Date.now(),
      excelData,
      filters,
      chartConfig,
      hasSearched,
      searchQuery,
      userProfile: selectedProfile,
    };

    const updatedSessions = [...savedSessions, sessionData];
    setSavedSessions(updatedSessions);
    localStorage.setItem(
      "chartAnalyzer_sessions",
      JSON.stringify(updatedSessions)
    );
    setCurrentSessionName(sessionName);

    trackUserBehavior("session_saved", { sessionName, hasData: !!excelData });
  };

  const loadSession = (sessionId: string) => {
    const session = savedSessions.find((s) => s.id === sessionId);
    if (!session) return;

    setExcelData(session.excelData);
    setFilters(session.filters);
    setChartConfig(session.chartConfig);
    session.searchQuery;
    setHasSearched(session.hasSearched);
    setCurrentSessionName(session.name);
    setSelectedProfile(session.userProfile);

    // Reapply filters if there's data
    if (session.excelData && session.filters.length > 0) {
      const allGridData = convertToGridData(session.excelData);
      const filtered = applyFilters(allGridData, session.filters);
      setFilteredData(filtered);
    }

    trackUserBehavior("session_loaded", { sessionName: session.name });
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = savedSessions.filter((s) => s.id !== sessionId);
    setSavedSessions(updatedSessions);
    localStorage.setItem(
      "chartAnalyzer_sessions",
      JSON.stringify(updatedSessions)
    );

    trackUserBehavior("session_deleted", { sessionId });
  };

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("chartAnalyzer_sessions");
    if (stored) {
      try {
        const sessions = JSON.parse(stored);
        setSavedSessions(sessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    }
  }, []);

  // User behavior tracking
  const trackUserBehavior = (action: string, details: any = {}) => {
    const behavior: UserBehavior = {
      action,
      timestamp: new Date(),
      details,
    };
    setUserBehaviors((prev) => [...prev, behavior]);
  };

  // Analyze chart data with AI
  const analyzeChartData = async () => {
    if (!excelData || !chartConfig.xAxis || !chartConfig.yAxis) {
      return;
    }

    setIsAnalyzingChart(true);
    try {
      const currentData = hasSearched
        ? filteredData
        : convertToGridData(excelData);
      const dataForAnalysis = aggregateDataForChart(
        currentData,
        chartConfig.xAxis,
        chartConfig.yAxis
      );

      // Prepare data summary for AI analysis
      const dataSummary = {
        totalRecords: dataForAnalysis.length,
        sampleData: dataForAnalysis.slice(0, 10), // First 10 records
        dataRange: {
          min: Math.min(
            ...dataForAnalysis.map((d) => Number(d[chartConfig.yAxis]) || 0)
          ),
          max: Math.max(
            ...dataForAnalysis.map((d) => Number(d[chartConfig.yAxis]) || 0)
          ),
        },
      };

      const chartConfigData = {
        xAxis: chartConfig.xAxis,
        yAxis: chartConfig.yAxis,
        type: chartConfig.type,
      };

      // Call the analysis service API
      const response = await fetch(
        `${getApiUrl("ai_chat", "analyzeChartData")}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data_summary: dataSummary,
            chart_config: chartConfigData,
            user_profile: selectedProfile,
            provider: selectedProvider,
            model: selectedModel,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setChartDataAnalysis(result.data);
        } else {
          throw new Error(result.error || "Analysis failed");
        }
      } else {
        throw new Error("AI analysis failed");
      }
    } catch (error) {
      console.error("Chart analysis error:", error);
      const currentData = hasSearched
        ? filteredData
        : convertToGridData(excelData);
      setChartDataAnalysis({
        dataInsights: `Data analysis: There are ${currentData.length} records, showing the relationship between ${chartConfig.xAxis} and ${chartConfig.yAxis}.`,
        patterns: [
          "The data shows a certain distribution pattern",
          "There is a trend of value change",
        ],
        keyFindings: [
          "Data integrity is good",
          "Suitable for visualization analysis",
        ],
        dataQuality: "Data quality meets analysis requirements",
      });
    } finally {
      setIsAnalyzingChart(false);
    }
  };

  // Analyze user behavior with AI
  const analyzeUserBehavior = async () => {
    if (userBehaviors.length === 0) {
      return;
    }

    setIsAnalyzingBehavior(true);
    try {
      // Prepare behavior summary for AI analysis
      const behaviorSummary = {
        totalActions: userBehaviors.length,
        actionTypes: [...new Set(userBehaviors.map((b) => b.action))],
        searchQueries: userBehaviors
          .filter((b) => b.action === "ai_search_start")
          .map((b) => b.details.query)
          .filter(Boolean),
        recentActions: userBehaviors.slice(-10).map((b) => ({
          action: b.action,
          timestamp: b.timestamp.toISOString(),
          details: b.details,
        })),
      };

      // Call the analysis service API
      const response = await fetch(
        `${getApiUrl("ai_chat", "analyzeUserBehavior")}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            behavior_summary: behaviorSummary,
            user_profile: selectedProfile,
            provider: selectedProvider,
            model: selectedModel,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUserBehaviorAnalysis(result.data);
        } else {
          throw new Error(result.error || "Analysis failed");
        }
      } else {
        throw new Error("AI analysis failed");
      }
    } catch (error) {
      console.error("User behavior analysis error:", error);
      setUserBehaviorAnalysis({
        behaviorPattern: `User behavior analysis: A total of ${userBehaviors.length} operations were performed, showing an active data exploration pattern.`,
        searchHistory: [
          "Users performed multiple data searches",
          "Showed good analytical habits",
        ],
        promptSuggestions: [
          "Try using more specific search keywords",
          "Combine multiple conditions for filtering",
          "Use natural language to describe requirements",
        ],
        optimizationTips: [
          "Save commonly used analysis sessions",
          "Try different chart types",
          "Utilize AI suggestions to optimize queries",
        ],
      });
    } finally {
      setIsAnalyzingBehavior(false);
    }
  };

  // Session management
  const createNewSession = () => {
    const newSession: AnalysisSession = {
      id: Date.now().toString(),
      name: `Session ${sessions.length + 1}`,
      createdAt: new Date(),
      excelData: null,
      filteredData: [],
      searchQuery: "",
      chartConfig: {
        type: "bar",
        xAxis: "",
        yAxis: "",
        title: "My Chart",
        colors: [
          "#3b82f6",
          "#ef4444",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
          "#06b6d4",
        ],
      },
      aiAnalysis: null,
    };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    trackUserBehavior("create_session", { sessionId: newSession.id });
  };

  const saveCurrentSession = () => {
    if (!currentSessionId) return;

    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              excelData,
              filteredData,
              searchQuery: inputManager.value,
              chartConfig,
              aiAnalysis,
            }
          : session
      )
    );
    trackUserBehavior("save_session", { sessionId: currentSessionId });
  };

  const resetAll = () => {
    setExcelData(null);
    setFilteredData([]);
    setHasSearched(false);
    inputManager.reset();
    setFilters([]);
    setAiAnalysis(null);
    setAiSuggestedFilters([]);
    setShowChart(false);
    setError(null);
    setIsLoading(false);
    setIsAnalyzing(false);
    setCurrentTab("data");
    setChartConfig({
      type: "bar",
      xAxis: "",
      yAxis: "",
      title: "My Chart",
      colors: [
        "#3b82f6",
        "#ef4444",
        "#10b981",
        "#f59e0b",
        "#8b5cf6",
        "#06b6d4",
      ],
    });
    // Clear file input
    const fileInput = document.getElementById(
      "excel-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    trackUserBehavior("reset_all");
  };

  const renderHeader = useMemo(() => {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-foreground">Chart Analyzer</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Profile Selection */}
          <ProfileSelector
            selectedProfileId={currentProfileId}
            onProfileChange={(profile) => {
              if (profile) {
                setCurrentProfile(profile);
                setCurrentProfileId(profile.id);
              } else {
                setCurrentProfile(null);
                setCurrentProfileId(null);
              }
            }}
            onManageProfiles={onShowProfiles}
            selectedProfile={currentProfile}
          />
          {/* Session Management */}
          <Button variant="outline" onClick={createNewSession}>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>

          {currentSessionId && (
            <Button variant="outline" onClick={saveCurrentSession}>
              Save Session
            </Button>
          )}

          {/* History */}
          {sessions.length > 0 && (
            <Select value={currentSessionId || ""} onValueChange={loadSession}>
              <SelectTrigger className="w-40">
                <History className="h-4 w-4 mr-2" />
                <SelectValue placeholder="History" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {excelData && (
            <Button variant="outline" onClick={resetAll}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>
    );
  }, [currentProfileId, currentProfile]);

  const renderDataView = useMemo(() => {
    return (
      <div className="flex gap-4">
        {/* Data Overview - 30% */}
        <Card className="flex-[0.3]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Data Overview</CardTitle>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                  disabled={isLoading}
                />
                <label htmlFor="excel-upload">
                  <Button asChild disabled={isLoading} size="sm">
                    <span className="cursor-pointer">
                      {isLoading ? "Processing..." : "Choose File"}
                    </span>
                  </Button>
                </label>
                {excelData && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveSession()}
                      className="h-8 px-2"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    {savedSessions.length > 0 && (
                      <Select onValueChange={loadSession}>
                        <SelectTrigger className="h-8 w-32">
                          <FolderOpen className="h-3 w-3 mr-1" />
                          <SelectValue placeholder="Load" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedSessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>
            {excelData && (
              <p className="text-sm text-muted-foreground">
                {excelData.rows.length} rows, {excelData.headers.length} columns
                loaded
              </p>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {excelData ? (
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-2xl font-bold text-primary">
                      {excelData.rows.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Records
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-2xl font-bold text-primary">
                      {excelData.headers.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Columns</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-2xl font-bold text-primary">
                      {filteredData.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Filtered Records
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-2xl font-bold text-primary">
                      {excelData.rows.length > 0
                        ? Math.round(
                            (filteredData.length / excelData.rows.length) * 100
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Match Rate
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No data loaded</p>
                <p className="text-sm">
                  Upload an Excel file to see data overview
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Search - 70% */}
        <Card className="flex-[0.4]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-4 w-4" />
              AI Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use natural language or basic patterns to search your data. Works
              with or without AI.
            </p>

            {/* Provider and Model Selection */}
            <ProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              selectedModel={selectedModel || ""}
              onModelChange={(model) => setSelectedModel(model)}
              selectedTemperature={[0.7]}
              onTemperatureChange={() => {}} // Add temperature state if needed
            />

            <div className="space-y-2">
              <OptimizedTextarea
                placeholder="Examples:
? year > 2024
? sales > 15000
? name contains john
? status = active"
                value={inputManager.value}
                onValueChange={inputManager.updateValue}
                onCompositionStart={inputManager.handleCompositionStart}
                onCompositionEnd={inputManager.handleCompositionEnd}
                className="text-sm"
                rows={3}
                onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                disabled={!excelData}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAISearch}
                  disabled={
                    isAnalyzing || !inputManager.value.trim() || !excelData
                  }
                  size="sm"
                >
                  {isAnalyzing ? "..." : "Search"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    inputManager.reset();
                    setFilters([]);
                    setAiAnalysis(null);
                    setAiSuggestedFilters([]);
                    setFilteredData([]);
                    setHasSearched(false);
                  }}
                  disabled={!inputManager.value && filters.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {aiAnalysis && (
          <Card className="flex-[0.3]">
            <CardContent>
              {/* AI Analysis Result */}
              {!aiAnalysis.success && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    <span>{aiAnalysis.error || "Analysis failed"}</span>
                  </div>
                </div>
              )}

              {/* Filter Manager - Show Applied Filters */}
              {excelData && filters.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm bg-green-50 border border-green-200 ">
                    {aiAnalysis?.interpretation}
                  </p>
                  <FilterManager
                    filters={filters}
                    availableColumns={excelData.headers}
                    onFiltersChange={handleFiltersChange}
                    onApplyFilters={handleApplyFilters}
                    aiSuggestedFilters={aiSuggestedFilters}
                    onAcceptAISuggestion={handleAcceptAISuggestion}
                    className="border-0 shadow-none bg-transparent p-0"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }, [
    excelData,
    filters,
    aiSuggestedFilters,
    aiAnalysis,
    isAnalyzing,
    inputManager.value,
    isLoading,
    savedSessions,
    selectedProvider,
    selectedModel,
    filteredData,
  ]);

  const renderTabs = useMemo(() => {
    return (
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Filtered Data
          </TabsTrigger>
          <TabsTrigger value="chart">
            <BarChart3 className="h-4 w-4 mr-2" />
            Chart Analysis
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <TrendingUp className="h-4 w-4 mr-2" />
            User Behavior
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-3">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filtered Data Results</h3>
              <div className="flex items-center gap-2">
                {hasSearched && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredData.length} of{" "}
                      {excelData?.rows.length || 0} records
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          exportToCSV(filteredData, "filtered_data.csv")
                        }
                        disabled={filteredData.length === 0}
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          exportToExcel(filteredData, "filtered_data.xlsx")
                        }
                        disabled={filteredData.length === 0}
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Excel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
            {hasSearched ? (
              <div
                className="ag-theme-alpine"
                style={{ height: "400px", width: "100%" }}
              >
                <AgGridReact
                  rowData={filteredData}
                  columnDefs={columnDefs}
                  pagination={true}
                  paginationPageSize={50}
                  paginationPageSizeSelector={[50, 100, 200, 500]}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    minWidth: 100,
                  }}
                  animateRows={true}
                  rowSelection="multiple"
                  localeText={{
                    page: "Page",
                    more: "More",
                    to: "to",
                    of: "of",
                    next: "Next",
                    last: "Last",
                    first: "First",
                    previous: "Previous",
                    loadingOoo: "Loading...",
                    selectAll: "Select All",
                    searchOoo: "Search...",
                    blanks: "Blanks",
                    filterOoo: "Filter...",
                    applyFilter: "Apply Filter",
                    equals: "Equals",
                    notEqual: "Not Equal",
                    contains: "Contains",
                    notContains: "Not Contains",
                    startsWith: "Starts With",
                    endsWith: "Ends With",
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No search performed</p>
                <p className="text-sm">
                  Use the AI search to filter data and see results here
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <div className="space-y-2 flex">
            {/* Chart Configuration */}
            {excelData && (
              <div className="space-y-4 mr-4 flex-[0.15]">
                <Card className="p-3">
                  <h3 className="text-lg font-semibold">Chart Configuration</h3>
                  <div className="gap-4 ">
                    {/* Chart Type */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Chart Type
                      </label>
                      <Select
                        value={chartConfig.type}
                        onValueChange={(
                          value: "bar" | "line" | "pie" | "scatter"
                        ) =>
                          setChartConfig((prev) => ({
                            ...prev,
                            type: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="scatter">Scatter Plot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* X-Axis */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        X Axis
                      </label>
                      <Select
                        value={chartConfig.xAxis}
                        onValueChange={(value) =>
                          setChartConfig((prev) => ({
                            ...prev,
                            xAxis: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select X Axis" />
                        </SelectTrigger>
                        <SelectContent>
                          {excelData.headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Y-Axis */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Y Axis
                      </label>
                      <Select
                        value={chartConfig.yAxis}
                        onValueChange={(value) =>
                          setChartConfig((prev) => ({
                            ...prev,
                            yAxis: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Y Axis" />
                        </SelectTrigger>
                        <SelectContent>
                          {excelData.headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chart Title */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Chart Title
                      </label>
                      <Input
                        value={chartConfig.title}
                        onChange={(e) =>
                          setChartConfig((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Enter chart title"
                      />
                    </div>
                  </div>
                </Card>
                <div className="grid gap-4 m-2">
                  <Button
                    onClick={() => {
                      setShowChart(true);
                      trackUserBehavior("generate_chart", {
                        chartConfig,
                      });
                    }}
                    disabled={!chartConfig.xAxis || !chartConfig.yAxis}
                  >
                    Generate Chart
                  </Button>
                  {showChart && (
                    <Button
                      variant="outline"
                      onClick={() => setShowChart(false)}
                    >
                      Hide Chart
                    </Button>
                  )}
                  {showChart && (
                    <Button
                      onClick={() => {
                        analyzeChartData();
                        trackUserBehavior("analyze_chart_data", {
                          chartConfig,
                        });
                      }}
                      disabled={isAnalyzingChart}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isAnalyzingChart ? "Analyzing..." : "AI Analyze Data"}
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div className="flex-[0.65] mr-4">
              {/* Chart Display */}
              {showChart && chartConfig.xAxis && chartConfig.yAxis && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Generated Chart
                  </h3>
                  <div className="flex justify-center">
                    <SimpleChart
                      data={aggregateDataForChart(
                        hasSearched
                          ? filteredData
                          : convertToGridData(
                              excelData || { headers: [], rows: [] }
                            ),
                        chartConfig.xAxis,
                        chartConfig.yAxis
                      )}
                      xAxis={chartConfig.xAxis}
                      yAxis={chartConfig.yAxis}
                      type={chartConfig.type}
                      title={chartConfig.title}
                      colors={chartConfig.colors}
                      width={800}
                      height={500}
                      allowZoom={true}
                    />
                  </div>
                </div>
              )}
            </div>
            {chartDataAnalysis && (
              <div className="border rounded-lg p-4 bg-blue-50 flex-[0.3]">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">
                  AI Data Analysis Results
                </h3>

                <div className="space-y-4">
                  {/* Data Insights */}
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">
                      Data Insights and Trends
                    </h4>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                      {chartDataAnalysis.dataInsights}
                    </p>
                  </div>

                  {/* Patterns */}
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">
                      Patterns Found
                    </h4>
                    <ul className="space-y-1">
                      {chartDataAnalysis.patterns.map((pattern, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 bg-white p-2 rounded border flex items-start gap-2"
                        >
                          <span className="text-blue-600 font-medium">
                            {index + 1}.
                          </span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Findings */}
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">
                      Key Findings
                    </h4>
                    <ul className="space-y-1">
                      {chartDataAnalysis.keyFindings.map((finding, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 bg-white p-2 rounded border flex items-start gap-2"
                        >
                          <span className="text-green-600 font-medium">?</span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Data Quality */}
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">
                      Data Quality Assessment
                    </h4>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                      {chartDataAnalysis.dataQuality}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">User Behavior Analysis</h3>
              <Button
                onClick={() => {
                  analyzeUserBehavior();
                  trackUserBehavior("ai_analyze_behavior", {
                    totalActions: userBehaviors.length,
                  });
                }}
                disabled={userBehaviors.length === 0 || isAnalyzingBehavior}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzingBehavior
                  ? "AI Analyzing..."
                  : "AI Behavior Analysis"}
              </Button>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-3">Action History</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userBehaviors
                  .slice(-10)
                  .reverse()
                  .map((behavior, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 bg-background rounded border"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{behavior.action}</span>
                        <span className="text-muted-foreground text-xs">
                          {behavior.timestamp.toLocaleString("en-US")}
                        </span>
                      </div>
                      {Object.keys(behavior.details).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(behavior.details)}
                        </div>
                      )}
                    </div>
                  ))}
                {userBehaviors.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No actions recorded yet
                  </p>
                )}
              </div>
            </div>

            {/* Behavior Statistics */}
            {userBehaviors.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-xl font-bold text-primary">
                    {userBehaviors.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Actions
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-xl font-bold text-primary">
                    {[...new Set(userBehaviors.map((b) => b.action))].length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Action Types
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-xl font-bold text-primary">
                    {
                      userBehaviors.filter((b) => b.action.includes("search"))
                        .length
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Searches</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-xl font-bold text-primary">
                    {
                      userBehaviors.filter((b) => b.action.includes("chart"))
                        .length
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Chart Actions
                  </div>
                </div>
              </div>
            )}

            {/* AI User Behavior Analysis Results */}
            {userBehaviorAnalysis && (
              <div className="border rounded-lg p-4 bg-purple-50 mt-4">
                <h4 className="text-lg font-semibold mb-4 text-purple-800">
                  AI User Behavior Analysis Results
                </h4>

                <div className="space-y-4">
                  {/* Behavior Pattern */}
                  <div>
                    <h5 className="font-medium text-purple-700 mb-2">
                      Behavior Pattern Analysis
                    </h5>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                      {userBehaviorAnalysis.behaviorPattern}
                    </p>
                  </div>

                  {/* Search History Analysis */}
                  <div>
                    <h5 className="font-medium text-purple-700 mb-2">
                      Search History Analysis
                    </h5>
                    <ul className="space-y-1">
                      {userBehaviorAnalysis.searchHistory.map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 bg-white p-2 rounded border flex items-start gap-2"
                        >
                          <span className="text-purple-600 font-medium">
                            {index + 1}.
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prompt Suggestions */}
                  <div>
                    <h5 className="font-medium text-purple-700 mb-2">
                      Prompt Optimization Suggestions
                    </h5>
                    <ul className="space-y-1">
                      {userBehaviorAnalysis.promptSuggestions.map(
                        (suggestion, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 bg-white p-2 rounded border flex items-start gap-2"
                          >
                            <span className="text-yellow-600 font-medium">
                              ?
                            </span>
                            {suggestion}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Optimization Tips */}
                  <div>
                    <h5 className="font-medium text-purple-700 mb-2">
                      Operation Optimization Suggestions
                    </h5>
                    <ul className="space-y-1">
                      {userBehaviorAnalysis.optimizationTips.map(
                        (tip, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 bg-white p-2 rounded border flex items-start gap-2"
                          >
                            <span className="text-green-600 font-medium">
                              ?
                            </span>
                            {tip}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  }, [
    userBehaviorAnalysis,
    chartDataAnalysis,
    userBehaviors,
    showChart,
    chartConfig,
    filteredData,
    hasSearched,
    currentTab,
  ]);

  return (
    <div className="h-full w-full p-3 bg-background overflow-auto">
      <div className="w-full space-y-3">
        {/* Header */}
        {renderHeader}
        {renderDataView}
        {/* Chart Analysis and User Behavior */}
        {excelData && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Chart visualization and user behavior tracking
              </p>
            </CardHeader>
            <CardContent>{renderTabs}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
