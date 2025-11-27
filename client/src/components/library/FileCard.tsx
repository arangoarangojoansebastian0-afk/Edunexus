import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Image,
  Download,
  MoreVertical,
  Flag,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { FileWithUploader } from "@shared/schema";
import { getFullName } from "@/lib/authUtils";

interface FileCardProps {
  file: FileWithUploader;
  onDownload?: (fileId: string) => void;
  onPreview?: (file: FileWithUploader) => void;
  onDelete?: (fileId: string) => void;
  onReport?: (fileId: string) => void;
  isOwner?: boolean;
  isAdmin?: boolean;
  isModerator?: boolean;
}

const fileTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  doc: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
};

const subjectColors: Record<string, string> = {
  Matemáticas: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Ciencias: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Historia: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Lenguaje: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Inglés: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Arte: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  Física: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  Química: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function FileCard({
  file,
  onDownload,
  onPreview,
  onDelete,
  onReport,
  isOwner = false,
  isAdmin = false,
  isModerator = false,
}: FileCardProps) {
  const extension = file.fileName.split(".").pop()?.toLowerCase() || "";
  const IconComponent = fileTypeIcons[extension] || FileText;
  const uploaderName = getFullName(file.uploader.firstName, file.uploader.lastName);
  const timeAgo = formatDistanceToNow(new Date(file.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="hover-elevate" data-testid={`file-card-${file.id}`}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconComponent className="h-8 w-8 text-primary" />
            </div>
            {!file.approved && (
              <div className="absolute -top-1 -right-1">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
            )}
          </div>

          <div className="space-y-1 w-full">
            <h4 className="font-medium text-sm line-clamp-2 break-all" title={file.fileName}>
              {file.fileName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.fileSize)}
            </p>
          </div>

          {file.subject && (
            <Badge
              variant="secondary"
              className={subjectColors[file.subject] || ""}
            >
              {file.subject}
            </Badge>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="truncate max-w-full" title={uploaderName}>
              {uploaderName}
            </p>
            <p>{timeAgo}</p>
          </div>

          <div className="flex items-center gap-2 w-full">
            {file.approved ? (
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={() => onDownload?.(file.id)}
                data-testid="button-download-file"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Descargar</span>
              </Button>
            ) : (
              <Badge variant="outline" className="flex-1 justify-center gap-1">
                <Clock className="h-3 w-3" />
                Pendiente
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-file-menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPreview?.(file)} data-testid="button-preview-file">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                {(isOwner || isAdmin || isModerator) && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(file.id)}
                    className="text-destructive focus:text-destructive"
                    data-testid="button-delete-file"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isModerator && !isOwner ? "Eliminar (Moderador)" : "Eliminar"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onReport?.(file.id)} data-testid="button-report-file">
                  <Flag className="h-4 w-4 mr-2" />
                  Reportar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {file.downloadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {file.downloadCount} {file.downloadCount === 1 ? "descarga" : "descargas"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FileCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2 w-full">
            <div className="h-4 bg-muted rounded animate-pulse mx-auto w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse mx-auto w-1/2" />
          </div>
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
          <div className="h-8 bg-muted rounded animate-pulse w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
