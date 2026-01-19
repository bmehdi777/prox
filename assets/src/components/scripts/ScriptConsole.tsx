import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "src/components/ui/button";
import type { ScriptLogEntry } from "src/types/scripts";

interface ScriptConsoleProps {
  logs: ScriptLogEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

function ScriptConsole({ logs, isOpen, onToggle, onClear }: ScriptConsoleProps) {
  const getLevelClass = (level: ScriptLogEntry["level"]) => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      case "debug":
        return "text-gray-500";
      case "info":
      default:
        return "text-foreground";
    }
  };

  const getLevelBadgeClass = (level: ScriptLogEntry["level"]) => {
    switch (level) {
      case "error":
        return "bg-red-500/20 text-red-500";
      case "warn":
        return "bg-yellow-500/20 text-yellow-500";
      case "debug":
        return "bg-gray-500/20 text-gray-500";
      case "info":
      default:
        return "bg-blue-500/20 text-blue-500";
    }
  };

  return (
    <div className="border-t bg-background flex flex-col">
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-muted/30 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">Console</span>
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({logs.length} {logs.length === 1 ? "entry" : "entries"})
            </span>
          )}
        </div>
        {isOpen && logs.length > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="cursor-pointer h-6 w-6"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
      {isOpen && (
        <div className="h-40 overflow-auto p-2 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No logs yet
            </p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium shrink-0 ${getLevelBadgeClass(log.level)}`}
                  >
                    {log.level}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    [{log.scriptName}]
                  </span>
                  <span className={getLevelClass(log.level)}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ScriptConsole;
