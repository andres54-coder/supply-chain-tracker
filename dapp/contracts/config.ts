/// @notice Configuración del contrato SupplyChain
/// @dev Actualizar esta dirección después de cada deploy

import SupplyChainABI from "./SupplyChain.json";

/// @notice Dirección del contrato SupplyChain desplegado
/// @dev Esta es la dirección del contrato desplegado en Anvil (Chain ID 31337)
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

/// @notice ABI del contrato SupplyChain
export const CONTRACT_ABI = SupplyChainABI.abi;

/// @notice Dirección del admin del contrato (deployer) - VALOR POR DEFECTO
/// @dev Esta es la primera cuenta de Anvil por defecto
/// @deprecated Usar el hook useAdmin() para obtener el admin dinámicamente del contrato
/// El admin real se establece cuando se despliega el contrato y puede obtenerse con contract.admin()
export const ADMIN_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/// @notice Configuración de red
export const NETWORK_CONFIG = {
  chainId: 31337, // Anvil default chain ID
  rpcUrl: "http://127.0.0.1:8545",
  name: "Anvil Local",
} as const;

import { Contract, ContractRunner } from "ethers";

/**
 * Obtiene una instancia del contrato SupplyChain
 * @param runner Signer o Provider de ethers.js v6
 * @returns Instancia del contrato SupplyChain
 */
export function getContract(runner: ContractRunner) {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, runner);
}

