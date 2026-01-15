import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "src/components/ui/table";
import type { LogEntry, LogSortField, SortDirection } from "src/types/requests";
import LogLevelBadge from "./LogLevelBadge";
import LogSortIcon from "./LogSortIcon";

interface LogsTableProps {
  logs: LogEntry[];
  selectedLogId: number | null;
  onSelectLog: (id: number) => void;
  sortField: LogSortField | null;
  sortDirection: SortDirection;
  onSort: (field: LogSortField) => void;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function LogsTable({
  logs,
  selectedLogId,
  onSelectLog,
  sortField,
  sortDirection,
  onSort,
}: LogsTableProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
        <table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[140px] cursor-pointer select-none"
                onClick={() => onSort("timestamp")}
              >
                <div className="flex items-center">
                  Timestamp
                  <LogSortIcon
                    field="timestamp"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="w-[100px] cursor-pointer select-none"
                onClick={() => onSort("level")}
              >
                <div className="flex items-center">
                  Level
                  <LogSortIcon
                    field="level"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="w-[120px] cursor-pointer select-none"
                onClick={() => onSort("source")}
              >
                <div className="flex items-center">
                  Source
                  <LogSortIcon
                    field="source"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => onSort("message")}
              >
                <div className="flex items-center">
                  Message
                  <LogSortIcon
                    field="message"
                    currentSortField={sortField}
                    sortDirection={sortDirection}
                  />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
        </table>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <Table>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No logs match the current filters
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => onSelectLog(log.id)}
                  className={`cursor-pointer ${
                    selectedLogId === log.id ? "bg-muted" : ""
                  }`}
                >
                  <TableCell className="w-[140px] font-mono text-sm text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell className="w-[100px]">
                    <LogLevelBadge level={log.level} />
                  </TableCell>
                  <TableCell className="w-[120px] font-mono text-sm">
                    {log.source}
                  </TableCell>
                  <TableCell className="truncate max-w-[500px]">
                    {log.message}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default LogsTable;
