"use client";

import { useState } from "react";
import { Button } from "./button";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Copy, Check, Wand2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Editor JSON con validación y formateo automático
 */
export function JsonEditor({
  value,
  onChange,
  label = "Metadatos (JSON)",
  placeholder = '{"key": "value"}',
  disabled = false,
  className,
}: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validateJson = (jsonString: string): boolean => {
    if (!jsonString.trim()) {
      setIsValid(true);
      setErrorMessage(null);
      return true; // JSON vacío es válido (se convertirá en "{}")
    }

    try {
      JSON.parse(jsonString);
      setIsValid(true);
      setErrorMessage(null);
      return true;
    } catch (error: any) {
      setIsValid(false);
      setErrorMessage(error.message || "JSON inválido");
      return false;
    }
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    validateJson(newValue);
  };

  const formatJson = () => {
    if (!value.trim()) {
      onChange("{}");
      setIsValid(true);
      setErrorMessage(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setIsValid(true);
      setErrorMessage(null);
    } catch (error: any) {
      setIsValid(false);
      setErrorMessage(error.message || "No se puede formatear JSON inválido");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || "{}");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="json-editor">{label}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={formatJson}
            disabled={disabled}
            className="h-8"
          >
            <Wand2 className="h-3 w-3 mr-1" />
            Formatear
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={disabled}
              className="h-8"
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
          )}
        </div>
      </div>
      <Textarea
        id="json-editor"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "font-mono text-sm min-h-[120px]",
          !isValid && "border-destructive focus-visible:ring-destructive"
        )}
      />
      {!isValid && errorMessage && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Información adicional en formato JSON (opcional). Usa el botón "Formatear" para organizar el JSON.
      </p>
    </div>
  );
}

