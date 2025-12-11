"use client";

import { Wallet } from "lucide-react";
import { Button } from "./button";
import { useMetaMask } from "@/hooks/useMetaMask";
import { LoadingSpinner } from "./LoadingSpinner";

interface ConnectWalletButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Botón para conectar/desconectar wallet MetaMask
 */
export function ConnectWalletButton({
  className,
  variant = "default",
  size = "default",
}: ConnectWalletButtonProps) {
  const { isConnected, account, connect, disconnect, isLoading, error } = useMetaMask();

  const handleClick = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  if (isConnected && account) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        Desconectar
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Conectando...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Conectar Wallet
        </>
      )}
    </Button>
  );
}

