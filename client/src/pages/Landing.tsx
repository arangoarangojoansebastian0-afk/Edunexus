import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  GraduationCap, ArrowRight, Users, BookOpen, Calendar,
  ClipboardList, BarChart2, Monitor, Bell, Shield,
  FileText, Clock, CheckCircle, TrendingUp, Award,
  ChevronRight, Star, CalendarDays, Eye, Layers,
  ChevronDown,
} from "lucide-react";

// ── Colores de módulos ────────────────────────────────────────────────────────
const MODULE_COLORS = {
  dashboard: { bg: "#1e293b", accent: "#3b82f6" },
  horarios:  { bg: "#0f172a", accent: "#6366f1" },
  boletines: { bg: "#0c1a2e", accent: "#22c55e" },
  biblioteca: { bg: "#1a0f2e", accent: "#a855f7" },
  observador: { bg: "#1a1a0a", accent: "#f59e0b" },
  matricula:  { bg: "#0f1a10", accent: "#10b981" },
};

// ── Slides del hero animado ───────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart2,
    badge: "Indicadores en tiempo real",
    badgeIcon: TrendingUp,
    color: MODULE_COLORS.dashboard,
    render: () => <SlidesDashboard />,
  },
  {
    id: "horarios",
    label: "Horarios",
    icon: CalendarDays,
    badge: "Vista por grupo o docente",
    badgeIcon: CalendarDays,
    color: MODULE_COLORS.horarios,
    render: () => <SlidesHorarios />,
  },
  {
    id: "boletines",
    label: "Boletines",
    icon: FileText,
    badge: "Calificaciones por periodo",
    badgeIcon: FileText,
    color: MODULE_COLORS.boletines,
    render: () => <SlidesBoletines />,
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    icon: BookOpen,
    badge: "Documentos institucionales",
    badgeIcon: BookOpen,
    color: MODULE_COLORS.biblioteca,
    render: () => <SlidesBiblioteca />,
  },
  {
    id: "observador",
    label: "Observador",
    icon: Eye,
    badge: "Seguimiento del estudiante",
    badgeIcon: Eye,
    color: MODULE_COLORS.observador,
    render: () => <SlidesObservador />,
  },
  {
    id: "matricula",
    label: "Matrícula",
    icon: ClipboardList,
    badge: "Formulario en 7 pasos",
    badgeIcon: ClipboardList,
    color: MODULE_COLORS.matricula,
    render: () => <SlidesMatricula />,
  },
];

// ────────────────────────────────────────────────────────────────────────────
//  Ilustraciones SVG por módulo
// ────────────────────────────────────────────────────────────────────────────

