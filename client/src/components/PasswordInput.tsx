import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

/**
 * Input de contraseña con botón para mostrar/ocultar el texto.
 * Se usa en Login, Register y ResetPassword para mantener el mismo
 * comportamiento en toda la app.
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, containerClassName, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className={cn("relative", containerClassName)}>
        <Input
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          data-testid={props.id ? `button-toggle-${props.id}` : "button-toggle-password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
