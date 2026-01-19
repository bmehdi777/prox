export interface Token {
  type: "keyword" | "string" | "comment" | "number" | "operator" | "function" | "builtin" | "text";
  value: string;
  start: number;
  end: number;
}

const LUA_KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function",
  "goto", "if", "in", "local", "nil", "not", "or", "repeat", "return",
  "then", "true", "until", "while"
]);

const LUA_BUILTINS = new Set([
  "print", "pairs", "ipairs", "type", "tostring", "tonumber", "error",
  "assert", "pcall", "xpcall", "require", "setmetatable", "getmetatable",
  "rawget", "rawset", "next", "select", "unpack", "table", "string",
  "math", "io", "os", "coroutine", "debug", "_G", "_VERSION"
]);

export function tokenizeLua(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Multiline comment --[[...]]
    if (code.slice(i, i + 4) === "--[[") {
      const start = i;
      i += 4;
      while (i < code.length && code.slice(i, i + 2) !== "]]") {
        i++;
      }
      i += 2;
      tokens.push({ type: "comment", value: code.slice(start, i), start, end: i });
      continue;
    }

    // Single line comment
    if (code.slice(i, i + 2) === "--") {
      const start = i;
      while (i < code.length && code[i] !== "\n") {
        i++;
      }
      tokens.push({ type: "comment", value: code.slice(start, i), start, end: i });
      continue;
    }

    // Multiline string [[...]]
    if (code.slice(i, i + 2) === "[[") {
      const start = i;
      i += 2;
      while (i < code.length && code.slice(i, i + 2) !== "]]") {
        i++;
      }
      i += 2;
      tokens.push({ type: "string", value: code.slice(start, i), start, end: i });
      continue;
    }

    // Double quoted string
    if (code[i] === '"') {
      const start = i;
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === "\\") i++; // Skip escaped char
        i++;
      }
      i++; // Include closing quote
      tokens.push({ type: "string", value: code.slice(start, i), start, end: i });
      continue;
    }

    // Single quoted string
    if (code[i] === "'") {
      const start = i;
      i++;
      while (i < code.length && code[i] !== "'") {
        if (code[i] === "\\") i++; // Skip escaped char
        i++;
      }
      i++; // Include closing quote
      tokens.push({ type: "string", value: code.slice(start, i), start, end: i });
      continue;
    }

    // Number (including hex and scientific notation)
    if (/[0-9]/.test(code[i]) || (code[i] === "." && /[0-9]/.test(code[i + 1]))) {
      const start = i;
      if (code.slice(i, i + 2).toLowerCase() === "0x") {
        i += 2;
        while (i < code.length && /[0-9a-fA-F]/.test(code[i])) i++;
      } else {
        while (i < code.length && /[0-9]/.test(code[i])) i++;
        if (code[i] === ".") {
          i++;
          while (i < code.length && /[0-9]/.test(code[i])) i++;
        }
        if (code[i]?.toLowerCase() === "e") {
          i++;
          if (code[i] === "+" || code[i] === "-") i++;
          while (i < code.length && /[0-9]/.test(code[i])) i++;
        }
      }
      tokens.push({ type: "number", value: code.slice(start, i), start, end: i });
      continue;
    }

    // Identifier (keyword, builtin, or function)
    if (/[a-zA-Z_]/.test(code[i])) {
      const start = i;
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
        i++;
      }
      const word = code.slice(start, i);

      // Check if followed by ( to identify function calls
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      const isFunction = code[j] === "(";

      let type: Token["type"] = "text";
      if (LUA_KEYWORDS.has(word)) {
        type = "keyword";
      } else if (LUA_BUILTINS.has(word)) {
        type = "builtin";
      } else if (isFunction) {
        type = "function";
      }

      tokens.push({ type, value: word, start, end: i });
      continue;
    }

    // Operators
    const operators = ["...", "..", "==", "~=", "<=", ">=", "<<", ">>", "//", "::", "+", "-", "*", "/", "%", "^", "#", "<", ">", "=", "(", ")", "{", "}", "[", "]", ";", ":", ",", ".", "~"];
    let matched = false;
    for (const op of operators) {
      if (code.slice(i, i + op.length) === op) {
        tokens.push({ type: "operator", value: op, start: i, end: i + op.length });
        i += op.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Whitespace and other characters
    const start = i;
    while (i < code.length && !/[a-zA-Z0-9_"'\-\[\]0-9.+\-*/%^#<>=~(){};\:,]/.test(code[i])) {
      i++;
    }
    if (i > start) {
      tokens.push({ type: "text", value: code.slice(start, i), start, end: i });
    } else {
      // Single unrecognized character
      tokens.push({ type: "text", value: code[i], start: i, end: i + 1 });
      i++;
    }
  }

  return tokens;
}

export function getTokenClass(type: Token["type"]): string {
  switch (type) {
    case "keyword":
      return "text-purple-600 dark:text-purple-400";
    case "string":
      return "text-green-600 dark:text-green-400";
    case "comment":
      return "text-gray-500 dark:text-gray-500 italic";
    case "number":
      return "text-orange-600 dark:text-orange-400";
    case "operator":
      return "text-sky-600 dark:text-sky-400";
    case "function":
      return "text-yellow-600 dark:text-yellow-400";
    case "builtin":
      return "text-cyan-600 dark:text-cyan-400";
    default:
      return "";
  }
}