function SlidesDashboard() {
  return (
    <svg viewBox="0 0 460 300" className="w-full" xmlns="http://www.w3.org/2000/svg">
      {/* Sidebar oscuro */}
      <rect width="90" height="300" rx="0" fill="#0f1623"/>
      <circle cx="45" cy="32" r="13" fill="#3b82f6" fillOpacity="0.9"/>
      <text x="45" y="37" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">EN</text>
      {[58,80,102,124,146,168,190].map((y,i) => (
        <g key={i}>
          <rect x="12" y={y} width={i===0?66:50} height="16" rx="5"
            fill={i===0?"#3b82f620":"transparent"}/>
          <rect x="17" y={y+4} width="8" height="8" rx="2"
            fill={i===0?"#3b82f6":"#4b5563"}/>
          <rect x="31" y={y+5} width={[34,28,36,22,30,26,20][i]} height="5" rx="2.5"
            fill={i===0?"#3b82f6":"#374151"}/>
        </g>
      ))}
      {/* Área principal */}
      <rect x="90" y="0" width="370" height="300" fill="#111827"/>
      {/* Header */}
      <rect x="106" y="14" width="160" height="9" rx="4.5" fill="#f9fafb" fillOpacity="0.9"/>
      <rect x="106" y="28" width="90" height="6" rx="3" fill="#6b7280"/>
      {/* KPI cards fila */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x={106+i*86} y="48" width="78" height="52" rx="8" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
          <rect x={112+i*86} y="55" width="10" height="10" rx="3"
            fill={["#3b82f630","#22c55e30","#f59e0b30","#a855f730"][i]}/>
          <rect x={126+i*86} y="57" width={[28,24,26,22][i]} height="5" rx="2.5" fill="#9ca3af"/>
          <rect x={112+i*86} y="70" width={[42,36,40,34][i]} height="14" rx="3" fill="#374151"/>
          <rect x={112+i*86} y="88" width={[22,18,20,16][i]} height="5" rx="2.5" fill="#6b7280"/>
        </g>
      ))}
      {/* Chart de barras */}
      <rect x="106" y="112" width="200" height="110" rx="8" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
      <rect x="114" y="120" width="70" height="6" rx="3" fill="#f9fafb" fillOpacity="0.8"/>
      {[0,1,2,3,4,5,6].map(i => {
        const heights = [45,60,38,70,52,65,42];
        const h = heights[i];
        return (
          <rect key={i} x={120+i*24} y={196-h} width="14" height={h} rx="3"
            fill={i===3?"#3b82f6":"#3b82f640"}/>
        );
      })}
      {["L","M","X","J","V","S","D"].map((d,i) => (
        <text key={i} x={127+i*24} y="208" textAnchor="middle" fill="#6b7280" fontSize="7">{d}</text>
      ))}
      {/* Panel derecho */}
      <rect x="318" y="112" width="136" height="50" rx="8" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
      <rect x="326" y="120" width="60" height="6" rx="3" fill="#f9fafb" fillOpacity="0.8"/>
      {[0,1,2].map(i => (
        <g key={i}>
          <rect x="326" y={132+i*10} width={[80,60,70][i]} height="6" rx="3" fill="#374151"/>
          <rect x={394} y={133+i*10} width="22" height="4" rx="2"
            fill={["#22c55e60","#f59e0b60","#3b82f660"][i]}/>
        </g>
      ))}
      <rect x="318" y="172" width="136" height="50" rx="8" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
      <rect x="326" y="180" width="70" height="6" rx="3" fill="#f9fafb" fillOpacity="0.8"/>
      {[0,1,2,3].map(i => (
        <rect key={i} x="326" y={192+i*8} width={[90,70,80,55][i]} height="5" rx="2.5" fill="#374151"/>
      ))}
      {/* KPI extra */}
      <rect x="106" y="232" width="312" height="50" rx="8" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
      <rect x="114" y="240" width="80" height="6" rx="3" fill="#f9fafb" fillOpacity="0.8"/>
      {[0,1,2,3].map(i => (
        <g key={i}>
          <circle cx={120+i*70} cy="261" r="8" fill={["#3b82f620","#22c55e20","#f59e0b20","#a855f720"][i]}/>
          <rect x={132+i*70} y="257" width={[40,36,38,32][i]} height="5" rx="2.5" fill="#4b5563"/>
          <rect x={132+i*70} y="264" width={[28,24,26,20][i]} height="4" rx="2" fill="#374151"/>
        </g>
      ))}
    </svg>
  );
}

