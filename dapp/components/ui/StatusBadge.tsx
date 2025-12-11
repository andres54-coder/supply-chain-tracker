import { Badge } from "./badge";
import { UserStatus, TransferStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: UserStatus | TransferStatus;
  type?: "user" | "transfer";
  className?: string;
}

/**
 * Componente Badge para mostrar estados de usuario o transferencia
 */
export function StatusBadge({ status, type = "user", className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === "user") {
      switch (status as UserStatus) {
        case UserStatus.Pending:
          return { label: "Pendiente", variant: "secondary" as const };
        case UserStatus.Approved:
          return { label: "Aprobado", variant: "default" as const };
        case UserStatus.Rejected:
          return { label: "Rechazado", variant: "destructive" as const };
        case UserStatus.Canceled:
          return { label: "Cancelado", variant: "outline" as const };
        default:
          return { label: "Desconocido", variant: "secondary" as const };
      }
    } else {
      switch (status as TransferStatus) {
        case TransferStatus.Pending:
          return { label: "Pendiente", variant: "secondary" as const };
        case TransferStatus.Accepted:
          return { label: "Aceptada", variant: "default" as const };
        case TransferStatus.Rejected:
          return { label: "Rechazada", variant: "destructive" as const };
        default:
          return { label: "Desconocido", variant: "secondary" as const };
      }
    }
  };

  const { label, variant } = getStatusConfig();

  return (
    <Badge variant={variant} className={cn(className)}>
      {label}
    </Badge>
  );
}

