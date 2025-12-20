"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { JsonDisplay } from "@/components/ui/JsonDisplay";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useContract } from "@/hooks/useContract";
import { UserStatus, Token } from "@/types";
import { ArrowLeft, ArrowRightLeft, Package, Calendar, User } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TraceabilityTree } from "@/components/TraceabilityTree";

export default function TokenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params.id as string;
  const { account, isConnected } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { getToken, getTokenBalance } = useContract();
  const queryClient = useQueryClient();

  const [balance, setBalance] = useState<bigint | null>(null);
  const [parentToken, setParentToken] = useState<Token | null>(null);

  const { data: token, isLoading: tokenLoading, error } = useQuery({
    queryKey: ["token", tokenId],
    queryFn: async () => {
      if (!tokenId) return null;
      
      // Validar que tokenId sea un número válido
      const parsedTokenId = BigInt(tokenId);
      if (parsedTokenId <= 0) return null;
      
      try {
        const result = await getToken(parsedTokenId);
        if (!result) {
          console.warn(`Token ${tokenId} not found or returned null`);
        }
        return result;
      } catch (err: unknown) {
        const errorMessage = (err as any)?.reason || (err as any)?.message || "";
        // Si el token no existe, retornar null sin lanzar error
        if (errorMessage.includes("Token does not exist") || 
            errorMessage.includes("token does not exist")) {
          return null;
        }
        // Para otros errores, relanzar
        throw err;
      }
    },
    enabled: !!tokenId && !isNaN(Number(tokenId)),
    staleTime: 0, // Siempre considerar los datos como obsoletos para forzar recarga después de transferencias
    retry: (failureCount, error: unknown) => {
      // No reintentar si el token no existe
      const errorMessage = (error as any)?.reason || (error as any)?.message || "";
      if (errorMessage.includes("Token does not exist") || 
          errorMessage.includes("token does not exist") ||
          errorMessage.includes("does not exist")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Obtener balance del usuario
  useEffect(() => {
    if (token && account && tokenId) {
      getTokenBalance(BigInt(tokenId), account)
        .then(setBalance)
        .catch((err) => {
          console.error("Error getting token balance:", err);
          setBalance(BigInt(0));
        });
    }
  }, [token, account, tokenId, getTokenBalance]);

  // Obtener token padre si existe
  useEffect(() => {
    if (token && token.parentId > 0) {
      getToken(token.parentId)
        .then(setParentToken)
        .catch((err) => {
          console.error("Error getting parent token:", err);
          setParentToken(null);
        });
    } else {
      setParentToken(null);
    }
  }, [token, getToken]);

  // Protección de ruta
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (!userLoading && user && user.status !== UserStatus.Approved) {
      router.push("/");
    }
  }, [isConnected, user, userLoading, router]);

  if (!isConnected || userLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </>
    );
  }

  if (!user || user.status !== UserStatus.Approved) {
    return null;
  }

  if (tokenLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Token no encontrado</p>
              <Link href="/tokens">
                <Button variant="outline" className="mt-4">
                  Volver a Tokens
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const canTransfer = user.role !== "Consumer" && balance && balance > 0;

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Navegación */}
          <div className="flex items-center gap-4">
            <Link href="/tokens">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{token.name}</h1>
              <p className="text-muted-foreground mt-2">Detalles del Token</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Información principal */}
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID del Token:</span>
                    <span className="font-mono text-sm">#{token.id.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Creador:</span>
                    <AddressDisplay address={token.creator} showCopyButton={false} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Supply:</span>
                    <span className="font-medium">{token.totalSupply.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Mi Balance:</span>
                    <span className="font-medium">
                      {balance !== null ? balance.toString() : "Cargando..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fecha de Creación:</span>
                    <span className="text-sm">
                      {new Date(Number(token.dateCreated) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trazabilidad */}
            <Card>
              <CardHeader>
                <CardTitle>Trazabilidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {token.parentId === BigInt(0) ? (
                  <div className="text-sm text-muted-foreground">
                    Este es un token base (materia prima) sin token padre
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Token Padre:</span>
                      <Link href={`/tokens/${token.parentId}`}>
                        <Button variant="link" className="h-auto p-0">
                          #{token.parentId.toString()}
                        </Button>
                      </Link>
                    </div>
                    {parentToken && (
                      <div className="mt-2 p-2 rounded-md bg-muted">
                        <p className="text-sm font-medium">{parentToken.name}</p>
                        <div className="text-xs text-muted-foreground">
                          Creado por: <AddressDisplay address={parentToken.creator} showCopyButton={false} truncate={true} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadatos */}
            {token.features && token.features !== "{}" && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Metadatos</CardTitle>
                </CardHeader>
                <CardContent>
                  <JsonDisplay json={token.features} />
                </CardContent>
              </Card>
            )}

            {/* Acciones */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                {canTransfer ? (
                  <Link href={`/tokens/${tokenId}/transfer`}>
                    <Button>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Transferir Token
                    </Button>
                  </Link>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {user.role === "Consumer"
                      ? "Los Consumers no pueden transferir tokens"
                      : "No tienes balance suficiente para transferir"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trazabilidad Completa */}
          <TraceabilityTree tokenId={BigInt(tokenId)} />
        </div>
      </main>
    </>
  );
}

