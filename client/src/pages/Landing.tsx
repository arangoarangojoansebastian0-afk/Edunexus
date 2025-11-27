import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Shield, 
  Award,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import heroImage from "@assets/generated_images/students_collaborating_classroom_hero.png";
import studyGroupImage from "@assets/generated_images/study_club_meeting_students.png";
import tutoringImage from "@assets/generated_images/tutoring_session_students_helping.png";

const features = [
  {
    icon: MessageSquare,
    title: "Muro Social",
    description: "Comparte publicaciones, comenta y reacciona. Mantente conectado con tu comunidad escolar."
  },
  {
    icon: Users,
    title: "Grupos y Clubes",
    description: "Únete a grupos de tu curso o clubes de interés. Chat en tiempo real con tus compañeros."
  },
  {
    icon: BookOpen,
    title: "Biblioteca Académica",
    description: "Accede a recursos educativos. Sube y descarga materiales organizados por materia."
  },
  {
    icon: Calendar,
    title: "Asesorías",
    description: "Solicita o brinda tutorías. Reserva sesiones con calendario integrado y videollamadas."
  },
  {
    icon: Award,
    title: "Perfil y Logros",
    description: "Personaliza tu perfil, muestra tus intereses y gana badges por tu participación."
  },
  {
    icon: Shield,
    title: "Ambiente Seguro",
    description: "Moderación activa y verificación de usuarios para una comunidad escolar confiable."
  }
];

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-serif font-bold text-xl">Comunidad Loyola</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleLogin} data-testid="button-login-nav">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Conecta, aprende y crece con tu{" "}
                <span className="text-primary">comunidad escolar</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                La plataforma oficial de la comunidad estudiantil del Colegio Loyola. 
                Un espacio seguro para colaborar, compartir recursos y apoyarse mutuamente 
                en el camino educativo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={handleLogin} data-testid="button-login-hero">
                  Únete a la Comunidad
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features" data-testid="link-learn-more">
                    Conoce más
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Acceso con Gmail o correo @iecolegioloyola.edu.co
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl -rotate-3" />
              <img
                src={heroImage}
                alt="Estudiantes colaborando en el aula"
                className="relative rounded-2xl shadow-xl w-full object-cover aspect-video"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Herramientas diseñadas para potenciar tu experiencia educativa y 
              fortalecer los lazos con tu comunidad escolar.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Así funciona nuestra comunidad
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tres pilares que hacen de Comunidad Loyola el espacio perfecto para tu desarrollo académico.
            </p>
          </div>

          {/* Step 1 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </span>
                <h3 className="font-serif text-2xl font-bold">Grupos de Estudio</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Únete a grupos de tu curso o crea clubes de interés. Colabora con tus 
                compañeros en tiempo real, comparte dudas y recursos. Cada grupo tiene 
                su propio foro y chat para mantener la conversación organizada.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Grupos por curso académico
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Clubes de interés (deportes, arte, ciencias)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Chat en tiempo real
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <img
                src={studyGroupImage}
                alt="Grupo de estudiantes en reunión de estudio"
                className="rounded-xl shadow-lg w-full object-cover aspect-4/3"
              />
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <img
                src={tutoringImage}
                alt="Sesión de tutoría entre estudiantes"
                className="rounded-xl shadow-lg w-full object-cover aspect-4/3"
              />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </span>
                <h3 className="font-serif text-2xl font-bold">Asesorías Académicas</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                ¿Necesitas ayuda con una materia? Solicita una asesoría con compañeros 
                destacados o profesores. ¿Eres bueno en algo? Ofrece tutorías y gana 
                reconocimiento en la comunidad.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Calendario integrado para reservas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Enlaces de videollamada automáticos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Sistema de valoración
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </span>
                <h3 className="font-serif text-2xl font-bold">Biblioteca de Recursos</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Accede a una biblioteca colaborativa de recursos académicos. Sube tus 
                apuntes, guías de estudio y materiales. Todo organizado por materia 
                y moderado para garantizar calidad.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Organización por materias
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Formatos: PDF, DOCX, imágenes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Sistema de moderación
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 flex items-center justify-center p-8 bg-muted/50 rounded-xl">
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                {["Matemáticas", "Ciencias", "Historia", "Lenguaje", "Inglés", "Arte"].map((subject) => (
                  <div
                    key={subject}
                    className="bg-card rounded-lg p-4 text-center shadow-sm border"
                  >
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <span className="text-sm font-medium">{subject}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para unirte a la comunidad?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Inicia sesión con tu correo de Gmail o @iecolegioloyola.edu.co y comienza 
            a disfrutar de todos los beneficios de nuestra plataforma estudiantil.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleLogin}
            data-testid="button-login-cta"
          >
            Iniciar Sesión
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-serif font-bold">Comunidad Loyola</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Colegio Loyola. Plataforma exclusiva para la comunidad educativa.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
