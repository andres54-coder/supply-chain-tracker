"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MetaMaskProvider } from "@/contexts/MetaMaskContext";
import { Toaster } from "@/components/ui/Toaster";
import { ReactNode, useState } from "react";

/**
 * Providers globales de la aplicación
 * - QueryClientProvider: Para React Query (cacheo de datos)
 * - MetaMaskProvider: Para gestión de wallet
 * - Toaster: Para notificaciones toast
 */
export function Providers({ children }: { children: ReactNode }) {
  // Crear QueryClient con configuración por defecto
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // No reintentar automáticamente en caso de error
            retry: false,
            // Tiempo que los datos se consideran frescos
            staleTime: 30000, // 30 segundos
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MetaMaskProvider>
        {children}
        <Toaster />
      </MetaMaskProvider>
    </QueryClientProvider>
  );
}

