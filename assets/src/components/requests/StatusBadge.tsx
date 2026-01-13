import { Badge } from "src/components/ui/badge";

interface StatusBadgeProps {
  status: number;
}

function getStatusColors(status: number): string {
  if (status >= 200 && status < 300) return "bg-emerald-100 text-emerald-700 border-emerald-300";
  if (status >= 300 && status < 400) return "bg-sky-100 text-sky-700 border-sky-300";
  if (status >= 400 && status < 500) return "bg-orange-100 text-orange-700 border-orange-300";
  if (status >= 500) return "bg-rose-100 text-rose-700 border-rose-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={getStatusColors(status)}>
      {status}
    </Badge>
  );
}

export default StatusBadge;
