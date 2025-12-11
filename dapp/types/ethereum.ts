/// @notice Tipos para window.ethereum (MetaMask)
/// @dev Extiende la interfaz Window para incluir ethereum

export interface EthereumProvider {
  isMetaMask?: boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
  selectedAddress: string | null;
  chainId: string | null;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};

