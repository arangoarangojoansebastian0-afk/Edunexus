import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { GraduationCap, ArrowRight, Loader2, ChevronDown } from "lucide-react";

type Role = "student" | "teacher" | "director" | "coordinator" | "secretary" | "admin" | "parent";

const roleOptions: { value: Role; label: string; description: string; needsCode: boolean }[] = [
  { value: "student",     label: "Estudiante",    description: "Acceso al aula y comunidad",         needsCode: false },
  { value: "parent",      label: "Padre/Acudiente", description: "Seguimiento de tus hijos",         needsCode: false },
  { value: "teacher",     label: "Maestro",       description: "Gestión de cursos y calificaciones", needsCode: true  },
  { value: "coordinator", label: "Coordinador",   description: "Coordinación académica",             needsCode: true  },
  { value: "director",    label: "Director",      description: "Dirección de grupo o área",          needsCode: true  },
  { value: "secretary",   label: "Secretaria",    description: "Gestión administrativa",             needsCode: true  },
  { value: "admin",       label: "Administrador", description: "Control total del sistema",          needsCode: true  },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetchUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const [schoolCode, setSchoolCode] = useState("");
  const [schoolData, setSchoolData] = useState<{ institution: { id: string; name: string; code: string }; grades: any[]; groups: any[] } | null>(null);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "student" as Role,
    accessCode: "",
    gradeId: "",
    groupId: "",
    institutionId: "", // FIX: campo correcto sin typo
    studentEmail: "", // solo para role === "parent"
  });

  const selectedRole = roleOptions.find((r) => r.value === formData.role) || roleOptions[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role: Role) => {
    setFormData((prev) => ({ ...prev, role, accessCode: "", gradeId: "", groupId: "", studentEmail: "" }));
  };

  const handleVerifySchool = async () => {
    if (!schoolCode.trim()) return;

    setIsSearchingSchool(true);
    try {
      const response = await fetch(`/api/institutionSettings/validate/${schoolCode.trim()}`);

      if (!response.ok) {
        throw new Error("Colegio no encontrado");
      }

      const data = await response.json();

      setSchoolData(data);

      // FIX: campo con nombre correcto "institutionId"
      setFormData(prev => ({
        ...prev,
        institutionId: data.institution.id,
      }));

      toast({
        title: "Colegio verificado",
        description: `Te estás registrando en: ${data.institution.name}`,
      });
    } catch (err) {
      setSchoolData(null);
      setFormData(prev => ({ ...prev, institutionId: "" }));
      // Solo mostramos el toast de error si el usuario ya terminó de escribir
      // un código con pinta de completo — si no, sería un error molesto por
      // cada letra que todavía no forma un código válido.
      if (schoolCode.trim().length >= 4) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El código de colegio no es válido o no existe.",
        });
      }
    } finally {
      setIsSearchingSchool(false);
    }
  };

  // Verificación automática con debounce: antes había que acordarse de
  // apretar "Verificar" — muchos ni lo notaban y creían que el registro
  // estaba roto. Ahora, medio segundo después de dejar de escribir, se
  // verifica solo (el botón sigue ahí como respaldo/manual).
  const lastAutoVerified = useRef<string>("");
  useEffect(() => {
    const code = schoolCode.trim();
    if (!code || code === lastAutoVerified.current) return;
    const timeout = setTimeout(() => {
      lastAutoVerified.current = code;
      handleVerifySchool();
    }, 600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const bodyData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        accessCode: selectedRole.needsCode ? formData.accessCode : undefined,
        institutionId: formData.institutionId || undefined, // FIX: enviamos institutionId al backend
        gradeId: formData.role === "student" ? formData.gradeId : null,
        groupId: formData.role === "student" ? formData.groupId : null,
        studentEmail: formData.role === "parent" && formData.studentEmail ? formData.studentEmail : undefined,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en el registro");
      }

      const result = await response.json();

      if (formData.role === "parent") {
        toast(
          result.linkWarning
            ? { variant: "destructive", title: "Cuenta creada, pero...", description: result.linkWarning }
            : formData.studentEmail
              ? { title: "Registro exitoso", description: "Enviamos la solicitud de vínculo. Cuando el estudiante (o el colegio) la apruebe, podrás ver su información." }
              : { title: "Registro exitoso", description: "Ya puedes agregar a tus hijos desde tu panel." }
        );
      } else {
        toast({
          title: "Registro exitoso",
          description: "Tu cuenta ha sido creada correctamente.",
        });
      }

      await refetchUser(); // FIX: actualiza el contexto de auth antes de redirigir
      setLocation("/");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: err instanceof Error ? err.message : "Ocurrió un error inesperado",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const codeLabel = (role: Role) => {
    if (role === "teacher") return "Código de Maestro";
    if (role === "admin") return "Código de Administrador";
    return "Código de Acceso Institucional";
  };

  const codePlaceholder = (role: Role) => {
    if (role === "teacher") return "Ej: TCH-12345";
    if (role === "admin") return "Ej: ADM-99999";
    return "Ingresa el código para tu rol";
  };

  const codeHint = (role: Role) => {
    return `Solicita este código a la dirección de tu institución para verificar tu rol como ${role}.`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full sm:max-w-md text-center mb-4">
        <div className="flex justify-center mb-2">
          <GraduationCap className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          LoyolaCommunity
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Plataforma de Gestión Educativa e Institucional
        </p>
      </div>

      <div className="mt-4 sm:mx-auto w-full sm:max-w-xl">
        <Card className="shadow-md border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center text-slate-800">
              Crear una nueva cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@colegio.edu.co"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* INPUT DEL CÓDIGO DEL COLEGIO */}
              <div className="space-y-2">
                <Label htmlFor="schoolCode">Código de la Institución (Colegio)</Label>
                <div className="flex gap-2">
                  <Input
                    id="schoolCode"
                    type="text"
                    placeholder="Ej: SCH001"
                    value={schoolCode}
                    onChange={(e) => { setSchoolCode(e.target.value); setSchoolData(null); }}
                    disabled={isSearchingSchool}
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleVerifySchool}
                    disabled={isSearchingSchool || !schoolCode}
                  >
                    {isSearchingSchool ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                  </Button>
                </div>
                {schoolData && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ Institución verificada: {schoolData.institution.name}
                  </p>
                )}
              </div>

              {/* SELECTORES DE GRADO Y GRUPO */}
              {formData.role === "student" && schoolData && (
                <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-xl bg-slate-50/50 animate-in fade-in duration-200">

                  <div className="space-y-2">
                    <Label htmlFor="gradeId" className="text-slate-700 font-medium">Grado / Año</Label>
                    <div className="relative">
                      <select
                        id="gradeId"
                        name="gradeId"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer text-slate-800 font-normal"
                        value={formData.gradeId}
                        onChange={handleChange}
                        required
                      >
                        <option value="" className="text-slate-400">Selecciona grado</option>
                        {schoolData.grades.map((g) => (
                          <option key={g.id} value={g.id} className="text-slate-800">
                            {g.name || `Grado ${g.level}`}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupId" className="text-slate-700 font-medium">Grupo / Salón</Label>
                    <div className="relative">
                      <select
                        id="groupId"
                        name="groupId"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer text-slate-800 font-normal"
                        value={formData.groupId}
                        onChange={handleChange}
                        required
                      >
                        <option value="" className="text-slate-400">Selecciona grupo</option>
                        {schoolData.groups
                          .filter((group) => !formData.gradeId || group.gradeId === formData.gradeId)
                          .map((group) => (
                            <option key={group.id} value={group.id} className="text-slate-800">
                              {group.name}
                            </option>
                          ))
                        }
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* PADRE/ACUDIENTE: vincular con un hijo ya registrado (opcional aquí) */}
              {formData.role === "parent" && (
                <div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50 animate-in fade-in duration-200">
                  <Label htmlFor="studentEmail" className="text-slate-700 font-medium">Correo de tu hijo/a (opcional)</Label>
                  <Input
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.studentEmail}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-slate-500">
                    Debe ser el correo con el que tu hijo/a ya está registrado. Quedará pendiente hasta que él/ella (o el colegio) lo apruebe. Si no lo tienes ahora, puedes agregarlo después desde tu panel.
                  </p>
                </div>
              )}

              {/* ROLES */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Tipo de cuenta</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {roleOptions.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => handleRoleSelect(r.value)}
                      className={`text-left p-4 rounded-xl border transition-all text-sm flex flex-col gap-0.5 ${
                        formData.role === r.value
                          ? "border-primary bg-slate-50 ring-2 ring-primary"
                          : "border-slate-200 hover:bg-slate-50/50 bg-white"
                      }`}
                    >
                      <span className="font-bold text-slate-900 text-base">{r.label}</span>
                      <span className="text-sm text-slate-500 leading-snug">{r.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CÓDIGO DE ACCESO PARA ROLES ADMINISTRATIVOS / DOCENTES */}
              {selectedRole.needsCode && (
                <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                  <Label htmlFor="accessCode">{codeLabel(formData.role)}</Label>
                  <Input
                    id="accessCode"
                    name="accessCode"
                    type="password"
                    placeholder={codePlaceholder(formData.role)}
                    value={formData.accessCode}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-slate-500 italic">
                    {codeHint(formData.role)}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Registrarse"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              ¿Ya tienes una cuenta activa?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
