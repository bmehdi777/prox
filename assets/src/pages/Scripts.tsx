import { useState } from "react";
import { toast } from "sonner";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "src/components/ui/menubar";
import ScriptFileBrowser from "src/components/scripts/ScriptFileBrowser";
import VimEditor from "src/components/scripts/VimEditor";
import type { ScriptFile } from "src/types/scripts";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function Scripts() {
  const [files, setFiles] = useState<ScriptFile[]>([
    {
      id: "1",
      name: "request_modifier.lua",
      content: '-- Modify request headers\nfunction on_request(req)\n  req:set_header("X-Custom", "value")\n  return req\nend',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "response_logger.lua",
      content: '-- Log response data\nfunction on_response(res)\n  print("Status: " .. res:status())\n  return res\nend',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>("1");
  const [editorContent, setEditorContent] = useState<string>(files[0]?.content ?? "");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedFile = files.find((f) => f.id === selectedFileId);

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFiles([...files, newFile]);
    setSelectedFileId(newFile.id);
    setEditorContent(newFile.content);
    setHasUnsavedChanges(false);
    toast.success("New file created");
  };

  const handleSaveFile = () => {
    if (!selectedFileId) return;
    setFiles(
      files.map((f) =>
        f.id === selectedFileId
          ? { ...f, content: editorContent, updatedAt: new Date().toISOString() }
          : f
      )
    );
    setHasUnsavedChanges(false);
    toast.success("File saved");
  };

  const handleDeleteFile = (id: string) => {
    const confirm = window.confirm("Are you sure you want to delete this file?");
    if (!confirm) return;

    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);

    if (selectedFileId === id) {
      const nextFile = newFiles[0];
      setSelectedFileId(nextFile?.id ?? null);
      setEditorContent(nextFile?.content ?? "");
      setHasUnsavedChanges(false);
    }
    toast.success("File deleted");
  };

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    setHasUnsavedChanges(true);
  };

  const handleRenameFile = () => {
    if (!selectedFileId || !selectedFile) return;
    const newName = window.prompt("Enter new file name:", selectedFile.name);
    if (!newName || newName === selectedFile.name) return;

    setFiles(
      files.map((f) =>
        f.id === selectedFileId
          ? { ...f, name: newName, updatedAt: new Date().toISOString() }
          : f
      )
    );
    toast.success("File renamed");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="shrink-0 p-2 border-b">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger className="cursor-pointer">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={handleNewFile} className="cursor-pointer">
                New Script
                <MenubarShortcut>Ctrl+N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                onClick={handleSaveFile}
                disabled={!selectedFileId}
                className="cursor-pointer"
              >
                Save
                <MenubarShortcut>Ctrl+S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={handleRenameFile}
                disabled={!selectedFileId}
                className="cursor-pointer"
              >
                Rename
              </MenubarItem>
              <MenubarItem
                onClick={() => selectedFileId && handleDeleteFile(selectedFileId)}
                disabled={!selectedFileId}
                variant="destructive"
                className="cursor-pointer"
              >
                Delete
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="cursor-pointer">Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem
                onClick={() => document.execCommand("undo")}
                className="cursor-pointer"
              >
                Undo
                <MenubarShortcut>Ctrl+Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                onClick={() => document.execCommand("redo")}
                className="cursor-pointer"
              >
                Redo
                <MenubarShortcut>Ctrl+Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={() => document.execCommand("cut")}
                className="cursor-pointer"
              >
                Cut
                <MenubarShortcut>Ctrl+X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                onClick={() => document.execCommand("copy")}
                className="cursor-pointer"
              >
                Copy
                <MenubarShortcut>Ctrl+C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                onClick={() => document.execCommand("paste")}
                className="cursor-pointer"
              >
                Paste
                <MenubarShortcut>Ctrl+V</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

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
          onDeleteFile={handleDeleteFile}
        />
      </div>
    </div>
  );
}

export default Scripts;
