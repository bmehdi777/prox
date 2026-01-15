import { useMemo, useState } from "react";
import LogDetail from "src/components/logs/LogDetail";
import LogFilters from "src/components/logs/LogFilters";
import LogsTable from "src/components/logs/LogsTable";
import { sampleLogs } from "src/constants/logs";
import type { LogLevelFilter, LogSortField, SortDirection } from "src/types/requests";

const logLevelOrder = { debug: 0, info: 1, warn: 2, error: 3 };

function Logs() {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<LogSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const selectedLog = sampleLogs.find((l) => l.id === selectedLogId);

  const availableSources = useMemo(() => {
    const sources = new Set(sampleLogs.map((l) => l.source));
    return Array.from(sources).sort();
  }, []);

  const filteredAndSortedLogs = useMemo(() => {
    let result = [...sampleLogs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(query) ||
          l.source.toLowerCase().includes(query)
      );
    }

    if (levelFilter !== "all") {
      result = result.filter((l) => l.level === levelFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((l) => l.source === sourceFilter);
    }

    if (sortField) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "timestamp":
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            break;
          case "level":
            comparison = logLevelOrder[a.level] - logLevelOrder[b.level];
            break;
          case "source":
            comparison = a.source.localeCompare(b.source);
            break;
          case "message":
            comparison = a.message.localeCompare(b.message);
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [searchQuery, levelFilter, sourceFilter, sortField, sortDirection]);

  const handleSort = (field: LogSortField) => {
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
    setLevelFilter("all");
    setSourceFilter("all");
    setSortField(null);
    setSortDirection("asc");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <LogFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          levelFilter={levelFilter}
          onLevelFilterChange={setLevelFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          availableSources={availableSources}
          onClearFilters={clearFilters}
          filteredCount={filteredAndSortedLogs.length}
          totalCount={sampleLogs.length}
        />

        <div className="flex-1 p-4 min-h-0">
          <LogsTable
            logs={filteredAndSortedLogs}
            selectedLogId={selectedLogId}
            onSelectLog={setSelectedLogId}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </div>
      </div>

      {selectedLog && (
        <div className="flex-1 p-4 border-l overflow-auto min-h-0">
          <LogDetail
            log={selectedLog}
            onClose={() => setSelectedLogId(null)}
          />
        </div>
      )}
    </div>
  );
}

export default Logs;
