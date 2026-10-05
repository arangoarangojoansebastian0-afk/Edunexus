import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MediaFileList({ files, onRemove }: { files: File[]; onRemove?: (index: number) => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setUrls(objectUrls);
    return () => objectUrls.forEach(URL.revokeObjectURL);
  }, [files]);
  if (!files.length) return null;
  return <div className="flex flex-wrap gap-2">{files.map((file, index) => <div key={`${file.name}-${file.lastModified}-${index}`} className="flex max-w-full items-center gap-2 rounded-md border bg-muted/40 p-2 text-xs" data-testid={`media-preview-${index}`}>
    {file.type.startsWith("image/") ? <img src={urls[index]} alt={`Vista previa: ${file.name}`} className="h-12 w-14 rounded object-cover" /> : file.type.startsWith("video/") ? <video src={urls[index]} controls className="h-12 w-20 rounded object-cover" /> : file.type.startsWith("audio/") ? <audio src={urls[index]} controls className="max-w-48" /> : <FileText className="h-6 w-6 shrink-0" />}
    <span className="max-w-40 truncate" title={file.name}>{file.name}<span className="block text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span></span>
    {onRemove && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label={`Quitar ${file.name}`} onClick={() => onRemove(index)}><X className="h-3 w-3" /></Button>}
  </div>)}</div>;
}
