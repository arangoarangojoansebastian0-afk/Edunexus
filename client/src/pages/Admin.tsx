import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFullName, getInitials, formatRole } from "@/lib/authUtils";
import {
  Users,
  FileText,
  Flag,
  Shield,
  CheckCircle,
  XCircle,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  Trash2,
  TrendingUp,
  Award,
} from "lucide-react";
import type { User, Report, File as FileType } from "@shared/schema";
import { BadgeManager } from "@/components/admin/BadgeManager";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation, Link } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "teacher") {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta página.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, setLocation, toast]);

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  const { data: stats } = useQuery<{
    totalUsers: number;
    pendingVerifications: number;
    totalPosts: number;
    pendingReports: number;
    pendingFiles: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", userRoleFilter],
    enabled: isAdmin,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports", reportStatusFilter],
    enabled: isAdmin,
  });

  const { data: pendingFiles, isLoading: filesLoading } = useQuery<FileType[]>({
    queryKey: ["/api/admin/files/pending"],
    enabled: isAdmin,
  });

  const filteredUsers = users?.filter((u) => {
    if (userSearch) {
      const query = userSearch.toLowerCase();
      const fullName = getFullName(u.firstName, u.lastName).toLowerCase();
      if (!fullName.includes(query) && !u.email?.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    return true;
  });

  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/users/${userId}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Usuario verificado",
        description: "El usuario ahora puede publicar contenido.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo verificar el usuario.",
        variant: "destructive",
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/users/${userId}/block`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuario bloqueado",
        description: "El usuario ha sido bloqueado.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo bloquear el usuario.",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido cambiado.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el rol.",
        variant: "destructive",
      });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, action, notes }: { reportId: string; action: string; notes: string }) => {
      await apiRequest("POST", `/api/admin/reports/${reportId}/resolve`, { action, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedReport(null);
      setReviewNotes("");
      toast({
        title: "Reporte procesado",
        description: "El reporte ha sido resuelto.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo procesar el reporte.",
        variant: "destructive",
      });
    },
  });

  const approveFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest("POST", `/api/admin/files/${fileId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Archivo aprobado",
        description: "El archivo ahora es visible para todos.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo aprobar el archivo.",
        variant: "destructive",
      });
    },
  });

  const rejectFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest("DELETE", `/api/admin/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Archivo rechazado",
        description: "El archivo ha sido eliminado.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo rechazar el archivo.",
        variant: "destructive",
      });
    },
  });

  if (user?.role !== "admin" && user?.role !== "teacher") {
    return null;
  }

  // Teachers only see badge management
  if (isTeacher && !isAdmin) {
    return (
      <AppLayout title="Gestionar Insignias">
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          <BadgeManager />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Panel de Administración">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {isAdmin && (
            <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                    <p className="text-xs text-muted-foreground">Usuarios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.pendingVerifications || 0}</p>
                    <p className="text-xs text-muted-foreground">Por verificar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
                    <p className="text-xs text-muted-foreground">Publicaciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                    <Flag className="h-5 w-5 text-red-600 dark:text-red-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.pendingReports || 0}</p>
                    <p className="text-xs text-muted-foreground">Reportes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.pendingFiles || 0}</p>
                    <p className="text-xs text-muted-foreground">Archivos pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2" data-testid="tab-reports">
                <Flag className="h-4 w-4" />
                Reportes
                {stats?.pendingReports ? (
                  <Badge variant="destructive" className="ml-1">
                    {stats.pendingReports}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2" data-testid="tab-files">
                <FileText className="h-4 w-4" />
                Archivos
                {stats?.pendingFiles ? (
                  <Badge variant="secondary" className="ml-1">
                    {stats.pendingFiles}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="badges" className="gap-2" data-testid="tab-badges">
                <Award className="h-4 w-4" />
                Insignias
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4 mt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar usuarios..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-users"
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-role-filter">
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="student">Estudiantes</SelectItem>
                    <SelectItem value="teacher">Profesores</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-10 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <Link href={`/profile/${u.id}`}>
                              <div className="flex items-center gap-3 hover-elevate cursor-pointer">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={u.profileImageUrl || undefined} className="object-cover" />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(u.firstName, u.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">
                                    {getFullName(u.firstName, u.lastName)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(role) =>
                                updateRoleMutation.mutate({ userId: u.id, role })
                              }
                            >
                              <SelectTrigger className="w-28 h-8" data-testid={`select-role-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Estudiante</SelectItem>
                                <SelectItem value="teacher">Profesor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {u.blocked ? (
                              <Badge variant="destructive">Bloqueado</Badge>
                            ) : u.verified ? (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Verificado
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pendiente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(u.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-user-menu-${u.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!u.verified && (
                                  <DropdownMenuItem
                                    onClick={() => verifyUserMutation.mutate(u.id)}
                                    data-testid={`button-verify-${u.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Verificar
                                  </DropdownMenuItem>
                                )}
                                {!u.blocked ? (
                                  <DropdownMenuItem
                                    onClick={() => blockUserMutation.mutate(u.id)}
                                    className="text-destructive"
                                    data-testid={`button-block-${u.id}`}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Bloquear
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => blockUserMutation.mutate(u.id)}
                                    data-testid={`button-unblock-${u.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Desbloquear
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">No se encontraron usuarios</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-report-status">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="resolved">Resueltos</SelectItem>
                    <SelectItem value="dismissed">Descartados</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportsLoading ? (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ) : reports && reports.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Razón</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {report.targetType}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {report.reason}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                report.status === "pending"
                                  ? "secondary"
                                  : report.status === "resolved"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {report.status === "pending"
                                ? "Pendiente"
                                : report.status === "resolved"
                                ? "Resuelto"
                                : "Descartado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(report.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedReport(report)}
                              data-testid={`button-review-report-${report.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <EmptyState
                  icon={Flag}
                  title="Sin reportes"
                  description="No hay reportes pendientes de revisión."
                />
              )}
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-4 mt-4">
              {filesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                  ))}
                </div>
              ) : pendingFiles && pendingFiles.length > 0 ? (
                <div className="grid gap-4">
                  {pendingFiles.map((file) => (
                    <Card key={file.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3 rounded-lg bg-muted">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{file.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.subject} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveFileMutation.mutate(file.id)}
                              data-testid={`button-approve-file-${file.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectFileMutation.mutate(file.id)}
                              data-testid={`button-reject-file-${file.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="Sin archivos pendientes"
                  description="Todos los archivos han sido moderados."
                />
              )}
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Gestionar Insignias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BadgeManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
            </>
          )}

          {/* Report Review Dialog */}
          <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Revisar Reporte</DialogTitle>
                <DialogDescription>
                  Toma una acción sobre este reporte.
                </DialogDescription>
              </DialogHeader>
              {selectedReport && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tipo de contenido</p>
                    <Badge variant="outline" className="capitalize">
                      {selectedReport.targetType}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Razón del reporte</p>
                    <p className="text-sm text-muted-foreground">{selectedReport.reason}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Notas de revisión</p>
                    <Textarea
                      placeholder="Agrega notas sobre tu decisión..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      data-testid="input-review-notes"
                    />
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedReport) {
                      resolveReportMutation.mutate({
                        reportId: selectedReport.id,
                        action: "dismiss",
                        notes: reviewNotes,
                      });
                    }
                  }}
                  data-testid="button-dismiss-report"
                >
                  Descartar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedReport) {
                      resolveReportMutation.mutate({
                        reportId: selectedReport.id,
                        action: "delete",
                        notes: reviewNotes,
                      });
                    }
                  }}
                  data-testid="button-delete-content"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar Contenido
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  );
}
