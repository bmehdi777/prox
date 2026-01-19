import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import ScriptFileBrowser from "src/components/scripts/ScriptFileBrowser";
import VimEditor from "src/components/scripts/VimEditor";
import ScriptConsole from "src/components/scripts/ScriptConsole";
import type { ScriptFile, ScriptLogEntry } from "src/types/scripts";
import {
  getAllScripts,
  saveAllScripts,
  exportScripts,
  exportScriptAsLua,
  importScripts,
  importLuaFile,
} from "src/lib/scripts-db";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function Scripts() {
  const [files, setFiles] = useState<ScriptFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ScriptLogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  const importInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const renamingFile = files.find((f) => f.id === renamingFileId);
  const deletingFile = files.find((f) => f.id === deletingFileId);

  // Load scripts from IndexedDB on mount
  useEffect(() => {
    async function loadScripts() {
      try {
        const savedScripts = await getAllScripts();
        if (savedScripts.length > 0) {
          // Ensure all scripts have the enabled property
          const migratedScripts = savedScripts.map((s) => ({
            ...s,
            enabled: s.enabled ?? true,
          }));
          setFiles(migratedScripts);
          setSelectedFileId(migratedScripts[0].id);
          setEditorContent(migratedScripts[0].content);
        }
        // If no scripts, start with empty state
      } catch (error) {
        console.error("Failed to load scripts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadScripts();
  }, []);

  // Save to IndexedDB when files change
  const saveToDb = useCallback(async (updatedFiles: ScriptFile[]) => {
    try {
      await saveAllScripts(updatedFiles);
    } catch (error) {
      console.error("Failed to save scripts:", error);
    }
  }, []);

  const handleSelectFile = (id: string) => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm("You have unsaved changes. Discard them?");
      if (!confirm) return;
    }
    setSelectedFileId(id);
    const file = files.find((f) => f.id === id);
    setEditorContent(file?.content ?? "");
    setHasUnsavedChanges(false);
  };

  const handleNewFile = () => {
    const newFile: ScriptFile = {
      id: generateId(),
      name: `script_${files.length + 1}.lua`,
      content: "-- New Lua script\n",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    saveToDb(updatedFiles);
    setSelectedFileId(newFile.id);
    setEditorContent(newFile.content);
    setHasUnsavedChanges(false);
    toast.success("New file created");
  };

  const handleSaveFile = () => {
    if (!selectedFileId) return;
    const updatedFiles = files.map((f) =>
      f.id === selectedFileId
        ? { ...f, content: editorContent, updatedAt: new Date().toISOString() }
        : f
    );
    setFiles(updatedFiles);
    saveToDb(updatedFiles);
    setHasUnsavedChanges(false);
    toast.success("File saved");
  };

  const handleDeleteFile = (id: string) => {
    setDeletingFileId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingFileId) return;

    const newFiles = files.filter((f) => f.id !== deletingFileId);
    setFiles(newFiles);
    saveToDb(newFiles);

    if (selectedFileId === deletingFileId) {
      const nextFile = newFiles[0];
      setSelectedFileId(nextFile?.id ?? null);
      setEditorContent(nextFile?.content ?? "");
      setHasUnsavedChanges(false);
    }
    setDeleteDialogOpen(false);
    toast.success("File deleted");
  };

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    setHasUnsavedChanges(true);
  };

  const handleRenameFile = (id?: string) => {
    const fileId = id ?? selectedFileId;
    const file = files.find((f) => f.id === fileId);
    if (!fileId || !file) return;
    setRenamingFileId(fileId);
    setNewFileName(file.name);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = () => {
    if (!renamingFileId || !newFileName.trim()) return;
    if (newFileName === renamingFile?.name) {
      setRenameDialogOpen(false);
      return;
    }

    const updatedFiles = files.map((f) =>
      f.id === renamingFileId
        ? { ...f, name: newFileName.trim(), updatedAt: new Date().toISOString() }
        : f
    );
    setFiles(updatedFiles);
    saveToDb(updatedFiles);
    setRenameDialogOpen(false);
    toast.success("File renamed");
  };

  // Export all scripts as JSON
  const handleExportAll = () => {
    exportScripts(files);
    toast.success("Scripts exported");
  };

  // Export current script as .lua
  const handleExportCurrent = () => {
    if (!selectedFile) return;
    exportScriptAsLua(selectedFile);
    toast.success(`Exported ${selectedFile.name}`);
  };

  // Toggle script enabled/disabled
  const handleToggleEnabled = (id: string) => {
    const updatedFiles = files.map((f) =>
      f.id === id
        ? { ...f, enabled: !f.enabled, updatedAt: new Date().toISOString() }
        : f
    );
    setFiles(updatedFiles);
    saveToDb(updatedFiles);
    const file = updatedFiles.find((f) => f.id === id);
    toast.success(`${file?.name} ${file?.enabled ? "enabled" : "disabled"}`);
  };

  // Clear console logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Toggle console open/closed
  const handleToggleConsole = () => {
    setIsConsoleOpen(!isConsoleOpen);
  };

  // Import scripts
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith(".json")) {
        const importedScripts = await importScripts(file);
        // Merge with existing, avoiding duplicates by ID
        const existingIds = new Set(files.map((f) => f.id));
        const newScripts = importedScripts.map((s) => ({
          ...s,
          id: existingIds.has(s.id) ? generateId() : s.id,
        }));
        const updatedFiles = [...files, ...newScripts];
        setFiles(updatedFiles);
        saveToDb(updatedFiles);
        toast.success(`Imported ${newScripts.length} script(s)`);
      } else if (file.name.endsWith(".lua")) {
        const script = await importLuaFile(file);
        const updatedFiles = [...files, script];
        setFiles(updatedFiles);
        saveToDb(updatedFiles);
        setSelectedFileId(script.id);
        setEditorContent(script.content);
        toast.success(`Imported ${script.name}`);
      } else {
        toast.error("Unsupported file format. Use .json or .lua");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import");
    }

    // Reset input
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden items-center justify-center">
        <p className="text-muted-foreground">Loading scripts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {selectedFile ? (
            <>
              <div className="shrink-0 px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
                <span className="text-sm font-medium">{selectedFile.name}</span>
                {hasUnsavedChanges && (
                  <span className="text-xs text-muted-foreground">(unsaved)</span>
                )}
              </div>
              <div className="flex-1 min-h-0">
                <VimEditor
                  value={editorContent}
                  onChange={handleEditorChange}
                  onSave={handleSaveFile}
                  placeholder="Write your Lua script here..."
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a file or create a new one</p>
            </div>
          )}
        </div>

        <ScriptFileBrowser
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={handleSelectFile}
          onNewFile={handleNewFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onToggleEnabled={handleToggleEnabled}
          onExportAll={handleExportAll}
          onExportCurrent={handleExportCurrent}
          onImport={handleImport}
          importInputRef={importInputRef}
        />
      </div>

      <ScriptConsole
        logs={logs}
        isOpen={isConsoleOpen}
        onToggle={handleToggleConsole}
        onClear={handleClearLogs}
      />

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter a new name for the file.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirmRename();
              }
            }}
            placeholder="File name"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingFile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Scripts;
