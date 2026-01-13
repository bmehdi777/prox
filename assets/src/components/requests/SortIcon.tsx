import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection, SortField } from "src/types/requests";

interface SortIconProps {
  field: SortField;
  currentSortField: SortField | null;
  sortDirection: SortDirection;
}

function SortIcon({ field, currentSortField, sortDirection }: SortIconProps) {
  if (currentSortField !== field) {
    return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground" />;
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-1 h-4 w-4" />
  ) : (
    <ArrowDown className="ml-1 h-4 w-4" />
  );
}

export default SortIcon;
