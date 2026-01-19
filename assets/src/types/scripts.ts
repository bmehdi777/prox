export interface ScriptFile {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptLogEntry {
  id: string;
  timestamp: string;
  scriptName: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}
