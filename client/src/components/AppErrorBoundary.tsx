import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[EduNexus UI error]", error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-destructive" /></div>
          <h1 className="text-xl font-semibold">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">La pantalla encontró un problema inesperado. Puedes intentar cargarla de nuevo sin perder tu sesión.</p>
          <Button onClick={() => this.setState({ hasError: false })}><RefreshCw className="h-4 w-4 mr-2" />Reintentar</Button>
        </div>
      </div>
    );
  }
}
