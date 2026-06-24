import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  GraduationCap, ArrowRight, Users, BookOpen, Calendar,
  ClipboardList, BarChart2, Monitor, Bell, Shield,
  FileText, Clock, CheckCircle, TrendingUp, Award,
  ChevronRight, Star,
} from "lucide-react";

// ── Ilustración SVG del panel admin ──────────────────────────────────────────
function DashboardIllustration() {
  return (
    <svg viewBox="0 0 480 320" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="320" rx="16" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5"/>
      {/* Sidebar */}
      <rect x="0" y="0" width="100" height="320" rx="16" fill="hsl(var(--muted))"/>
      <rect x="0" y="0" width="16" height="320" fill="hsl(var(--muted))"/>
      <circle cx="50" cy="36" r="14" fill="hsl(var(--primary))"/>
      <text x="50" y="41" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">EN</text>
      {[60,90,120,150,180,210,240].map((y, i) => (
        <rect key={i} x="16" y={y} width={i === 0 ? 84 : 68} height="20" rx="6"
          fill={i === 0 ? "hsl(var(--primary)/0.2)" : "transparent"}/>
      ))}
      {[60,90,120,150,180,210,240].map((y, i) => (
        <rect key={i} x="22" y={y+5} width="10" height="10" rx="2" fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.4)"}/>
      ))}
      {[60,90,120,150,180,210,240].map((y, i) => (
        <rect key={i} x="38" y={y+7} width={[42,36,48,30,44,38,32][i]} height="6" rx="3" fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.3)"}/>
      ))}
      {/* Header */}
      <rect x="108" y="12" width="200" height="10" rx="5" fill="hsl(var(--foreground)/0.8)"/>
      <rect x="108" y="28" width="120" height="7" rx="3.5" fill="hsl(var(--muted-foreground)/0.4)"/>
      {/* Stat cards row 1 */}
      {[0,1,2,3,4].map((i) => (
        <g key={i}>
          <rect x={108 + i*73} y="50" width="66" height="54" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
          <rect x={114 + i*73} y="58" width="12" height="12" rx="3" fill={["hsl(221,83%,53%/0.15)","hsl(142,71%,45%/0.15)","hsl(280,68%,60%/0.15)","hsl(32,95%,44%/0.15)","hsl(346,77%,49%/0.15)"][i]}/>
          <rect x={130 + i*73} y="61" width={[30,24,28,26,20][i]} height="6" rx="3" fill="hsl(var(--foreground)/0.7)"/>
          <rect x={114 + i*73} y="76" width={[40,32,36,30,42][i]} height="20" rx="4" fill="hsl(var(--muted)/0.5)"/>
          <rect x={114 + i*73} y="92" width={[28,20,24,18,30][i]} height="6" rx="3" fill="hsl(var(--muted-foreground)/0.4)"/>
        </g>
      ))}
      {/* Indicator cards row 2 */}
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x={108 + i*91} y="115" width="84" height="44" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
          <rect x={114 + i*91} y="122" width="12" height="12" rx="3" fill={["hsl(142,71%,45%/0.15)","hsl(221,83%,53%/0.15)","hsl(32,95%,44%/0.15)","hsl(280,68%,60%/0.15)"][i]}/>
          <rect x={132 + i*91} y="125" width={[36,40,38,30][i]} height="6" rx="3" fill="hsl(var(--foreground)/0.6)"/>
          <rect x={114 + i*91} y="139" width={[28,32,24,36][i]} height="14" rx="3" fill="hsl(var(--muted)/0.5)"/>
          <rect x={144 + i*91} y="143" width={[18,16,22,14][i]} height="6" rx="3" fill="hsl(var(--muted-foreground)/0.3)"/>
        </g>
      ))}
      {/* Schedule grid */}
      <rect x="108" y="170" width="180" height="128" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
      <rect x="116" y="178" width="80" height="7" rx="3.5" fill="hsl(var(--foreground)/0.7)"/>
      {["hsl(221,83%,53%)","hsl(142,71%,45%)","hsl(280,68%,60%)","hsl(32,95%,44%)","hsl(346,77%,49%)"].map((c, i) => (
        <rect key={i} x={116 + i*32} y="192" width="26" height="7" rx="3.5" fill={c + "/0.6"}/>
      ))}
      {[0,1,2,3,4,5].map((row) =>
        [0,1,2,3,4].map((col) => {
          const filled = (row + col) % 3 !== 0;
          const color = ["hsl(221,83%,53%)","hsl(142,71%,45%)","hsl(280,68%,60%)","hsl(32,95%,44%)","hsl(346,77%,49%)"][col];
          return filled ? (
            <rect key={`${row}-${col}`} x={116 + col*32} y={206 + row*15} width="26" height="12" rx="3"
              fill={color + "/0.5"}/>
          ) : null;
        })
      )}
      {/* Right panel */}
      <rect x="298" y="170" width="170" height="56" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
      <rect x="306" y="178" width="70" height="7" rx="3.5" fill="hsl(var(--foreground)/0.7)"/>
      {[0,1,2].map((i) => (
        <g key={i}>
          <rect x="306" y={192 + i*12} width={[90,70,80][i]} height="8" rx="4" fill="hsl(var(--muted)/0.7)"/>
          <rect x={402} y={194 + i*12} width="28" height="5" rx="2.5" fill={["hsl(142,71%,45%/0.6)","hsl(32,95%,44%/0.6)","hsl(221,83%,53%/0.6)"][i]}/>
        </g>
      ))}
      <rect x="298" y="234" width="170" height="64" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
      <rect x="306" y="242" width="90" height="7" rx="3.5" fill="hsl(var(--foreground)/0.7)"/>
      {[0,1,2,3].map((i) => (
        <rect key={i} x="306" y={256 + i*10} width={[120,90,110,70][i]} height="6" rx="3" fill="hsl(var(--muted-foreground)/0.3)"/>
      ))}
    </svg>
  );
}

