import { useState } from "react";
import { Archive, Check, Clipboard, Loader2, Play, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { Separator } from "src/components/ui/separator";
import type { Request } from "src/types/requests";
import { generateCurlCommand, replayRequest } from "src/lib/request-utils";
import MethodBadge from "./MethodBadge";
import StatusBadge from "./StatusBadge";

interface RequestDetailProps {
  request: Request;
  onClose: () => void;
  isCached: boolean;
  onToggleCache: () => void;
  onReplayResult?: (status: number, duration: string) => void;
}

function RequestDetail({ request, onClose, isCached, onToggleCache, onReplayResult }: RequestDetailProps) {
  const [copied, setCopied] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  const handleCopyAsCurl = async () => {
    const curlCommand = generateCurlCommand(request);
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    toast.success("cURL command copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplay = async () => {
    setIsReplaying(true);
    const startTime = performance.now();
    try {
      const response = await replayRequest(request);
      const duration = Math.round(performance.now() - startTime);
      toast.success(`Request replayed: ${response.status} (${duration}ms)`);
      onReplayResult?.(response.status, `${duration}ms`);
    } catch (error) {
      toast.error(`Request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsReplaying(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Request Details</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MethodBadge method={request.method} />
              <StatusBadge status={request.status} />
            </div>
            <Button
              variant={isCached ? "default" : "outline"}
              size="sm"
              onClick={onToggleCache}
              className={isCached ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              <Archive className="h-4 w-4 mr-2" />
              {isCached ? "Cached" : "Add to Cache"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">URL</p>
            <p className="font-mono text-sm break-all">{request.url}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAsCurl}
              className="flex-1"
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Clipboard className="h-4 w-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy as cURL"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReplay}
              disabled={isReplaying}
              className="flex-1"
            >
              {isReplaying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isReplaying ? "Replaying..." : "Replay"}
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className="font-medium">{request.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Duration</p>
              <p className="font-medium">{request.duration}</p>
            </div>
          </div>

          <Separator />

          <div>
            <CardTitle className="text-sm mb-3">Request Headers</CardTitle>
            <div className="bg-muted rounded-md p-3 font-mono text-xs space-y-1">
              {Object.entries(request.requestHeaders).map(([key, value]) => (
                <p key={key}>{key}: {value}</p>
              ))}
            </div>
          </div>

          {request.requestBody && (
            <div>
              <CardTitle className="text-sm mb-3">Request Body</CardTitle>
              <div className="bg-muted rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all">
                {request.requestBody}
              </div>
            </div>
          )}

          <div>
            <CardTitle className="text-sm mb-3">Response Headers</CardTitle>
            <div className="bg-muted rounded-md p-3 font-mono text-xs space-y-1">
              {Object.entries(request.responseHeaders).map(([key, value]) => (
                <p key={key}>{key}: {value}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RequestDetail;
