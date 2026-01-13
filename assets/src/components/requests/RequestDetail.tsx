import { Archive, X } from "lucide-react";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { Separator } from "src/components/ui/separator";
import type { Request } from "src/types/requests";
import MethodBadge from "./MethodBadge";
import StatusBadge from "./StatusBadge";

interface RequestDetailProps {
  request: Request;
  onClose: () => void;
  isCached: boolean;
  onToggleCache: () => void;
}

function RequestDetail({ request, onClose, isCached, onToggleCache }: RequestDetailProps) {
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
              <p>Accept: application/json</p>
              <p>Content-Type: application/json</p>
              <p>User-Agent: Mozilla/5.0</p>
            </div>
          </div>

          <div>
            <CardTitle className="text-sm mb-3">Response Headers</CardTitle>
            <div className="bg-muted rounded-md p-3 font-mono text-xs space-y-1">
              <p>Content-Type: application/json</p>
              <p>Cache-Control: no-cache</p>
              <p>X-Request-Id: abc123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RequestDetail;
