"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useUserTokens } from "@/hooks/useUserTokens";
import { useUserTransfers } from "@/hooks/useUserTransfers";
import { UserStatus, TransferStatus } from "@/types";
import { Package, ArrowLeftRight, Plus, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { account, isConnected } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { data: tokens, isLoading: tokensLoading } = useUserTokens(account, { includeBalance: true });
  const { data: transfers, isLoading: transfersLoading } = useUserTransfers(account);
  const { data: pendingTransfers } = useUserTransfers(account, { filterByStatus: TransferStatus.Pending });

  // Protección de ruta: redirigir si no está conectado o no aprobado
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (!userLoading && user) {
      if (user.status !== UserStatus.Approved) {
        router.push("/");
      }
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

  const userRole = user.role;
  const tokensArray = Array.isArray(tokens) ? tokens : [];
  const transfersArray = Array.isArray(transfers) ? transfers : [];
  const pendingTransfersArray = Array.isArray(pendingTransfers) ? pendingTransfers : [];

  // Calcular estadísticas según rol
  const stats = {
    totalTokens: tokensArray.length,
    totalTransfers: transfersArray.length,
    pendingTransfers: pendingTransfersArray.length,
    tokensCreated: tokensArray.filter((t: any) => t.creator?.toLowerCase() === account?.toLowerCase()).length,
  };

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Título y bienvenida */}
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Bienvenido, {userRole}
            </p>
          </div>

          {/* Estadísticas según rol */}
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
                  {stats.pendingTransfers} pendientes
                </p>
              </CardContent>
            </Card>

            {userRole === "Producer" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tokens Creados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tokensCreated}</div>
                  <p className="text-xs text-muted-foreground">Materias primas</p>
                </CardContent>
              </Card>
            )}

            {userRole === "Factory" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tokensCreated}</div>
                  <p className="text-xs text-muted-foreground">Productos derivados</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Accesos rápidos */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Tokens</CardTitle>
                <CardDescription>Ver y crear tokens</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link href="/tokens">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Mis Tokens
                  </Button>
                </Link>
                {(userRole === "Producer" || userRole === "Factory" || userRole === "Retailer") && (
                  <Link href="/tokens/create">
                    <Button className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Nuevo Token
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transferencias</CardTitle>
                <CardDescription>Gestionar transferencias</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/transfers">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Ver Transferencias
                  </Button>
                </Link>
                {stats.pendingTransfers > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {stats.pendingTransfers} transferencia(s) pendiente(s)
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Información de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    Ver Perfil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Tokens recientes */}
          {tokensLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </CardContent>
            </Card>
          ) : tokensArray.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Mis Tokens Recientes</CardTitle>
                <CardDescription>Últimos tokens en tu posesión</CardDescription>
              </CardHeader>
              <CardContent>
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
                {tokensArray.length > 5 && (
                  <div className="mt-4">
                    <Link href="/tokens">
                      <Button variant="outline" className="w-full">
                        Ver Todos los Tokens
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Transferencias pendientes */}
          {pendingTransfersArray.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transferencias Pendientes</CardTitle>
                <CardDescription>Requieren tu atención</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingTransfersArray.slice(0, 3).map((transfer: any) => (
                    <div
                      key={transfer.id.toString()}
                      className="p-3 rounded-md border flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Token ID: {transfer.tokenId.toString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cantidad: {transfer.amount.toString()}
                        </p>
                      </div>
                      <Link href="/transfers">
                        <Button size="sm">Revisar</Button>
                      </Link>
                    </div>
                  ))}
                </div>
                {pendingTransfersArray.length > 3 && (
                  <div className="mt-4">
                    <Link href="/transfers">
                      <Button variant="outline" className="w-full">
                        Ver Todas las Pendientes
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

