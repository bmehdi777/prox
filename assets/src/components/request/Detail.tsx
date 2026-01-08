import RequestDetail from "src/components/request/RequestDetail";
import ResponseDetail from "src/components/request/ResponseDetail";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "src/components/ui/tabs";
import { requestColor } from "src/constants/requests";
import type { HttpVerb } from "src/types/requests";

interface DetailProps {
  method: HttpVerb;
  url: string;
}

function Detail({ method, url }: DetailProps) {
  return (
    <Card className="h-fit max-h-screen">
      <Tabs defaultValue="request" className="w-100">
        <CardHeader>
          <CardTitle className="w-full">
            <span className={`pr-4 text-${requestColor[method]}`}>
              {method}
            </span>
            <span>{url}</span>
          </CardTitle>
          <CardDescription>Details of request/response</CardDescription>

          <CardAction>
            <TabsList>
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-2">
          <TabsContent value="request">
            <RequestDetail />
          </TabsContent>
          <TabsContent value="response">
            <ResponseDetail />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

export default Detail;
