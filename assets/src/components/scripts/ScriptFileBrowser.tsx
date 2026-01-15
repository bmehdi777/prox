import { FileCode, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "src/components/ui/button";
import { Separator } from "src/components/ui/separator";
import type { ScriptFile } from "src/types/scripts";

interface ScriptFileBrowserProps {
  files: ScriptFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onNewFile: () => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string) => void;
}

function ScriptFileBrowser({
  files,
  selectedFileId,
  onSelectFile,
  onNewFile,
  onDeleteFile,
  onRenameFile,
}: ScriptFileBrowserProps) {
  return (
    <div className="flex flex-col h-full w-64 border-l bg-background">
      <div className="p-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Files</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNewFile}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <div className="flex-1 overflow-auto p-2">
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No scripts yet
          </p>
        ) : (
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer group ${
                  selectedFileId === file.id
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameFile(file.id);
                    }}
                    className="cursor-pointer h-6 w-6"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className="cursor-pointer h-6 w-6"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScriptFileBrowser;
