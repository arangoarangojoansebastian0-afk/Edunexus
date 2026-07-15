import { createContext, useContext, ReactNode } from "react";
import { useWebRTC, CallState, CallType, IncomingCall } from "@/hooks/useWebRTC";

interface CallContextType {
  callState: CallState;
  callType: CallType;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  callError: string | null;
  startCall: (targetUserId: string, callerName: string, type?: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const webrtc = useWebRTC();
  return (
    <CallContext.Provider value={webrtc}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}
