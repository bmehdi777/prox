export type HttpVerb = "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "HEAD" | "CONNECT" | "OPTIONS" | "TRACE";

export interface Request {
  id: number;
  method: HttpVerb;
  url: string;
  status: number;
  duration: string;
}

export type SortField = "method" | "url" | "status" | "duration" | "cached";
export type SortDirection = "asc" | "desc";
export type StatusFilter = "all" | "2xx" | "3xx" | "4xx" | "5xx";
export type CacheFilter = "all" | "cached" | "uncached";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
}

export type LogLevelFilter = "all" | LogLevel;
export type LogSortField = "timestamp" | "level" | "source" | "message";
