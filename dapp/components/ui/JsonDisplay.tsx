"use client";

import { useState } from "react";
import { Button } from "./button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonDisplayProps {
  json: string;
  className?: string;
  title?: string;
}

/**
 * Componente para mostrar JSON formateado con botón de copiar
 */
export function JsonDisplay({ json, className, title }: JsonDisplayProps) {
  const [copied, setCopied] = useState(false);

  const formatJson = (jsonString: string): string => {
    if (!jsonString || jsonString.trim() === "" || jsonString === "{}") {
      return "{}";
    }

    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Si no es JSON válido, retornar tal cual
      return jsonString;
    }
  };

  const handleCopy = async () => {
    try {
      const formatted = formatJson(json);
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy JSON:", error);
    }
  };

  const formattedJson = formatJson(json);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 ml-auto"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </>
          )}
        </Button>
      </div>
      <div className="relative">
        <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto border font-mono">
          <code className="text-xs">{formattedJson}</code>
        </pre>
      </div>
    </div>
  );
}

