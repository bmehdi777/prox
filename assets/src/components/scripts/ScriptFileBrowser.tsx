import { Download, FileCode, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "src/components/ui/button";
import { Separator } from "src/components/ui/separator";
import { Switch } from "src/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "src/components/ui/tooltip";
import type { ScriptFile } from "src/types/scripts";

interface ScriptFileBrowserProps {
  files: ScriptFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onNewFile: () => void;
  onRenameFile: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onExportAll: () => void;
  onExportCurrent: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
}

function ScriptFileBrowser({
  files,
  selectedFileId,
  onSelectFile,
  onNewFile,
  onRenameFile,
  onDeleteFile,
  onToggleEnabled,
  onExportAll,
  onExportCurrent,
  onImport,
  importInputRef,
}: ScriptFileBrowserProps) {
  return (
    <div className="flex flex-col h-full w-64 border-l bg-background">
      <div className="p-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Files</h3>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => importInputRef.current?.click()}
                className="cursor-pointer"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import scripts</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onExportAll}
                className="cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export all scripts</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onNewFile}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New script</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <input
        ref={importInputRef}
        type="file"
        accept=".json,.lua"
        onChange={onImport}
        className="hidden"
      />
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
                  selectedFileId === file.id ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={file.enabled}
                          onCheckedChange={() => onToggleEnabled(file.id)}
                          className="scale-75"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {file.enabled ? "Disable script" : "Enable script"}
                    </TooltipContent>
                  </Tooltip>
                  <FileCode className={`h-4 w-4 shrink-0 ${file.enabled ? "text-muted-foreground" : "text-muted-foreground/50"}`} />
                  <span className={`text-sm truncate ${!file.enabled && "text-muted-foreground/50"}`}>{file.name}</span>
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
                  {selectedFileId === file.id && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportCurrent();
                      }}
                      className="cursor-pointer h-6 w-6"
                    >
                      <Download className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </Button>
                  )}
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
