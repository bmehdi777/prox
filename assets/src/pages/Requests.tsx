import { useState } from "react";
import Detail from "src/components/request/Detail";
import Request from "src/components/request/Request";
import type { HttpVerb } from "src/types/requests";

const requests = [
  {
    method: "GET" as HttpVerb,
    url: "https://google.fr",
    status: 200,
    duration: "0.4",
  },
];

function Requests() {
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);

  return (
    <div className="flex">
      <div className="flex flex-1 flex-col gap-4 p-4">
        {Array.from({ length: 24 }).map((_, index) => (
          <Request
            selected={activeRequestId === index}
            id={index}
            method={requests[0].method}
            url={requests[0].url}
            status={requests[0].status}
            duration={requests[0].duration}
            setActiveRequestId={setActiveRequestId}
          />
        ))}
      </div>
      {activeRequestId !== null && (
        <div className="flex flex-1 p-4">
          <Detail method={requests[0].method} url={requests[0].url} />
        </div>
      )}
    </div>
  );
}

export default Requests;
