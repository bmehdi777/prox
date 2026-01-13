import { useMemo, useState } from "react";
import RequestDetail from "src/components/requests/RequestDetail";
import RequestFilters from "src/components/requests/RequestFilters";
import RequestsTable from "src/components/requests/RequestsTable";
import { sampleRequests } from "src/constants/requests";
import type { CacheFilter, HttpVerb, SortDirection, SortField, StatusFilter } from "src/types/requests";

function parseDuration(duration: string): number {
  return parseInt(duration.replace("ms", ""), 10);
}

function Requests() {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<HttpVerb | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cacheFilter, setCacheFilter] = useState<CacheFilter>("all");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isPaused, setIsPaused] = useState(false);
  const [cachedRequestIds, setCachedRequestIds] = useState<Set<number>>(new Set());

  const selectedRequest = sampleRequests.find((r) => r.id === selectedRequestId);

  const filteredAndSortedRequests = useMemo(() => {
    let result = [...sampleRequests];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.url.toLowerCase().includes(query));
    }

    if (methodFilter !== "all") {
      result = result.filter((r) => r.method === methodFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => {
        const statusRange = parseInt(statusFilter.charAt(0), 10) * 100;
        return r.status >= statusRange && r.status < statusRange + 100;
      });
    }

    if (cacheFilter !== "all") {
      result = result.filter((r) => {
        const isCached = cachedRequestIds.has(r.id);
        return cacheFilter === "cached" ? isCached : !isCached;
      });
    }

    if (sortField) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "method":
            comparison = a.method.localeCompare(b.method);
            break;
          case "url":
            comparison = a.url.localeCompare(b.url);
            break;
          case "status":
            comparison = a.status - b.status;
            break;
          case "duration":
            comparison = parseDuration(a.duration) - parseDuration(b.duration);
            break;
          case "cached":
            const aCached = cachedRequestIds.has(a.id) ? 1 : 0;
            const bCached = cachedRequestIds.has(b.id) ? 1 : 0;
            comparison = aCached - bCached;
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [searchQuery, methodFilter, statusFilter, cacheFilter, sortField, sortDirection, cachedRequestIds]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMethodFilter("all");
    setStatusFilter("all");
    setCacheFilter("all");
    setSortField(null);
    setSortDirection("asc");
  };

  const toggleCache = (requestId: number) => {
    setCachedRequestIds((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <RequestFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          methodFilter={methodFilter}
          onMethodFilterChange={setMethodFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          cacheFilter={cacheFilter}
          onCacheFilterChange={setCacheFilter}
          onClearFilters={clearFilters}
          filteredCount={filteredAndSortedRequests.length}
          totalCount={sampleRequests.length}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
        />

        <div className="flex-1 overflow-auto p-4">
          <RequestsTable
            requests={filteredAndSortedRequests}
            selectedRequestId={selectedRequestId}
            onSelectRequest={setSelectedRequestId}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            cachedRequestIds={cachedRequestIds}
            onToggleCache={toggleCache}
          />
        </div>
      </div>

      {selectedRequest && (
        <div className="flex-1 p-4 border-l overflow-auto">
          <RequestDetail
            request={selectedRequest}
            onClose={() => setSelectedRequestId(null)}
            isCached={cachedRequestIds.has(selectedRequest.id)}
            onToggleCache={() => toggleCache(selectedRequest.id)}
          />
        </div>
      )}
    </div>
  );
}

export default Requests;
