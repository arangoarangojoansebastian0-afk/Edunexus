import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFullName } from "@/lib/authUtils";

export type CallState = "idle" | "calling" | "incoming" | "connected" | "ended";
export type CallType = "video" | "audio";

export interface IncomingCall {
  roomId: string;
  callerId: string;
  callerName: string;
  callType: CallType;
}

const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/calls`;

export function useWebRTC() {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("video");
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [localStream_, setLocalStream_] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  // ── Connect WebSocket ─────────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (!user?.id || ws.current?.readyState === WebSocket.OPEN) return;
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "register", userId: user.id }));
    };

    socket.onmessage = async (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case "incoming-call":
          setIncomingCall({ roomId: msg.roomId, callerId: msg.callerId, callerName: msg.callerName, callType: msg.callType });
          setCallState("incoming");
          break;
        case "call-accepted":
          await startPeerConnection(msg.roomId, true);
          break;
        case "call-rejected":
          hangUp();
          break;
        case "call-ended":
          hangUp();
          break;
        case "peer-joined":
          setPeerId(msg.peerId);
          // If we joined first, create offer
          if (pc.current && pc.current.signalingState === "stable") {
            try {
              const offer = await pc.current.createOffer();
              await pc.current.setLocalDescription(offer);
              socket.send(JSON.stringify({ type: "offer", targetId: msg.peerId, sdp: offer }));
            } catch {}
          }
          break;
        case "offer":
          await handleOffer(msg);
          break;
        case "answer":
          if (pc.current) await pc.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          break;
        case "ice-candidate":
          if (pc.current && msg.candidate) {
            try { await pc.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
          }
          break;
      }
    };

    socket.onclose = () => {
      setTimeout(() => connectWS(), 3000);
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) connectWS();
    return () => { ws.current?.close(); };
  }, [user?.id]);

  // ── Get local media ───────────────────────────────────────────────────────
  const getLocalMedia = async (type: CallType): Promise<MediaStream> => {
    const constraints = type === "video"
      ? { video: { width: 1280, height: 720, facingMode: "user" }, audio: true }
      : { video: false, audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStream.current = stream;
    setLocalStream_(stream);
    return stream;
  };

  // ── Create RTCPeerConnection ──────────────────────────────────────────────
  const createPC = (rId: string, pId?: string): RTCPeerConnection => {
    const connection = new RTCPeerConnection({ iceServers });
    pc.current = connection;

    connection.onicecandidate = (e) => {
      if (e.candidate && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: "ice-candidate",
          targetId: pId || peerId,
          roomId: rId,
          candidate: e.candidate,
        }));
      }
    };

    connection.ontrack = (e) => {
      const [track] = e.streams;
      setRemoteStream(track);
    };

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") setCallState("connected");
      if (["disconnected", "failed", "closed"].includes(connection.connectionState)) hangUp();
    };

    return connection;
  };

  const startPeerConnection = async (rId: string, isInitiator: boolean) => {
    const stream = localStream.current || await getLocalMedia(callType);
    const connection = createPC(rId);
    stream.getTracks().forEach(t => connection.addTrack(t, stream));

    // Join room via WS
    ws.current?.send(JSON.stringify({ type: "join-room", roomId: rId, userId: user!.id }));
    setRoomId(rId);
    setCallState("connected");
  };

  const handleOffer = async (msg: any) => {
    if (!pc.current) return;
    setPeerId(msg.fromId);
    await pc.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);
    ws.current?.send(JSON.stringify({ type: "answer", targetId: msg.fromId, sdp: answer }));
  };

  // ── Public API ────────────────────────────────────────────────────────────
  const startCall = useCallback(async (targetUserId: string, callerName: string, type: CallType = "video") => {
    try {
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
    } catch (e) {
      setCallState("idle");
      throw e;
    }
  }, [user]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      const type = incomingCall.callType;
      setCallType(type);
      await getLocalMedia(type);
      ws.current?.send(JSON.stringify({ type: "call-accepted", roomId: incomingCall.roomId, callerId: incomingCall.callerId }));
      await startPeerConnection(incomingCall.roomId, false);
      setIncomingCall(null);
    } catch (e) {
      hangUp();
    }
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    ws.current?.send(JSON.stringify({ type: "call-rejected", roomId: incomingCall.roomId, callerId: incomingCall.callerId }));
    setIncomingCall(null);
    setCallState("idle");
  }, [incomingCall]);

  const hangUp = useCallback(() => {
    if (roomId) ws.current?.send(JSON.stringify({ type: "call-ended", roomId }));
    pc.current?.close();
    pc.current = null;
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    setLocalStream_(null);
    setRemoteStream(null);
    setCallState("idle");
    setRoomId(null);
    setPeerId(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
  }, [roomId]);

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

  return {
    callState, callType, incomingCall, roomId, peerId,
    localStream: localStream_, remoteStream,
    isMuted, isCameraOff,
    startCall, acceptCall, rejectCall, hangUp, toggleMute, toggleCamera,
  };
}
