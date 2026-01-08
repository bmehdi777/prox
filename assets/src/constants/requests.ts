import type { HttpVerb } from "src/types/requests";

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
