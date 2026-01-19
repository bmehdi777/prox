import type { Request } from "src/types/requests";

export function generateCurlCommand(request: Request): string {
  const parts: string[] = ["curl"];

  // Add method (skip for GET as it's default)
  if (request.method !== "GET") {
    parts.push(`-X ${request.method}`);
  }

  // Add headers
  for (const [key, value] of Object.entries(request.requestHeaders)) {
    // Escape single quotes in header values
    const escapedValue = value.replace(/'/g, "'\\''");
    parts.push(`-H '${key}: ${escapedValue}'`);
  }

  // Add body if present
  if (request.requestBody) {
    // Escape single quotes in body
    const escapedBody = request.requestBody.replace(/'/g, "'\\''");
    parts.push(`-d '${escapedBody}'`);
  }

  // Add URL (quoted to handle special characters)
  parts.push(`'${request.url}'`);

  return parts.join(" \\\n  ");
}

export async function replayRequest(request: Request): Promise<Response> {
  const options: RequestInit = {
    method: request.method,
    headers: request.requestHeaders,
  };

  // Add body for methods that support it
  if (request.requestBody && !["GET", "HEAD"].includes(request.method)) {
    options.body = request.requestBody;
  }

  return fetch(request.url, options);
}
