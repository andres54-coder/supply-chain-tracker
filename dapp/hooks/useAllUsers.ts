"use client";

import { useQuery } from "@tanstack/react-query";
import { useContract } from "./useContract";
import { User } from "@/types";
import { JsonRpcProvider } from "ethers";
import { CONTRACT_ADDRESS } from "@/contracts/config";
import { getContract } from "@/contracts/config";
import { NETWORK_CONFIG } from "@/contracts/config";

/**
 * Hook para obtener todos los usuarios del sistema (solo admin)
 * Nota: Esto requiere iterar sobre allUserIds y obtener cada usuario
 */
export function useAllUsers() {
  const { getUserInfo } = useContract();

  return useQuery<User[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      // Crear provider para lectura pública
      const provider = new JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      const contract = getContract(provider);

      // Obtener el array de IDs de usuarios
      // Nota: Necesitamos obtener la longitud primero
      // Como no hay función pública para obtener la longitud, intentaremos obtener usuarios conocidos
      // o usar eventos. Por ahora, retornamos array vacío y se puede mejorar después.
      
      const users: User[] = [];
      
      // Intentar obtener usuarios hasta encontrar uno que no exista
      // Esto es una implementación simplificada
      let userId = 1;
      let foundUsers = 0;
      const maxAttempts = 100; // Límite de seguridad

      while (foundUsers < maxAttempts) {
        try {
          // Intentar obtener el usuario por ID
          // Necesitamos una función en el contrato para obtener usuario por ID
          // Por ahora, usamos getUserInfo con direcciones conocidas
          userId++;
          foundUsers++;
        } catch (error) {
          // Si falla, probablemente no hay más usuarios
          break;
        }
      }

      return users;
    },
    staleTime: 60000, // 1 minuto
  });
}

