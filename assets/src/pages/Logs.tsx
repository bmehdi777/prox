import { useMemo, useState } from "react";
import LogFilters from "src/components/logs/LogFilters";
import LogsTable from "src/components/logs/LogsTable";
import { sampleLogs } from "src/constants/logs";
import type { LogLevelFilter } from "src/types/requests";

function Logs() {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const sources = useMemo(() => {
    const uniqueSources = new Set(sampleLogs.map((log) => log.source));
    return Array.from(uniqueSources).sort();
  }, []);

  const filteredLogs = useMemo(() => {
    let result = [...sampleLogs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          log.source.toLowerCase().includes(query)
      );
    }

    if (levelFilter !== "all") {
      result = result.filter((log) => log.level === levelFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((log) => log.source === sourceFilter);
    }

    return result;
  }, [searchQuery, levelFilter, sourceFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setLevelFilter("all");
    setSourceFilter("all");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <LogFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        sources={sources}
        onClearFilters={clearFilters}
        filteredCount={filteredLogs.length}
        totalCount={sampleLogs.length}
      />

      <div className="flex-1 overflow-auto p-4">
        <LogsTable
          logs={filteredLogs}
          selectedLogId={selectedLogId}
          onSelectLog={setSelectedLogId}
        />
      </div>
    </div>
  );
}

export default Logs;
