import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePostCard } from "@/components/posts/CreatePostCard";
import { PostCard } from "@/components/posts/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFullName, getInitials } from "@/lib/authUtils";
import {
  Users,
  MessageSquare,
  Send,
  BookOpen,
  ArrowLeft,
  Settings,
  Paperclip,
  Mic,
  Square,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import type { GroupWithMembers, PostWithAuthor, MessageWithSender, GroupMember, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "wouter";
import { useEffect, useRef } from "react";

export default function GroupDetail() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("forum");
  const [chatMessage, setChatMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const { data: group, isLoading: groupLoading } = useQuery<GroupWithMembers>({
    queryKey: ["/api/groups", groupId],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/groups", groupId, "posts"],
    enabled: !!groupId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/groups", groupId, "messages"],
    enabled: !!groupId && activeTab === "chat",
    refetchInterval: activeTab === "chat" ? 3000 : false,
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("content", "[Nota de voz]");
        formData.append("media", audioBlob, "voice.webm");
        
        try {
          const response = await fetch(`/api/groups/${groupId}/messages`, {
            method: "POST",
            credentials: "include",
            body: formData,
          });
          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "messages"] });
          }
        } catch (error) {
          console.error("Error uploading voice:", error);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const { data: members } = useQuery<(GroupMember & { user: User })[]>({
    queryKey: ["/api/groups", groupId, "members"],
    enabled: !!groupId,
  });

  const isMember = members?.some((m) => m.userId === user?.id);
  const memberCount = members?.length || 0;

  useEffect(() => {
    if (messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/groups/${groupId}/posts`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "posts"] });
      toast({
        title: "Publicación creada",
        description: "Tu publicación ha sido compartida en el grupo.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la publicación.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/groups/${groupId}/messages`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "messages"] });
      setChatMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje.",
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "members"] });
      toast({
        title: "Te uniste al grupo",
        description: "Ahora eres miembro de este grupo.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo unir al grupo.",
        variant: "destructive",
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "members"] });
      toast({
        title: "Saliste del grupo",
        description: "Ya no eres miembro de este grupo.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo salir del grupo.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendMessageMutation.mutate(chatMessage.trim());
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("content", `[${file.type.includes("audio") ? "Nota de voz" : file.type.includes("image") ? "Imagen" : "Documento"}]`);
    formData.append("media", file);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "messages"] });
      }
    } catch (error) {
      console.error("Error uploading media:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "messages"] });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };


  if (groupLoading) {
    return (
      <AppLayout>
        <PageLoader text="Cargando grupo..." />
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout>
        <EmptyState
          icon={Users}
          title="Grupo no encontrado"
          description="El grupo que buscas no existe o fue eliminado."
          action={{
            label: "Volver a Grupos",
            onClick: () => window.location.href = "/groups",
          }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Group Header */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5">
            {group.coverImageUrl && (
              <img
                src={group.coverImageUrl}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <Button variant="ghost" size="icon" asChild className="shrink-0 bg-background/50 backdrop-blur">
                  <Link href="/groups">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-serif text-2xl md:text-3xl font-bold">{group.name}</h1>
                    <Badge variant="secondary">
                      {group.type === "course" ? "Curso" : "Club"}
                    </Badge>
                    {group.grade && (
                      <Badge variant="outline">{group.grade}° Grado</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{memberCount} miembros</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMember ? (
                  <Button
                    variant="outline"
                    onClick={() => leaveGroupMutation.mutate()}
                    disabled={leaveGroupMutation.isPending}
                    data-testid="button-leave-group"
                  >
                    Salir del Grupo
                  </Button>
                ) : (
                  <Button
                    onClick={() => joinGroupMutation.mutate()}
                    disabled={joinGroupMutation.isPending}
                    data-testid="button-join-group"
                  >
                    Unirse al Grupo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {group.description && (
            <p className="text-muted-foreground mb-6">{group.description}</p>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="forum" className="gap-2" data-testid="tab-forum">
                    <MessageSquare className="h-4 w-4" />
                    Foro
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-2" data-testid="tab-chat" disabled={!isMember}>
                    <Send className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="forum" className="space-y-4 mt-4">
                  {isMember && user?.verified && (
                    <CreatePostCard
                      onSubmit={(content) => createPostMutation.mutate(content)}
                      isSubmitting={createPostMutation.isPending}
                      placeholder="¿Qué quieres compartir con el grupo?"
                    />
                  )}

                  {postsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ))
                  ) : posts && posts.length > 0 ? (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={user?.id}
                        likesCount={post._count?.reactions || 0}
                        commentsCount={post._count?.comments || 0}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={MessageSquare}
                      title="Sin publicaciones"
                      description={
                        isMember
                          ? "Sé el primero en publicar algo en el grupo."
                          : "Únete al grupo para ver y crear publicaciones."
                      }
                    />
                  )}
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                  <Card className="h-[500px] flex flex-col">
                    <CardHeader className="pb-3 border-b shrink-0">
                      <CardTitle className="text-base">Chat del Grupo</CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1 p-4">
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-8 w-40" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : messages && messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map((message) => {
                            const isOwn = message.senderId === user?.id;
                            return (
                              <div
                                key={message.id}
                                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                              >
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage
                                    src={message.sender.profileImageUrl || undefined}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(message.sender.firstName, message.sender.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {getFullName(message.sender.firstName, message.sender.lastName)}
                                  </p>
                                  <div
                                    className={`inline-block rounded-2xl px-4 py-2 ${
                                      isOwn
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }`}
                                  >
                                    <p className="text-sm">{message.content}</p>
                                    {message.mediaUrl && (
                                      <div className="mt-2">
                                        {message.mediaType === "image" && (
                                          <img src={message.mediaUrl} alt="shared" className="max-w-xs rounded-lg" />
                                        )}
                                        {message.mediaType === "voice" && (
                                          <audio controls className="max-w-xs">
                                            <source src={message.mediaUrl} />
                                          </audio>
                                        )}
                                        {message.mediaType === "document" && (
                                          <a href={message.mediaUrl} target="_blank" className="text-blue-400 underline">
                                            Descargar documento
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {(isOwn || user?.role === "teacher" || user?.role === "admin") && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="opacity-0 hover:opacity-100"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(message.createdAt), {
                                      addSuffix: true,
                                      locale: es,
                                    })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground text-sm">
                            No hay mensajes aún. ¡Inicia la conversación!
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                    <div className="p-4 border-t space-y-2 shrink-0">
                      <div className="flex gap-1 flex-wrap">
                        <Button 
                          size="sm" 
                          variant={isRecording ? "destructive" : "outline"} 
                          className="gap-1" 
                          onClick={isRecording ? stopRecording : startRecording}
                        >
                          {isRecording ? (
                            <>
                              <Square className="h-3 w-3" />
                              Detener
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4" />
                              Grabar Voz
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => imageInputRef.current?.click()}>
                          <ImageIcon className="h-4 w-4" />
                          Imagen
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => documentInputRef.current?.click()}>
                          <Paperclip className="h-4 w-4" />
                          Documento
                        </Button>
                        <input
                          ref={imageInputRef}
                          type="file"
                          onChange={handleMediaUpload}
                          className="hidden"
                          accept="image/*"
                        />
                        <input
                          ref={documentInputRef}
                          type="file"
                          onChange={handleMediaUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                        />
                      </div>
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          placeholder="Escribe un mensaje..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          disabled={sendMessageMutation.isPending}
                          data-testid="input-chat-message"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                          data-testid="button-send-message"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Members */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Miembros ({memberCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members?.slice(0, 10).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={member.user.profileImageUrl || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.user.firstName, member.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getFullName(member.user.firstName, member.user.lastName)}
                          </p>
                          {member.role === "admin" && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {memberCount > 10 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        +{memberCount - 10} más
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
