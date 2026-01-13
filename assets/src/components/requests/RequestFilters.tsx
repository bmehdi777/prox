import { X } from "lucide-react";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { methodFilterColors } from "src/constants/requests";
import type { CacheFilter, HttpVerb, StatusFilter } from "src/types/requests";

interface RequestFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  methodFilter: HttpVerb | "all";
  onMethodFilterChange: (method: HttpVerb | "all") => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  cacheFilter: CacheFilter;
  onCacheFilterChange: (cache: CacheFilter) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  isPaused: boolean;
  onTogglePause: () => void;
}

const methodOptions = ["all", "GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const statusOptions = ["all", "2xx", "3xx", "4xx", "5xx"] as const;
const cacheOptions = ["all", "cached", "uncached"] as const;

function RequestFilters({
  searchQuery,
  onSearchChange,
  methodFilter,
  onMethodFilterChange,
  statusFilter,
  onStatusFilterChange,
  cacheFilter,
  onCacheFilterChange,
  onClearFilters,
  filteredCount,
  totalCount,
  isPaused,
  onTogglePause,
}: RequestFiltersProps) {
  const hasActiveFilters = searchQuery || methodFilter !== "all" || statusFilter !== "all" || cacheFilter !== "all";

  return (
    <div className="p-4 space-y-4 border-b">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by URL..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
        <Button
          variant={isPaused ? "default" : "outline"}
          onClick={onTogglePause}
          className={isPaused ? "bg-amber-500 hover:bg-amber-600" : ""}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Method:</span>
          <div className="flex gap-1">
            {methodOptions.map((method) => (
              <Button
                key={method}
                variant="outline"
                size="sm"
                data-active={methodFilter === method}
                className={methodFilterColors[method]}
                onClick={() => onMethodFilterChange(method)}
              >
                {method === "all" ? "All" : method}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div className="flex gap-1">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                data-active={statusFilter === status}
                className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                onClick={() => onStatusFilterChange(status)}
              >
                {status === "all" ? "All" : status}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Cache:</span>
          <div className="flex gap-1">
            {cacheOptions.map((cache) => (
              <Button
                key={cache}
                variant="outline"
                size="sm"
                data-active={cacheFilter === cache}
                className="data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-700 data-[active=true]:border-emerald-300"
                onClick={() => onCacheFilterChange(cache)}
              >
                {cache === "all" ? "All" : cache.charAt(0).toUpperCase() + cache.slice(1)}
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
        Showing {filteredCount} of {totalCount} requests
      </div>
    </div>
  );
}

export default RequestFilters;