function SlidesHorarios() {
  return (
    <svg viewBox="0 0 460 300" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="460" height="300" fill="#0f172a"/>
      {/* Header */}
      <rect x="16" y="14" width="120" height="9" rx="4.5" fill="#f8fafc" fillOpacity="0.9"/>
      <rect x="16" y="28" width="80" height="6" rx="3" fill="#64748b"/>
      {/* Controles */}
      <rect x="16" y="46" width="70" height="20" rx="6" fill="#6366f1" fillOpacity="0.9"/>
      <rect x="22" y="52" width="58" height="7" rx="3.5" fill="white"/>
      <rect x="92" y="46" width="70" height="20" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
      <rect x="98" y="52" width="58" height="7" rx="3.5" fill="#64748b"/>
      {/* Grilla de horario */}
      <rect x="16" y="76" width="428" height="210" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
      {/* Header días */}
      <rect x="16" y="76" width="428" height="24" rx="8" fill="#1e293b"/>
      <rect x="16" y="88" width="428" height="12" rx="0" fill="#0f172a" fillOpacity="0.5"/>
      {["", "Lunes","Martes","Miérc.","Jueves","Viernes"].map((d,i) => (
        <text key={i} x={i===0?38:62+i*74} y="86" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="600">{d}</text>
      ))}
      {/* Filas de horas */}
      {[0,1,2,3,4,5,6,7].map(row => (
        <g key={row}>
          <text x="34" y={108+row*22} textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">{`0${7+row}:00`}</text>
          <rect x="46" y={97+row*22} width="398" height="20" rx="0" fill={row%2===0?"#1e293b":"#1a2744"} fillOpacity="0.4"/>
          {[0,1,2,3,4].map(col => {
            const patterns = [
              [1,0,1,1,0],[0,1,1,0,1],[1,1,0,1,1],[0,1,0,1,0],
              [1,0,1,0,1],[0,1,1,1,0],[1,1,0,0,1],[0,0,1,1,1],
            ];
            const colors = ["#6366f1","#22c55e","#f59e0b","#a855f7","#3b82f6"];
            const labels = [
              ["Matemáticas","Español","Inglés","Ciencias","Historia"],
              ["Física","Arte","Química","Biología","Música"],
            ];
            const filled = patterns[row][col];
            if (!filled) return null;
            return (
              <rect key={col} x={62+col*74} y={100+row*22} width="66" height="14" rx="4"
                fill={colors[col]+"cc"}/>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function SlidesBoletines() {
  const subjects = ["Matemáticas","Español","Inglés","Ciencias","Historia","Arte","Física"];
  const grades = [
    [4.5,3.8,4.2,4.8],[3.2,4.1,3.9,4.5],[4.8,4.6,4.7,4.9],
    [3.5,3.8,4.0,4.2],[4.1,3.5,3.8,4.3],[4.6,4.8,4.5,4.7],[2.8,3.2,3.5,3.8],
  ];
  return (
    <svg viewBox="0 0 460 300" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="460" height="300" fill="#0c1a2e"/>
      <rect x="16" y="14" width="130" height="9" rx="4.5" fill="#f0fdf4" fillOpacity="0.9"/>
      <rect x="16" y="28" width="90" height="6" rx="3" fill="#4b5563"/>
      {/* Controles */}
      <rect x="16" y="46" width="90" height="18" rx="6" fill="#1e3a5f" stroke="#2d5a87" strokeWidth="1"/>
      <rect x="22" y="51" width="78" height="7" rx="3.5" fill="#6b7280"/>
      <rect x="114" y="46" width="70" height="18" rx="6" fill="#22c55e" fillOpacity="0.9"/>
      <rect x="120" y="51" width="58" height="7" rx="3.5" fill="white"/>
      {/* Tabla boletín */}
      <rect x="16" y="76" width="428" height="210" rx="8" fill="#112238" stroke="#1e3a5f" strokeWidth="1"/>
      {/* Header tabla */}
      {["Asignatura","P1","P2","P3","P4","Prom."].map((h,i) => (
        <text key={i} x={i===0?60:[200,240,280,320,370][i-1]} y="92" textAnchor="middle"
          fill="#9ca3af" fontSize="8" fontWeight="600">{h}</text>
      ))}
      <rect x="16" y="96" width="428" height="1" fill="#1e3a5f"/>
      {/* Filas */}
      {subjects.map((s,row) => {
        const gs = grades[row];
        const avg = (gs.reduce((a,b)=>a+b,0)/gs.length).toFixed(1);
        const avgN = parseFloat(avg);
        return (
          <g key={row}>
            <rect x="16" y={98+row*28} width="428" height="27" rx="0"
              fill={row%2===0?"#0d1f33":"#112238"}/>
            <text x="28" y={116+row*28} fill="#e5e7eb" fontSize="9">{s}</text>
            {gs.map((g,ci) => {
              const color = g>=4?"#22c55e":g>=3?"#f59e0b":"#ef4444";
              return (
                <g key={ci}>
                  <rect x={185+ci*40} y={103+row*28} width="30" height="16" rx="4" fill={color+"20"}/>
                  <text x={200+ci*40} y={115+row*28} textAnchor="middle" fill={color} fontSize="9" fontWeight="700">{g}</text>
                </g>
              );
            })}
            <rect x="352" y={103+row*28} width="36" height="16" rx="4"
              fill={avgN>=4?"#22c55e30":avgN>=3?"#f59e0b30":"#ef444430"}/>
            <text x="370" y={115+row*28} textAnchor="middle"
              fill={avgN>=4?"#22c55e":avgN>=3?"#f59e0b":"#ef4444"} fontSize="9" fontWeight="700">{avg}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SlidesBiblioteca() {
  const files = [
    { name:"Manual de convivencia", type:"PDF", color:"#a855f7", size:"2.4 MB"},
    { name:"PEI Institucional", type:"PDF", color:"#6366f1", size:"1.8 MB"},
    { name:"Calendario académico", type:"PDF", color:"#3b82f6", size:"840 KB"},
    { name:"Reglamento interno", type:"PDF", color:"#a855f7", size:"1.2 MB"},
    { name:"Guía de matemáticas", type:"PDF", color:"#22c55e", size:"3.1 MB"},
    { name:"Atlas ciencias naturales", type:"PDF", color:"#f59e0b", size:"5.6 MB"},
  ];
  return (
    <svg viewBox="0 0 460 300" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="460" height="300" fill="#1a0f2e"/>
      <rect x="16" y="14" width="110" height="9" rx="4.5" fill="#fdf4ff" fillOpacity="0.9"/>
      <rect x="16" y="28" width="75" height="6" rx="3" fill="#6b7280"/>
      {/* Search */}
      <rect x="16" y="46" width="260" height="20" rx="6" fill="#2d1a4e" stroke="#4c1d95" strokeWidth="1"/>
      <rect x="24" y="52" width="12" height="8" rx="2" fill="#7c3aed" fillOpacity="0.6"/>
      <rect x="42" y="54" width="100" height="5" rx="2.5" fill="#4c1d95"/>
      <rect x="284" y="46" width="60" height="20" rx="6" fill="#7c3aed" fillOpacity="0.8"/>
      <rect x="290" y="52" width="48" height="8" rx="4" fill="white" fillOpacity="0.8"/>
      {/* Grid de archivos */}
      {files.map((f, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 16 + col * 148;
        const y = 80 + row * 100;
        return (
          <g key={i}>
            <rect x={x} y={y} width="136" height="88" rx="8" fill="#2d1a4e" stroke="#4c1d9540" strokeWidth="1"/>
            {/* Icono archivo */}
            <rect x={x+12} y={y+12} width="36" height="44" rx="4" fill={f.color+"30"} stroke={f.color+"60"} strokeWidth="1"/>
            <rect x={x+18} y={y+20} width="24" height="4" rx="2" fill={f.color+"80"}/>
            <rect x={x+18} y={y+28} width="18" height="3" rx="1.5" fill={f.color+"60"}/>
            <rect x={x+18} y={y+34} width="22" height="3" rx="1.5" fill={f.color+"60"}/>
            <rect x={x+18} y={y+40} width="16" height="3" rx="1.5" fill={f.color+"60"}/>
            <rect x={x+12} y={y+60} width="20" height="9" rx="3" fill={f.color+"40"}/>
            <text x={x+22} y={y+68} textAnchor="middle" fill={f.color} fontSize="6" fontWeight="700">{f.type}</text>
            {/* Info */}
            <text x={x+56} y={y+24} fill="#e5e7eb" fontSize="7.5" fontWeight="600">{f.name.substring(0,18)}</text>
            <text x={x+56} y={y+35} fill="#9ca3af" fontSize="7">{f.name.length>18?f.name.substring(18):""}</text>
            <text x={x+56} y={y+50} fill="#6b7280" fontSize="6.5">{f.size}</text>
            <rect x={x+56} y={y+60} width="70" height="9" rx="3" fill={f.color+"20"}/>
            <text x={x+91} y={y+68} textAnchor="middle" fill={f.color} fontSize="6.5">Ver documento</text>
          </g>
        );
      })}
    </svg>
  );
}

function SlidesObservador() {
  const obs = [
    { type:"Positiva", text:"Excelente participación en clase", color:"#22c55e", student:"García, Ana"},
    { type:"Compromiso", text:"Entrega de tareas pendientes", color:"#f59e0b", student:"López, Juan"},
    { type:"Seguimiento", text:"Asistencia irregular detectada", color:"#3b82f6", student:"Martínez, Luis"},
    { type:"Negativa", text:"Comportamiento disruptivo en patio", color:"#ef4444", student:"Pérez, Sara"},
    { type:"Positiva", text:"Liderazgo en proyecto de ciencias", color:"#22c55e", student:"Torres, María"},
  ];
  return (
    <svg viewBox="0 0 460 300" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="460" height="300" fill="#1a1a0a"/>
      <rect x="16" y="14" width="120" height="9" rx="4.5" fill="#fefce8" fillOpacity="0.9"/>
      <rect x="16" y="28" width="85" height="6" rx="3" fill="#6b7280"/>
      {/* Filtros */}
      {["Todos","Positivas","Compromisos","Negativas"].map((f,i) => (
        <rect key={i} x={16+i*96} y="44" width="88" height="16" rx="5"
          fill={i===0?"#f59e0b":"#292000"} stroke={i===0?"transparent":"#3d3000"} strokeWidth="1"/>
      ))}
      {["Todos","Positivas","Compromisos","Negativas"].map((f,i) => (
        <text key={i} x={60+i*96} y="55" textAnchor="middle"
          fill={i===0?"white":"#78716c"} fontSize="7.5" fontWeight={i===0?"600":"400"}>{f}</text>
      ))}
      {/* Lista observaciones */}
      {obs.map((o,i) => (
        <g key={i}>
          <rect x="16" y={72+i*44} width="428" height="38" rx="8"
            fill="#1f1f0a" stroke="#2d2d10" strokeWidth="1"/>
          {/* Dot tipo */}
          <circle cx="32" cy={91+i*44} r="6" fill={o.color+"30"}/>
          <circle cx="32" cy={91+i*44} r="3" fill={o.color}/>
          {/* Badge tipo */}
          <rect x="42" y={80+i*44} width="58" height="12" rx="4" fill={o.color+"20"}/>
          <text x="71" y={89+i*44} textAnchor="middle" fill={o.color} fontSize="6.5" fontWeight="600">{o.type}</text>
          {/* Texto */}
          <text x="108" y={88+i*44} fill="#e5e7eb" fontSize="8">{o.text}</text>
          {/* Estudiante */}
          <text x="108" y={99+i*44} fill="#78716c" fontSize="7">{o.student}</text>
          {/* Fecha */}
          <text x="424" y={89+i*44} textAnchor="end" fill="#57534e" fontSize="7">Hoy, 10:30</text>
        </g>
      ))}
    </svg>
  );
}

function SlidesMatricula() {
  const steps = [
    "Datos de matrícula","Ubicación escolar","Año anterior",
    "Situación académica","Director de grupo","Asignaturas","Convivencia",
  ];
  return (
    <svg viewBox="0 0 460 300" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="460" height="300" fill="#0f1a10"/>
      <rect x="16" y="14" width="130" height="9" rx="4.5" fill="#f0fdf4" fillOpacity="0.9"/>
      <rect x="16" y="28" width="90" height="6" rx="3" fill="#4b5563"/>
      {/* Stepper */}
      {steps.map((s,i) => (
        <g key={i}>
          <circle cx={26+i*60} cy="60" r="10"
            fill={i<3?"#10b981":i===3?"#10b98130":"#1f2937"}
            stroke={i===3?"#10b981":"transparent"} strokeWidth="1.5"/>
          {i<3 ? (
            <text x={26+i*60} y="64" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">✓</text>
          ) : (
            <text x={26+i*60} y="64" textAnchor="middle" fill={i===3?"#10b981":"#6b7280"} fontSize="7" fontWeight="700">{i+1}</text>
          )}
          {i<6 && <rect x={36+i*60} y="58" width="40" height="3" rx="1.5" fill={i<2?"#10b981":"#1f2937"}/>}
        </g>
      ))}
      <text x="26" y="80" textAnchor="middle" fill="#10b981" fontSize="6.5" fontWeight="600">Paso 4</text>
      {/* Formulario */}
      <rect x="16" y="90" width="428" height="196" rx="10" fill="#112211" stroke="#1a3320" strokeWidth="1"/>
      <rect x="28" y="102" width="150" height="7" rx="3.5" fill="#f0fdf4" fillOpacity="0.8"/>
      <rect x="28" y="113" width="100" height="6" rx="3" fill="#374151"/>
      {[
        ["Sede educativa","Jornada"],
        ["Grado actual","Director de grupo"],
        ["Repitencia","Situación especial"],
        ["Modalidad","Año lectivo"],
      ].map((row, ri) => (
        <g key={ri}>
          {row.map((label, ci) => (
            <g key={ci}>
              <text x={28+ci*210} y={138+ri*38} fill="#9ca3af" fontSize="7">{label}</text>
              <rect x={28+ci*210} y={142+ri*38} width="196" height="20" rx="6"
                fill="#1a3320" stroke="#2d5a3d" strokeWidth="1"/>
              <rect x={36+ci*210} y={149+ri*38} width={[80,60,90,55,70,65,75,58][ri*2+ci]} height="6" rx="3" fill="#374151"/>
              <rect x={210+ci*200} y={149+ri*38} width="8" height="6" rx="1" fill="#4b5563"/>
            </g>
          ))}
        </g>
      ))}
      {/* Botones */}
      <rect x="304" y="264" width="68" height="18" rx="6" fill="#10b981"/>
      <text x="338" y="276" textAnchor="middle" fill="white" fontSize="8" fontWeight="600">Continuar</text>
      <rect x="228" y="264" width="68" height="18" rx="6" fill="#1a3320" stroke="#2d5a3d" strokeWidth="1"/>
      <text x="262" y="276" textAnchor="middle" fill="#9ca3af" fontSize="8">Anterior</text>
    </svg>
  );
}

// ── Componente animado del hero ───────────────────────────────────────────────
function AnimatedHeroMockup() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const goTo = (idx: number) => {
    if (idx === active || animating) return;
    setAnimating(true);
    setVisible(false);
    setTimeout(() => {
      setActive(idx);
      setVisible(true);
      setAnimating(false);
    }, 280);
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const next = (active + 1) % HERO_SLIDES.length;
      goTo(next);
    }, 3200);
    return () => clearTimeout(timerRef.current);
  }, [active, animating]);

  const slide = HERO_SLIDES[active];
  const BadgeIcon = slide.badgeIcon;

  return (
    <div className="relative">
      {/* Glow de fondo */}
      <div
        className="absolute -inset-6 rounded-3xl blur-3xl opacity-30 transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${slide.color.accent}60, transparent 70%)` }}
      />

      {/* Ventana del mockup */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Barra de chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: slide.color.bg }}>
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70"/>
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70"/>
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70"/>
          <div className="ml-3 flex-1 h-4 rounded-full bg-white/5 flex items-center px-3">
            <span className="text-white/30 text-[9px]">edunexus.app/{slide.id}</span>
          </div>
        </div>

        {/* Contenido que anima */}
        <div
          className="transition-all duration-280"
          style={{
            background: slide.color.bg,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(6px)",
          }}
        >
          {slide.render()}
        </div>
      </div>

      {/* Badge flotante inferior izquierda */}
      <div className="absolute -bottom-3 -left-4 bg-card border rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 transition-all duration-500">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-xs font-medium">Matrícula activa</span>
      </div>

      {/* Badge flotante superior derecha */}
      <div
        className="absolute -top-3 -right-4 border rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 transition-all duration-500"
        style={{ background: slide.color.accent + "20", borderColor: slide.color.accent + "40" }}
      >
        <BadgeIcon className="h-4 w-4" style={{ color: slide.color.accent }} />
        <span className="text-xs font-medium" style={{ color: slide.color.accent }}>{slide.badge}</span>
      </div>

      {/* Tabs de navegación de secciones */}
      <div className="absolute -bottom-14 left-0 right-0 flex justify-center gap-2.5">
        {HERO_SLIDES.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === active;
          return (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              title={s.label}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                isActive
                  ? "text-white shadow-md scale-105 border-transparent"
                  : "bg-background/80 text-muted-foreground hover:text-foreground border-border hover:border-border/80 hover:scale-102"
              }`}
              style={isActive ? { background: s.color.accent, boxShadow: `0 0 12px ${s.color.accent}60` } : {}}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon, title, description, color, accent,
}: { icon: any; title: string; description: string; color: string; accent?: string }) {
  return (
    <Card className="group hover:shadow-md hover:-translate-y-1 transition-all duration-200 border-border/60 overflow-hidden relative">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${accent||"hsl(var(--primary))"}08, transparent)` }}/>
      <CardContent className="p-5 relative">
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
    <div className="text-center px-6 py-4">
      <p className="text-3xl font-bold text-primary tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ── Role card ─────────────────────────────────────────────────────────────────
function RoleCard({ icon: Icon, title, description, features, color, borderColor }:
  { icon: any; title: string; description: string; features: string[]; color: string; borderColor: string }) {
  return (
    <Card className={`border-2 ${borderColor} transition-all duration-200 hover:shadow-lg`}
      style={{ background: `linear-gradient(160deg, ${color}06, transparent)` }}>
      <CardContent className="p-6 space-y-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center`} style={{ background: color+"20" }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
        </div>
        <ul className="space-y-1.5">
          {features.map(f => (
            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
              <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color }} />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">EduNexus</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#modulos" className="hover:text-foreground transition-colors">Módulos</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Para quién</a>
            <a href="#indicadores" className="hover:text-foreground transition-colors">Indicadores</a>
          </nav>
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
      <section className="pt-28 pb-28 md:pt-36 md:pb-36">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
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
              <div className="flex flex-wrap gap-2 pt-1">
                {["Estudiantes","Docentes","Directivos","Coordinadores","Secretaría"].map((r) => (
                  <span key={r} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">{r}</span>
                ))}
              </div>
            </div>

            {/* Mockup animado */}
            <div className="relative mt-6 mb-16 lg:mb-0">
              <AnimatedHeroMockup />
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

      {/* ── PARA QUIÉN ── */}
      <section id="roles" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-4">
              <Users className="h-3.5 w-3.5" />
              Para toda la institución
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Una plataforma para cada rol</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada miembro de la comunidad educativa tiene su propio espacio con herramientas adaptadas a su rol.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <RoleCard
              icon={BarChart2}
              title="Directivos y Admin"
              description="Panel completo con indicadores institucionales en tiempo real. Gestión total de la institución."
              features={["Dashboard con KPIs reales","Matrícula completa (7 secciones)","Horarios tipo ASC","Boletines por grupo y periodo","Observador del estudiante"]}
              color="#3b82f6"
              borderColor="border-blue-500/30"
            />
            <RoleCard
              icon={Monitor}
              title="Docentes"
              description="Aula virtual propia, registro de asistencia, calificaciones y comunicación directa con estudiantes."
              features={["Cursos y aula virtual","Registro de asistencia","Calificaciones por periodo","Actividades y entregas","Asesorías y calendario"]}
              color="#22c55e"
              borderColor="border-green-500/30"
            />
            <RoleCard
              icon={GraduationCap}
              title="Estudiantes"
              description="Acceso a horario, cursos, biblioteca, muro social, grupos, logros y documentos importantes."
              features={["Horario del grupo","Cursos y actividades","Biblioteca académica","Muro y grupos sociales","Manual de convivencia"]}
              color="#a855f7"
              borderColor="border-purple-500/30"
            />
          </div>
        </div>
      </section>

      {/* ── MÓDULOS ── */}
      <section id="modulos" className="py-20 md:py-28 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-4">
              <Layers className="h-3.5 w-3.5" />
              Módulos integrados
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo conectado</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada módulo está diseñado para una necesidad real y conectado con los demás.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={ClipboardList} title="Matrícula"
              description="Formulario completo con 7 secciones: datos del estudiante, ubicación escolar, situación académica, director de grupo, asignaturas y convivencia."
              color="bg-blue-500/10 text-blue-600" accent="#3b82f6"/>
            <FeatureCard icon={Clock} title="Horarios"
              description="Vista tipo ASC en grilla días × horas. Filtrable por grupo o por docente. Sección pública accesible para toda la institución."
              color="bg-indigo-500/10 text-indigo-600" accent="#6366f1"/>
            <FeatureCard icon={FileText} title="Boletines"
              description="Calificaciones consolidadas por estudiante, materia y periodo académico. Vista de tabla por grupo completa."
              color="bg-green-500/10 text-green-600" accent="#22c55e"/>
            <FeatureCard icon={Bell} title="Observador"
              description="Registro de observaciones por tipo (positiva, negativa, compromiso, seguimiento) con historial completo por estudiante."
              color="bg-amber-500/10 text-amber-600" accent="#f59e0b"/>
            <FeatureCard icon={BarChart2} title="Indicadores"
              description="Asistencia promedio, rendimiento por materia y grupo, estudiantes en riesgo y actividad reciente — todos calculados sobre datos reales."
              color="bg-purple-500/10 text-purple-600" accent="#a855f7"/>
            <FeatureCard icon={Monitor} title="Aula Virtual"
              description="Cursos, actividades, entregas y seguimiento de estudiantes integrado al resto del sistema de gestión."
              color="bg-cyan-500/10 text-cyan-600" accent="#06b6d4"/>
            <FeatureCard icon={BookOpen} title="Biblioteca"
              description="Archivos aprobados por el administrador con visor integrado. PDFs, imágenes y documentos se abren sin descargar."
              color="bg-rose-500/10 text-rose-600" accent="#f43f5e"/>
            <FeatureCard icon={Shield} title="Multi-institución"
              description="Cada colegio ve solo sus datos. Todos los registros están aislados por institución con validación en backend."
              color="bg-teal-500/10 text-teal-600" accent="#14b8a6"/>
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
              <h2 className="text-3xl md:text-4xl font-bold">Matrícula completa en un solo formulario</h2>
              <p className="text-muted-foreground leading-relaxed">
                El módulo de matrículas recoge toda la información necesaria: desde el número de matrícula generado automáticamente hasta los compromisos de convivencia, pasando por la sede, jornada, director de grupo y asignaturas del grado.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { n:"1", t:"Información de matrícula" },
                  { n:"2", t:"Ubicación escolar" },
                  { n:"3", t:"Año anterior" },
                  { n:"4", t:"Situación académica" },
                  { n:"5", t:"Director de grupo" },
                  { n:"6", t:"Asignaturas del grado" },
                  { n:"7", t:"Convivencia" },
                ].map(({ n, t }) => (
                  <div key={n} className="flex items-center gap-2.5 text-sm">
                    <span className="h-6 w-6 rounded-full bg-green-500/10 text-green-600 text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
                    <span className="text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl blur-xl" />
              <div className="relative rounded-2xl overflow-hidden border shadow-xl">
                <SlidesMatricula />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INDICADORES SHOWCASE ── */}
      <section id="indicadores" className="py-20 md:py-28 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: CheckCircle, label: "Asistencia promedio", value: "94.2%", color: "text-green-600", bg: "bg-green-500/10", desc: "Por semana o por periodo" },
                  { icon: TrendingUp, label: "Rendimiento académico", value: "4.1", color: "text-blue-600", bg: "bg-blue-500/10", desc: "Por materia y por grupo" },
                  { icon: Award, label: "Estudiantes en riesgo", value: "3", color: "text-amber-600", bg: "bg-amber-500/10", desc: "Con motivo detallado" },
                  { icon: BarChart2, label: "Actividad reciente (7d)", value: "24", color: "text-purple-600", bg: "bg-purple-500/10", desc: "Filtrable por grado/grupo" },
                ].map((item) => (
                  <Card key={item.label} className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
                    <CardContent className="p-4 space-y-2">
                      <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <p className="text-2xl font-bold tabular-nums">{item.value}</p>
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
              <h2 className="text-3xl md:text-4xl font-bold">Decisiones basadas en datos reales</h2>
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
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-4">
              <FileText className="h-3.5 w-3.5" />
              Información institucional
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Centralizada y siempre disponible</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Todos los documentos y la información importante del colegio en un solo lugar, siempre actualizado.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { icon: FileText, label: "Manual de convivencia", desc: "PDF embebido visible desde la página principal", color: "#6366f1" },
              { icon: BookOpen, label: "PEI", desc: "Proyecto Educativo Institucional siempre disponible", color: "#3b82f6" },
              { icon: Calendar, label: "Calendario académico", desc: "Fechas importantes del año escolar", color: "#22c55e" },
              { icon: Users, label: "Misión y visión", desc: "Identidad institucional accesible para todos", color: "#a855f7" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="group text-center p-5 rounded-xl border bg-card hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors"
                  style={{ background: color+"15" }}>
                  <Icon className="h-5 w-5" style={{ color }} />
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
          <h2 className="text-3xl md:text-4xl font-bold">¿Tu colegio listo para EduNexus?</h2>
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
