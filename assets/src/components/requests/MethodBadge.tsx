import { Badge } from "src/components/ui/badge";
import { methodColors } from "src/constants/requests";
import type { HttpVerb } from "src/types/requests";

interface MethodBadgeProps {
  method: HttpVerb;
}

function MethodBadge({ method }: MethodBadgeProps) {
  return (
    <Badge variant="outline" className={methodColors[method]}>
      {method}
    </Badge>
  );
}

export default MethodBadge;
