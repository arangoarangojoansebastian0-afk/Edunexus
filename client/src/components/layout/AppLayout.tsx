import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
}

// ── Convierte un color hex a los componentes H S L que usa el sistema de CSS vars
function hexToHSL(hex: string): string | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ── Hook que aplica los colores del colegio como CSS custom properties
function useInstitutionColors() {
  const { data: institution } = useInstitutionSettings();

  useEffect(() => {
    const root = document.documentElement;
    const primary = institution?.primaryColor;
    const secondary = institution?.secondaryColor;

    if (primary) {
      const hsl = hexToHSL(primary);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--ring", hsl);
        root.style.setProperty("--sidebar-primary", hsl);
        root.style.setProperty("--sidebar-ring", hsl);
        root.style.setProperty("--chart-1", hsl);
      }
    }
    if (secondary) {
      const hsl = hexToHSL(secondary);
      if (hsl) {
        root.style.setProperty("--chart-2", hsl);
      }
    }

    return () => {
      // Al desmontar (si el usuario sale del área autenticada) limpiamos
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-ring");
      root.style.removeProperty("--chart-1");
      root.style.removeProperty("--chart-2");
    };
  }, [institution?.primaryColor, institution?.secondaryColor]);

  return institution;
}

export function AppLayout({ children, title, showSearch = false }: AppLayoutProps) {
  const institution = useInstitutionColors();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-4 h-16 px-4 border-b bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {/* Barra de color institucional debajo del header */}
              {institution?.primaryColor && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
                  style={{ background: `linear-gradient(to right, ${institution.primaryColor}, ${institution.secondaryColor || institution.primaryColor}80)` }}
                />
              )}
              {title && (
                <h1 className="font-serif font-semibold text-lg truncate">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              {showSearch && (
                <div className="hidden md:flex items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar..."
                      className="pl-9 w-64"
                      data-testid="input-search"
                    />
                  </div>
                </div>
              )}
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
