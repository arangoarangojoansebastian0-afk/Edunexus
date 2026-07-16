import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export type CallState = "idle" | "calling" | "incoming" | "connected" | "ended";
export type CallType = "video" | "audio";

export interface IncomingCall {
  roomId: string;
  callerId: string;
  callerName: string;
  callType: CallType;
}

const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/calls`;
const RING_TIMEOUT_MS = 45000; // si nadie contesta en 45s, cancelamos la llamada

export function useWebRTC() {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isInitiatorRef = useRef(false);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs "espejo" del estado — evitan closures obsoletos dentro del
  // handler de WebSocket, que se crea una sola vez por conexión.
  const roomIdRef = useRef<string | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const callStateRef = useRef<CallState>("idle");

  const [callState, setCallStateRaw] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("video");
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [roomId, setRoomIdRaw] = useState<string | null>(null);
  const [peerId, setPeerIdRaw] = useState<string | null>(null);
  const [localStream_, setLocalStream_] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);

  const setCallState = (s: CallState) => { callStateRef.current = s; setCallStateRaw(s); };
  const setRoomId = (id: string | null) => { roomIdRef.current = id; setRoomIdRaw(id); };
  const setPeerId = (id: string | null) => { peerIdRef.current = id; setPeerIdRaw(id); };

  // Servidores ICE (STUN + TURN). Se cargan desde el backend porque sin TURN
  // las llamadas fallan (o van en un solo sentido) en redes con NAT
  // simétrico/firewall restrictivo. Empezamos con un respaldo de solo-STUN
  // por si el fetch todavía no resolvió cuando se crea la primera conexión.
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ]);

  useEffect(() => {
    fetch("/api/calls/ice-servers", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.iceServers?.length) iceServersRef.current = data.iceServers; })
      .catch(() => { /* nos quedamos con el respaldo de solo-STUN */ });
  }, []);

  const clearRingTimeout = () => {
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
  };

  // ── Connect WebSocket ─────────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (!user?.id || ws.current?.readyState === WebSocket.OPEN) return;
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "register", userId: user.id }));
    };

    socket.onmessage = async (e) => {
      let msg: any;
      try { msg = JSON.parse(e.data); } catch { return; }

      switch (msg.type) {
        case "incoming-call":
          setIncomingCall({ roomId: msg.roomId, callerId: msg.callerId, callerName: msg.callerName, callType: msg.callType });
          setCallState("incoming");
          break;

        case "call-accepted":
          clearRingTimeout();
          await startPeerConnection(msg.roomId, true, peerIdRef.current || undefined);
          break;

        case "call-rejected":
          clearRingTimeout();
          setCallError("La persona rechazó la llamada");
          hangUpInternal(false);
          break;

        case "call-unavailable":
          // El destinatario no tiene una sesión activa para recibir la llamada
          clearRingTimeout();
          setCallError("Esa persona no está disponible ahora mismo");
          hangUpInternal(false);
          break;

        case "call-cancelled":
          // El llamante colgó antes de que contestáramos
          setIncomingCall(null);
          setCallState("idle");
          break;

        case "call-ended":
          hangUpInternal(false);
          break;

        case "peer-joined":
          setPeerId(msg.peerId);
          // Solo quien inició la llamada crea la oferta — si ambos lados
          // crearan oferta al mismo tiempo (glare), la conexión falla.
          if (isInitiatorRef.current && pc.current && pc.current.signalingState === "stable") {
            try {
              const offer = await pc.current.createOffer();
              await pc.current.setLocalDescription(offer);
              socket.send(JSON.stringify({ type: "offer", targetId: msg.peerId, sdp: offer }));
            } catch (err) {
              console.error("Error creando oferta WebRTC:", err);
            }
          }
          break;

        case "offer":
          await handleOffer(msg);
          break;

        case "answer":
          if (pc.current) {
            try {
              await pc.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              await flushPendingCandidates();
            } catch (err) {
              console.error("Error aplicando respuesta WebRTC:", err);
            }
          }
          break;

        case "ice-candidate":
          if (msg.candidate) {
            if (pc.current?.remoteDescription) {
              try { await pc.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); }
              catch (err) { console.error("Error agregando candidato ICE:", err); }
            } else {
              // Aún no hay descripción remota — se guarda para aplicarlo después
              pendingCandidates.current.push(msg.candidate);
            }
          }
          break;

        case "peer-left":
          // El otro participante se desconectó de la sala (perdió conexión, cerró la pestaña, etc.)
          hangUpInternal(false);
          break;
      }
    };

    socket.onclose = () => {
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      setTimeout(() => connectWS(), 3000);
    };

    // Cloudflare (y otros proxies delante de Render) cierran los WebSocket
    // inactivos después de ~100s sin tráfico. Como después de "registrarse"
    // no se manda nada hasta que hay una llamada, el socket queda inactivo
    // el tiempo suficiente para que lo cierren en silencio — el navegador a
    // veces ni se entera (el objeto queda "zombie", reportándose abierto sin
    // estarlo), así que nunca reconecta, y el servidor ya lo dio de baja.
    // Esto se ve como "esa persona no está disponible" con la app abierta.
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) connectWS();
    return () => {
      ws.current?.close();
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    };
  }, [user?.id]);

  // ── Get local media ───────────────────────────────────────────────────────
  const mediaErrorMessage = (err: any): string => {
    switch (err?.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "No se pudo acceder a la cámara/micrófono: revisa los permisos del navegador para este sitio.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No se encontró cámara o micrófono en este dispositivo.";
      case "NotReadableError":
      case "TrackStartError":
        return "La cámara o el micrófono ya están siendo usados por otra aplicación.";
      case "OverconstrainedError":
        return "La cámara no admite la configuración solicitada.";
      default:
        return "No se pudo iniciar la llamada. Revisa los permisos de cámara/micrófono.";
    }
  };

  const getLocalMedia = async (type: CallType): Promise<MediaStream> => {
    const constraints = type === "video"
      ? { video: { width: 1280, height: 720, facingMode: "user" }, audio: true }
      : { video: false, audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream.current = stream;
    setLocalStream_(stream);
    return stream;
  };

  const flushPendingCandidates = async () => {
    if (!pc.current) return;
    const queued = pendingCandidates.current;
    pendingCandidates.current = [];
    for (const candidate of queued) {
      try { await pc.current.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (err) { console.error("Error agregando candidato ICE pendiente:", err); }
    }
  };

  // ── Create RTCPeerConnection ──────────────────────────────────────────────
  const createPC = (rId: string, pId?: string): RTCPeerConnection => {
    const connection = new RTCPeerConnection({ iceServers: iceServersRef.current });
    pc.current = connection;

    connection.onicecandidate = (e) => {
      if (e.candidate && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: "ice-candidate",
          targetId: pId || peerIdRef.current,
          roomId: rId,
          candidate: e.candidate,
        }));
      }
    };

    connection.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) setRemoteStream(stream);
    };

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") setCallState("connected");
      if (["disconnected", "failed", "closed"].includes(connection.connectionState)) {
        hangUpInternal(false);
      }
    };

    return connection;
  };

  const startPeerConnection = async (rId: string, isInitiator: boolean, pId?: string) => {
    isInitiatorRef.current = isInitiator;
    // IMPORTANTE: fijar el peerId ANTES de crear el RTCPeerConnection. La
    // recolección de candidatos ICE empieza de inmediato al crear la conexión
    // (no espera a la oferta/respuesta), y onicecandidate necesita saber a
    // quién reenviar cada candidato. Si esto se deja para después de crear la
    // conexión, los primeros candidatos del que contesta la llamada se
    // generan con peerId todavía en null, se envían con targetId vacío y el
    // servidor los descarta — la llamada "conecta" en la UI pero el audio o
    // video nunca llega a uno de los dos lados.
    if (pId) setPeerId(pId);
    const stream = localStream.current || await getLocalMedia(callType);
    const connection = createPC(rId);
    stream.getTracks().forEach(t => connection.addTrack(t, stream));

    ws.current?.send(JSON.stringify({ type: "join-room", roomId: rId, userId: user!.id }));
    setRoomId(rId);
    setCallState("connected");
  };

  const handleOffer = async (msg: any) => {
    if (!pc.current) return;
    setPeerId(msg.fromId);
    try {
      await pc.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      await flushPendingCandidates();
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      ws.current?.send(JSON.stringify({ type: "answer", targetId: msg.fromId, sdp: answer }));
    } catch (err) {
      console.error("Error manejando oferta WebRTC:", err);
    }
  };

  // ── Colgar / limpiar (interno, no siempre reenvía señal) ──────────────────
  const hangUpInternal = useCallback((notifyPeer: boolean) => {
    if (notifyPeer) {
      if (callStateRef.current === "calling" && peerIdRef.current) {
        // Aún no habían aceptado — avisamos directo al destinatario para que
        // deje de timbrar (no existe sala todavía, así que no sirve broadcastear ahí)
        ws.current?.send(JSON.stringify({ type: "call-cancel", targetUserId: peerIdRef.current, roomId: roomIdRef.current }));
      } else if (roomIdRef.current) {
        ws.current?.send(JSON.stringify({ type: "call-ended", roomId: roomIdRef.current }));
      }
    }
    clearRingTimeout();
    pc.current?.close();
    pc.current = null;
    pendingCandidates.current = [];
    isInitiatorRef.current = false;
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    cameraTrackRef.current = null;
    setLocalStream_(null);
    setRemoteStream(null);
    setCallState("idle");
    setRoomId(null);
    setPeerId(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────
  const startCall = useCallback(async (targetUserId: string, callerName: string, type: CallType = "video") => {
    try {
      setCallError(null);
      const rId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setCallType(type);
      setCallState("calling");
      setRoomId(rId);
      setPeerId(targetUserId);
      await getLocalMedia(type);
      ws.current?.send(JSON.stringify({
        type: "call-request",
        roomId: rId,
        targetUserId,
        callerId: user!.id,
        callerName,
        callType: type,
      }));

      clearRingTimeout();
      ringTimeoutRef.current = setTimeout(() => {
        setCallError("No hubo respuesta");
        hangUpInternal(true);
      }, RING_TIMEOUT_MS);
    } catch (e) {
      console.error("Error al iniciar la llamada:", e);
      setCallError(mediaErrorMessage(e));
      hangUpInternal(false);
    }
  }, [user, hangUpInternal]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      setCallError(null);
      const type = incomingCall.callType;
      setCallType(type);
      await getLocalMedia(type);
      ws.current?.send(JSON.stringify({ type: "call-accepted", roomId: incomingCall.roomId, callerId: incomingCall.callerId }));
      await startPeerConnection(incomingCall.roomId, false, incomingCall.callerId);
      setIncomingCall(null);
    } catch (e) {
      console.error("Error al aceptar la llamada:", e);
      setCallError(mediaErrorMessage(e));
      hangUpInternal(false);
    }
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    ws.current?.send(JSON.stringify({ type: "call-rejected", roomId: incomingCall.roomId, callerId: incomingCall.callerId }));
    setIncomingCall(null);
    setCallState("idle");
  }, [incomingCall]);

  const hangUp = useCallback(() => {
    hangUpInternal(true);
  }, [hangUpInternal]);

  const toggleMute = useCallback(() => {
    if (!localStream.current) return;
    localStream.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStream.current) return;
    localStream.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(c => !c);
  }, []);

  // ── Compartir pantalla ────────────────────────────────────────────────────
  // Reemplaza el track de video que se envía al otro lado por el de la
  // pantalla, sin renegociar la conexión (replaceTrack reutiliza el mismo
  // transceiver, así que el otro lado no necesita hacer nada especial).
  const stopScreenShare = useCallback(async () => {
    if (!screenStreamRef.current) return;
    screenStreamRef.current.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;

    const sender = pc.current?.getSenders().find(s => s.track?.kind === "video");
    if (sender && cameraTrackRef.current) {
      try { await sender.replaceTrack(cameraTrackRef.current); } catch (err) { console.error("Error restaurando cámara:", err); }
    }
    cameraTrackRef.current = null;
    setIsScreenSharing(false);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) { await stopScreenShare(); return; }
    if (!pc.current) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenStreamRef.current = displayStream;

      const sender = pc.current.getSenders().find(s => s.track?.kind === "video");
      cameraTrackRef.current = sender?.track ?? localStream.current?.getVideoTracks()[0] ?? null;
      if (sender) await sender.replaceTrack(screenTrack);

      // Si el usuario detiene el compartir desde el control nativo del
      // navegador (en vez del botón de la app), volvemos a la cámara.
      screenTrack.onended = () => { stopScreenShare(); };

      setIsScreenSharing(true);
    } catch (err) {
      console.error("Error compartiendo pantalla:", err);
    }
  }, [isScreenSharing, stopScreenShare]);

  return {
    callState, callType, incomingCall, roomId, peerId,
    localStream: localStream_, remoteStream,
    isMuted, isCameraOff, isScreenSharing, callError,
    startCall, acceptCall, rejectCall, hangUp, toggleMute, toggleCamera, toggleScreenShare,
  };
}
