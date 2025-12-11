"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useUserTokens } from "@/hooks/useUserTokens";
import { useUserTransfers } from "@/hooks/useUserTransfers";
import { UserStatus, TransferStatus } from "@/types";
import { Package, ArrowLeftRight, Calendar, User, Eye } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { account, isConnected } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { data: tokens, isLoading: tokensLoading } = useUserTokens(account, { includeBalance: true });
  const { data: transfers, isLoading: transfersLoading } = useUserTransfers(account);

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

  const tokensArray = Array.isArray(tokens) ? tokens : [];
  const transfersArray = Array.isArray(transfers) ? transfers : [];

  // Calcular estadísticas
  const stats = {
    totalTokens: tokensArray.length,
    totalTransfers: transfersArray.length,
    transfersSent: transfersArray.filter((t: any) => t.from.toLowerCase() === account?.toLowerCase()).length,
    transfersReceived: transfersArray.filter((t: any) => t.to.toLowerCase() === account?.toLowerCase()).length,
    tokensCreated: tokensArray.filter((t: any) => t.creator?.toLowerCase() === account?.toLowerCase()).length,
    acceptedTransfers: transfersArray.filter((t: any) => t.status === TransferStatus.Accepted).length,
  };

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-muted-foreground mt-2">
              Información de tu cuenta y actividad
            </p>
          </div>

          {/* Información del usuario */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Dirección:</span>
                  </div>
                  <AddressDisplay address={user.userAddress} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rol:</span>
                  </div>
                  <span className="font-medium">{user.role}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                  </div>
                  <StatusBadge status={user.status} type="user" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ID de Usuario:</span>
                  </div>
                  <span className="font-mono text-sm">#{user.id.toString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Tokens</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTokens}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.tokensCreated} creados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransfers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.acceptedTransfers} aceptadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.transfersSent}</div>
                <p className="text-xs text-muted-foreground">
                  Transferencias enviadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.transfersReceived}</div>
                <p className="text-xs text-muted-foreground">
                  Transferencias recibidas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio de tokens */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Portfolio de Tokens</CardTitle>
                  <CardDescription>
                    Resumen de tus tokens y productos
                  </CardDescription>
                </div>
                <Link href="/tokens">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {tokensLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : tokensArray.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tienes tokens aún
                </div>
              ) : (
                <div className="space-y-2">
                  {tokensArray.slice(0, 5).map((token: any) => (
                    <Link
                      key={token.id.toString()}
                      href={`/tokens/${token.id}`}
                      className="block p-3 rounded-md border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Balance: {token.balance?.toString() || "0"}
                          </p>
                        </div>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actividad reciente */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>
                    Últimas transferencias
                  </CardDescription>
                </div>
                <Link href="/transfers">
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {transfersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : transfersArray.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay actividad aún
                </div>
              ) : (
                <div className="space-y-2">
                  {transfersArray
                    .sort((a: any, b: any) => Number(b.dateCreated - a.dateCreated))
                    .slice(0, 5)
                    .map((transfer: any) => {
                      const isIncoming = transfer.to.toLowerCase() === account?.toLowerCase();
                      return (
                        <div
                          key={transfer.id.toString()}
                          className="p-3 rounded-md border"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {isIncoming ? "Recibiste" : "Enviaste"} Token #{transfer.tokenId.toString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cantidad: {transfer.amount.toString()} •{" "}
                                {new Date(Number(transfer.dateCreated) * 1000).toLocaleString()}
                              </p>
                            </div>
                            <StatusBadge status={transfer.status} type="transfer" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

