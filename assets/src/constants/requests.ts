import type { HttpVerb, Request } from "src/types/requests";

export const requestColor: Record<HttpVerb, string> = {
  GET: "emerald-400",
  POST: "sky-700",
  PATCH: "orange-400",
  PUT: "indigo-500",
  DELETE: "rose-500",
  HEAD: "violet-600",
  CONNECT: "fuschia-700",
  OPTIONS: "purple-300",
  TRACE: "rose-950",
};

export const methodColors: Record<HttpVerb, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-sky-100 text-sky-700",
  PUT: "bg-indigo-100 text-indigo-700",
  PATCH: "bg-orange-100 text-orange-700",
  DELETE: "bg-rose-100 text-rose-700",
  HEAD: "bg-violet-100 text-violet-700",
  CONNECT: "bg-fuchsia-100 text-fuchsia-700",
  OPTIONS: "bg-purple-100 text-purple-700",
  TRACE: "bg-pink-100 text-pink-700",
};

export const methodFilterColors: Record<HttpVerb | "all", string> = {
  all: "",
  GET: "data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-700 data-[active=true]:border-emerald-300",
  POST: "data-[active=true]:bg-sky-100 data-[active=true]:text-sky-700 data-[active=true]:border-sky-300",
  PUT: "data-[active=true]:bg-indigo-100 data-[active=true]:text-indigo-700 data-[active=true]:border-indigo-300",
  PATCH: "data-[active=true]:bg-orange-100 data-[active=true]:text-orange-700 data-[active=true]:border-orange-300",
  DELETE: "data-[active=true]:bg-rose-100 data-[active=true]:text-rose-700 data-[active=true]:border-rose-300",
  HEAD: "data-[active=true]:bg-violet-100 data-[active=true]:text-violet-700 data-[active=true]:border-violet-300",
  CONNECT: "data-[active=true]:bg-fuchsia-100 data-[active=true]:text-fuchsia-700 data-[active=true]:border-fuchsia-300",
  OPTIONS: "data-[active=true]:bg-purple-100 data-[active=true]:text-purple-700 data-[active=true]:border-purple-300",
  TRACE: "data-[active=true]:bg-pink-100 data-[active=true]:text-pink-700 data-[active=true]:border-pink-300",
};

const defaultRequestHeaders = {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

const defaultResponseHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
  "X-Request-Id": "abc123",
};

export const sampleRequests: Request[] = [
  { id: 1, method: "GET", url: "https://api.example.com/users", status: 200, duration: "120ms", requestHeaders: defaultRequestHeaders, responseHeaders: defaultResponseHeaders },
  { id: 2, method: "POST", url: "https://api.example.com/auth/login", status: 201, duration: "340ms", requestHeaders: { ...defaultRequestHeaders, "Authorization": "Bearer token123" }, responseHeaders: defaultResponseHeaders, requestBody: '{"username": "admin", "password": "***"}' },
  { id: 3, method: "GET", url: "https://api.example.com/products", status: 200, duration: "89ms", requestHeaders: defaultRequestHeaders, responseHeaders: defaultResponseHeaders },
  { id: 4, method: "PUT", url: "https://api.example.com/users/42", status: 200, duration: "156ms", requestHeaders: defaultRequestHeaders, responseHeaders: defaultResponseHeaders, requestBody: '{"name": "John Doe", "email": "john@example.com"}' },
  { id: 5, method: "DELETE", url: "https://api.example.com/posts/15", status: 204, duration: "78ms", requestHeaders: defaultRequestHeaders, responseHeaders: defaultResponseHeaders },
  { id: 6, method: "GET", url: "https://api.example.com/orders", status: 500, duration: "2100ms", requestHeaders: defaultRequestHeaders, responseHeaders: { ...defaultResponseHeaders, "X-Error": "Internal Server Error" } },
  { id: 7, method: "PATCH", url: "https://api.example.com/settings", status: 200, duration: "95ms", requestHeaders: defaultRequestHeaders, responseHeaders: defaultResponseHeaders, requestBody: '{"theme": "dark"}' },
  { id: 8, method: "GET", url: "https://api.example.com/notifications", status: 404, duration: "45ms", requestHeaders: defaultRequestHeaders, responseHeaders: defaultResponseHeaders },
  { id: 9, method: "POST", url: "https://api.example.com/upload", status: 201, duration: "890ms", requestHeaders: { ...defaultRequestHeaders, "Content-Type": "multipart/form-data" }, responseHeaders: defaultResponseHeaders },
  { id: 10, method: "GET", url: "https://api.example.com/dashboard", status: 200, duration: "210ms", requestHeaders: defaultRequestHeaders, responseHeaders: defaultResponseHeaders },
];
