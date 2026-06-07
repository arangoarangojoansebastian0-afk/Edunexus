import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, File } from "lucide-react";

function getFileType(url: string): "image" | "pdf" | "office" | "other" {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"].includes(ext || "")) return "office";
  return "other";
}

function getFileName(url: string): string {
  return decodeURIComponent(url.split("/").pop()?.split("?")[0] || "archivo");
}

function FileIcon({ url }: { url: string }) {
  const type = getFileType(url);
  if (type === "image") return <Image className="h-4 w-4" />;
  if (type === "pdf") return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

export function FileViewer({ urls, label = "Archivos" }: { urls: string[]; label?: string }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!urls || urls.length === 0) return null;

  const fileType = selected ? getFileType(selected) : null;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setSelected(url)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
          >
            <FileIcon url={url} />
            <span className="max-w-[140px] truncate">{getFileName(url)}</span>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-row items-center justify-between shrink-0">
  <DialogTitle className="truncate text-sm font-medium pr-4">
    {selected ? getFileName(selected) : ""}
  </DialogTitle>
  <a href={selected || "#"} download target="_blank" rel="noopener noreferrer" className="shrink-0">
    <Button variant="outline" size="sm">
      <Download className="h-4 w-4 mr-1.5" />
      Descargar
    </Button>
  </a>
</DialogHeader>

          <div className="flex-1 overflow-hidden rounded-md border bg-muted/20">
            {fileType === "image" && (
              <img
                src={selected!}
                alt="archivo"
                className="w-full h-full object-contain"
              />
            )}
            {fileType === "pdf" && (
              <iframe
                src={selected!}
                className="w-full h-full"
                title="PDF viewer"
              />
            )}
            {fileType === "office" && (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(selected!)}&embedded=true`}
                className="w-full h-full"
                title="Document viewer"
              />
            )}
            {fileType === "other" && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <File className="h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Vista previa no disponible</p>
                <a href={selected!} download target="_blank" rel="noopener noreferrer">
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar archivo
                  </Button>
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}