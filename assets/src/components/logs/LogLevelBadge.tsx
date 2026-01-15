import { Badge } from "src/components/ui/badge";
import { logLevelColors } from "src/constants/logs";
import type { LogLevel } from "src/types/requests";

interface LogLevelBadgeProps {
  level: LogLevel;
}

function LogLevelBadge({ level }: LogLevelBadgeProps) {
  return (
    <Badge variant="outline" className={logLevelColors[level]}>
      {level.toUpperCase()}
    </Badge>
  );
}

export default LogLevelBadge;
