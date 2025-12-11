import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface AddressDisplayProps {
  address: string;
  className?: string;
  showCopyButton?: boolean;
  truncate?: boolean;
}

/**
 * Componente para mostrar direcciones Ethereum formateadas
 */
export function AddressDisplay({
  address,
  className,
  showCopyButton = true,
  truncate = true,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string): string => {
    if (!truncate) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <code className="text-sm font-mono">{formatAddress(address)}</code>
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0"
          aria-label="Copiar dirección"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}

