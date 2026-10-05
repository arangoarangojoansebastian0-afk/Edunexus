import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Bell, Search, Command, ArrowRight, X, Loader2 } from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import { useQuery } from "@tanstack/react-query";
import { useAccessibilityPreferences } from "@/hooks/useAccessibilityPreferences";

type SearchHit = { title: string; description: string; href: string };
type GlobalSearchData = Record<string, SearchHit[]>;

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

const quickLinks = [
  { title: "Inicio", description: "Panel y actividad reciente", href: "/", keywords: "panel inicio feed publicaciones" },
  { title: "Aula virtual", description: "Cursos y espacios de aprendizaje", href: "/classroom", keywords: "clase curso aula materia" },
  { title: "Grupos", description: "Comunidades y grupos académicos", href: "/groups", keywords: "grupo comunidad estudiantes" },
  { title: "Biblioteca", description: "Archivos y recursos compartidos", href: "/library", keywords: "archivo documento recurso pdf" },
  { title: "Calendario", description: "Eventos y fechas importantes", href: "/calendar", keywords: "evento fecha actividad" },
  { title: "Horarios", description: "Organización de clases", href: "/schedules", keywords: "horario clase agenda" },
  { title: "Mensajes", description: "Conversaciones directas y grupales", href: "/messages", keywords: "chat conversar mensaje" },
  { title: "Reuniones", description: "Videollamadas de EduNexus Meet", href: "/meet", keywords: "video llamada meet" },
  { title: "Asesorías", description: "Acompañamiento académico", href: "/tutoring", keywords: "tutoría ayuda asesoría" },
  { title: "Notificaciones", description: "Novedades y avisos", href: "/notifications", keywords: "alerta aviso campana" },
  { title: "Mi perfil", description: "Información personal", href: "/profile", keywords: "cuenta usuario perfil" },
  { title: "Configuración", description: "Preferencias de la plataforma", href: "/settings", keywords: "ajustes preferencias tema" },
  { title: "Administración", description: "Herramientas de gestión institucional", href: "/admin", keywords: "admin usuarios matrícula institución" },
];

export function AppLayout({ children, title }: AppLayoutProps) {
  useAccessibilityPreferences();
  const institution = useInstitutionColors();
  const [location, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.25rem",
  };

  const filteredLinks = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("es");
    if (!term) return quickLinks.slice(0, 6);
    return quickLinks.filter((item) => `${item.title} ${item.description} ${item.keywords}`.toLocaleLowerCase("es").includes(term)).slice(0, 8);
  }, [searchTerm]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedTerm(searchTerm.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const globalSearch = useQuery<GlobalSearchData>({
    queryKey: ["/api/search/global", debouncedTerm],
    enabled: searchOpen && debouncedTerm.length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const response = await fetch(`/api/search/global?q=${encodeURIComponent(debouncedTerm)}`, { credentials: "include" });
      if (!response.ok) throw new Error("No pudimos completar la búsqueda");
      return response.json();
    },
  });

  const resultGroups = useMemo(() => {
    const data = globalSearch.data;
    if (!data) return [];
    return [
      { label: "Personas", items: data.users || [] },
      { label: "Cursos", items: data.courses || [] },
      { label: "Actividades", items: data.activities || [] },
      { label: "Anuncios", items: data.announcements || [] },
      { label: "Comunidades", items: data.groups || [] },
      { label: "Publicaciones", items: data.posts || [] },
      { label: "Archivos", items: data.files || [] },
      { label: "Conversaciones", items: data.conversations || [] },
    ].filter((group) => group.items.length > 0);
  }, [globalSearch.data]);
  const firstGlobalResult = resultGroups[0]?.items[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => searchInput.current?.focus(), 30);
    else setSearchTerm("");
  }, [searchOpen]);

  const goTo = (href: string) => {
    setSearchOpen(false);
    navigate(href);
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="edunexus-app-shell flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="edunexus-topbar sticky top-0 z-40 flex items-center justify-between gap-3 h-16 px-3 sm:px-5 lg:px-7 border-b bg-background/85 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {title && <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hidden sm:block">EduNexus · Espacio educativo</p><h1 className="font-serif font-semibold text-base sm:text-lg truncate">{title}</h1></div>}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setSearchOpen(true)} className="edunexus-search-trigger h-9 justify-start gap-2 px-2.5 sm:px-3 text-muted-foreground" aria-label="Buscar en EduNexus">
                <Search className="h-4 w-4" /><span className="hidden sm:inline text-sm">Buscar en EduNexus</span><kbd className="ml-3 hidden lg:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium"><Command className="h-3 w-3"/> K</kbd>
              </Button>
              <Button asChild variant="ghost" size="icon" className="relative" aria-label="Abrir notificaciones"><Link href="/notifications"><Bell className="h-[18px] w-[18px]" /></Link></Button>
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="edunexus-main flex-1 overflow-auto">
            <div key={location} className="edunexus-page-enter">{children}</div>
          </main>
        </SidebarInset>
      </div>
      {searchOpen && (
        <div className="edunexus-command-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <section className="edunexus-command-panel" role="dialog" aria-modal="true" aria-label="Búsqueda rápida">
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="h-5 w-5 shrink-0 text-primary" />
              <input ref={searchInput} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Busca personas, cursos, tareas, publicaciones o archivos…" className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" onKeyDown={(event) => { if (event.key === "Enter") { const href = searchTerm.trim().length >= 2 ? firstGlobalResult?.href : filteredLinks[0]?.href; if (href) goTo(href); } }} />
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda"><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-2">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{searchTerm.trim().length >= 2 ? "Resultados en EduNexus" : "Accesos rápidos"}</p>
              {searchTerm.trim().length >= 2 ? globalSearch.isFetching && !globalSearch.data ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Buscando en tus espacios…</div>
              ) : globalSearch.isError ? (
                <div className="px-4 py-8 text-center text-sm text-destructive">No pudimos completar la búsqueda. Intenta nuevamente.</div>
              ) : resultGroups.length ? (
                <div className="max-h-[min(65vh,480px)] overflow-y-auto">
                  {resultGroups.map((group) => <section key={group.label} className="pb-2">
                    <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
                    {group.items.map((item) => <button type="button" key={`${group.label}-${item.href}-${item.title}`} onClick={() => goTo(item.href)} className="edunexus-command-result group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ArrowRight className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.description}</span></span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </button>)}
                  </section>)}
                </div>
              ) : <div className="px-4 py-10 text-center"><Search className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60"/><p className="text-sm font-medium">No encontramos resultados</p><p className="mt-1 text-xs text-muted-foreground">Prueba con otro nombre o palabra clave.</p></div> : filteredLinks.length ? filteredLinks.map((item) => (
                <button type="button" key={item.href} onClick={() => goTo(item.href)} className="edunexus-command-result group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ArrowRight className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.description}</span></span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </button>
              )) : <div className="px-4 py-10 text-center"><Search className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60"/><p className="text-sm font-medium">No encontramos resultados</p><p className="mt-1 text-xs text-muted-foreground">Prueba con “grupos”, “horarios” o “mensajes”.</p></div>}
            </div>
            <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground"><span>Navegación rápida de EduNexus</span><span>ESC para cerrar · ENTER para abrir</span></div>
          </section>
        </div>
      )}
    </SidebarProvider>
  );
}
