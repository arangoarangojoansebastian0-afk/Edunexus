import { useEffect, useRef, useState } from "react";
import { useCall } from "@/context/CallContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, PhoneMissed, Video, VideoOff, Mic, MicOff, PhoneIncoming, AlertCircle, MonitorUp, MonitorOff } from "lucide-react";

function VideoEl({ stream, muted = false, className = "" }: { stream: MediaStream | null; muted?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) { ref.current.srcObject = stream; ref.current.play().catch(() => {}); }
  }, [stream]);
  if (!stream) return null;
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}

// Para llamadas de audio (sin video): reproduce el stream remoto sin
// necesidad de un <video> visible. Un <video oculto puede quedar pausado
// por políticas de ahorro de batería en algunos navegadores; <audio> no.
function RemoteAudio({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current && stream) { ref.current.srcObject = stream; ref.current.play().catch(() => {}); }
  }, [stream]);
  if (!stream) return null;
  return <audio ref={ref} autoPlay />;
}

export function CallErrorToast() {
  const { callError, callState } = useCall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (callError && callState === "idle") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [callError, callState]);

  if (!visible || !callError) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-card border shadow-xl rounded-full px-4 py-2.5 flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-2">
      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
      {callError}
    </div>
  );
}

export function IncomingCallToast() {
  const { incomingCall, callState, acceptCall, rejectCall } = useCall();
  if (callState !== "incoming" || !incomingCall) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
      <div className="h-1 w-full bg-green-500 animate-pulse" />
      <div className="p-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {incomingCall.callerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background animate-ping" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{incomingCall.callerName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {incomingCall.callType === "video" ? <><Video className="h-3 w-3" /> Llamada de video</> : <><Phone className="h-3 w-3" /> Llamada de voz</>}
          </p>
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <Button onClick={rejectCall} variant="destructive" size="sm" className="flex-1 rounded-full gap-1.5">
          <PhoneMissed className="h-4 w-4" /> Rechazar
        </Button>
        <Button onClick={acceptCall} size="sm" className="flex-1 rounded-full gap-1.5 bg-green-600 hover:bg-green-700">
          <PhoneIncoming className="h-4 w-4" /> Aceptar
        </Button>
      </div>
    </div>
  );
}

export function OutgoingCallOverlay() {
  const { callState, callType, hangUp } = useCall();
  if (callState !== "calling") return null;
  return (
    <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative mx-auto w-24 h-24">
          <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
          <Avatar className="h-24 w-24 relative">
            <AvatarFallback className="text-3xl bg-primary/20 text-primary">📞</AvatarFallback>
          </Avatar>
        </div>
        <div className="text-white space-y-1">
          <p className="text-lg font-semibold">Llamando...</p>
          <p className="text-sm text-white/60">{callType === "video" ? "Llamada de video" : "Llamada de voz"}</p>
        </div>
        <Button onClick={hangUp} variant="destructive" size="lg" className="rounded-full h-14 w-14 p-0">
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

export function ActiveCallScreen() {
  const { callState, callType, localStream, remoteStream, isMuted, isCameraOff, isScreenSharing, hangUp, toggleMute, toggleCamera, toggleScreenShare } = useCall();
  if (callState !== "connected") return null;
  return (
    <div className="fixed inset-0 z-[9997] bg-black flex flex-col">
      {callType === "video" && remoteStream ? (
        <VideoEl stream={remoteStream} className="absolute inset-0 w-full h-full object-contain" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center text-white space-y-3">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarFallback className="text-4xl bg-white/10">👤</AvatarFallback>
            </Avatar>
            <p className="text-lg font-medium">En llamada</p>
          </div>
        </div>
      )}
      {/* Llamadas de audio: el remoteStream nunca se conecta a ningún
          elemento cuando no hay video (la rama de arriba solo monta un
          <video> si callType === "video"), así que sin esto el audio del
          otro lado llega por WebRTC pero jamás se reproduce. */}
      {callType !== "video" && remoteStream && (
        <RemoteAudio stream={remoteStream} />
      )}
      {callType === "video" && localStream && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-20 h-28 sm:w-32 sm:h-44 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
          <VideoEl stream={localStream} muted className="w-full h-full object-cover" />
          {isCameraOff && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <VideoOff className="h-6 w-6 text-white/40" />
            </div>
          )}
        </div>
      )}
      <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 flex justify-center gap-2 sm:gap-4 px-2">
        <Button onClick={toggleMute} size="lg" className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full p-0 ${isMuted ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"}`}>
          {isMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
        </Button>
        {callType === "video" && (
          <Button onClick={toggleCamera} size="lg" className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full p-0 ${isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-white/20 hover:bg-white/30"}`}>
            {isCameraOff ? <VideoOff className="h-5 w-5 text-white" /> : <Video className="h-5 w-5 text-white" />}
          </Button>
        )}
        {callType === "video" && (
          <Button onClick={toggleScreenShare} size="lg" className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full p-0 ${isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-white/20 hover:bg-white/30"}`} title={isScreenSharing ? "Dejar de compartir pantalla" : "Compartir pantalla"}>
            {isScreenSharing ? <MonitorOff className="h-5 w-5 text-white" /> : <MonitorUp className="h-5 w-5 text-white" />}
          </Button>
        )}
        <Button onClick={hangUp} size="lg" className="h-12 w-12 sm:h-14 sm:w-14 rounded-full p-0 bg-red-600 hover:bg-red-700">
          <PhoneOff className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
}

export function GlobalCallUI() {
  return (
    <>
      <IncomingCallToast />
      <OutgoingCallOverlay />
      <ActiveCallScreen />
      <CallErrorToast />
    </>
  );
}