// ── Ilustración de matrícula ──────────────────────────────────────────────────
function EnrollmentIllustration() {
  return (
    <svg viewBox="0 0 320 200" className="w-full max-w-md mx-auto" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5"/>
      <rect x="16" y="16" width="120" height="8" rx="4" fill="hsl(var(--primary))"/>
      <rect x="16" y="30" width="80" height="6" rx="3" fill="hsl(var(--muted-foreground)/0.4)"/>
      {[0,1,2,3].map((i) => (
        <g key={i}>
          <rect x="16" y={50 + i*36} width="60" height="6" rx="3" fill="hsl(var(--muted-foreground)/0.5)"/>
          <rect x="16" y={62 + i*36} width="120" height="14" rx="6" fill="hsl(var(--muted)/0.7)" stroke="hsl(var(--border))" strokeWidth="1"/>
          <rect x="160" y={50 + i*36} width="60" height="6" rx="3" fill="hsl(var(--muted-foreground)/0.5)"/>
          <rect x="160" y={62 + i*36} width="144" height="14" rx="6" fill="hsl(var(--muted)/0.7)" stroke="hsl(var(--border))" strokeWidth="1"/>
        </g>
      ))}
      <rect x="220" y="168" width="84" height="20" rx="8" fill="hsl(var(--primary))"/>
      <rect x="228" y="175" width="68" height="6" rx="3" fill="white"/>
    </svg>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color }: { icon: any; title: string; description: string; color: string }) {
  return (
    <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-border/60">
      <CardContent className="p-5">
        <div className={`rounded-xl w-11 h-11 flex items-center justify-center mb-4 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-base mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-6 py-3">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">EduNexus</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Registrarse <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Texto */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary border border-primary/20">
                <Star className="h-3.5 w-3.5" />
                Plataforma de gestión educativa integral
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Todo tu colegio,{" "}
                <span className="text-primary">en un solo lugar</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                EduNexus centraliza la gestión académica, las comunicaciones y la vida institucional.
                Matrículas, horarios, boletines, observador y comunidad — conectados para estudiantes, docentes y directivos.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg" className="h-11 px-6">
                    Comenzar ahora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-11 px-6">
                    Ya tengo cuenta
                  </Button>
                </Link>
              </div>
              {/* Roles */}
              <div className="flex flex-wrap gap-2 pt-1">
                {["Estudiantes","Docentes","Directivos","Coordinadores","Secretaría"].map((r) => (
                  <span key={r} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/60">
                <DashboardIllustration />
              </div>
              {/* Floating badges */}
              <div className="absolute -bottom-3 -left-4 bg-card border rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium">Matrícula activa</span>
              </div>
              <div className="absolute -top-3 -right-4 bg-card border rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Indicadores en tiempo real</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-8 border-y bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex flex-wrap justify-center divide-x">
            <StatPill value="7" label="Módulos integrados" />
            <StatPill value="5" label="Roles de usuario" />
            <StatPill value="360°" label="Vista institucional" />
            <StatPill value="100%" label="Datos por institución" />
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ES ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Una plataforma para toda la institución
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada miembro de la comunidad educativa tiene su propio espacio y herramientas adaptadas a su rol.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Directivos / Admin */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Directivos y Admin</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Panel completo con indicadores institucionales en tiempo real. Gestión de matrículas, horarios, boletines, observador estudiantil y documentos del colegio.
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {["Dashboard con KPIs reales","Matrícula completa (7 secciones)","Horarios tipo ASC","Boletines por grupo y periodo","Observador del estudiante"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Docentes */}
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Docentes</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Aula virtual propia, registro de asistencia, calificaciones, actividades y comunicación directa con estudiantes y padres de familia.
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {["Cursos y aula virtual","Registro de asistencia","Calificaciones por periodo","Actividades y entregas","Asesorías y calendario"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Estudiantes */}
            <Card className="border-purple-500/30 bg-purple-500/5">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Estudiantes</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Acceso a su horario, cursos, biblioteca, muro social de la institución, grupos, logros y documentos importantes del colegio.
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {["Horario del grupo","Cursos y actividades","Biblioteca académica","Muro y grupos sociales","Manual de convivencia"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5 text-purple-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── MÓDULOS PRINCIPALES ── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Módulos integrados
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada módulo está diseñado para una necesidad real del colegio y conectado con los demás.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={ClipboardList}
              title="Matrícula"
              description="Formulario completo con 7 secciones: datos del estudiante, ubicación escolar, situación académica, director de grupo, asignaturas y convivencia."
              color="bg-blue-500/10 text-blue-600"
            />
            <FeatureCard
              icon={Clock}
              title="Horarios"
              description="Vista tipo ASC en grilla días × horas. Filtrable por grupo o por docente. Sección pública accesible para toda la institución."
              color="bg-indigo-500/10 text-indigo-600"
            />
            <FeatureCard
              icon={FileText}
              title="Boletines"
              description="Calificaciones consolidadas por estudiante, materia y periodo académico. Vista de tabla por grupo completa."
              color="bg-green-500/10 text-green-600"
            />
            <FeatureCard
              icon={Bell}
              title="Observador"
              description="Registro de observaciones por tipo (positiva, negativa, compromiso, seguimiento) con historial completo por estudiante."
              color="bg-amber-500/10 text-amber-600"
            />
            <FeatureCard
              icon={BarChart2}
              title="Indicadores de gestión"
              description="Asistencia promedio, rendimiento por materia y grupo, estudiantes en riesgo y actividad reciente — todos calculados sobre datos reales."
              color="bg-purple-500/10 text-purple-600"
            />
            <FeatureCard
              icon={Monitor}
              title="Aula Virtual"
              description="Cursos, actividades, entregas y seguimiento de estudiantes integrado al resto del sistema de gestión."
              color="bg-cyan-500/10 text-cyan-600"
            />
            <FeatureCard
              icon={BookOpen}
              title="Biblioteca"
              description="Archivos aprobados por el administrador con visor integrado. PDFs, imágenes y documentos se abren sin descargar."
              color="bg-rose-500/10 text-rose-600"
            />
            <FeatureCard
              icon={Shield}
              title="Multi-institución"
              description="Cada colegio ve solo sus datos. Todos los registros están aislados por institución con validación en backend."
              color="bg-teal-500/10 text-teal-600"
            />
          </div>
        </div>
      </section>

      {/* ── MATRÍCULA SHOWCASE ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3.5 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 border border-green-500/20">
                <ClipboardList className="h-3.5 w-3.5" />
                Sistema de matrículas
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Matrícula completa en un solo formulario
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                El módulo de matrículas recoge toda la información necesaria: desde el número de matrícula generado automáticamente hasta los compromisos de convivencia, pasando por la sede, jornada, director de grupo y asignaturas del grado.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { n: "1", t: "Información de matrícula" },
                  { n: "2", t: "Ubicación escolar" },
                  { n: "3", t: "Año anterior" },
                  { n: "4", t: "Situación académica" },
                  { n: "5", t: "Director de grupo" },
                  { n: "6", t: "Asignaturas del grado" },
                  { n: "7", t: "Convivencia" },
                ].map(({ n, t }) => (
                  <div key={n} className="flex items-center gap-2.5 text-sm">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {n}
                    </span>
                    <span className="text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl blur-xl" />
              <div className="relative rounded-2xl overflow-hidden border shadow-xl">
                <EnrollmentIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INDICADORES SHOWCASE ── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="order-2 lg:order-1">
              {/* Indicadores mockup */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: CheckCircle, label: "Asistencia promedio", value: "94.2%", color: "text-green-600", bg: "bg-green-500/10", desc: "Por semana o por periodo" },
                  { icon: TrendingUp, label: "Rendimiento académico", value: "4.1", color: "text-blue-600", bg: "bg-blue-500/10", desc: "Por materia y por grupo" },
                  { icon: Award, label: "Estudiantes en riesgo", value: "3", color: "text-amber-600", bg: "bg-amber-500/10", desc: "Con motivo detallado" },
                  { icon: BarChart2, label: "Actividad reciente (7d)", value: "24", color: "text-purple-600", bg: "bg-purple-500/10", desc: "Filtrable por grado/grupo" },
                ].map((item) => (
                  <Card key={item.label} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 space-y-2">
                      <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs font-medium leading-tight">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Haz clic en cualquier indicador para ver el detalle completo
              </p>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3.5 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 border border-purple-500/20">
                <BarChart2 className="h-3.5 w-3.5" />
                Indicadores de gestión
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Decisiones basadas en datos reales
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Los 4 indicadores del panel de admin se calculan sobre los datos reales de tu institución — no son números de ejemplo. Cada uno es clicable y abre un panel de detalle con la información completa.
              </p>
              <ul className="space-y-3">
                {[
                  "Asistencia promedio por semana o por periodo académico",
                  "Rendimiento por materia Y por grupo en la misma pantalla",
                  "Estudiantes en riesgo: promedio bajo, ausentismo u observaciones graves",
                  "Actividad reciente filtrable por grado y por grupo",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── INFO INSTITUCIONAL ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Información institucional centralizada
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Todos los documentos y la información importante del colegio en un solo lugar, siempre actualizado.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { icon: FileText, label: "Manual de convivencia", desc: "PDF embebido visible desde la página principal" },
              { icon: BookOpen, label: "PEI", desc: "Proyecto Educativo Institucional siempre disponible" },
              { icon: Calendar, label: "Calendario académico", desc: "Fechas importantes del año escolar" },
              { icon: Users, label: "Misión y visión", desc: "Identidad institucional accesible para todos" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center p-5 rounded-xl border bg-card hover:border-primary/40 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            ¿Tu colegio listo para EduNexus?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Regístrate con el código de tu institución y accede a la plataforma completa. Estudiantes, docentes y directivos en un mismo sistema.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-11 px-7">
                Registrarse ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 px-7 border-white/30 text-white hover:bg-white/10">
                Iniciar sesión
              </Button>
            </Link>
          </div>
          <p className="text-xs text-primary-foreground/60">
            Necesitas el código de tu institución para registrarte
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">EduNexus</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} EduNexus — Plataforma de gestión educativa institucional
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Registrarse</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
