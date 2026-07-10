import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { getFullName, getInitials } from "@/lib/authUtils";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { Send, Search, MessageCircle, ArrowLeft, Check, CheckCheck, Phone, Video, Users, UserPlus2 } from "lucide-react";
import { useCall } from "@/context/CallContext";

function formatMsgTime(date: string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ayer";
  return format(d, "d MMM", { locale: es });
}

function formatMsgDate(date: string) {
  const d = new Date(date);
  if (isToday(d)) return "Hoy";
  if (isYesterday(d)) return "Ayer";
  return format(d, "EEEE d 'de' MMMM", { locale: es });
}

function RoleChip({ role }: { role: string }) {
  const map: Record<string, { label: string; color: string }> = {
    student: { label: "Estudiante", color: "bg-blue-500/10 text-blue-600" },
    teacher: { label: "Docente", color: "bg-green-500/10 text-green-600" },
    admin: { label: "Admin", color: "bg-purple-500/10 text-purple-600" },
    director: { label: "Director", color: "bg-amber-500/10 text-amber-600" },
    coordinator: { label: "Coordinador", color: "bg-rose-500/10 text-rose-600" },
    secretary: { label: "Secretaría", color: "bg-teal-500/10 text-teal-600" },
  };
  const r = map[role] || { label: role, color: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.color}`}>{r.label}</span>;
}

function CallButtons({ targetUser }: { targetUser: any }) {
  const { startCall, callState } = useCall();
  const { user } = useAuth();
  const busy = callState !== "idle";
  const myName = user ? getFullName(user.firstName, user.lastName) : "Usuario";

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" disabled={busy} title="Llamada de voz"
        onClick={() => startCall(targetUser.id, myName, "audio")}>
        <Phone className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled={busy} title="Videollamada"
        onClick={() => startCall(targetUser.id, myName, "video")}>
        <Video className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function DirectMessages() {
  const { user } = useAuth();
  const params = useParams<{ userId?: string; groupId?: string }>();
  const [, navigate] = useLocation();
  const [otherId, setOtherId] = useState(params.userId || "");
  const [groupId, setGroupId] = useState(params.groupId || "");
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Diálogo de "crear grupo privado" — solo entran quienes se seleccionen aquí
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupMemberSearch, setGroupMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  const activeType: "direct" | "group" | null = groupId ? "group" : otherId ? "direct" : null;

  // Conversaciones 1 a 1
  const { data: conversations = [], isLoading: loadingConvs } = useQuery<any[]>({
    queryKey: ["/api/direct-messages/conversations"],
    refetchInterval: 5000,
  });

  // Grupos privados en los que el usuario es miembro (nunca todos los de la institución)
  const { data: chatGroups = [], isLoading: loadingGroups } = useQuery<any[]>({
    queryKey: ["/api/chat-groups"],
    refetchInterval: 5000,
  });

  // Mensajes del hilo 1 a 1 activo
  const { data: directMessages = [], isLoading: loadingDirectMsgs } = useQuery<any[]>({
    queryKey: ["/api/direct-messages", otherId],
    queryFn: () => fetch(`/api/direct-messages/${otherId}`, { credentials: "include" }).then(r => r.json()),
    enabled: activeType === "direct" && !!otherId,
    refetchInterval: 3000,
  });

  // Mensajes del grupo privado activo
  const { data: groupMessages = [], isLoading: loadingGroupMsgs } = useQuery<any[]>({
    queryKey: ["/api/chat-groups", groupId, "messages"],
    queryFn: () => fetch(`/api/chat-groups/${groupId}/messages`, { credentials: "include" }).then(r => r.json()),
    enabled: activeType === "group" && !!groupId,
    refetchInterval: 3000,
  });

  const messages = activeType === "group" ? groupMessages : directMessages;
  const loadingMsgs = activeType === "group" ? loadingGroupMsgs : loadingDirectMsgs;

  // Búsqueda de usuarios para iniciar un chat 1 a 1
  const { data: searchResults = [] } = useQuery<any[]>({
    queryKey: ["/api/users/search", search],
    queryFn: () => fetch(`/api/users/search?q=${encodeURIComponent(search)}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : []),
    enabled: search.length >= 2,
  });

  // Búsqueda de usuarios para invitar al grupo nuevo
  const { data: groupSearchResults = [] } = useQuery<any[]>({
    queryKey: ["/api/users/search", "group", groupMemberSearch],
    queryFn: () => fetch(`/api/users/search?q=${encodeURIComponent(groupMemberSearch)}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : []),
    enabled: groupMemberSearch.length >= 2,
  });

  // Usuario activo con quien chateamos (solo aplica en chats 1 a 1)
  const activeConv = (conversations as any[]).find(c =>
    c.otherUser?.id === otherId
  );
  const activeUser = activeConv?.otherUser;
  const activeGroup = (chatGroups as any[]).find(g => g.id === groupId);

  const send = useMutation({
    mutationFn: () => activeType === "group"
      ? apiRequest("POST", `/api/chat-groups/${groupId}/messages`, { content: text })
      : apiRequest("POST", `/api/direct-messages/${otherId}`, { content: text }),
    onSuccess: () => {
      setText("");
      if (activeType === "group") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat-groups", groupId, "messages"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/direct-messages", otherId] });
        queryClient.invalidateQueries({ queryKey: ["/api/direct-messages/conversations"] });
      }
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat-groups", {
        name: groupNameInput.trim(),
        memberIds: selectedMembers.map((m) => m.id),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-groups"] });
      setShowCreateGroup(false);
      setGroupNameInput("");
      setGroupMemberSearch("");
      setSelectedMembers([]);
      setOtherId("");
      setGroupId(data.id);
      navigate(`/messages/group/${data.id}`);
    },
  });

  const toggleSelectedMember = (u: any) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === u.id) ? prev.filter((m) => m.id !== u.id) : [...prev, u]
    );
  };

  useEffect(() => {
    if (otherId || groupId) bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [otherId, groupId, messages.length]);

  useEffect(() => {
    if (params.userId) { setOtherId(params.userId); setGroupId(""); }
    if (params.groupId) { setGroupId(params.groupId); setOtherId(""); }
  }, [params.userId, params.groupId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && text.trim()) {
      e.preventDefault();
      send.mutate();
    }
  };

  const startChat = (u: any) => {
    setGroupId("");
    setOtherId(u.id);
    setSearch("");
    setShowSearch(false);
    navigate(`/messages/${u.id}`);
  };

  const openGroup = (g: any) => {
    setOtherId("");
    setGroupId(g.id);
    navigate(`/messages/group/${g.id}`);
  };

  // Agrupar mensajes por fecha
  const groupedMessages: Array<{ date: string; msgs: any[] }> = [];
  for (const msg of (messages as any[])) {
    const d = formatMsgDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === d) last.msgs.push(msg);
    else groupedMessages.push({ date: d, msgs: [msg] });
  }

  return (
    <AppLayout title="Mensajes">
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">

        {/* ── Columna izquierda: lista de conversaciones ── */}
        <div className={`w-full md:w-80 border-r flex flex-col shrink-0 ${otherId ? "hidden md:flex" : "flex"}`}>
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <h2 className="font-bold text-base">Mensajes</h2>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" title="Nuevo grupo privado" onClick={() => setShowCreateGroup(true)}>
                <Users className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSearch(!showSearch)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Buscar usuario para nuevo chat */}
          {showSearch && (
            <div className="p-3 border-b">
              <Input
                placeholder="Buscar persona..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="text-sm"
              />
              {search.length >= 2 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {(searchResults as any[]).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Sin resultados</p>
                  ) : (searchResults as any[]).map((u: any) => (
                    <button key={u.id} onClick={() => startChat(u)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted text-left">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={u.profileImageUrl} />
                        <AvatarFallback className="text-xs">{getInitials(u.firstName, u.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{getFullName(u.firstName, u.lastName)}</p>
                        <RoleChip role={u.role} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {/* Grupos privados — solo aparecen los grupos donde soy miembro/invitado */}
            {!loadingGroups && (chatGroups as any[]).length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Grupos privados
                </p>
                {(chatGroups as any[]).map((g: any) => {
                  const isActive = g.id === groupId;
                  return (
                    <button key={g.id}
                      onClick={() => openGroup(g)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/40 ${isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={g.avatarUrl} />
                        <AvatarFallback className="text-sm bg-primary/10 text-primary"><Users className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{g.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {g.description || "Grupo privado"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {conversations && (conversations as any[]).length > 0 && (
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Chats directos
              </p>
            )}

            {loadingConvs ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (conversations as any[]).length === 0 && (chatGroups as any[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-6">
                <MessageCircle className="h-10 w-10 opacity-20" />
                <p className="text-sm text-center">Aún no tienes conversaciones.<br/>Busca a alguien para empezar.</p>
                <Button size="sm" variant="outline" onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4 mr-1.5" /> Buscar persona
                </Button>
              </div>
            ) : (
              (conversations as any[]).map((conv: any) => {
                const other = conv.otherUser;
                const isActive = other?.id === otherId;
                return (
                  <button key={conv.id}
                    onClick={() => { setGroupId(""); setOtherId(other.id); navigate(`/messages/${other.id}`); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/40 ${isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={other?.profileImageUrl} />
                        <AvatarFallback className="text-sm">{getInitials(other?.firstName, other?.lastName)}</AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline gap-1">
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                          {getFullName(other?.firstName, other?.lastName)}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatMsgTime(conv.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {conv.senderId === user?.id ? "Tú: " : ""}{conv.content}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Columna derecha: hilo del chat ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!activeType ? "hidden md:flex" : "flex"}`}>
          {!activeType ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
                <MessageCircle className="h-10 w-10 opacity-30" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Selecciona una conversación</p>
                <p className="text-sm mt-1">O busca a alguien para comenzar a chatear</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header del chat */}
              <div className="border-b px-4 py-3 flex items-center gap-3 bg-background">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => { setOtherId(""); setGroupId(""); navigate("/messages"); }}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                {activeType === "direct" && activeUser && (
                  <>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={activeUser.profileImageUrl} />
                      <AvatarFallback className="text-sm">{getInitials(activeUser.firstName, activeUser.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{getFullName(activeUser.firstName, activeUser.lastName)}</p>
                      <RoleChip role={activeUser.role} />
                    </div>
                    <CallButtons targetUser={activeUser} />
                  </>
                )}
                {activeType === "group" && activeGroup && (
                  <>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={activeGroup.avatarUrl} />
                      <AvatarFallback className="text-sm bg-primary/10 text-primary"><Users className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{activeGroup.name}</p>
                      <p className="text-xs text-muted-foreground">Grupo privado</p>
                    </div>
                  </>
                )}
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMsgs ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-48" />)}
                  </div>
                ) : (messages as any[]).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <MessageCircle className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Sé el primero en escribir algo</p>
                  </div>
                ) : (
                  groupedMessages.map(({ date, msgs }) => (
                    <div key={date}>
                      {/* Separador de fecha */}
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 border-t" />
                        <span className="text-[11px] text-muted-foreground bg-background px-2">{date}</span>
                        <div className="flex-1 border-t" />
                      </div>
                      <div className="space-y-1">
                        {msgs.map((msg: any, i: number) => {
                          const isMe = msg.senderId === user?.id;
                          const prevMsg = msgs[i - 1];
                          const sameSender = prevMsg?.senderId === msg.senderId;
                          return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameSender ? "mt-0.5" : "mt-2"}`}>
                              <div className={`max-w-[72%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              }`}>
                                {activeType === "group" && !isMe && !sameSender && (
                                  <p className="text-xs font-semibold text-primary mb-0.5">
                                    {getFullName(msg.senderFirstName, msg.senderLastName)}
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                  <span className={`text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                    {format(new Date(msg.createdAt), "HH:mm")}
                                  </span>
                                  {isMe && activeType === "direct" && (
                                    msg.readAt
                                      ? <CheckCheck className="h-3 w-3 text-blue-300" />
                                      : <Check className="h-3 w-3 text-primary-foreground/50" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3 flex gap-2 items-end bg-background">
                <Input
                  ref={inputRef}
                  className="flex-1 resize-none rounded-full bg-muted border-0 px-4 text-sm"
                  placeholder="Escribe un mensaje..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  size="icon"
                  className="rounded-full shrink-0 h-9 w-9"
                  onClick={() => send.mutate()}
                  disabled={!text.trim() || send.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Diálogo: crear grupo privado — solo entran las personas seleccionadas aquí */}
      <Dialog open={showCreateGroup} onOpenChange={(open) => {
        setShowCreateGroup(open);
        if (!open) { setGroupNameInput(""); setGroupMemberSearch(""); setSelectedMembers([]); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Nuevo grupo privado
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Nombre del grupo"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
            />

            {/* Personas ya seleccionadas — el grupo se crea SOLO con ellas + tú */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedMembers.map((m) => (
                  <Badge key={m.id} variant="secondary" className="gap-1 pr-1">
                    {getFullName(m.firstName, m.lastName)}
                    <button onClick={() => toggleSelectedMember(m)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Input
              placeholder="Buscar personas para invitar..."
              value={groupMemberSearch}
              onChange={(e) => setGroupMemberSearch(e.target.value)}
            />
            {groupMemberSearch.length >= 2 && (
              <div className="space-y-1 max-h-52 overflow-y-auto border rounded-md">
                {(groupSearchResults as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Sin resultados</p>
                ) : (groupSearchResults as any[]).map((u: any) => {
                  const isSelected = selectedMembers.some((m) => m.id === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleSelectedMember(u)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/60 text-left"
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={u.profileImageUrl} />
                        <AvatarFallback className="text-xs">{getInitials(u.firstName, u.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{getFullName(u.firstName, u.lastName)}</p>
                      </div>
                      <RoleChip role={u.role} />
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <UserPlus2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Este grupo solo tendrá a las personas que invites aquí — nadie más de la institución
              podrá verlo ni unirse por su cuenta.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGroup(false)}>Cancelar</Button>
            <Button
              onClick={() => createGroup.mutate()}
              disabled={!groupNameInput.trim() || selectedMembers.length === 0 || createGroup.isPending}
            >
              Crear grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
