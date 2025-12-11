"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useUserTokens } from "@/hooks/useUserTokens";
import { useContract } from "@/hooks/useContract";
import { UserStatus, TokenWithBalance } from "@/types";
import { Plus, Package, Eye } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function TokensPage() {
  const router = useRouter();
  const { account, isConnected } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { data: tokens, isLoading: tokensLoading, refetch } = useUserTokens(account, { includeBalance: true });
  const queryClient = useQueryClient();

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

  const tokensArray = (tokens as TokenWithBalance[]) || [];
  const canCreateToken = user.role === "Producer" || user.role === "Factory" || user.role === "Retailer";

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Título y acciones */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mis Tokens</h1>
              <p className="text-muted-foreground mt-2">
                Gestiona tus tokens y productos
              </p>
            </div>
            {canCreateToken && (
              <Link href="/tokens/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Token
                </Button>
              </Link>
            )}
          </div>

          {/* Lista de tokens */}
          {tokensLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </CardContent>
            </Card>
          ) : tokensArray.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No tienes tokens aún</p>
                {canCreateToken && (
                  <Link href="/tokens/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear tu Primer Token
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tokensArray.map((token) => (
                <Card key={token.id.toString()} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{token.name}</CardTitle>
                        <CardDescription className="mt-1">
                          ID: {token.id.toString()}
                        </CardDescription>
                      </div>
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Balance:</span>
                        <span className="font-medium">{token.balance.toString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Supply:</span>
                        <span className="font-medium">{token.totalSupply.toString()}</span>
                      </div>
                      {token.parentId > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Token Padre:</span>
                          <span className="font-medium">#{token.parentId.toString()}</span>
                        </div>
                      )}
                    </div>
                    <Link href={`/tokens/${token.id}`}>
                      <Button variant="outline" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

