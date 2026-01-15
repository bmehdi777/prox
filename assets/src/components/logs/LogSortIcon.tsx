import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { LogSortField, SortDirection } from "src/types/requests";

interface LogSortIconProps {
  field: LogSortField;
  currentSortField: LogSortField | null;
  sortDirection: SortDirection;
}

function LogSortIcon({ field, currentSortField, sortDirection }: LogSortIconProps) {
  if (currentSortField !== field) {
    return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground" />;
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-1 h-4 w-4" />
  ) : (
    <ArrowDown className="ml-1 h-4 w-4" />
  );
}

export default LogSortIcon;
