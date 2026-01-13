import type { LogEntry, LogLevel } from "src/types/requests";

export const logLevelColors: Record<LogLevel, string> = {
  info: "bg-sky-100 text-sky-700",
  warn: "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
  debug: "bg-gray-100 text-gray-700",
};

export const logLevelFilterColors: Record<LogLevel | "all", string> = {
  all: "",
  info: "data-[active=true]:bg-sky-100 data-[active=true]:text-sky-700 data-[active=true]:border-sky-300",
  warn: "data-[active=true]:bg-amber-100 data-[active=true]:text-amber-700 data-[active=true]:border-amber-300",
  error: "data-[active=true]:bg-rose-100 data-[active=true]:text-rose-700 data-[active=true]:border-rose-300",
  debug: "data-[active=true]:bg-gray-100 data-[active=true]:text-gray-700 data-[active=true]:border-gray-300",
};

export const sampleLogs: LogEntry[] = [
  { id: 1, timestamp: "2024-01-13 10:23:45", level: "info", message: "Proxy server started on port 8080", source: "proxy" },
  { id: 2, timestamp: "2024-01-13 10:23:46", level: "info", message: "Connected to upstream server", source: "proxy" },
  { id: 3, timestamp: "2024-01-13 10:24:12", level: "debug", message: "Intercepted request to api.example.com", source: "interceptor" },
  { id: 4, timestamp: "2024-01-13 10:24:13", level: "info", message: "Request forwarded successfully", source: "proxy" },
  { id: 5, timestamp: "2024-01-13 10:25:01", level: "warn", message: "Slow response detected (2100ms)", source: "monitor" },
  { id: 6, timestamp: "2024-01-13 10:25:34", level: "error", message: "Connection refused to upstream server", source: "proxy" },
  { id: 7, timestamp: "2024-01-13 10:25:35", level: "info", message: "Retrying connection...", source: "proxy" },
  { id: 8, timestamp: "2024-01-13 10:25:36", level: "info", message: "Connection restored", source: "proxy" },
  { id: 9, timestamp: "2024-01-13 10:26:00", level: "debug", message: "Cache hit for /api/users", source: "cache" },
  { id: 10, timestamp: "2024-01-13 10:26:15", level: "warn", message: "Certificate validation warning", source: "tls" },
  { id: 11, timestamp: "2024-01-13 10:27:00", level: "info", message: "Lua script executed: modify_headers.lua", source: "scripts" },
  { id: 12, timestamp: "2024-01-13 10:27:30", level: "error", message: "Script error: undefined variable 'response'", source: "scripts" },
  { id: 13, timestamp: "2024-01-13 10:28:00", level: "debug", message: "Memory usage: 128MB", source: "monitor" },
  { id: 14, timestamp: "2024-01-13 10:28:45", level: "info", message: "New client connected from 192.168.1.100", source: "proxy" },
  { id: 15, timestamp: "2024-01-13 10:29:00", level: "info", message: "Request cached: /api/products", source: "cache" },
];
