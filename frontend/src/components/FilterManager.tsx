import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Plus, Filter } from "lucide-react";

export interface FilterCondition {
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

interface FilterManagerProps {
  filters: FilterCondition[];
  availableColumns: string[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  onApplyFilters: (filters: FilterCondition[]) => void;
  aiSuggestedFilters?: FilterCondition[];
  onAcceptAISuggestion?: (filter: FilterCondition) => void;
  className?: string;
}

const operatorOptions = [
  { value: "equals", label: "Equals (=)" },
  { value: "contains", label: "Contains" },
  { value: "greater", label: "Greater than (>)" },
  { value: "less", label: "Less than (<)" },
  { value: "greaterEqual", label: "Greater or equal (>=)" },
  { value: "lessEqual", label: "Less or equal (<=)" },
];

export function FilterManager({
  filters,
  availableColumns,
  onFiltersChange,
  onApplyFilters,
  aiSuggestedFilters = [],
  onAcceptAISuggestion,
  className = "",
}: FilterManagerProps) {
  const addNewFilter = () => {
    if (availableColumns.length === 0) return;

    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}`,
      column: availableColumns[0],
      operator: "equals",
      value: "",
    };

    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (
    filterId: string,
    field: keyof FilterCondition,
    value: string
  ) => {
    const updatedFilters = filters.map((filter) =>
      filter.id === filterId ? { ...filter, [field]: value } : filter
    );
    onFiltersChange(updatedFilters);
  };

  const removeFilter = (filterId: string) => {
    const updatedFilters = filters.filter((filter) => filter.id !== filterId);
    onFiltersChange(updatedFilters);
  };

  const acceptAISuggestion = (suggestedFilter: FilterCondition) => {
    const newFilter = {
      ...suggestedFilter,
      id: `ai_filter_${Date.now()}`,
    };
    onFiltersChange([...filters, newFilter]);
    if (onAcceptAISuggestion) {
      onAcceptAISuggestion(newFilter);
    }
  };

  const applyAllAISuggestions = () => {
    const newFilters = aiSuggestedFilters.map((filter) => ({
      ...filter,
      id: `ai_filter_${Date.now()}_${Math.random()}`,
    }));
    onFiltersChange([...filters, ...newFilters]);
  };

  // Debug logging
  console.log("FilterManager render:", {
    filtersCount: filters.length,
    aiSuggestedFiltersCount: aiSuggestedFilters.length,
    aiSuggestedFilters: aiSuggestedFilters,
  });

  // Check if we should render as a card or inline
  const isInlineMode =
    className?.includes("border-0") || className?.includes("shadow-none");

  const content = (
    <div className="space-y-3">
      {/* Applied Filters */}
      {filters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-green-600">
              Applied Filters ({filters.length})
            </h4>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={addNewFilter}
                disabled={availableColumns.length === 0}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                onClick={() => onApplyFilters(filters)}
                className="h-6 px-2 text-xs"
              >
                Apply ({filters.length})
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <div
                key={filter.id}
                className="flex items-center gap-1 p-1 bg-green-50 border border-green-200 rounded min-w-[500px] w-[600px]"
              >
                <div className="flex gap-2 items-center text-xs">
                  <div className="">
                    <Select
                      value={filter.column}
                      onValueChange={(value) =>
                        updateFilter(filter.id, "column", value)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="h-8 text-xxs min-w-[140px] w-[160px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs min-w-[120px] w-[140px]">
                        {availableColumns.map((column) => (
                          <SelectItem key={column} value={column}>
                            {column}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-4">
                    <Select
                      value={filter.operator}
                      onValueChange={(value) =>
                        updateFilter(
                          filter.id,
                          "operator",
                          value as FilterCondition["operator"]
                        )
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="h-8 text-xxs min-w-[120px] w-[160px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs min-w-[120px] w-[160px]">
                        {operatorOptions.map((option) => (
                          <SelectItem key={option.label} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-5">
                    <Input
                      value={filter.value}
                      onChange={(e) =>
                        updateFilter(filter.id, "value", e.target.value)
                      }
                      placeholder="Value"
                      className="h-8 text-sm min-w-[100px] w-[180px]"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter.id)}
                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0 shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Return content wrapped in Card or inline
  if (isInlineMode) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-4 w-4" />
          Filter Manager
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
