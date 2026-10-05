import { useState } from "react";
import { Download, FileText, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function MediaViewer({ url, type, name }: { url: string; type: string | null; name?: string }) {
  const [open, setOpen] = useState(false);
  const label = name || "Archivo adjunto";
  if (!url) return null;
  if (type === "image") return <><button type="button" className="group relative mt-2 block" onClick={() => setOpen(true)} aria-label="Ampliar imagen"><img src={url} alt={label} className="max-h-80 max-w-full rounded-lg object-contain" /><Maximize2 className="absolute bottom-2 right-2 h-4 w-4 rounded bg-black/60 p-0.5 text-white opacity-80" /></button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-6xl"><DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader><img src={url} alt={label} className="max-h-[80vh] w-full object-contain" /><a href={url} download={label} className="self-end"><Button variant="outline"><Download className="mr-2 h-4 w-4" />Descargar</Button></a></DialogContent></Dialog></>;
  if (type === "video") return <video src={url} controls playsInline preload="metadata" className="mt-2 max-h-80 max-w-full rounded-lg" aria-label={label} />;
  if (type === "audio" || type === "voice") return <audio src={url} controls preload="metadata" className="mt-2 max-w-full" aria-label={label} />;
  return <a href={url} download={label} className="mt-2 flex max-w-full items-center gap-2 rounded-lg border border-current/20 px-3 py-2"><FileText className="h-4 w-4 shrink-0" /><span className="max-w-48 truncate">{label}</span><Download className="h-4 w-4 shrink-0" /></a>;
}
