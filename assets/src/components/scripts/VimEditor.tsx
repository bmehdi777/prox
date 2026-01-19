import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "src/components/ui/badge";
import { Input } from "src/components/ui/input";
import { tokenizeLua, getTokenClass, type Token } from "src/lib/lua-highlighter";

type VimMode = "normal" | "insert" | "visual" | "visual-line" | "visual-block" | "replace";

interface VimEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
}

interface HistoryEntry {
  content: string;
  cursorPos: number;
}

interface CommandState {
  isActive: boolean;
  input: string;
}

interface SearchState {
  isActive: boolean;
  pattern: string;
  matches: { start: number; end: number }[];
  currentMatchIndex: number;
}

interface CharSearchState {
  char: string;
  direction: "f" | "F" | "t" | "T";
}

interface TextObject {
  start: number;
  end: number;
}

function VimEditor({ value, onChange, onSave, placeholder }: VimEditorProps) {
  const [mode, setMode] = useState<VimMode>("normal");
  const [cursorPos, setCursorPos] = useState(0);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [commandBuffer, setCommandBuffer] = useState("");
  const [countBuffer, setCountBuffer] = useState("");
  const [lastCharSearch, setLastCharSearch] = useState<CharSearchState | null>(null);
  const [pendingOperator, setPendingOperator] = useState<"d" | "c" | "y" | null>(null);
  const [awaitingCharInput, setAwaitingCharInput] = useState<"r" | "f" | "F" | "t" | "T" | null>(null);
  const [search, setSearch] = useState<SearchState>({
    isActive: false,
    pattern: "",
    matches: [],
    currentMatchIndex: -1,
  });
  const [command, setCommand] = useState<CommandState>({
    isActive: false,
    input: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [register, setRegister] = useState("");

  // Undo/redo history
  const [history, setHistory] = useState<HistoryEntry[]>([{ content: value, cursorPos: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  const lines = value.split("\n");

  const getCursorLine = useCallback(() => {
    let pos = 0;
    for (let i = 0; i < lines.length; i++) {
      if (pos + lines[i].length >= cursorPos) {
        return i;
      }
      pos += lines[i].length + 1;
    }
    return lines.length - 1;
  }, [cursorPos, lines]);

  const getCursorColumn = useCallback(() => {
    let pos = 0;
    for (let i = 0; i < lines.length; i++) {
      if (pos + lines[i].length >= cursorPos) {
        return cursorPos - pos;
      }
      pos += lines[i].length + 1;
    }
    return 0;
  }, [cursorPos, lines]);

  const getPositionFromLineCol = useCallback(
    (line: number, col: number) => {
      let pos = 0;
      const targetLine = Math.max(0, Math.min(line, lines.length - 1));
      for (let i = 0; i < targetLine; i++) {
        pos += lines[i].length + 1;
      }
      const lineLength = lines[targetLine]?.length ?? 0;
      return pos + Math.min(col, Math.max(0, lineLength - 1));
    },
    [lines]
  );

  const getLineStart = useCallback(
    (line: number) => {
      let pos = 0;
      for (let i = 0; i < line && i < lines.length; i++) {
        pos += lines[i].length + 1;
      }
      return pos;
    },
    [lines]
  );

  const getLineEnd = useCallback(
    (line: number) => {
      return getLineStart(line) + (lines[line]?.length ?? 0);
    },
    [getLineStart, lines]
  );

  const getFirstNonWhitespace = useCallback(
    (line: number) => {
      const lineContent = lines[line] ?? "";
      const match = lineContent.match(/^\s*/);
      const offset = match ? match[0].length : 0;
      return getLineStart(line) + Math.min(offset, Math.max(0, lineContent.length - 1));
    },
    [lines, getLineStart]
  );

  const getLastNonWhitespace = useCallback(
    (line: number) => {
      const lineContent = lines[line] ?? "";
      const trimmed = lineContent.trimEnd();
      return getLineStart(line) + Math.max(0, trimmed.length - 1);
    },
    [lines, getLineStart]
  );

  // ============ Word boundary detection ============
  const isWordChar = (char: string) => /\w/.test(char);
  const isWhitespace = (char: string) => /\s/.test(char);
  const isSymbol = (char: string) => !isWordChar(char) && !isWhitespace(char);

  // ============ Text Objects ============
  const getInnerWord = useCallback((): TextObject => {
    let start = cursorPos;
    let end = cursorPos;

    // Determine what type of "word" we're in
    const currentChar = value[cursorPos] || "";
    const isWord = isWordChar(currentChar);
    const isWs = isWhitespace(currentChar);

    if (isWs) {
      // In whitespace, select whitespace
      while (start > 0 && isWhitespace(value[start - 1])) start--;
      while (end < value.length - 1 && isWhitespace(value[end + 1])) end++;
    } else if (isWord) {
      // In word, select word
      while (start > 0 && isWordChar(value[start - 1])) start--;
      while (end < value.length - 1 && isWordChar(value[end + 1])) end++;
    } else {
      // In symbols, select symbols
      while (start > 0 && isSymbol(value[start - 1])) start--;
      while (end < value.length - 1 && isSymbol(value[end + 1])) end++;
    }

    return { start, end: end + 1 };
  }, [cursorPos, value]);

  const getAWord = useCallback((): TextObject => {
    const inner = getInnerWord();
    let { start, end } = inner;

    // Include trailing whitespace, or leading if no trailing
    if (end < value.length && isWhitespace(value[end])) {
      while (end < value.length && isWhitespace(value[end])) end++;
    } else if (start > 0 && isWhitespace(value[start - 1])) {
      while (start > 0 && isWhitespace(value[start - 1])) start--;
    }

    return { start, end };
  }, [getInnerWord, value]);

  const getInnerWORD = useCallback((): TextObject => {
    let start = cursorPos;
    let end = cursorPos;

    if (isWhitespace(value[cursorPos])) {
      while (start > 0 && isWhitespace(value[start - 1])) start--;
      while (end < value.length - 1 && isWhitespace(value[end + 1])) end++;
    } else {
      while (start > 0 && !isWhitespace(value[start - 1])) start--;
      while (end < value.length - 1 && !isWhitespace(value[end + 1])) end++;
    }

    return { start, end: end + 1 };
  }, [cursorPos, value]);

  const getAWORD = useCallback((): TextObject => {
    const inner = getInnerWORD();
    let { start, end } = inner;

    if (end < value.length && isWhitespace(value[end])) {
      while (end < value.length && isWhitespace(value[end])) end++;
    } else if (start > 0 && isWhitespace(value[start - 1])) {
      while (start > 0 && isWhitespace(value[start - 1])) start--;
    }

    return { start, end };
  }, [getInnerWORD, value]);

  const getInnerQuote = useCallback((quote: string): TextObject | null => {
    const currentLine = getCursorLine();
    const lineStart = getLineStart(currentLine);
    const lineEnd = getLineEnd(currentLine);
    const lineContent = value.slice(lineStart, lineEnd);

    // Find quotes on current line
    let firstQuote = -1;
    let secondQuote = -1;
    let inQuote = false;

    for (let i = 0; i < lineContent.length; i++) {
      if (lineContent[i] === quote && (i === 0 || lineContent[i - 1] !== "\\")) {
        if (!inQuote) {
          firstQuote = i;
          inQuote = true;
        } else {
          secondQuote = i;
          // Check if cursor is within these quotes
          const cursorCol = cursorPos - lineStart;
          if (cursorCol >= firstQuote && cursorCol <= secondQuote) {
            return { start: lineStart + firstQuote + 1, end: lineStart + secondQuote };
          }
          firstQuote = -1;
          secondQuote = -1;
          inQuote = false;
        }
      }
    }

    return null;
  }, [cursorPos, getCursorLine, getLineEnd, getLineStart, value]);

  const getAQuote = useCallback((quote: string): TextObject | null => {
    const inner = getInnerQuote(quote);
    if (!inner) return null;
    return { start: inner.start - 1, end: inner.end + 1 };
  }, [getInnerQuote]);

  const getInnerBracket = useCallback((open: string, close: string): TextObject | null => {
    let depth = 0;
    let start = -1;

    // Search backward for opening bracket
    for (let i = cursorPos; i >= 0; i--) {
      if (value[i] === close) depth++;
      if (value[i] === open) {
        if (depth === 0) {
          start = i + 1;
          break;
        }
        depth--;
      }
    }

    if (start === -1) return null;

    // Search forward for closing bracket
    depth = 0;
    for (let i = cursorPos; i < value.length; i++) {
      if (value[i] === open) depth++;
      if (value[i] === close) {
        if (depth === 0) {
          return { start, end: i };
        }
        depth--;
      }
    }

    return null;
  }, [cursorPos, value]);

  const getABracket = useCallback((open: string, close: string): TextObject | null => {
    const inner = getInnerBracket(open, close);
    if (!inner) return null;
    return { start: inner.start - 1, end: inner.end + 1 };
  }, [getInnerBracket]);

  const getInnerParagraph = useCallback((): TextObject => {
    let startLine = getCursorLine();
    let endLine = startLine;

    // Find paragraph boundaries (empty lines)
    while (startLine > 0 && lines[startLine - 1].trim() !== "") startLine--;
    while (endLine < lines.length - 1 && lines[endLine + 1].trim() !== "") endLine++;

    return { start: getLineStart(startLine), end: getLineEnd(endLine) };
  }, [getCursorLine, getLineEnd, getLineStart, lines]);

  const getInnerLine = useCallback((): TextObject => {
    const currentLine = getCursorLine();
    const start = getFirstNonWhitespace(currentLine);
    const end = getLineEnd(currentLine);
    return { start, end };
  }, [getCursorLine, getFirstNonWhitespace, getLineEnd]);

  const getTextObject = useCallback((modifier: "i" | "a", object: string): TextObject | null => {
    switch (object) {
      case "w":
        return modifier === "i" ? getInnerWord() : getAWord();
      case "W":
        return modifier === "i" ? getInnerWORD() : getAWORD();
      case '"':
        return modifier === "i" ? getInnerQuote('"') : getAQuote('"');
      case "'":
        return modifier === "i" ? getInnerQuote("'") : getAQuote("'");
      case "`":
        return modifier === "i" ? getInnerQuote("`") : getAQuote("`");
      case "(":
      case ")":
      case "b":
        return modifier === "i" ? getInnerBracket("(", ")") : getABracket("(", ")");
      case "[":
      case "]":
        return modifier === "i" ? getInnerBracket("[", "]") : getABracket("[", "]");
      case "{":
      case "}":
      case "B":
        return modifier === "i" ? getInnerBracket("{", "}") : getABracket("{", "}");
      case "<":
      case ">":
        return modifier === "i" ? getInnerBracket("<", ">") : getABracket("<", ">");
      case "p":
        return getInnerParagraph();
      case "l":
        return getInnerLine();
      default:
        return null;
    }
  }, [getInnerWord, getAWord, getInnerWORD, getAWORD, getInnerQuote, getAQuote, getInnerBracket, getABracket, getInnerParagraph, getInnerLine]);

  // ============ Movement functions ============
  const moveToNextWord = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      while (pos < value.length && isWordChar(value[pos])) pos++;
      while (pos < value.length && isSymbol(value[pos])) pos++;
      while (pos < value.length && isWhitespace(value[pos])) pos++;
    }
    return Math.min(pos, Math.max(0, value.length - 1));
  }, [cursorPos, value]);

  const moveToNextWORD = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      while (pos < value.length && !isWhitespace(value[pos])) pos++;
      while (pos < value.length && isWhitespace(value[pos])) pos++;
    }
    return Math.min(pos, Math.max(0, value.length - 1));
  }, [cursorPos, value]);

  const moveToEndOfWord = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      pos++;
      while (pos < value.length && isWhitespace(value[pos])) pos++;
      while (pos < value.length - 1 && isWordChar(value[pos]) && isWordChar(value[pos + 1])) pos++;
      if (pos < value.length && isSymbol(value[pos])) {
        while (pos < value.length - 1 && isSymbol(value[pos + 1])) pos++;
      }
    }
    return Math.min(pos, Math.max(0, value.length - 1));
  }, [cursorPos, value]);

  const moveToEndOfWORD = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      pos++;
      while (pos < value.length && isWhitespace(value[pos])) pos++;
      while (pos < value.length - 1 && !isWhitespace(value[pos + 1])) pos++;
    }
    return Math.min(pos, Math.max(0, value.length - 1));
  }, [cursorPos, value]);

  const moveToPrevWord = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      pos--;
      while (pos > 0 && isWhitespace(value[pos])) pos--;
      if (pos > 0 && isSymbol(value[pos])) {
        while (pos > 0 && isSymbol(value[pos - 1])) pos--;
      } else {
        while (pos > 0 && isWordChar(value[pos - 1])) pos--;
      }
    }
    return Math.max(pos, 0);
  }, [cursorPos, value]);

  const moveToPrevWORD = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      pos--;
      while (pos > 0 && isWhitespace(value[pos])) pos--;
      while (pos > 0 && !isWhitespace(value[pos - 1])) pos--;
    }
    return Math.max(pos, 0);
  }, [cursorPos, value]);

  const moveToEndOfPrevWord = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      pos--;
      while (pos > 0 && isWhitespace(value[pos])) pos--;
    }
    return Math.max(pos, 0);
  }, [cursorPos, value]);

  const moveToNextParagraph = useCallback((count: number = 1) => {
    let currentLine = getCursorLine();
    for (let i = 0; i < count; i++) {
      while (currentLine < lines.length - 1 && lines[currentLine].trim() !== "") currentLine++;
      while (currentLine < lines.length - 1 && lines[currentLine].trim() === "") currentLine++;
    }
    return Math.min(getLineStart(currentLine), Math.max(0, value.length - 1));
  }, [getCursorLine, getLineStart, lines, value.length]);

  const moveToPrevParagraph = useCallback((count: number = 1) => {
    let currentLine = getCursorLine();
    for (let i = 0; i < count; i++) {
      while (currentLine > 0 && lines[currentLine].trim() !== "") currentLine--;
      while (currentLine > 0 && lines[currentLine].trim() === "") currentLine--;
    }
    return getLineStart(currentLine);
  }, [getCursorLine, getLineStart, lines]);

  const moveToNextSentence = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      while (pos < value.length && !/[.!?]/.test(value[pos])) pos++;
      pos++;
      while (pos < value.length && /\s/.test(value[pos])) pos++;
    }
    return Math.min(pos, Math.max(0, value.length - 1));
  }, [cursorPos, value]);

  const moveToPrevSentence = useCallback((count: number = 1) => {
    let pos = cursorPos;
    for (let i = 0; i < count; i++) {
      pos--;
      while (pos > 0 && /\s/.test(value[pos])) pos--;
      while (pos > 0 && !/[.!?]/.test(value[pos])) pos--;
      if (pos > 0) {
        pos--;
        while (pos > 0 && /\s/.test(value[pos])) pos--;
        while (pos > 0 && !/[.!?]/.test(value[pos - 1])) pos--;
      }
    }
    return Math.max(pos, 0);
  }, [cursorPos, value]);

  const findCharForward = useCallback((char: string, till: boolean = false) => {
    const currentLine = getCursorLine();
    const lineEnd = getLineEnd(currentLine);
    let pos = cursorPos + 1;
    while (pos < lineEnd) {
      if (value[pos] === char) return till ? pos - 1 : pos;
      pos++;
    }
    return cursorPos;
  }, [cursorPos, getCursorLine, getLineEnd, value]);

  const findCharBackward = useCallback((char: string, till: boolean = false) => {
    const currentLine = getCursorLine();
    const lineStart = getLineStart(currentLine);
    let pos = cursorPos - 1;
    while (pos >= lineStart) {
      if (value[pos] === char) return till ? pos + 1 : pos;
      pos--;
    }
    return cursorPos;
  }, [cursorPos, getCursorLine, getLineStart, value]);

  const findMatchingBracket = useCallback(() => {
    const brackets: Record<string, string> = {
      "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<",
    };
    const openBrackets = "([{<";
    const char = value[cursorPos];
    if (!brackets[char]) return cursorPos;

    const isOpen = openBrackets.includes(char);
    const target = brackets[char];
    let depth = 1;
    let pos = cursorPos;

    if (isOpen) {
      pos++;
      while (pos < value.length && depth > 0) {
        if (value[pos] === char) depth++;
        if (value[pos] === target) depth--;
        if (depth > 0) pos++;
      }
    } else {
      pos--;
      while (pos >= 0 && depth > 0) {
        if (value[pos] === char) depth++;
        if (value[pos] === target) depth--;
        if (depth > 0) pos--;
      }
    }
    return depth === 0 ? pos : cursorPos;
  }, [cursorPos, value]);

  // Get word under cursor for * and # commands
  const getWordUnderCursor = useCallback((): string => {
    if (!value[cursorPos] || !isWordChar(value[cursorPos])) return "";

    let start = cursorPos;
    let end = cursorPos;

    while (start > 0 && isWordChar(value[start - 1])) start--;
    while (end < value.length - 1 && isWordChar(value[end + 1])) end++;

    return value.slice(start, end + 1);
  }, [cursorPos, value]);

  // Search for word under cursor
  const searchWordUnderCursor = useCallback((forward: boolean) => {
    const word = getWordUnderCursor();
    if (!word) {
      setStatusMessage("No word under cursor");
      return;
    }

    const pattern = `\\b${word}\\b`;
    try {
      const regex = new RegExp(pattern, "g");
      const matches: { start: number; end: number }[] = [];
      let match;
      while ((match = regex.exec(value)) !== null) {
        matches.push({ start: match.index, end: match.index + match[0].length });
      }

      if (matches.length === 0) {
        setStatusMessage("Pattern not found");
        return;
      }

      setSearch((prev) => ({ ...prev, pattern, matches }));

      // Find next/previous match from cursor position
      if (forward) {
        const nextMatch = matches.find((m) => m.start > cursorPos) || matches[0];
        const idx = matches.indexOf(nextMatch);
        setSearch((prev) => ({ ...prev, currentMatchIndex: idx }));
        setCursorPos(nextMatch.start);
      } else {
        const prevMatch = [...matches].reverse().find((m) => m.start < cursorPos) || matches[matches.length - 1];
        const idx = matches.indexOf(prevMatch);
        setSearch((prev) => ({ ...prev, currentMatchIndex: idx }));
        setCursorPos(prevMatch.start);
      }
      setStatusMessage(`/${pattern} (${matches.length} matches)`);
    } catch {
      setStatusMessage("Invalid pattern");
    }
  }, [cursorPos, getWordUnderCursor, value]);

  // ============ Get motion target position ============
  const getMotionTarget = useCallback((motion: string, count: number = 1): number => {
    const currentLine = getCursorLine();
    const currentCol = getCursorColumn();

    switch (motion) {
      case "h": return Math.max(cursorPos - count, getLineStart(currentLine));
      case "l": return Math.min(cursorPos + count, getLineEnd(currentLine) - 1);
      case "j": return getPositionFromLineCol(currentLine + count, currentCol);
      case "k": return getPositionFromLineCol(currentLine - count, currentCol);
      case "0": return getLineStart(currentLine);
      case "^": return getFirstNonWhitespace(currentLine);
      case "$": return Math.max(getLineEnd(currentLine) - 1, getLineStart(currentLine));
      case "g_": return getLastNonWhitespace(currentLine);
      case "w": return moveToNextWord(count);
      case "W": return moveToNextWORD(count);
      case "e": return moveToEndOfWord(count);
      case "E": return moveToEndOfWORD(count);
      case "b": return moveToPrevWord(count);
      case "B": return moveToPrevWORD(count);
      case "ge": return moveToEndOfPrevWord(count);
      case "}": return moveToNextParagraph(count);
      case "{": return moveToPrevParagraph(count);
      case ")": return moveToNextSentence(count);
      case "(": return moveToPrevSentence(count);
      case "gg": return count > 1 ? getLineStart(count - 1) : 0;
      case "G": return count > 1 ? getLineStart(count - 1) : getLineStart(lines.length - 1);
      case "%": return findMatchingBracket();
      case "H": return getLineStart(Math.max(0, currentLine - 10));
      case "M": return getLineStart(Math.floor(lines.length / 2));
      case "L": return getLineStart(Math.min(lines.length - 1, currentLine + 10));
      default: return cursorPos;
    }
  }, [cursorPos, getCursorColumn, getCursorLine, getFirstNonWhitespace, getLastNonWhitespace, getLineEnd, getLineStart, getPositionFromLineCol, lines.length, moveToEndOfPrevWord, moveToEndOfWORD, moveToEndOfWord, moveToNextParagraph, moveToNextSentence, moveToNextWORD, moveToNextWord, moveToPrevParagraph, moveToPrevSentence, moveToPrevWORD, moveToPrevWord, findMatchingBracket]);

  // ============ Core operations ============
  const moveCursor = useCallback((direction: string, count: number = 1) => {
    let newPos = getMotionTarget(direction, count);

    if (direction === "ctrl-d") newPos = getPositionFromLineCol(Math.min(getCursorLine() + 15, lines.length - 1), getCursorColumn());
    else if (direction === "ctrl-u") newPos = getPositionFromLineCol(Math.max(getCursorLine() - 15, 0), getCursorColumn());
    else if (direction === "ctrl-f") newPos = getPositionFromLineCol(Math.min(getCursorLine() + 30, lines.length - 1), getCursorColumn());
    else if (direction === "ctrl-b") newPos = getPositionFromLineCol(Math.max(getCursorLine() - 30, 0), getCursorColumn());
    else if (direction === "+") newPos = getFirstNonWhitespace(Math.min(getCursorLine() + count, lines.length - 1));
    else if (direction === "-") newPos = getFirstNonWhitespace(Math.max(getCursorLine() - count, 0));
    else if (direction === "_") newPos = getFirstNonWhitespace(Math.min(getCursorLine() + count - 1, lines.length - 1));
    else if (direction === "|") newPos = getLineStart(getCursorLine()) + Math.min(count - 1, (lines[getCursorLine()]?.length ?? 1) - 1);

    newPos = Math.max(0, Math.min(newPos, Math.max(0, value.length - 1)));
    setCursorPos(newPos);

    if (mode === "visual" || mode === "visual-line" || mode === "visual-block") {
      setSelectionEnd(newPos);
    }
    return newPos;
  }, [getMotionTarget, getPositionFromLineCol, getCursorLine, getCursorColumn, lines, getFirstNonWhitespace, getLineStart, mode, value.length]);

  // ============ History (Undo/Redo) ============
  const pushHistory = useCallback((content: string, cursor: number) => {
    setHistory((prev) => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Don't push if content is the same as current
      if (newHistory[newHistory.length - 1]?.content === content) {
        return newHistory;
      }
      return [...newHistory, { content, cursorPos: cursor }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      setHistoryIndex(newIndex);
      onChange(entry.content);
      setCursorPos(Math.min(entry.cursorPos, Math.max(0, entry.content.length - 1)));
      setStatusMessage(`Undo: ${historyIndex} changes left`);
    } else {
      setStatusMessage("Already at oldest change");
    }
  }, [history, historyIndex, onChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      setHistoryIndex(newIndex);
      onChange(entry.content);
      setCursorPos(Math.min(entry.cursorPos, Math.max(0, entry.content.length - 1)));
      setStatusMessage(`Redo: ${history.length - newIndex - 1} changes ahead`);
    } else {
      setStatusMessage("Already at newest change");
    }
  }, [history, historyIndex, onChange]);

  // ============ Core operations ============
  const deleteRange = useCallback((start: number, end: number, enterInsert: boolean = false) => {
    const deletedText = value.slice(start, end);
    setRegister(deletedText);
    const newValue = value.slice(0, start) + value.slice(end);
    const newCursorPos = Math.min(start, Math.max(0, newValue.length - 1));
    onChange(newValue);
    setCursorPos(newCursorPos);
    if (!enterInsert) {
      // Push history for delete operations that don't enter insert mode
      pushHistory(newValue, newCursorPos);
    }
    if (enterInsert) {
      setMode("insert");
    }
    return deletedText;
  }, [value, onChange, pushHistory]);

  const deleteLine = useCallback((count: number = 1, enterInsert: boolean = false) => {
    const currentLine = getCursorLine();
    const endLine = Math.min(currentLine + count - 1, lines.length - 1);
    const lineStart = getLineStart(currentLine);
    const lineEnd = getLineEnd(endLine);

    let newValue: string;
    let newCursorPos: number;

    if (lines.length <= count) {
      setRegister(value);
      newValue = "";
      newCursorPos = 0;
    } else if (endLine === lines.length - 1) {
      setRegister(value.slice(Math.max(0, lineStart - 1)));
      newValue = value.slice(0, Math.max(0, lineStart - 1));
      newCursorPos = getLineStart(Math.max(0, currentLine - 1));
    } else {
      setRegister(value.slice(lineStart, lineEnd + 1));
      newValue = value.slice(0, lineStart) + value.slice(lineEnd + 1);
      newCursorPos = lineStart;
    }

    onChange(newValue);
    setCursorPos(Math.min(newCursorPos, Math.max(0, newValue.length - 1)));

    if (enterInsert) {
      // For cc/S, we want to keep the line but empty it
      const lineStartPos = getLineStart(currentLine);
      const lineEndPos = getLineEnd(currentLine);
      const before = value.slice(0, lineStartPos);
      const after = value.slice(lineEndPos);
      onChange(before + after);
      setCursorPos(lineStartPos);
      setMode("insert");
    }
  }, [getCursorLine, getLineEnd, getLineStart, lines.length, onChange, value]);

  const yankRange = useCallback((start: number, end: number) => {
    const text = value.slice(start, end);
    setRegister(text);
    navigator.clipboard.writeText(text);
    setStatusMessage(`Yanked ${text.length} characters`);
  }, [value]);

  const yankLine = useCallback((count: number = 1) => {
    const currentLine = getCursorLine();
    const lineStart = getLineStart(currentLine);
    const lineEnd = getLineEnd(Math.min(currentLine + count - 1, lines.length - 1));
    const text = value.slice(lineStart, lineEnd);
    setRegister(text);
    navigator.clipboard.writeText(text);
    setStatusMessage(`Yanked ${count} line(s)`);
  }, [getCursorLine, getLineEnd, getLineStart, lines.length, value]);

  const performSearch = useCallback((pattern: string) => {
    if (!pattern) {
      setSearch((prev) => ({ ...prev, matches: [], currentMatchIndex: -1 }));
      return;
    }
    try {
      const regex = new RegExp(pattern, "gi");
      const matches: { start: number; end: number }[] = [];
      let match;
      while ((match = regex.exec(value)) !== null) {
        matches.push({ start: match.index, end: match.index + match[0].length });
        if (match.index === regex.lastIndex) regex.lastIndex++;
      }
      setSearch((prev) => ({ ...prev, matches, currentMatchIndex: matches.length > 0 ? 0 : -1 }));
      if (matches.length > 0) {
        setCursorPos(matches[0].start);
        setStatusMessage(`Found ${matches.length} matches`);
      } else {
        setStatusMessage("Pattern not found");
      }
    } catch {
      setStatusMessage("Invalid regex pattern");
    }
  }, [value]);

  const nextMatch = useCallback(() => {
    if (search.matches.length === 0) return;
    const nextIndex = (search.currentMatchIndex + 1) % search.matches.length;
    setSearch((prev) => ({ ...prev, currentMatchIndex: nextIndex }));
    setCursorPos(search.matches[nextIndex].start);
  }, [search.matches, search.currentMatchIndex]);

  const prevMatch = useCallback(() => {
    if (search.matches.length === 0) return;
    const prevIndex = search.currentMatchIndex <= 0 ? search.matches.length - 1 : search.currentMatchIndex - 1;
    setSearch((prev) => ({ ...prev, currentMatchIndex: prevIndex }));
    setCursorPos(search.matches[prevIndex].start);
  }, [search.matches, search.currentMatchIndex]);

  // ============ Command Mode ============
  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();

    // :w - Save
    if (trimmed === "w") {
      if (onSave) {
        onSave();
        setStatusMessage("File saved");
      } else {
        setStatusMessage("No save handler");
      }
      return;
    }

    // :wq - Save and quit (just save, no quit in browser)
    if (trimmed === "wq" || trimmed === "x") {
      if (onSave) {
        onSave();
        setStatusMessage("File saved");
      }
      return;
    }

    // :q - Quit (no-op in browser)
    if (trimmed === "q" || trimmed === "q!") {
      setStatusMessage("Can't quit browser vim :)");
      return;
    }

    // :123 - Go to line number
    const lineMatch = trimmed.match(/^(\d+)$/);
    if (lineMatch) {
      const lineNum = Math.max(1, Math.min(parseInt(lineMatch[1]), lines.length));
      setCursorPos(getLineStart(lineNum - 1));
      setStatusMessage(`Line ${lineNum}`);
      return;
    }

    // :$ - Go to last line
    if (trimmed === "$") {
      setCursorPos(getLineStart(lines.length - 1));
      setStatusMessage(`Line ${lines.length}`);
      return;
    }

    // :s/pattern/replacement/ or :s/pattern/replacement/g - Substitute on current line
    // :%s/pattern/replacement/ or :%s/pattern/replacement/g - Substitute globally
    const subMatch = trimmed.match(/^(%)?s\/(.+?)\/(.*)\/([gi]*)$/);
    if (subMatch) {
      const [, global, pattern, replacement, flags] = subMatch;
      try {
        const isGlobalFile = global === "%";
        const isGlobalReplace = flags.includes("g");
        const isCaseInsensitive = flags.includes("i");
        const regex = new RegExp(pattern, isCaseInsensitive ? "gi" : "g");

        if (isGlobalFile) {
          // Replace in entire file
          let newValue: string;
          let count = 0;
          if (isGlobalReplace) {
            newValue = value.replace(regex, () => { count++; return replacement; });
          } else {
            // Replace first occurrence on each line
            newValue = value.split("\n").map((line) => {
              const newLine = line.replace(regex, () => { count++; return replacement; });
              regex.lastIndex = 0;
              return newLine;
            }).join("\n");
          }
          if (count > 0) {
            onChange(newValue);
            pushHistory(newValue, cursorPos);
            setStatusMessage(`${count} substitution(s)`);
          } else {
            setStatusMessage("Pattern not found");
          }
        } else {
          // Replace on current line only
          const currentLine = getCursorLine();
          const lineStart = getLineStart(currentLine);
          const lineEnd = getLineEnd(currentLine);
          const lineContent = value.slice(lineStart, lineEnd);
          let count = 0;
          const newLine = isGlobalReplace
            ? lineContent.replace(regex, () => { count++; return replacement; })
            : lineContent.replace(new RegExp(pattern, isCaseInsensitive ? "i" : ""), () => { count++; return replacement; });

          if (count > 0) {
            const newValue = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
            onChange(newValue);
            pushHistory(newValue, cursorPos);
            setStatusMessage(`${count} substitution(s)`);
          } else {
            setStatusMessage("Pattern not found");
          }
        }
      } catch {
        setStatusMessage("Invalid pattern");
      }
      return;
    }

    // :noh - Clear search highlight
    if (trimmed === "noh" || trimmed === "nohlsearch") {
      setSearch((prev) => ({ ...prev, matches: [], currentMatchIndex: -1 }));
      setStatusMessage("Search cleared");
      return;
    }

    setStatusMessage(`Unknown command: ${trimmed}`);
  }, [cursorPos, getCursorLine, getLineEnd, getLineStart, lines.length, onChange, onSave, pushHistory, value]);

  // ============ Mode transitions ============
  const enterInsertMode = useCallback((position: "before" | "after" | "lineStart" | "lineEnd" | "firstNonWhitespace") => {
    setMode("insert");
    const currentLine = getCursorLine();
    switch (position) {
      case "after": setCursorPos((prev) => Math.min(prev + 1, value.length)); break;
      case "lineStart": setCursorPos(getLineStart(currentLine)); break;
      case "lineEnd": setCursorPos(getLineEnd(currentLine)); break;
      case "firstNonWhitespace": setCursorPos(getFirstNonWhitespace(currentLine)); break;
    }
  }, [getCursorLine, getFirstNonWhitespace, getLineEnd, getLineStart, value.length]);

  const enterVisualMode = useCallback((type: "visual" | "visual-line" | "visual-block") => {
    setMode(type);
    setSelectionStart(cursorPos);
    setSelectionEnd(cursorPos);
  }, [cursorPos]);

  const exitToNormalMode = useCallback(() => {
    setMode("normal");
    setSelectionStart(null);
    setSelectionEnd(null);
    setCommandBuffer("");
    setCountBuffer("");
    setPendingOperator(null);
    setAwaitingCharInput(null);
  }, []);

  // ============ Key handlers ============
  const handleNormalModeKey = useCallback((e: React.KeyboardEvent) => {
    const key = e.key;
    const count = parseInt(countBuffer) || 1;

    // Handle character input waiting (r, f, F, t, T)
    if (awaitingCharInput) {
      if (key === "Escape") {
        setAwaitingCharInput(null);
        return;
      }
      if (key.length === 1) {
        if (awaitingCharInput === "r") {
          // Replace single character
          const newValue = value.slice(0, cursorPos) + key + value.slice(cursorPos + 1);
          onChange(newValue);
        } else {
          // Character search (f, F, t, T)
          const till = awaitingCharInput === "t" || awaitingCharInput === "T";
          const forward = awaitingCharInput === "f" || awaitingCharInput === "t";
          const newPos = forward ? findCharForward(key, till) : findCharBackward(key, till);

          if (pendingOperator) {
            const start = Math.min(cursorPos, newPos);
            const end = Math.max(cursorPos, newPos) + 1;
            if (pendingOperator === "d") deleteRange(start, end);
            else if (pendingOperator === "c") deleteRange(start, end, true);
            else if (pendingOperator === "y") yankRange(start, end);
            setPendingOperator(null);
          } else {
            setCursorPos(newPos);
            setLastCharSearch({ char: key, direction: awaitingCharInput as "f" | "F" | "t" | "T" });
          }
        }
        setAwaitingCharInput(null);
        setCommandBuffer("");
        setCountBuffer("");
        return;
      }
    }

    // Handle Ctrl combinations
    if (e.ctrlKey) {
      switch (key) {
        case "d": moveCursor("ctrl-d", count); break;
        case "u": moveCursor("ctrl-u", count); break;
        case "f": moveCursor("ctrl-f", count); break;
        case "b": moveCursor("ctrl-b", count); break;
        case "v": enterVisualMode("visual-block"); break;
        case "r": redo(); break;
      }
      setCountBuffer("");
      setCommandBuffer("");
      setPendingOperator(null);
      return;
    }

    // Number prefix
    if (/^[1-9]$/.test(key) || (countBuffer && /^[0-9]$/.test(key))) {
      setCountBuffer(countBuffer + key);
      return;
    }

    // Handle pending operator with text objects or motions
    if (pendingOperator) {
      // Text object modifiers
      if (commandBuffer === "i" || commandBuffer === "a") {
        const textObj = getTextObject(commandBuffer as "i" | "a", key);
        if (textObj) {
          if (pendingOperator === "d") deleteRange(textObj.start, textObj.end);
          else if (pendingOperator === "c") deleteRange(textObj.start, textObj.end, true);
          else if (pendingOperator === "y") yankRange(textObj.start, textObj.end);
        }
        setPendingOperator(null);
        setCommandBuffer("");
        setCountBuffer("");
        return;
      }

      // Start text object
      if (key === "i" || key === "a") {
        setCommandBuffer(key);
        return;
      }

      // Double operator (dd, cc, yy)
      if ((pendingOperator === "d" && key === "d") ||
          (pendingOperator === "c" && key === "c") ||
          (pendingOperator === "y" && key === "y")) {
        if (pendingOperator === "d") deleteLine(count);
        else if (pendingOperator === "c") deleteLine(count, true);
        else if (pendingOperator === "y") yankLine(count);
        setPendingOperator(null);
        setCommandBuffer("");
        setCountBuffer("");
        return;
      }

      // Character search motions
      if (key === "f" || key === "F" || key === "t" || key === "T") {
        setAwaitingCharInput(key as "f" | "F" | "t" | "T");
        return;
      }

      // Regular motions
      const motionTarget = getMotionTarget(key, count);
      if (motionTarget !== cursorPos || ["$", "0", "^", "G", "gg", "w", "W", "e", "E", "b", "B"].includes(key)) {
        const start = Math.min(cursorPos, motionTarget);
        const end = Math.max(cursorPos, motionTarget) + (["w", "W", "e", "E", "$"].includes(key) ? 1 : 0);

        if (pendingOperator === "d") deleteRange(start, end);
        else if (pendingOperator === "c") deleteRange(start, end, true);
        else if (pendingOperator === "y") yankRange(start, end);

        setPendingOperator(null);
        setCommandBuffer("");
        setCountBuffer("");
        return;
      }
    }

    // Handle g prefix commands
    if (commandBuffer === "g") {
      switch (key) {
        case "g": moveCursor("gg", count); break;
        case "e": moveCursor("ge", count); break;
        case "_": moveCursor("g_", count); break;
      }
      setCommandBuffer("");
      setCountBuffer("");
      return;
    }

    // Main key handling
    switch (key) {
      // Operators
      case "d":
      case "c":
      case "y":
        setPendingOperator(key as "d" | "c" | "y");
        return;

      // Movement
      case "h": case "j": case "k": case "l":
      case "w": case "W": case "e": case "E": case "b": case "B":
      case "0": case "^": case "$":
      case "{": case "}": case "(": case ")":
      case "%": case "H": case "M": case "L":
      case "+": case "-":
        moveCursor(key, count);
        break;

      case "|":
        moveCursor("|", count);
        break;

      case "G":
        moveCursor("G", parseInt(countBuffer) || 0);
        break;

      case "g":
        setCommandBuffer("g");
        return;

      // Character search
      case "f": case "F": case "t": case "T":
        setAwaitingCharInput(key as "f" | "F" | "t" | "T");
        return;

      case ";":
        if (lastCharSearch) {
          const { char, direction } = lastCharSearch;
          const till = direction === "t" || direction === "T";
          const forward = direction === "f" || direction === "t";
          setCursorPos(forward ? findCharForward(char, till) : findCharBackward(char, till));
        }
        break;

      case ",":
        if (lastCharSearch) {
          const { char, direction } = lastCharSearch;
          const till = direction === "t" || direction === "T";
          const forward = direction === "f" || direction === "t";
          setCursorPos(forward ? findCharBackward(char, till) : findCharForward(char, till));
        }
        break;

      // Replace
      case "r":
        setAwaitingCharInput("r");
        return;

      case "R":
        setMode("replace");
        break;

      // Substitute
      case "s": {
        // Delete char and enter insert mode
        if (value.length > 0 && cursorPos < value.length) {
          const newValue = value.slice(0, cursorPos) + value.slice(cursorPos + count);
          onChange(newValue);
        }
        setMode("insert");
        break;
      }

      case "S": {
        // Substitute line (like cc)
        const currentLine = getCursorLine();
        const lineStart = getFirstNonWhitespace(currentLine);
        const lineEnd = getLineEnd(currentLine);
        deleteRange(lineStart, lineEnd, true);
        break;
      }

      // Change shortcuts
      case "C": {
        // Change to end of line
        const lineEnd = getLineEnd(getCursorLine());
        deleteRange(cursorPos, lineEnd, true);
        break;
      }

      case "D": {
        // Delete to end of line
        const lineEnd = getLineEnd(getCursorLine());
        deleteRange(cursorPos, lineEnd);
        break;
      }

      case "Y": {
        // Yank line (like yy)
        yankLine(count);
        break;
      }

      // Insert mode
      case "i": enterInsertMode("before"); break;
      case "a": enterInsertMode("after"); break;
      case "I": enterInsertMode("firstNonWhitespace"); break;
      case "A": enterInsertMode("lineEnd"); break;

      case "o": {
        const lineEnd = getLineEnd(getCursorLine());
        onChange(value.slice(0, lineEnd) + "\n" + value.slice(lineEnd));
        setCursorPos(lineEnd + 1);
        setMode("insert");
        break;
      }

      case "O": {
        const lineStart = getLineStart(getCursorLine());
        onChange(value.slice(0, lineStart) + "\n" + value.slice(lineStart));
        setCursorPos(lineStart);
        setMode("insert");
        break;
      }

      // Visual mode
      case "v": enterVisualMode("visual"); break;
      case "V": enterVisualMode("visual-line"); break;

      // Delete
      case "x": {
        for (let i = 0; i < count && cursorPos < value.length; i++) {
          onChange(value.slice(0, cursorPos) + value.slice(cursorPos + 1));
        }
        setCursorPos(Math.min(cursorPos, Math.max(0, value.length - count - 1)));
        break;
      }

      case "X": {
        for (let i = 0; i < count && cursorPos > 0; i++) {
          onChange(value.slice(0, cursorPos - 1) + value.slice(cursorPos));
          setCursorPos(cursorPos - 1);
        }
        break;
      }

      // Join lines
      case "J": {
        const currentLine = getCursorLine();
        if (currentLine < lines.length - 1) {
          const lineEnd = getLineEnd(currentLine);
          const nextLineStart = getLineStart(currentLine + 1);
          const nextLineFirstNonWs = lines[currentLine + 1].search(/\S/);
          const trimStart = nextLineFirstNonWs > 0 ? nextLineFirstNonWs : 0;
          const newValue = value.slice(0, lineEnd) + " " + value.slice(nextLineStart + trimStart);
          onChange(newValue);
          setCursorPos(lineEnd);
        }
        break;
      }

      // Paste
      case "p":
        navigator.clipboard.readText().then((text) => {
          const pasteText = text || register;
          if (pasteText) {
            const newValue = value.slice(0, cursorPos + 1) + pasteText + value.slice(cursorPos + 1);
            onChange(newValue);
            setCursorPos(cursorPos + pasteText.length);
          }
        });
        break;

      case "P":
        navigator.clipboard.readText().then((text) => {
          const pasteText = text || register;
          if (pasteText) {
            const newValue = value.slice(0, cursorPos) + pasteText + value.slice(cursorPos);
            onChange(newValue);
            setCursorPos(cursorPos + pasteText.length - 1);
          }
        });
        break;

      // Undo
      case "u":
        undo();
        break;

      // Command mode
      case ":":
        setCommand({ isActive: true, input: "" });
        setTimeout(() => commandInputRef.current?.focus(), 0);
        break;

      // Search
      case "/":
        setSearch((prev) => ({ ...prev, isActive: true, pattern: "" }));
        setTimeout(() => searchInputRef.current?.focus(), 0);
        break;

      case "?":
        setSearch((prev) => ({ ...prev, isActive: true, pattern: "" }));
        setTimeout(() => searchInputRef.current?.focus(), 0);
        setStatusMessage("Search backward (use N to go backward)");
        break;

      case "n": nextMatch(); break;
      case "N": prevMatch(); break;

      // Search word under cursor
      case "*": searchWordUnderCursor(true); break;
      case "#": searchWordUnderCursor(false); break;

      // First non-whitespace + count-1 lines down
      case "_":
        moveCursor("_", count);
        break;

      // Tilde: toggle case of character under cursor
      case "~": {
        if (cursorPos < value.length) {
          const char = value[cursorPos];
          const newChar = char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
          const newValue = value.slice(0, cursorPos) + newChar + value.slice(cursorPos + 1);
          onChange(newValue);
          setCursorPos(Math.min(cursorPos + 1, newValue.length - 1));
        }
        break;
      }

      case "Escape":
        exitToNormalMode();
        break;
    }

    setCountBuffer("");
    setCommandBuffer("");
  }, [awaitingCharInput, commandBuffer, countBuffer, cursorPos, deleteRange, deleteLine, enterInsertMode, enterVisualMode, exitToNormalMode, findCharBackward, findCharForward, getCursorLine, getFirstNonWhitespace, getLineEnd, getLineStart, getMotionTarget, getTextObject, lastCharSearch, lines.length, moveCursor, nextMatch, onChange, pendingOperator, prevMatch, redo, register, searchWordUnderCursor, undo, value, yankLine, yankRange]);

  const handleVisualModeKey = useCallback((e: React.KeyboardEvent) => {
    const key = e.key;
    const count = parseInt(countBuffer) || 1;

    if (e.ctrlKey) {
      switch (key) {
        case "d": moveCursor("ctrl-d", count); break;
        case "u": moveCursor("ctrl-u", count); break;
      }
      setCountBuffer("");
      return;
    }

    if (/^[1-9]$/.test(key) || (countBuffer && /^[0-9]$/.test(key))) {
      setCountBuffer(countBuffer + key);
      return;
    }

    // Handle text object modifiers (iw, aw, i", etc.)
    if (commandBuffer === "i" || commandBuffer === "a") {
      const textObj = getTextObject(commandBuffer as "i" | "a", key);
      if (textObj) {
        setSelectionStart(textObj.start);
        setSelectionEnd(textObj.end - 1);
        setCursorPos(textObj.end - 1);
      }
      setCommandBuffer("");
      setCountBuffer("");
      return;
    }

    switch (key) {
      // Start text object selection
      case "i":
      case "a":
        setCommandBuffer(key);
        return;

      case "h": case "j": case "k": case "l":
      case "w": case "W": case "E": case "b": case "B":
      case "0": case "^": case "$": case "{": case "}": case "(": case ")": case "%":
      case "_":
        moveCursor(key, count);
        break;

      // Handle g-prefix commands and 'e' motion
      case "g":
        if (commandBuffer === "g") {
          moveCursor("gg", count);
          setCommandBuffer("");
        } else {
          setCommandBuffer("g");
          return;
        }
        break;

      case "e":
        if (commandBuffer === "g") {
          moveCursor("ge", count);
          setCommandBuffer("");
        } else {
          moveCursor("e", count);
        }
        break;

      case "G":
        moveCursor("G", parseInt(countBuffer) || 0);
        break;

      case "d":
      case "x":
        if (selectionStart !== null && selectionEnd !== null) {
          const start = Math.min(selectionStart, selectionEnd);
          const end = Math.max(selectionStart, selectionEnd) + 1;
          deleteRange(start, end);
          exitToNormalMode();
        }
        break;

      case "c":
      case "s":
        if (selectionStart !== null && selectionEnd !== null) {
          const start = Math.min(selectionStart, selectionEnd);
          const end = Math.max(selectionStart, selectionEnd) + 1;
          deleteRange(start, end, true);
          setSelectionStart(null);
          setSelectionEnd(null);
        }
        break;

      case "y":
        if (selectionStart !== null && selectionEnd !== null) {
          const start = Math.min(selectionStart, selectionEnd);
          const end = Math.max(selectionStart, selectionEnd) + 1;
          yankRange(start, end);
          exitToNormalMode();
        }
        break;

      case "o":
        // Swap selection anchor and cursor
        if (selectionStart !== null && selectionEnd !== null) {
          const temp = selectionStart;
          setSelectionStart(selectionEnd);
          setSelectionEnd(temp);
          setCursorPos(temp);
        }
        break;

      case "Escape":
        exitToNormalMode();
        break;
    }

    setCountBuffer("");
    if (key !== "g" && key !== "i" && key !== "a") {
      setCommandBuffer("");
    }
  }, [commandBuffer, countBuffer, deleteRange, exitToNormalMode, getTextObject, moveCursor, selectionEnd, selectionStart, yankRange]);

  const handleInsertModeKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      // Push current content to history when leaving insert mode
      pushHistory(value, cursorPos);
      setMode("normal");
      setCursorPos((prev) => Math.max(prev - 1, 0));
    }
  }, [cursorPos, pushHistory, value]);

  const handleReplaceModeKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setMode("normal");
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const newValue = value.slice(0, cursorPos) + e.key + value.slice(cursorPos + 1);
      onChange(newValue);
      setCursorPos(cursorPos + 1);
    }
  }, [cursorPos, onChange, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (search.isActive || command.isActive) return;

    if (mode === "normal") {
      e.preventDefault();
      handleNormalModeKey(e);
    } else if (mode === "visual" || mode === "visual-line" || mode === "visual-block") {
      e.preventDefault();
      handleVisualModeKey(e);
    } else if (mode === "insert") {
      handleInsertModeKey(e);
    } else if (mode === "replace") {
      handleReplaceModeKey(e);
    }
  }, [command.isActive, mode, search.isActive, handleNormalModeKey, handleVisualModeKey, handleInsertModeKey, handleReplaceModeKey]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (mode === "insert") {
      const newValue = e.target.value;
      onChange(newValue);
      setCursorPos(e.target.selectionStart);
      // Debounce history push (will be pushed when leaving insert mode)
    }
  }, [mode, onChange]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    performSearch(search.pattern);
    setSearch((prev) => ({ ...prev, isActive: false }));
    textareaRef.current?.focus();
  }, [performSearch, search.pattern]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearch((prev) => ({ ...prev, isActive: false, pattern: "" }));
      textareaRef.current?.focus();
    }
  }, []);

  const handleCommandSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(command.input);
    setCommand({ isActive: false, input: "" });
    textareaRef.current?.focus();
  }, [command.input, executeCommand]);

  const handleCommandKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setCommand({ isActive: false, input: "" });
      textareaRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current && !search.isActive && !command.isActive) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  }, [cursorPos, search.isActive, command.isActive]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const getModeColor = () => {
    switch (mode) {
      case "insert": return "bg-green-100 text-green-700 border-green-300";
      case "replace": return "bg-red-100 text-red-700 border-red-300";
      case "visual": case "visual-line": case "visual-block": return "bg-purple-100 text-purple-700 border-purple-300";
      default: return "bg-sky-100 text-sky-700 border-sky-300";
    }
  };


  const getModeName = () => {
    switch (mode) {
      case "insert": return "INSERT";
      case "replace": return "REPLACE";
      case "visual": return "VISUAL";
      case "visual-line": return "V-LINE";
      case "visual-block": return "V-BLOCK";
      default: return "NORMAL";
    }
  };

  // Memoize tokens to avoid re-tokenizing on every render
  const tokens = useMemo(() => tokenizeLua(value), [value]);

  // Get cursor class based on mode
  const getCursorClass = useCallback(() => {
    switch (mode) {
      case "insert":
        return "border-l-2 border-green-500 -ml-px";
      case "replace":
        return "bg-red-400 text-white border-b-2 border-red-600";
      case "visual":
      case "visual-line":
      case "visual-block":
        return "bg-sky-500 text-white";
      default: // normal
        return "bg-sky-500 text-white";
    }
  }, [mode]);

  // Render highlighted text with cursor/selection
  const renderHighlightedText = useCallback((
    textTokens: Token[],
    cursorPosition: number | null,
    selectionRange: { start: number; end: number } | null,
    cursorClassName: string
  ): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    for (const token of textTokens) {
      const tokenClass = getTokenClass(token.type);

      // Check if cursor is within this token
      const cursorInToken = cursorPosition !== null &&
        cursorPosition >= token.start && cursorPosition < token.end;

      // Check if selection overlaps with this token
      const selOverlaps = selectionRange !== null &&
        selectionRange.start < token.end && selectionRange.end > token.start;

      if (cursorInToken && mode !== "insert") {
        const relCursorPos = cursorPosition - token.start;
        const before = token.value.slice(0, relCursorPos);
        const cursorChar = token.value[relCursorPos] || " ";
        const after = token.value.slice(relCursorPos + 1);

        if (before) {
          parts.push(<span key={key++} className={tokenClass}>{before}</span>);
        }
        parts.push(<span key={key++} className={cursorClassName}>{cursorChar}</span>);
        if (after) {
          parts.push(<span key={key++} className={tokenClass}>{after}</span>);
        }
      } else if (cursorInToken && mode === "insert") {
        const relCursorPos = cursorPosition - token.start;
        const before = token.value.slice(0, relCursorPos);
        const after = token.value.slice(relCursorPos);

        if (before) {
          parts.push(<span key={key++} className={tokenClass}>{before}</span>);
        }
        parts.push(<span key={key++} className={cursorClassName}></span>);
        if (after) {
          parts.push(<span key={key++} className={tokenClass}>{after}</span>);
        }
      } else if (selOverlaps && selectionRange) {
        // Handle selection within token
        const selStart = Math.max(selectionRange.start, token.start);
        const selEnd = Math.min(selectionRange.end, token.end);

        const beforeSel = token.value.slice(0, selStart - token.start);
        const inSel = token.value.slice(selStart - token.start, selEnd - token.start);
        const afterSel = token.value.slice(selEnd - token.start);

        if (beforeSel) {
          parts.push(<span key={key++} className={tokenClass}>{beforeSel}</span>);
        }
        if (inSel) {
          // Check if cursor is in this selection part
          if (cursorPosition !== null && cursorPosition >= selStart && cursorPosition < selEnd) {
            const relCursor = cursorPosition - selStart;
            parts.push(
              <span key={key++} className="bg-purple-300 dark:bg-purple-700">
                {inSel.slice(0, relCursor)}
              </span>
            );
            parts.push(
              <span key={key++} className={cursorClassName}>
                {inSel[relCursor]}
              </span>
            );
            parts.push(
              <span key={key++} className="bg-purple-300 dark:bg-purple-700">
                {inSel.slice(relCursor + 1)}
              </span>
            );
          } else {
            parts.push(
              <span key={key++} className={`bg-purple-300 dark:bg-purple-700 ${tokenClass}`}>
                {inSel}
              </span>
            );
          }
        }
        if (afterSel) {
          parts.push(<span key={key++} className={tokenClass}>{afterSel}</span>);
        }
      } else {
        parts.push(<span key={key++} className={tokenClass}>{token.value}</span>);
      }
    }

    return parts;
  }, [mode]);

  const renderContent = () => {
    const isVisual = mode === "visual" || mode === "visual-line" || mode === "visual-block";
    const selStart = selectionStart !== null && selectionEnd !== null ? Math.min(selectionStart, selectionEnd) : null;
    const selEnd = selectionStart !== null && selectionEnd !== null ? Math.max(selectionStart, selectionEnd) + 1 : null;

    // Show placeholder when empty
    if (!value && placeholder) {
      return (
        <div className="absolute inset-0 pointer-events-none p-4 font-mono text-sm whitespace-pre-wrap break-all overflow-auto">
          <span className={mode === "insert" ? "border-l-2 border-green-500" : "bg-sky-500"}> </span>
          <span className="text-muted-foreground">{placeholder}</span>
        </div>
      );
    }

    const cursorClassName = getCursorClass();
    const selectionRange = isVisual && selStart !== null && selEnd !== null
      ? { start: selStart, end: selEnd }
      : null;

    const highlighted = renderHighlightedText(
      tokens,
      cursorPos,
      selectionRange,
      cursorClassName
    );

    return (
      <div className="absolute inset-0 pointer-events-none p-4 font-mono text-sm whitespace-pre-wrap break-all overflow-auto">
        {highlighted}
      </div>
    );
  };

  const getStatusDisplay = () => {
    const parts = [];
    if (countBuffer) parts.push(countBuffer);
    if (pendingOperator) parts.push(pendingOperator);
    if (commandBuffer) parts.push(commandBuffer);
    if (awaitingCharInput) parts.push(awaitingCharInput);
    return parts.join("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {renderContent()}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 font-mono text-sm bg-transparent resize-none focus:outline-none text-transparent caret-transparent selection:bg-transparent"
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>

      {search.isActive && (
        <form onSubmit={handleSearchSubmit} className="shrink-0 border-t p-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/</span>
          <Input
            ref={searchInputRef}
            value={search.pattern}
            onChange={(e) => setSearch((prev) => ({ ...prev, pattern: e.target.value }))}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search pattern (regex)"
            className="flex-1 h-8"
            autoFocus
          />
        </form>
      )}

      {command.isActive && (
        <form onSubmit={handleCommandSubmit} className="shrink-0 border-t p-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">:</span>
          <Input
            ref={commandInputRef}
            value={command.input}
            onChange={(e) => setCommand((prev) => ({ ...prev, input: e.target.value }))}
            onKeyDown={handleCommandKeyDown}
            placeholder="Enter command (w, q, s/find/replace/, %s/find/replace/g, noh)"
            className="flex-1 h-8"
            autoFocus
          />
        </form>
      )}

      <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={getModeColor()}>
            {getModeName()}
          </Badge>
          {getStatusDisplay() && (
            <span className="text-sm font-mono text-muted-foreground">{getStatusDisplay()}</span>
          )}
          {statusMessage && (
            <span className="text-sm text-muted-foreground">{statusMessage}</span>
          )}
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {getCursorLine() + 1}:{getCursorColumn() + 1}
        </div>
      </div>
    </div>
  );
}

export default VimEditor;
