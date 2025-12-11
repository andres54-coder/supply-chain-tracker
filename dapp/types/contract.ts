/// @notice Tipos TypeScript para el contrato SupplyChain
/// @dev Estos tipos deben mantenerse sincronizados con el contrato Solidity

/**
 * Estados posibles de un usuario en el sistema
 */
export enum UserStatus {
  Pending = 0,    // Esperando aprobación
  Approved = 1,   // Aprobado y activo
  Rejected = 2,   // Rechazado por admin
  Canceled = 3    // Cancelado por usuario
}

/**
 * Estados posibles de una transferencia
 */
export enum TransferStatus {
  Pending = 0,    // Esperando aceptación
  Accepted = 1,  // Aceptada y completada
  Rejected = 2    // Rechazada por destinatario
}

/**
 * Información de un usuario en el sistema
 */
export interface User {
  id: bigint;
  userAddress: string;
  role: "Producer" | "Factory" | "Retailer" | "Consumer" | "Admin";
  status: UserStatus;
}

/**
 * Información de un token que representa un producto
 * Nota: El balance no está incluido aquí, se obtiene con getTokenBalance()
 */
export interface Token {
  id: bigint;
  creator: string;
  name: string;
  totalSupply: bigint;
  features: string;  // Metadatos JSON como string
  parentId: bigint;  // ID del token padre (0 si es materia prima)
  dateCreated: bigint;
}

/**
 * Información de una transferencia entre usuarios
 */
export interface Transfer {
  id: bigint;
  from: string;
  to: string;
  tokenId: bigint;
  dateCreated: bigint;
  amount: bigint;
  status: TransferStatus;
}

/**
 * Roles válidos en el sistema
 */
export type UserRole = "Producer" | "Factory" | "Retailer" | "Consumer" | "Admin";

/**
 * Información completa de token con balance del usuario actual
 */
export interface TokenWithBalance extends Token {
  balance: bigint;
}

