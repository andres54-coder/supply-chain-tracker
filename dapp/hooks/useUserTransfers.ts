"use client";

import { useQuery } from "@tanstack/react-query";
import { useContract } from "./useContract";
import { Transfer, TransferStatus } from "@/types";

/**
 * Hook para obtener transferencias de un usuario usando React Query
 */
export function useUserTransfers(
  userAddress: string | null | undefined,
  options?: { filterByStatus?: TransferStatus }
) {
  const { getUserTransfers, getTransfer } = useContract();
  const filterByStatus = options?.filterByStatus;

  return useQuery<Transfer[]>({
    queryKey: ["userTransfers", userAddress, filterByStatus],
    queryFn: async () => {
      if (!userAddress) return [];

      const transferIds = await getUserTransfers(userAddress);

      // Obtener información completa de cada transferencia
      const transfers = await Promise.all(
        transferIds.map(async (transferId) => {
          return await getTransfer(transferId);
        })
      );

      const validTransfers = transfers.filter(
        (t) => t !== null
      ) as Transfer[];

      // Debug log en desarrollo para verificar estados
      if (process.env.NODE_ENV === 'development') {
        console.log(`useUserTransfers: Found ${validTransfers.length} transfers for ${userAddress}`);
        validTransfers.forEach((t) => {
          console.log(`  Transfer ${t.id}: status=${t.status} (${TransferStatus[t.status]}), from=${t.from}, to=${t.to}`);
        });
      }

      // Filtrar por estado si se especifica
      if (filterByStatus !== undefined) {
        const filtered = validTransfers.filter((t) => t.status === filterByStatus);
        if (process.env.NODE_ENV === 'development') {
          console.log(`  Filtered by ${TransferStatus[filterByStatus]}: ${filtered.length} transfers`);
        }
        return filtered;
      }

      return validTransfers;
    },
    enabled: !!userAddress,
    staleTime: 0, // Siempre considerar los datos como obsoletos para forzar recarga
    gcTime: 60000, // Mantener en caché por 1 minuto pero siempre refetch
    refetchOnWindowFocus: true, // Refetch cuando la ventana recupera el foco
  });
}

