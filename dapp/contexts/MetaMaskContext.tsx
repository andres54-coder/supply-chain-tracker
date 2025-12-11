"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { BrowserProvider, JsonRpcSigner, JsonRpcProvider } from "ethers";
import { NETWORK_CONFIG } from "@/contracts/config";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Estado del contexto MetaMask
 */
interface MetaMaskState {
  account: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Funciones del contexto MetaMask
 */
interface MetaMaskContextType extends MetaMaskState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  getSigner: () => Promise<JsonRpcSigner>;
  checkConnection: () => Promise<void>;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

const STORAGE_KEY = "metamask_connected";

/**
 * Provider de MetaMask que gestiona la conexión con la wallet
 */
export function MetaMaskProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const previousAccountRef = useRef<string | null>(null);
  
  const [state, setState] = useState<MetaMaskState>({
    account: null,
    isConnected: false,
    chainId: null,
    provider: null,
    signer: null,
    isLoading: true,
    error: null,
  });

  /**
   * Intenta cambiar a la red correcta automáticamente
   */
  const switchToCorrectNetwork = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      const chainIdHex = `0x${NETWORK_CONFIG.chainId.toString(16)}`;
      
      // Intentar cambiar a la red si ya existe
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
        return true;
      } catch (switchError: any) {
        // Si la red no existe, intentar agregarla
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: NETWORK_CONFIG.name,
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                blockExplorerUrls: [],
              },
            ],
          });
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error("Error switching network:", error);
      return false;
    }
  }, []);

  /**
   * Obtiene el chainId actual directamente desde window.ethereum
   */
  const getCurrentChainId = useCallback(async (): Promise<number | null> => {
    if (!window.ethereum) return null;
    
    try {
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      return parseInt(chainIdHex, 16);
    } catch (error) {
      console.error("Error getting chainId:", error);
      return null;
    }
  }, []);

  /**
   * Valida que la red sea la correcta (Chain ID 31337 para Anvil)
   */
  const validateChain = useCallback(async (provider: BrowserProvider): Promise<boolean> => {
    try {
      // Primero verificar el chainId directamente desde window.ethereum
      const currentChainId = await getCurrentChainId();
      
      if (currentChainId === null) {
        setState((prev) => ({
          ...prev,
          error: "No se pudo obtener el Chain ID de la red",
        }));
        return false;
      }
      
      // Log para depuración
      console.log("Validating chain - Current chainId:", currentChainId, "Expected:", NETWORK_CONFIG.chainId);
      
      if (currentChainId !== NETWORK_CONFIG.chainId) {
        // Intentar cambiar automáticamente
        const switched = await switchToCorrectNetwork();
        if (switched) {
          // Esperar a que MetaMask cambie la red (el evento chainChanged se disparará)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verificar nuevamente después del cambio
          const newChainId = await getCurrentChainId();
          console.log("After switch - New chainId:", newChainId);
      
          if (newChainId === NETWORK_CONFIG.chainId) {
            setState((prev) => ({ ...prev, error: null }));
            return true;
          }
        }
        
        setState((prev) => ({
          ...prev,
          error: `Red incorrecta. Por favor cambia a ${NETWORK_CONFIG.name} (Chain ID: ${NETWORK_CONFIG.chainId}). Red actual: ${currentChainId}`,
        }));
        return false;
      }
      
      setState((prev) => ({ ...prev, error: null }));
      return true;
    } catch (error: any) {
      // Si el error es porque la red cambió durante la validación, es normal
      if (error.code === "NETWORK_ERROR" && error.message?.includes("network changed")) {
        // Verificar el chainId actual directamente
        const currentChainId = await getCurrentChainId();
        if (currentChainId === NETWORK_CONFIG.chainId) {
          setState((prev) => ({ ...prev, error: null }));
          return true;
        }
      }
      console.error("Error validating chain:", error);
      return false;
    }
  }, [switchToCorrectNetwork, getCurrentChainId]);

  /**
   * Obtiene el signer actual
   */
  const getSigner = useCallback(async (): Promise<JsonRpcSigner> => {
    if (!state.provider) {
      throw new Error("Provider no disponible");
    }
    
    const signer = await state.provider.getSigner();
    return signer;
  }, [state.provider]);

  /**
   * Conecta la wallet MetaMask
   */
  const connect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      if (!window.ethereum) {
        throw new Error("MetaMask no está instalado");
      }

      // Crear provider inicial
      let provider = new BrowserProvider(window.ethereum);
      
      // Solicitar conexión usando wallet_requestPermissions para forzar selección de cuenta
      // Esto siempre muestra el selector de cuentas en MetaMask
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (error: any) {
        // Si el usuario rechaza, lanzar error
        if (error.code === 4001) {
          throw new Error("Conexión rechazada por el usuario");
        }
        // Si falla, intentar con eth_requestAccounts como fallback
      await provider.send("eth_requestAccounts", []);
      }
      
      // Validar red (esto puede cambiar la red automáticamente)
      const isValidChain = await validateChain(provider);
      if (!isValidChain) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Si la red cambió, crear un nuevo provider para evitar errores de "network changed"
      const currentChainId = await getCurrentChainId();
      if (currentChainId !== NETWORK_CONFIG.chainId) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Crear un nuevo provider después de validar la red
      provider = new BrowserProvider(window.ethereum);

      // Obtener cuenta y chain ID
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const chainId = await getCurrentChainId();

      if (chainId === null || chainId !== NETWORK_CONFIG.chainId) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Red incorrecta. Por favor cambia a ${NETWORK_CONFIG.name} (Chain ID: ${NETWORK_CONFIG.chainId})`,
        }));
        return;
      }

      // Si cambió la cuenta, limpiar queries de la cuenta anterior
      const previousAccount = previousAccountRef.current;
      if (previousAccount && previousAccount.toLowerCase() !== address.toLowerCase()) {
        console.log("Account changed during connect, clearing queries for previous account:", previousAccount);
        queryClient.removeQueries({ queryKey: ["user", previousAccount] });
        queryClient.removeQueries({ queryKey: ["userTokens", previousAccount] });
        queryClient.removeQueries({ queryKey: ["userTransfers", previousAccount] });
        queryClient.removeQueries({ queryKey: ["admin", "isAdmin", previousAccount] });
        
        // Invalidar todas las queries de admin para forzar recarga
        queryClient.invalidateQueries({ queryKey: ["admin"] });
      }

      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY, "true");
      
      // Actualizar referencia de cuenta anterior
      previousAccountRef.current = address;

      setState({
        account: address,
        isConnected: true,
        chainId,
        provider,
        signer,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Si el error es porque la red cambió, es normal, solo loguear
      // El evento chainChanged manejará la reconexión automáticamente
      if (error.code === "NETWORK_ERROR" && error.message?.includes("network changed")) {
        console.log("Network changed during connection, waiting for chainChanged event...");
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      
      console.error("Error connecting to MetaMask:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Error al conectar con MetaMask",
        isConnected: false,
      }));
    }
  }, [validateChain, getCurrentChainId]);

  /**
   * Desconecta la wallet y revoca permisos para forzar selección de cuenta en próxima conexión
   */
  const disconnect = useCallback(async () => {
    const currentAccount = state.account;
    
    // Revocar permisos de MetaMask para forzar selección de cuenta en próxima conexión
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        // Si falla la revocación (por ejemplo, si no hay permisos), ignorar el error
        console.log("No permissions to revoke or error revoking:", error);
      }
    }

    // Limpiar todas las queries relacionadas con la cuenta actual
    if (currentAccount) {
      queryClient.removeQueries({ queryKey: ["user", currentAccount] });
      queryClient.removeQueries({ queryKey: ["userTokens", currentAccount] });
      queryClient.removeQueries({ queryKey: ["userTransfers", currentAccount] });
      queryClient.removeQueries({ queryKey: ["admin", "isAdmin", currentAccount] });
    }
    
    // Limpiar todas las queries de admin (incluyendo admin address e isAdmin para todas las cuentas)
    queryClient.removeQueries({ queryKey: ["admin"] });

    localStorage.removeItem(STORAGE_KEY);
    previousAccountRef.current = null;
    
    setState({
      account: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null,
      isLoading: false,
      error: null,
    });
  }, [state.account, queryClient]);

  /**
   * Firma un mensaje
   */
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.signer) {
      throw new Error("No hay signer disponible");
    }
    
    return await state.signer.signMessage(message);
  }, [state.signer]);

  /**
   * Verifica la conexión actual
   */
  const checkConnection = useCallback(async () => {
    if (!window.ethereum) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      let provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      
      if (accounts.length === 0) {
        setState((prev) => ({ ...prev, isLoading: false, isConnected: false }));
        return;
      }

      const isValidChain = await validateChain(provider);
      if (!isValidChain) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Verificar el chainId actual directamente
      const chainId = await getCurrentChainId();
      if (chainId === null || chainId !== NETWORK_CONFIG.chainId) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Crear un nuevo provider después de validar la red
      provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Si cambió la cuenta, limpiar queries de la cuenta anterior
      const previousAccount = previousAccountRef.current;
      if (previousAccount && previousAccount.toLowerCase() !== address.toLowerCase()) {
        console.log("Account changed during checkConnection, clearing queries for previous account:", previousAccount);
        queryClient.removeQueries({ queryKey: ["user", previousAccount] });
        queryClient.removeQueries({ queryKey: ["userTokens", previousAccount] });
        queryClient.removeQueries({ queryKey: ["userTransfers", previousAccount] });
        queryClient.removeQueries({ queryKey: ["admin", "isAdmin", previousAccount] });
        
        // Invalidar todas las queries de admin para forzar recarga
        queryClient.invalidateQueries({ queryKey: ["admin"] });
      }

      // Actualizar referencia de cuenta anterior
      previousAccountRef.current = address;

      setState({
        account: address,
        isConnected: true,
        chainId,
        provider,
        signer,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Si el error es porque la red cambió, es normal
      if (error.code === "NETWORK_ERROR" && error.message?.includes("network changed")) {
        console.log("Network changed during check, retrying...");
        // Reintentar después de un momento
        setTimeout(() => {
          checkConnection();
        }, 1000);
        return;
      }
      
      console.error("Error checking connection:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [validateChain, getCurrentChainId]);

  /**
   * Maneja cambios de cuenta
   */
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      // Usar la referencia para obtener la cuenta anterior sin depender del estado
      const previousAccount = previousAccountRef.current;
      
      console.log("Accounts changed event:", accounts, "Previous account:", previousAccount);
      
      if (accounts.length === 0) {
        // Usuario desconectó su cuenta en MetaMask
        console.log("No accounts available, disconnecting...");
        // Limpiar queries de la cuenta anterior
        if (previousAccount) {
          queryClient.removeQueries({ queryKey: ["user", previousAccount] });
          queryClient.removeQueries({ queryKey: ["userTokens", previousAccount] });
          queryClient.removeQueries({ queryKey: ["userTransfers", previousAccount] });
          queryClient.removeQueries({ queryKey: ["admin", "isAdmin", previousAccount] });
        }
        // Invalidar todas las queries de admin para forzar recarga
        queryClient.invalidateQueries({ queryKey: ["admin"] });
        
        // No revocar permisos aquí porque el usuario ya los revocó manualmente
        localStorage.removeItem(STORAGE_KEY);
        previousAccountRef.current = null;
        
        setState({
          account: null,
          isConnected: false,
          chainId: null,
          provider: null,
          signer: null,
          isLoading: false,
          error: null,
        });
      } else {
        // Usuario cambió de cuenta o conectó una nueva
        const newAccount = accounts[0].toLowerCase();
        const accountChanged = previousAccount && previousAccount.toLowerCase() !== newAccount;
        
        console.log("Account changed, reconnecting automatically...", {
          previousAccount,
          newAccount,
          accountChanged,
        });
        
        // Limpiar queries de la cuenta anterior si cambió
        if (accountChanged && previousAccount) {
          console.log("Clearing queries for previous account:", previousAccount);
          queryClient.removeQueries({ queryKey: ["user", previousAccount] });
          queryClient.removeQueries({ queryKey: ["userTokens", previousAccount] });
          queryClient.removeQueries({ queryKey: ["userTransfers", previousAccount] });
          queryClient.removeQueries({ queryKey: ["admin", "isAdmin", previousAccount] });
        }
        
        // Invalidar todas las queries de admin para forzar recarga
        queryClient.invalidateQueries({ queryKey: ["admin"] });
        
        setState((prev) => ({ ...prev, isLoading: true }));
        
        try {
          // Usar checkConnection para reconectar automáticamente
          // Esto valida la red y actualiza el estado correctamente
          await checkConnection();
        } catch (error) {
          console.error("Error reconnecting after account change:", error);
          // Si falla, intentar desconectar limpiamente
          queryClient.invalidateQueries({ queryKey: ["admin"] });
          
          setState({
            account: null,
            isConnected: false,
            chainId: null,
            provider: null,
            signer: null,
            isLoading: false,
            error: "Error al reconectar después del cambio de cuenta",
          });
        }
      }
    };

    /**
     * Maneja cambios de red
     */
    const handleChainChanged = async (chainId: string | number) => {
      // MetaMask puede enviar el chainId como string hexadecimal o número
      let newChainId: number;
      if (typeof chainId === "string") {
        // Puede venir como "0x7a69" o como número decimal en string
        newChainId = chainId.startsWith("0x") 
          ? parseInt(chainId, 16) 
          : parseInt(chainId, 10);
      } else {
        newChainId = chainId;
      }
      
      console.log("Chain changed - New chainId:", newChainId, "Expected:", NETWORK_CONFIG.chainId);
      
      if (newChainId !== NETWORK_CONFIG.chainId) {
        // Intentar cambiar automáticamente
        const switched = await switchToCorrectNetwork();
        if (!switched) {
        setState((prev) => ({
          ...prev,
            error: `Red incorrecta. Por favor cambia a ${NETWORK_CONFIG.name} (Chain ID: ${NETWORK_CONFIG.chainId}). Red actual: ${newChainId}`,
        }));
        }
      } else {
        await checkConnection();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [queryClient, checkConnection, switchToCorrectNetwork, getCurrentChainId]);

  /**
   * Limpiar queries cuando cambia la cuenta
   */
  useEffect(() => {
    const currentAccount = state.account;
    const previousAccount = previousAccountRef.current;

    // Si cambió la cuenta, limpiar queries de la cuenta anterior
    if (previousAccount && previousAccount !== currentAccount) {
      console.log("Account changed, clearing queries for previous account:", previousAccount);
      queryClient.removeQueries({ queryKey: ["user", previousAccount] });
      queryClient.removeQueries({ queryKey: ["userTokens", previousAccount] });
      queryClient.removeQueries({ queryKey: ["userTransfers", previousAccount] });
      queryClient.removeQueries({ queryKey: ["admin", "isAdmin", previousAccount] });
      
      // También invalidar todas las queries de admin para forzar recarga
      // Esto asegura que isAdmin se recalcule para la nueva cuenta
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    }

    // Actualizar la referencia de la cuenta anterior
    if (currentAccount) {
      previousAccountRef.current = currentAccount;
    } else {
      previousAccountRef.current = null;
    }
  }, [state.account, queryClient]);

  /**
   * Reconexión automática al cargar la página
   */
  useEffect(() => {
    const attemptReconnection = async () => {
      if (!window.ethereum) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

    const wasConnected = localStorage.getItem(STORAGE_KEY);
      if (!wasConnected) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Primero verificar si hay cuentas disponibles en MetaMask
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        
        // Si no hay cuentas disponibles, limpiar localStorage y no reconectar
        if (accounts.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
          setState((prev) => ({ 
            ...prev, 
            isLoading: false, 
            isConnected: false,
            account: null,
            provider: null,
            signer: null,
          }));
          return;
        }

        // Si hay cuentas, intentar reconectar
        await checkConnection();
      } catch (error) {
        console.error("Error during reconnection:", error);
        // Limpiar localStorage si hay error
        localStorage.removeItem(STORAGE_KEY);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
    };

    attemptReconnection();
  }, [checkConnection]);

  const value: MetaMaskContextType = {
    ...state,
    connect,
    disconnect,
    signMessage,
    getSigner,
    checkConnection,
  };

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
}

/**
 * Hook para usar el contexto MetaMask
 */
export function useMetaMask(): MetaMaskContextType {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return context;
}

