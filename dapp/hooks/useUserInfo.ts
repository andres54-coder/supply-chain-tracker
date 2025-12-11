"use client";

import { useQuery } from "@tanstack/react-query";
import { useContract } from "./useContract";
import { User } from "@/types";

/**
 * Hook para obtener información de un usuario usando React Query
 */
export function useUserInfo(userAddress: string | null | undefined) {
  const { getUserInfo } = useContract();

  return useQuery<User | null>({
    queryKey: ["user", userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      try {
      return await getUserInfo(userAddress);
      } catch (error: any) {
        // Si el usuario no está registrado, retornar null sin error
        const errorMessage = error?.reason || error?.message || error?.data?.message || "";
        if (errorMessage.includes("User not registered") || 
            errorMessage.includes("user not registered") ||
            errorMessage.includes("User not registered")) {
          return null;
        }
        // Para otros errores, relanzar
        throw error;
      }
    },
    enabled: !!userAddress,
    staleTime: 30000, // 30 segundos
    retry: (failureCount, error: any) => {
      // No reintentar si el usuario no está registrado
      const errorMessage = error?.reason || error?.message || error?.data?.message || "";
      if (errorMessage.includes("User not registered") || 
          errorMessage.includes("user not registered") ||
          errorMessage.includes("User not registered")) {
        return false;
      }
      // Reintentar otros errores hasta 2 veces
      return failureCount < 2;
    },
    // No mostrar error en la UI si el usuario no está registrado
    throwOnError: (error: any) => {
      const errorMessage = error?.reason || error?.message || error?.data?.message || "";
      // No lanzar error si el usuario no está registrado (es esperado)
      return !errorMessage.includes("User not registered") && 
             !errorMessage.includes("user not registered");
    },
  });
}

