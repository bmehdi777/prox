import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent } from "src/components/ui/card";

interface RequestProps {
  method: string;
  url: string;
  status: number;
  duration: string;
  id: number;
	selected: boolean;
  setActiveRequestId: Dispatch<SetStateAction<number | null>>;
}

function Request({
  method,
  url,
  status,
  duration,
  id,
	selected,
  setActiveRequestId,
}: RequestProps) {
  return (
    <Card
      className={`py-3 hover:bg-neutral-100 hover:cursor-pointer ${selected ? "bg-neutral-50":""}`}
      onClick={() => setActiveRequestId(id)}
    >
      <CardContent>
        <div className="grid grid-cols-4">
          <div className="flex items-center pl-4">{method}</div>
          <div className="flex items-center text-center justify-center">
            {url}
          </div>
          <div className="flex items-center text-center justify-center">
            {status}
          </div>
          <div className="flex items-center text-center justify-center">
            {duration}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Request;
