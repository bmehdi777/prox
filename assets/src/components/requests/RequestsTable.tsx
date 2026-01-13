import { Archive } from "lucide-react";
import { Switch } from "src/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "src/components/ui/table";
import type { Request, SortDirection, SortField } from "src/types/requests";
import MethodBadge from "./MethodBadge";
import SortIcon from "./SortIcon";
import StatusBadge from "./StatusBadge";

interface RequestsTableProps {
  requests: Request[];
  selectedRequestId: number | null;
  onSelectRequest: (id: number) => void;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  cachedRequestIds: Set<number>;
  onToggleCache: (requestId: number) => void;
}

function RequestsTable({
  requests,
  selectedRequestId,
  onSelectRequest,
  sortField,
  sortDirection,
  onSort,
  cachedRequestIds,
  onToggleCache,
}: RequestsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            className="w-[60px] cursor-pointer select-none"
            onClick={() => onSort("cached")}
          >
            <div className="flex items-center">
              <Archive className="h-4 w-4" />
              <SortIcon
                field="cached"
                currentSortField={sortField}
                sortDirection={sortDirection}
              />
            </div>
          </TableHead>
          <TableHead
            className="w-[100px] cursor-pointer select-none"
            onClick={() => onSort("method")}
          >
            <div className="flex items-center">
              Method
              <SortIcon
                field="method"
                currentSortField={sortField}
                sortDirection={sortDirection}
              />
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => onSort("url")}
          >
            <div className="flex items-center">
              URL
              <SortIcon
                field="url"
                currentSortField={sortField}
                sortDirection={sortDirection}
              />
            </div>
          </TableHead>
          <TableHead
            className="w-[100px] cursor-pointer select-none"
            onClick={() => onSort("status")}
          >
            <div className="flex items-center">
              Status
              <SortIcon
                field="status"
                currentSortField={sortField}
                sortDirection={sortDirection}
              />
            </div>
          </TableHead>
          <TableHead
            className="w-[100px] cursor-pointer select-none"
            onClick={() => onSort("duration")}
          >
            <div className="flex items-center justify-end">
              Duration
              <SortIcon
                field="duration"
                currentSortField={sortField}
                sortDirection={sortDirection}
              />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No requests match the current filters
            </TableCell>
          </TableRow>
        ) : (
          requests.map((request) => {
            const isCached = cachedRequestIds.has(request.id);
            return (
              <TableRow
                key={request.id}
                onClick={() => onSelectRequest(request.id)}
                className={`cursor-pointer ${
                  selectedRequestId === request.id ? "bg-muted" : ""
                }`}
              >
                <TableCell>
                  <Switch
                    checked={isCached}
                    onCheckedChange={(_) => {
                      onToggleCache(request.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell>
                  <MethodBadge method={request.method} />
                </TableCell>
                <TableCell className="font-mono text-sm truncate max-w-[400px]">
                  {request.url}
                </TableCell>
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {request.duration}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export default RequestsTable;
