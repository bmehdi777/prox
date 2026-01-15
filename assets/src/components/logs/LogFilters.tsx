import { X } from "lucide-react";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { logLevelFilterColors } from "src/constants/logs";
import type { LogLevel, LogLevelFilter } from "src/types/requests";

interface LogFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  levelFilter: LogLevelFilter;
  onLevelFilterChange: (level: LogLevelFilter) => void;
  sourceFilter: string;
  onSourceFilterChange: (source: string) => void;
  availableSources: string[];
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

const levelOptions: (LogLevel | "all")[] = ["all", "info", "warn", "error", "debug"];

function LogFilters({
  searchQuery,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
  sourceFilter,
  onSourceFilterChange,
  availableSources,
  onClearFilters,
  filteredCount,
  totalCount,
}: LogFiltersProps) {
  const hasActiveFilters = searchQuery || levelFilter !== "all" || sourceFilter !== "all";

  return (
    <div className="p-4 space-y-4 border-b">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Level:</span>
          <div className="flex gap-1">
            {levelOptions.map((level) => (
              <Button
                key={level}
                variant="outline"
                size="sm"
                data-active={levelFilter === level}
                className={logLevelFilterColors[level]}
                onClick={() => onLevelFilterChange(level)}
              >
                {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Source:</span>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              data-active={sourceFilter === "all"}
              className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
              onClick={() => onSourceFilterChange("all")}
            >
              All
            </Button>
            {availableSources.map((source) => (
              <Button
                key={source}
                variant="outline"
                size="sm"
                data-active={sourceFilter === source}
                className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                onClick={() => onSourceFilterChange(source)}
              >
                {source}
              </Button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredCount} of {totalCount} logs
      </div>
    </div>
  );
}

export default LogFilters;
