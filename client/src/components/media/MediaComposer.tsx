import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Film, ImagePlus, Mic, Paperclip, Send, Square, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/webm,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt";
const ALLOWED = /\.(jpe?g|png|webp|gif|mp4|webm|mov|mp3|wav|m4a|ogg|oga|pdf|docx?|xlsx?|pptx?|zip|txt)$/i;

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
  onSend: () => void;
  disabled?: boolean;
  uploading?: boolean;
  progress?: number;
  onCancelUpload?: () => void;
  showSendButton?: boolean;
  canSend?: boolean;
};

export function MediaComposer({ value, onChange, onSend, disabled, uploading, progress, onCancelUpload, showSendButton = true, canSend = true }: Props) {
  const { toast } = useToast();
  const picker = useRef<HTMLInputElement>(null);
  const cameraVideo = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recordingType, setRecordingType] = useState<"video" | "audio" | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!value) { setPreview(""); return; }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  useEffect(() => {
    if (!recording) return;
    if ((recordingType === "video" && elapsed >= 60) || (recordingType === "audio" && elapsed >= 600)) {
      recorderRef.current?.stop();
      return;
    }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording, recordingType, elapsed]);

  useEffect(() => {
    if (cameraVideo.current && streamRef.current) cameraVideo.current.srcObject = streamRef.current;
  }, [cameraOpen, cameraError]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };
  const choose = (file?: File) => {
    if (!file) return;
    if (!ALLOWED.test(file.name)) { toast({ title: "Formato no permitido", description: "Selecciona una imagen, video, audio o documento admitido.", variant: "destructive" }); return; }
    if (!file.size || file.size > MAX_MEDIA_BYTES) { toast({ title: "Tamaño no permitido", description: "El archivo debe pesar menos de 50 MB.", variant: "destructive" }); return; }
    onChange(file);
  };
  const startCapture = async (kind: "photo" | "video" | "audio") => {
    try {
      setCameraError("");
      setElapsed(0);
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("MEDIA_DEVICES_UNAVAILABLE");
      if (kind !== "photo" && typeof MediaRecorder === "undefined") throw new Error("MEDIA_RECORDER_UNAVAILABLE");
      if (kind === "audio") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        chunks.current = [];
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
          if (blob.size <= MAX_MEDIA_BYTES && blob.size) choose(new File([blob], `audio-${Date.now()}.${blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm"}`, { type: blob.type }));
          else toast({ title: "Audio demasiado grande", description: "El límite de grabación es 50 MB.", variant: "destructive" });
          stopStream(); setRecording(false); setRecordingType(null);
        };
        recorderRef.current = recorder; setRecordingType("audio"); setRecording(true); recorder.start(500);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: kind === "video" });
      streamRef.current = stream; setRecordingType(kind === "photo" ? null : "video"); setCameraOpen(true);
      if (kind === "photo") setRecordingType(null);
    } catch (error: any) {
      stopStream(); setCameraOpen(false); setRecording(false);
      const needed = kind === "audio" ? "micrófono" : "cámara";
      setCameraError(`Necesitamos acceso a tu ${needed} para ${kind === "audio" ? "grabar el audio" : "usar la cámara"}.`);
      const description = error?.name === "NotAllowedError"
        ? `Permite el acceso a tu ${needed} desde los ajustes del navegador.`
        : error?.message === "MEDIA_RECORDER_UNAVAILABLE"
          ? "Este navegador no permite grabar multimedia. Prueba con Chrome o Edge actualizado."
          : error?.message === "MEDIA_DEVICES_UNAVAILABLE"
            ? "La cámara y el micrófono requieren HTTPS o abrir EduNexus en localhost."
            : `No se pudo acceder a tu ${needed}. Comprueba el permiso, la conexión segura y que el dispositivo esté disponible.`;
      toast({ title: "No se pudo iniciar", description, variant: "destructive" });
    }
  };
  const capturePhoto = () => {
    const video = cameraVideo.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) choose(new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" })); stopStream(); setCameraOpen(false); }, "image/jpeg", 0.92);
  };
  const startVideoRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks.current = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: recorder.mimeType || "video/webm" });
      if (blob.size && blob.size <= MAX_MEDIA_BYTES) choose(new File([blob], `video-${Date.now()}.${blob.type.includes("mp4") ? "mp4" : "webm"}`, { type: blob.type }));
      else toast({ title: "Video demasiado grande", description: "El límite de grabación es 50 MB.", variant: "destructive" });
      stopStream(); setRecording(false); setRecordingType(null); setCameraOpen(false);
    };
    recorderRef.current = recorder; setElapsed(0); setRecordingType("video"); setRecording(true); recorder.start(500);
  };
  const stopRecording = () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); };
  const cancelRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => { chunks.current = []; stopStream(); setRecording(false); setRecordingType(null); setCameraOpen(false); };
      recorder.stop();
    } else { stopStream(); setRecording(false); setRecordingType(null); setCameraOpen(false); }
  };

  return <div className="space-y-2">
    {value && <div className="flex flex-wrap items-center gap-3 rounded-lg border p-2 text-sm" aria-label="Vista previa del archivo">
      {value.type.startsWith("image/") ? <img src={preview} className="h-16 w-20 rounded object-cover" alt="Vista previa" /> : value.type.startsWith("video/") ? <video src={preview} className="h-16 w-24 rounded object-cover" controls /> : value.type.startsWith("audio/") ? <audio src={preview} controls className="max-w-56" /> : <FileText className="h-8 w-8" />}
      <div className="min-w-0 flex-1"><p className="truncate font-medium">{value.name}</p><p className="text-xs text-muted-foreground">{(value.size / 1024 / 1024).toFixed(1)} MB</p></div>
      {uploading ? <><progress className="w-24" value={progress || 0} max={100} aria-label="Progreso de subida" /> <Button variant="ghost" size="sm" onClick={onCancelUpload}>Cancelar subida</Button></> : <Button type="button" variant="ghost" size="icon" aria-label="Quitar archivo" onClick={() => onChange(null)}><Trash2 className="h-4 w-4" /></Button>}
    </div>}
    {cameraError && <p className="text-xs text-destructive" role="status">{cameraError}</p>}
    <div className="flex items-end gap-2">
      <input ref={picker} type="file" className="hidden" accept={ACCEPT} onChange={(event) => { choose(event.target.files?.[0]); event.target.value = ""; }} />
      <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" disabled={disabled || uploading} title="Adjuntar multimedia"><Paperclip className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => picker.current?.click()}><FileText className="mr-2 h-4 w-4" />Seleccionar archivo</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void startCapture("photo")}><Camera className="mr-2 h-4 w-4" />Tomar foto</DropdownMenuItem>
        <DropdownMenuItem onClick={() => picker.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />Seleccionar foto o video</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void startCapture("video")}><Film className="mr-2 h-4 w-4" />Grabar video</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void startCapture("audio")}><Mic className="mr-2 h-4 w-4" />Grabar audio</DropdownMenuItem>
      </DropdownMenuContent></DropdownMenu>
      <Button type="button" variant="ghost" size="icon" disabled={disabled || uploading} title="Grabar audio" aria-label="Grabar audio" onClick={() => void startCapture("audio")}><Mic className="h-4 w-4" /></Button>
      {recordingType === "audio" && <div className="flex items-center gap-2 text-sm text-destructive" role="status"><span className="animate-pulse">●</span> Grabando {formatDuration(elapsed)}<Button type="button" variant="ghost" size="sm" onClick={cancelRecording}><X className="mr-1 h-4 w-4" />Cancelar</Button><Button type="button" variant="destructive" size="sm" onClick={stopRecording}><Square className="mr-1 h-4 w-4" />Detener</Button></div>}
      {showSendButton && <Button type="button" size="icon" className="rounded-full shrink-0 h-9 w-9" onClick={onSend} disabled={disabled || uploading || !canSend} title="Enviar mensaje" aria-label="Enviar mensaje"><Send className="h-4 w-4" /></Button>}
    </div>
    <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) cancelRecording(); }}><DialogContent><DialogHeader><DialogTitle>{recording ? `Grabando video ${formatDuration(elapsed)}` : "Cámara"}</DialogTitle></DialogHeader>
      <video ref={cameraVideo} autoPlay muted playsInline className="w-full max-h-[55vh] rounded-lg bg-black" />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={cancelRecording}>Cancelar</Button>
        {recording ? <Button variant="destructive" onClick={stopRecording}><Square className="mr-2 h-4 w-4" />Detener</Button> : recordingType === "video" ? <Button onClick={startVideoRecording}><Film className="mr-2 h-4 w-4" />Grabar</Button> : <Button onClick={capturePhoto}><Camera className="mr-2 h-4 w-4" />Capturar foto</Button>}
      </div>
    </DialogContent></Dialog>
  </div>;
}
