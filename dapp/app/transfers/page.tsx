"use client";

import { useState, useEffect } from "react";
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
import { useUserTransfers } from "@/hooks/useUserTransfers";
import { useContract } from "@/hooks/useContract";
import { UserStatus, TransferStatus, Transfer } from "@/types";
import { Check, X, ArrowLeftRight, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TransfersPage() {
  const router = useRouter();
  const { account, isConnected } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { acceptTransfer, rejectTransfer, getTransfer, isLoading: isProcessing } = useContract();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<TransferStatus | "all">("all");
  const [selectedTransfer, setSelectedTransfer] = useState<bigint | null>(null);

  const { data: allTransfers, isLoading: transfersLoading } = useUserTransfers(account);
  const { data: pendingTransfers } = useUserTransfers(account, { filterByStatus: TransferStatus.Pending });

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

  const handleAccept = async (transferId: bigint) => {
    setSelectedTransfer(transferId);
    try {
      const success = await acceptTransfer(transferId);
      if (success) {
        // Invalidar y refetch inmediatamente todas las queries relacionadas
        // NO invalidar la query del token específico para evitar problemas de "token no encontrado"
        // El token se actualizará automáticamente cuando se visite la página debido a staleTime: 0
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["userTransfers"] }),
          queryClient.invalidateQueries({ queryKey: ["userTokens", account] }),
          queryClient.invalidateQueries({ queryKey: ["transfer", transferId] }),
        ]);
        // Forzar refetch inmediato solo de transferencias
        await queryClient.refetchQueries({ queryKey: ["userTransfers"] });
      }
    } finally {
      setSelectedTransfer(null);
    }
  };

  const handleReject = async (transferId: bigint) => {
    setSelectedTransfer(transferId);
    try {
      const success = await rejectTransfer(transferId);
      if (success) {
        // Invalidar y refetch inmediatamente todas las queries relacionadas
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["userTransfers"] }),
          queryClient.invalidateQueries({ queryKey: ["transfer", transferId] }),
        ]);
        // Forzar refetch inmediato
        await queryClient.refetchQueries({ queryKey: ["userTransfers"] });
      }
    } finally {
      setSelectedTransfer(null);
    }
  };

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

  const transfersArray = (allTransfers || []) as Transfer[];
  const pendingArray = (pendingTransfers || []) as Transfer[];

  // Filtrar transferencias según el filtro seleccionado
  const filteredTransfers = filterStatus === "all"
    ? transfersArray
    : transfersArray.filter((t) => t.status === filterStatus);

  // Ordenar por fecha (más reciente primero)
  const sortedTransfers = [...filteredTransfers].sort((a, b) => {
    return Number(b.dateCreated - a.dateCreated);
  });

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Transferencias</h1>
              <p className="text-muted-foreground mt-2">
                Gestiona tus transferencias de tokens
              </p>
            </div>
          </div>

          {/* Transferencias pendientes recibidas */}
          {pendingArray.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transferencias Pendientes</CardTitle>
                <CardDescription>
                  Transferencias que requieren tu atención
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingArray.map((transfer) => (
                    <div
                      key={transfer.id.toString()}
                      className="p-4 rounded-lg border flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Token ID: {transfer.tokenId.toString()}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">De: </span>
                            <AddressDisplay address={transfer.from} showCopyButton={false} />
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cantidad: </span>
                            <span className="font-medium">{transfer.amount.toString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fecha: </span>
                            <span>{new Date(Number(transfer.dateCreated) * 1000).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(transfer.id)}
                          disabled={isProcessing || selectedTransfer === transfer.id}
                        >
                          {selectedTransfer === transfer.id && isProcessing ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(transfer.id)}
                          disabled={isProcessing || selectedTransfer === transfer.id}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de transferencias */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Transferencias</CardTitle>
                  <CardDescription>
                    Todas tus transferencias enviadas y recibidas
                  </CardDescription>
                </div>
                <Select 
                  value={filterStatus === "all" ? "all" : filterStatus.toString()} 
                  onValueChange={(value) => {
                    if (value === "all") {
                      setFilterStatus("all");
                    } else {
                      setFilterStatus(Number(value) as TransferStatus);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value={TransferStatus.Pending.toString()}>Pendientes</SelectItem>
                    <SelectItem value={TransferStatus.Accepted.toString()}>Aceptadas</SelectItem>
                    <SelectItem value={TransferStatus.Rejected.toString()}>Rechazadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {transfersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : sortedTransfers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay transferencias para mostrar
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedTransfers.map((transfer) => {
                    const isIncoming = transfer.to.toLowerCase() === account?.toLowerCase();
                    // Comparar el estado correctamente (ya está mapeado a enum en getTransfer)
                    const isPending = transfer.status === TransferStatus.Pending;
                    const canAction = isIncoming && isPending;

                    return (
                      <div
                        key={transfer.id.toString()}
                        className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {isIncoming ? "Recibida" : "Enviada"}
                              </span>
                              <StatusBadge status={transfer.status} type="transfer" />
                            </div>
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="text-muted-foreground">
                                  {isIncoming ? "De: " : "Para: "}
                                </span>
                                <AddressDisplay
                                  address={isIncoming ? transfer.from : transfer.to}
                                  showCopyButton={false}
                                />
                              </div>
                              <div>
                                <span className="text-muted-foreground">Token ID: </span>
                                <Link
                                  href={`/tokens/${transfer.tokenId}`}
                                  className="font-medium hover:underline"
                                >
                                  #{transfer.tokenId.toString()}
                                </Link>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cantidad: </span>
                                <span className="font-medium">{transfer.amount.toString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Fecha: </span>
                                <span>{new Date(Number(transfer.dateCreated) * 1000).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          {canAction && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAccept(transfer.id)}
                                disabled={isProcessing || selectedTransfer === transfer.id}
                              >
                                {selectedTransfer === transfer.id && isProcessing ? (
                                  <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                  <Check className="mr-2 h-4 w-4" />
                                )}
                                Aceptar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(transfer.id)}
                                disabled={isProcessing || selectedTransfer === transfer.id}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Rechazar
                              </Button>
                            </div>
                          )}
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

