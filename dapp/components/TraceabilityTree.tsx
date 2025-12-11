"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useContract } from "@/hooks/useContract";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { Token, Transfer, TransferStatus } from "@/types";
import { Package, ArrowDown, ChevronRight, Circle } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { JsonRpcProvider } from "ethers";
import { getContract } from "@/contracts/config";
import { NETWORK_CONFIG } from "@/contracts/config";

interface TraceabilityTreeProps {
  tokenId: bigint;
}

interface TransferWithDetails extends Transfer {
  fromUserRole?: string;
  toUserRole?: string;
}

export function TraceabilityTree({ tokenId }: TraceabilityTreeProps) {
  const { getToken } = useContract();
  const { account } = useMetaMask();
  const [parentChain, setParentChain] = useState<Token[]>([]);
  const [allTransfers, setAllTransfers] = useState<TransferWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: rootToken } = useQuery({
    queryKey: ["token", tokenId.toString()],
    queryFn: async () => {
      return await getToken(tokenId);
    },
  });

  useEffect(() => {
    const buildTraceability = async () => {
      if (!rootToken) return;

      setIsLoading(true);
      setError(null);

      try {
        // Construir la cadena de padres hacia arriba
        const chain: Token[] = [];
        let currentToken: Token | null = rootToken;

        while (currentToken && currentToken.parentId > 0) {
          try {
            const parent = await getToken(currentToken.parentId);
            chain.push(parent);
            currentToken = parent;
          } catch {
            break;
          }
        }

        setParentChain(chain);

        // Obtener todas las transferencias relacionadas con este token
        // Usamos un provider público para leer todos los datos
        const provider = new JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
        const contract = getContract(provider);

        // Obtener nextTransferId para saber cuántas transferencias hay
        const nextTransferId = await contract.nextTransferId();
        const transferCount = Number(nextTransferId);

        const transfers: TransferWithDetails[] = [];

        // Iterar sobre todas las transferencias para encontrar las relacionadas con este token
        for (let i = 1; i < transferCount; i++) {
          try {
            const transfer = await contract.getTransfer(i);
            // Mapear correctamente el estado numérico al enum TransferStatus
            const statusNumber = Number(transfer.status);
            let status: TransferStatus;
            switch (statusNumber) {
              case 0:
                status = TransferStatus.Pending;
                break;
              case 1:
                status = TransferStatus.Accepted;
                break;
              case 2:
                status = TransferStatus.Rejected;
                break;
              default:
                status = TransferStatus.Pending;
            }
            
            // Mapear correctamente la transferencia (igual que en useContract.ts)
            const mappedTransfer: TransferWithDetails = {
              id: BigInt(transfer.id.toString()),
              from: transfer.from,
              to: transfer.to,
              tokenId: BigInt(transfer.tokenId.toString()),
              dateCreated: BigInt(transfer.dateCreated.toString()),
              amount: BigInt(transfer.amount.toString()),
              status,
            };
            
            if (mappedTransfer.tokenId.toString() === tokenId.toString()) {
              // Intentar obtener información de los usuarios
              try {
                const fromUser = await contract.getUserInfo(mappedTransfer.from);
                const toUser = await contract.getUserInfo(mappedTransfer.to);
                mappedTransfer.fromUserRole = fromUser.role;
                mappedTransfer.toUserRole = toUser.role;
              } catch {
                // Continuar sin roles si falla
              }
              transfers.push(mappedTransfer);
            }
          } catch {
            // Continuar si falla
            continue;
          }
        }

        // Ordenar transferencias por fecha (más antiguas primero)
        transfers.sort((a, b) => Number(a.dateCreated - b.dateCreated));
        setAllTransfers(transfers);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Error al construir la trazabilidad";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (rootToken) {
      buildTraceability();
    }
  }, [rootToken, tokenId, getToken]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-muted-foreground">Cargando trazabilidad...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadena de Trazabilidad</CardTitle>
        <CardDescription>
          Historial completo del token desde su origen hasta el consumidor final
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cadena de padres (hacia arriba) */}
        {parentChain.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Origen del Producto</h3>
            <div className="space-y-3">
              {parentChain.reverse().map((parent, index) => (
                <div key={parent.id.toString()} className="flex items-center gap-3">
                  {index > 0 && (
                    <div className="flex flex-col items-center">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <TokenNode token={parent} />
                </div>
              ))}
              {parentChain.length > 0 && (
                <div className="flex items-center gap-3">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  <TokenNode token={rootToken!} isCurrent />
                </div>
              )}
            </div>
          </div>
        )}

        {parentChain.length === 0 && rootToken && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Token Base</h3>
            <TokenNode token={rootToken} isCurrent />
          </div>
        )}

        {/* Historial de transferencias - Timeline */}
        {allTransfers.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Historial de Transferencias</h3>
            <div className="relative">
              {/* Línea vertical del timeline */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              
              {/* Items del timeline */}
              <div className="space-y-6 relative">
                {allTransfers.map((transfer, index) => (
                  <TransferTimelineNode
                    key={transfer.id.toString()}
                    transfer={transfer}
                    isLast={index === allTransfers.length - 1}
                    isUserReceiver={account?.toLowerCase() === transfer.to.toLowerCase()}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {allTransfers.length === 0 && (
          <div className="text-sm text-muted-foreground py-4">
            No hay transferencias registradas para este token aún.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TokenNode({ token, isCurrent = false }: { token: Token; isCurrent?: boolean }) {
  return (
    <Link
      href={`/tokens/${token.id}`}
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        isCurrent
          ? "bg-primary/10 border-primary"
          : "bg-card hover:bg-accent"
      }`}
    >
      <Package className={`h-5 w-5 mt-0.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{token.name}</p>
          {isCurrent && (
            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
              Actual
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1 space-y-1">
          <div>
            <span>ID: </span>
            <span className="font-mono">#{token.id.toString()}</span>
          </div>
          <div>
            <span>Creador: </span>
            <AddressDisplay address={token.creator} showCopyButton={false} truncate={true} />
          </div>
          <div>
            <span>Supply: </span>
            <span className="font-medium">{token.totalSupply.toString()}</span>
          </div>
          <div>
            <span>Creado: </span>
            <span>{new Date(Number(token.dateCreated) * 1000).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TransferTimelineNode({
  transfer,
  isLast,
  isUserReceiver,
}: {
  transfer: TransferWithDetails;
  isLast: boolean;
  isUserReceiver: boolean;
}) {
  return (
    <div className="relative flex items-start gap-4">
      {/* Nodo del timeline */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
            isUserReceiver
              ? "bg-primary/10 border-primary"
              : "bg-card border-border"
          }`}
        >
          <Circle
            className={`h-6 w-6 ${
              isUserReceiver ? "fill-primary text-primary" : "fill-muted text-muted-foreground"
            }`}
          />
        </div>
      </div>

      {/* Contenido de la transferencia */}
      <div
        className={`flex-1 pb-6 ${
          !isLast ? "border-b border-border" : ""
        } ${isUserReceiver ? "bg-primary/5 rounded-lg p-4 -ml-4" : ""}`}
      >
        <div className="space-y-2">
          {/* Encabezado con fecha */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-medium text-muted-foreground">
              {new Date(Number(transfer.dateCreated) * 1000).toLocaleString()}
            </div>
            <StatusBadge status={transfer.status} type="transfer" />
          </div>

          {/* Información de la transferencia */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">De:</span>
                <AddressDisplay address={transfer.from} showCopyButton={false} truncate={true} />
                {transfer.fromUserRole && (
                  <span className="text-xs text-muted-foreground">
                    ({transfer.fromUserRole})
                  </span>
                )}
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Para:</span>
                <div className={isUserReceiver ? "font-semibold text-primary" : ""}>
                  <AddressDisplay
                    address={transfer.to}
                    showCopyButton={false}
                    truncate={true}
                  />
                </div>
                {transfer.toUserRole && (
                  <span className="text-xs text-muted-foreground">
                    ({transfer.toUserRole})
                  </span>
                )}
                {isUserReceiver && (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
                    Tú
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <span>Cantidad: </span>
              <span className="font-medium">{transfer.amount.toString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
