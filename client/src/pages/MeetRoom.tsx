import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  LiveKitRoom,
  VideoConference,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MicOff, UserX, Users, X, Loader2, ShieldAlert } from "lucide-react";

interface JoinInfo {
  token: string;
  url: string;
  roomName: string;
  isHost: boolean;
  title: string;
}

export default function MeetRoom() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiRequest("POST", `/api/meet/sessions/${id}/join`, {});
        const data = await res.json();
        setJoinInfo(data);
      } catch (e: any) {
        let msg = e?.message || "No se pudo unir a la sesión.";
        const match = /^\d+:\s*(.*)$/.exec(msg);
        if (match) {
          try { msg = JSON.parse(match[1]).message || msg; } catch { msg = match[1] || msg; }
        }
        setError(msg);
      }
    })();
  }, [id]);

  const leave = async () => {
    try { await apiRequest("POST", `/api/meet/sessions/${id}/leave`, {}); } catch { /* no bloquea la salida */ }
    setLocation("/tutoring");
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center text-white space-y-4 max-w-sm">
          <ShieldAlert className="h-12 w-12 mx-auto text-red-400" />
          <p className="font-medium">{error}</p>
          <Button variant="secondary" onClick={() => setLocation("/tutoring")}>Volver</Button>
        </div>
      </div>
    );
  }

  if (!joinInfo) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white space-y-3">
          <Loader2 className="h-8 w-8 mx-auto animate-spin" />
          <p className="text-sm text-white/70">Conectando a la sala...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9990] bg-black">
      <LiveKitRoom
        serverUrl={joinInfo.url}
        token={joinInfo.token}
        connect
        video
        audio
        data-lk-theme="default"
        style={{ height: "100%" }}
        onDisconnected={() => setLocation("/tutoring")}
      >
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <Badge className="bg-black/60 text-white border-white/20 backdrop-blur">{joinInfo.title}</Badge>
          {joinInfo.isHost && (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setShowParticipants((v) => !v)}
            >
              <Users className="h-3.5 w-3.5" /> Participantes
            </Button>
          )}
        </div>
        <VideoConference />
        {joinInfo.isHost && showParticipants && (
          <HostParticipantPanel sessionId={id!} onClose={() => setShowParticipants(false)} />
        )}
      </LiveKitRoom>
    </div>
  );
}

// Panel del anfitrión: mutear/expulsar participantes. LiveKit no deja hacer
// esto desde el cliente de otro participante (con razón) — pasa siempre por
// el servidor, así que estos botones llaman a nuestra API, que usa
// RoomServiceClient del lado del servidor con las credenciales de LiveKit.
function HostParticipantPanel({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { toast } = useToast();

  const muteMutation = useMutation({
    mutationFn: async (participantId: string) => {
      await apiRequest("POST", `/api/meet/sessions/${sessionId}/mute/${participantId}`, {});
    },
    onSuccess: () => toast({ title: "Participante silenciado" }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (participantId: string) => {
      await apiRequest("POST", `/api/meet/sessions/${sessionId}/remove/${participantId}`, {});
    },
    onSuccess: () => toast({ title: "Participante expulsado" }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="absolute top-14 left-3 z-10 w-72 rounded-xl border border-white/10 bg-black/80 backdrop-blur-md shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <p className="text-sm font-medium text-white">Participantes ({participants.length})</p>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
        {participants.map((p) => {
          const isMe = p.identity === localParticipant.identity;
          return (
            <div key={p.identity} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-white/90 truncate">
                {p.name || p.identity} {isMe && <span className="text-white/40">(tú)</span>}
              </span>
              {!isMe && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                    title="Silenciar"
                    onClick={() => muteMutation.mutate(p.identity)}
                  >
                    <MicOff className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Expulsar"
                    onClick={() => removeMutation.mutate(p.identity)}
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
