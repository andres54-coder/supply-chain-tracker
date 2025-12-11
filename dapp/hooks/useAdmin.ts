"use client";

import { useQuery } from "@tanstack/react-query";
import { useContract } from "./useContract";
import { useMetaMask } from "./useMetaMask";

/**
 * Hook para obtener la dirección del admin del contrato y verificar si el usuario actual es admin
 */
export function useAdmin() {
  const { account } = useMetaMask();
  const { contract } = useContract();

  // Obtener la dirección del admin del contrato
  const { data: adminAddress, isLoading: isLoadingAdmin } = useQuery<string | null>({
    queryKey: ["admin", "address"],
    queryFn: async () => {
      if (!contract) return null;
      try {
        const admin = await contract.admin();
        return admin as string;
      } catch (error) {
        console.error("Error getting admin address:", error);
        return null;
      }
    },
    enabled: !!contract,
    staleTime: 5 * 60 * 1000, // 5 minutos (el admin no cambia)
  });

  // Verificar si el usuario actual es admin
  const { data: isAdmin, isLoading: isLoadingIsAdmin } = useQuery<boolean>({
    queryKey: ["admin", "isAdmin", account],
    queryFn: async () => {
      if (!contract || !account) return false;
      try {
        const result = await contract.isAdmin(account);
        return result as boolean;
      } catch (error) {
        console.error("Error checking if admin:", error);
        return false;
      }
    },
    enabled: !!contract && !!account,
    staleTime: 30 * 1000, // 30 segundos
  });

  return {
    adminAddress,
    isAdmin: isAdmin ?? false,
    isLoading: isLoadingAdmin || isLoadingIsAdmin,
  };
}

