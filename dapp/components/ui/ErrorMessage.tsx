import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  className?: string;
  onDismiss?: () => void;
}

/**
 * Componente para mostrar mensajes de error
 */
export function ErrorMessage({ message, className, onDismiss }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto text-destructive/70 hover:text-destructive"
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
}

