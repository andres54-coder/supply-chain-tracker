"use client";

import { useMemo, useState, useCallback } from "react";
import { useMetaMask } from "./useMetaMask";
import { getContract } from "@/contracts/config";
import { UserStatus, TransferStatus, User, Token, Transfer } from "@/types";
import { toast } from "@/components/ui/Toaster";

/**
 * Hook para interactuar con el contrato SupplyChain
 * 
 * @description Proporciona funciones wrapper para todas las operaciones del contrato,
 *              maneja estados de carga y errores, y muestra notificaciones toast.
 * 
 * @example
 * ```tsx
 * const { createToken, isLoading, error } = useContract();
 * 
 * const handleCreate = async () => {
 *   const success = await createToken("Trigo", 1000n, "{}", 0n);
 *   if (success) {
 *     // Token creado exitosamente
 *   }
 * };
 * ```
 * 
 * @returns Objeto con funciones del contrato, estados de carga y errores
 */
export function useContract() {
  const { signer, provider, account, isConnected } = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener instancia del contrato
  const contract = useMemo(() => {
    if (!signer && !provider) return null;
    return getContract(signer || provider);
  }, [signer, provider]);

  /**
   * Ejecuta una función del contrato y maneja errores automáticamente
   * 
   * @template T Tipo de retorno de la función
   * @param fn Función asíncrona que ejecuta la llamada al contrato
   * @param options Opciones para personalizar el manejo de errores y notificaciones
   * @param options.successMessage Mensaje a mostrar en toast cuando la operación es exitosa
   * @param options.errorMessage Mensaje personalizado para errores
   * @param options.showSuccess Si es false, no muestra toast de éxito (default: true)
   * @param options.showError Si es false, no muestra toast de error (default: true)
   * @returns Resultado de la función o null si hay error
   * 
   * @example
   * ```ts
   * const result = await executeContractCall(
   *   async () => await contract.createToken("Trigo", 1000n, "{}", 0n),
   *   { successMessage: "Token creado", errorMessage: "Error al crear token" }
   * );
   * ```
   */
  const executeContractCall = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: {
        successMessage?: string;
        errorMessage?: string;
        showSuccess?: boolean;
        showError?: boolean;
      }
    ): Promise<T | null> => {
      if (!contract) {
        const msg = "No hay conexión con el contrato";
        setError(msg);
        if (options?.showError !== false) {
          toast.error("Error de Conexión", msg);
        }
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fn();
        if (options?.showSuccess !== false && options?.successMessage) {
          toast.success(options.successMessage);
        }
        return result;
      } catch (err: any) {
        // Extraer mensaje de error más descriptivo
        let errorMessage = "Error desconocido";
        
        if (err.reason) {
          errorMessage = err.reason;
        } else if (err.message) {
          // Intentar extraer mensaje de revert reason
          const revertMatch = err.message.match(/reason: (.+)/i);
          if (revertMatch) {
            errorMessage = revertMatch[1];
          } else if (err.message.includes("user rejected")) {
            errorMessage = "Transacción rechazada por el usuario";
          } else if (err.message.includes("insufficient funds")) {
            errorMessage = "Fondos insuficientes";
          } else {
            errorMessage = err.message;
          }
        }

        // Verificar si es un error de "no encontrado" (token, transfer, etc.)
        const isNotFoundError = 
          errorMessage.includes("Token does not exist") ||
          errorMessage.includes("token does not exist") ||
          errorMessage.includes("Transfer does not exist") ||
          errorMessage.includes("transfer does not exist");

        // Solo mostrar error si no es un error de "no encontrado" y showError no es false
        if (!isNotFoundError) {
        setError(errorMessage);
        console.error("Contract call error:", err);
        
        if (options?.showError !== false) {
          toast.error(
            options?.errorMessage || "Error en la Transacción",
            errorMessage
          );
        }
        }
        
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // ============ Gestión de Usuarios ============

  /**
   * Solicita un rol en el sistema
   */
  const requestUserRole = useCallback(
    async (role: string): Promise<boolean> => {
      const result = await executeContractCall(
        async () => {
          const tx = await contract!.requestUserRole(role);
          await tx.wait();
          return true;
        },
        {
          successMessage: `Solicitud de rol ${role} enviada correctamente`,
          errorMessage: "Error al solicitar el rol",
        }
      );
      return result !== null;
    },
    [executeContractCall, contract]
  );

  /**
   * Cambia el estado de un usuario (solo Admin)
   */
  const changeStatusUser = useCallback(
    async (userAddress: string, newStatus: UserStatus): Promise<boolean> => {
      const statusText = newStatus === UserStatus.Approved ? "aprobado" : 
                        newStatus === UserStatus.Rejected ? "rechazado" : "cancelado";
      const result = await executeContractCall(
        async () => {
          const tx = await contract!.changeStatusUser(userAddress, newStatus);
          await tx.wait();
          return true;
        },
        {
          successMessage: `Usuario ${statusText} correctamente`,
          errorMessage: "Error al cambiar el estado del usuario",
        }
      );
      return result !== null;
    },
    [executeContractCall, contract]
  );

  /**
   * Obtiene la información de un usuario
   */
  const getUserInfo = useCallback(
    async (userAddress: string): Promise<User | null> => {
      if (!contract) {
        return null;
      }

      try {
        const user = await contract.getUserInfo(userAddress);
        
        // Mapear el estado numérico al enum UserStatus
        const statusNumber = Number(user.status);
        
        let status: UserStatus;
        switch (statusNumber) {
          case 0:
            status = UserStatus.Pending;
            break;
          case 1:
            status = UserStatus.Approved;
            break;
          case 2:
            status = UserStatus.Rejected;
            break;
          case 3:
            status = UserStatus.Canceled;
            break;
          default:
            console.warn(`Unknown user status: ${statusNumber}, defaulting to Pending`);
            status = UserStatus.Pending;
        }
        
        const mappedUser = {
          id: BigInt(user.id.toString()),
          userAddress: user.userAddress,
          role: user.role,
          status,
        };
        
        return mappedUser;
      } catch (err: any) {
        // Si el usuario no está registrado, retornar null sin mostrar error
        const errorMessage = err.reason || err.message || "";
        if (errorMessage.includes("User not registered") || 
            errorMessage.includes("user not registered")) {
          return null;
        }
        
        // Para otros errores, solo loguear sin mostrar toast
        console.error("Error getting user info:", err);
        return null;
      }
    },
    [contract]
  );

  /**
   * Verifica si una dirección es admin
   */
  const isAdmin = useCallback(
    async (userAddress: string): Promise<boolean> => {
      const result = await executeContractCall(async () => {
        return await contract!.isAdmin(userAddress);
      });
      return result ?? false;
    },
    [executeContractCall, contract]
  );

  // ============ Gestión de Tokens ============

  /**
   * Crea un nuevo token en el contrato
   * 
   * @param name Nombre del producto o materia prima
   * @param totalSupply Cantidad total de unidades del token (debe ser > 0)
   * @param features Metadatos JSON como string (puede ser "{}" si no hay metadatos)
   * @param parentId ID del token padre (0n para materias primas, > 0n para productos derivados)
   * @returns Promise<boolean> true si la creación fue exitosa, false en caso contrario
   * 
   * @remarks
   * - Producer solo puede crear tokens sin parentId (materias primas)
   * - Factory y Retailer deben especificar un parentId válido y tener balance del token padre
   * - El usuario debe estar aprobado para crear tokens
   * 
   * @example
   * ```ts
   * // Crear materia prima (Producer)
   * await createToken("Trigo Orgánico", 1000n, '{"organic": true}', 0n);
   * 
   * // Crear producto derivado (Factory)
   * await createToken("Harina", 500n, '{"type": "whole wheat"}', 1n);
   * ```
   */
  const createToken = useCallback(
    async (
      name: string,
      totalSupply: bigint,
      features: string,
      parentId: bigint
    ): Promise<boolean> => {
      const result = await executeContractCall(
        async () => {
          const tx = await contract!.createToken(name, totalSupply, features, parentId);
          await tx.wait();
          return true;
        },
        {
          successMessage: `Token "${name}" creado correctamente`,
          errorMessage: "Error al crear el token",
        }
      );
      return result !== null;
    },
    [executeContractCall, contract]
  );

  /**
   * Obtiene información de un token
   */
  const getToken = useCallback(
    async (tokenId: bigint): Promise<Token | null> => {
      return await executeContractCall(
        async () => {
        const result = await contract!.getToken(tokenId);
        return {
          id: BigInt(result.id.toString()),
          creator: result.creator,
          name: result.name,
          totalSupply: BigInt(result.totalSupply.toString()),
          features: result.features,
          parentId: BigInt(result.parentId.toString()),
          dateCreated: BigInt(result.dateCreated.toString()),
        };
        },
        {
          showError: false, // No mostrar error en toast para tokens no encontrados
          showSuccess: false,
        }
      );
    },
    [executeContractCall, contract]
  );

  /**
   * Obtiene el balance de un token para una dirección
   */
  const getTokenBalance = useCallback(
    async (tokenId: bigint, userAddress: string): Promise<bigint | null> => {
      const result = await executeContractCall(async () => {
        const balance = await contract!.getTokenBalance(tokenId, userAddress);
        return BigInt(balance.toString());
      });
      return result;
    },
    [executeContractCall, contract]
  );

  /**
   * Obtiene los tokens de un usuario
   */
  const getUserTokens = useCallback(
    async (userAddress: string): Promise<bigint[]> => {
      const result = await executeContractCall(async () => {
        const tokenIds = await contract!.getUserTokens(userAddress);
        return tokenIds.map((id: any) => BigInt(id.toString()));
      });
      return result ?? [];
    },
    [executeContractCall, contract]
  );

  // ============ Gestión de Transferencias ============

  /**
   * Solicita una transferencia de tokens a otro usuario
   * 
   * @param to Dirección Ethereum del destinatario (debe estar registrado y aprobado)
   * @param tokenId ID del token a transferir
   * @param amount Cantidad de tokens a transferir (debe ser > 0 y <= balance del remitente)
   * @returns Promise<boolean> true si la solicitud fue exitosa, false en caso contrario
   * 
   * @remarks
   * - Crea una transferencia con estado Pending que debe ser aceptada por el destinatario
   * - Valida el flujo de roles: Producer→Factory, Factory→Retailer, Retailer→Consumer
   * - Consumer no puede transferir
   * - El remitente debe tener balance suficiente
   * 
   * @example
   * ```ts
   * // Producer transfiere a Factory
   * await transfer("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 1n, 100n);
   * ```
   */
  const transfer = useCallback(
    async (to: string, tokenId: bigint, amount: bigint): Promise<boolean> => {
      const result = await executeContractCall(
        async () => {
          const tx = await contract!.transfer(to, tokenId, amount);
          await tx.wait();
          return true;
        },
        {
          successMessage: `Transferencia de ${amount.toString()} tokens solicitada`,
          errorMessage: "Error al solicitar la transferencia",
        }
      );
      return result !== null;
    },
    [executeContractCall, contract]
  );

  /**
   * Acepta una transferencia pendiente
   */
  const acceptTransfer = useCallback(
    async (transferId: bigint): Promise<boolean> => {
      const result = await executeContractCall(
        async () => {
          const tx = await contract!.acceptTransfer(transferId);
          await tx.wait();
          return true;
        },
        {
          successMessage: "Transferencia aceptada correctamente",
          errorMessage: "Error al aceptar la transferencia",
        }
      );
      return result !== null;
    },
    [executeContractCall, contract]
  );

  /**
   * Rechaza una transferencia pendiente
   */
  const rejectTransfer = useCallback(
    async (transferId: bigint): Promise<boolean> => {
      const result = await executeContractCall(
        async () => {
          const tx = await contract!.rejectTransfer(transferId);
          await tx.wait();
          return true;
        },
        {
          successMessage: "Transferencia rechazada",
          errorMessage: "Error al rechazar la transferencia",
        }
      );
      return result !== null;
    },
    [executeContractCall, contract]
  );

  /**
   * Obtiene información de una transferencia
   */
  const getTransfer = useCallback(
    async (transferId: bigint): Promise<Transfer | null> => {
      return await executeContractCall(async () => {
        const transfer = await contract!.getTransfer(transferId);
        
        // Mapear el estado numérico al enum TransferStatus
        // El contrato devuelve el estado como número (0=Pending, 1=Accepted, 2=Rejected)
        const statusNumber = Number(transfer.status);
        let status: TransferStatus;
        switch (statusNumber) {
          case 0:
            status = TransferStatus.Pending;
            break;
          case 1:
            status = TransferStatus.Accepted;
            break;
          case 2:
            status = TransferStatus.Rejected;
            break;
          default:
            console.warn(`Unknown transfer status: ${statusNumber} for transfer ${transferId}, defaulting to Pending`);
            status = TransferStatus.Pending;
        }
        
        const mappedTransfer = {
          id: BigInt(transfer.id.toString()),
          from: transfer.from,
          to: transfer.to,
          tokenId: BigInt(transfer.tokenId.toString()),
          dateCreated: BigInt(transfer.dateCreated.toString()),
          amount: BigInt(transfer.amount.toString()),
          status,
        };
        
        // Debug log para verificar el mapeo
        if (process.env.NODE_ENV === 'development') {
          console.log(`Transfer ${transferId}: raw status=${statusNumber}, mapped status=${status} (${TransferStatus[status]})`);
        }
        
        return mappedTransfer;
      });
    },
    [executeContractCall, contract]
  );

  /**
   * Obtiene las transferencias de un usuario
   */
  const getUserTransfers = useCallback(
    async (userAddress: string): Promise<bigint[]> => {
      const result = await executeContractCall(async () => {
        const transferIds = await contract!.getUserTransfers(userAddress);
        return transferIds.map((id: any) => BigInt(id.toString()));
      });
      return result ?? [];
    },
    [executeContractCall, contract]
  );

  return {
    // Estado
    isLoading,
    error,
    isConnected,
    account,
    contract, // Exponer el contrato para uso directo
    
    // Gestión de usuarios
    requestUserRole,
    changeStatusUser,
    getUserInfo,
    isAdmin,
    
    // Gestión de tokens
    createToken,
    getToken,
    getTokenBalance,
    getUserTokens,
    
    // Gestión de transferencias
    transfer,
    acceptTransfer,
    rejectTransfer,
    getTransfer,
    getUserTransfers,
  };
}

