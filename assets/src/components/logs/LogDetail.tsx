import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader } from "src/components/ui/card";
import { Separator } from "src/components/ui/separator";
import type { LogEntry } from "src/types/requests";
import LogLevelBadge from "./LogLevelBadge";

interface LogDetailProps {
  log: LogEntry;
  onClose: () => void;
}

function formatFullTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  });
}

function LogDetail({ log, onClose }: LogDetailProps) {
  const copyToClipboard = () => {
    const text = `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`;
    navigator.clipboard.writeText(text);
    toast.success("Log entry copied to clipboard");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Log Details</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogLevelBadge level={log.level} />
              <span className="font-mono text-sm text-muted-foreground">{log.source}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="cursor-pointer"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
            <p className="font-mono text-sm">{formatFullTimestamp(log.timestamp)}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Level</p>
              <p className="font-medium capitalize">{log.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Source</p>
              <p className="font-medium font-mono">{log.source}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Message</p>
            <div className="bg-muted rounded-md p-3 font-mono text-sm break-words">
              {log.message}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Raw Log Entry</p>
            <div className="bg-muted rounded-md p-3 font-mono text-xs break-all">
              [{log.timestamp}] [{log.level.toUpperCase()}] [{log.source}] {log.message}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LogDetail;
