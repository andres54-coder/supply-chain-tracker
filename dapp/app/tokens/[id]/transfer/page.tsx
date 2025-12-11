"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useContract } from "@/hooks/useContract";
import { useUserInfo as useRecipientInfo } from "@/hooks/useUserInfo";
import { UserStatus, User } from "@/types";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { JsonRpcProvider } from "ethers";
import { getContract } from "@/contracts/config";
import { NETWORK_CONFIG } from "@/contracts/config";

export default function TransferTokenPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = params.id as string;
  const { account, isConnected } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { getToken, getTokenBalance, transfer, isLoading: isTransferring, error: contractError } = useContract();
  const queryClient = useQueryClient();

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const { data: token } = useQuery({
    queryKey: ["token", tokenId],
    queryFn: async () => {
      if (!tokenId) return null;
      return await getToken(BigInt(tokenId));
    },
    enabled: !!tokenId,
  });

  const { data: recipient } = useRecipientInfo(recipientAddress || null);

  // Obtener todos los usuarios aprobados
  const fetchUsers = useCallback(async () => {
    if (!account) return;

    setIsLoadingUsers(true);
    try {
      // Crear provider para lectura pública
      const provider = new JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      const contract = getContract(provider);

      // Obtener nextUserId para saber cuántos usuarios hay
      const nextUserId = await contract.nextUserId();
      const userIdCount = Number(nextUserId);

      // Obtener todos los usuarios iterando sobre los IDs
      const usersList: User[] = [];
      for (let i = 1; i < userIdCount; i++) {
        try {
          // Obtener el usuario por ID usando el mapping público users
          const userData = await contract.users(i);
          if (userData.userAddress && userData.userAddress !== "0x0000000000000000000000000000000000000000") {
            // Mapear el estado numérico al enum UserStatus
            const statusNumber = Number(userData.status);
            let status: UserStatus;
            switch (statusNumber) {
              case 0:
                status = UserStatus.Pending;
                break;
              case 1:
                status = UserStatus.Approved;
                break;
              case 2:
                status = UserStatus.Rejected;
                break;
              case 3:
                status = UserStatus.Canceled;
                break;
              default:
                status = UserStatus.Pending;
            }
            
            // Solo incluir usuarios aprobados y excluir al usuario actual
            if (status === UserStatus.Approved && userData.userAddress.toLowerCase() !== account.toLowerCase()) {
              usersList.push({
                id: BigInt(userData.id.toString()),
                userAddress: userData.userAddress,
                role: userData.role,
                status,
              });
            }
          }
        } catch (error) {
          // Continuar si falla
          continue;
        }
      }

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [account]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Obtener balance
  useEffect(() => {
    if (token && account) {
      getTokenBalance(BigInt(tokenId), account).then(setBalance);
    }
  }, [token, account, tokenId, getTokenBalance]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!recipientAddress.trim()) {
      setError("La dirección del destinatario es requerida");
      return;
    }

    if (!amount || BigInt(amount) <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (!balance || BigInt(amount) > balance) {
      setError("No tienes balance suficiente");
      return;
    }

    if (recipientAddress.toLowerCase() === account?.toLowerCase()) {
      setError("No puedes transferir a ti mismo");
      return;
    }

    if (!recipient) {
      setError("El destinatario no está registrado en el sistema");
      return;
    }

    if (recipient.status !== UserStatus.Approved) {
      setError("El destinatario no está aprobado");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await transfer(
        recipientAddress.trim(),
        BigInt(tokenId),
        BigInt(amount)
      );

      if (success) {
        // Invalidar queries para refrescar datos
        queryClient.invalidateQueries({ queryKey: ["userTokens", account] });
        queryClient.invalidateQueries({ queryKey: ["userTransfers", account] });
        router.push("/transfers");
      } else {
        setError(contractError || "Error al transferir el token");
      }
    } catch (err: any) {
      setError(err.message || "Error al transferir el token");
    } finally {
      setIsSubmitting(false);
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

  if (user.role === "Consumer") {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>
                Los Consumers no pueden transferir tokens
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href={`/tokens/${tokenId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Transferir Token</h1>
              <p className="text-muted-foreground mt-2">
                {token && `Transferir: ${token.name}`}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información de Transferencia</CardTitle>
              <CardDescription>
                Completa los datos para transferir el token
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balance !== null && (
                <div className="mb-6 p-4 rounded-md bg-muted">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tu Balance:</span>
                    <span className="font-medium">{balance.toString()}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Destinatario *</Label>
                  {isLoadingUsers ? (
                    <div className="flex items-center gap-2 py-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-muted-foreground">Cargando usuarios...</span>
                    </div>
                  ) : (
                    <Select
                      value={recipientAddress}
                      onValueChange={setRecipientAddress}
                      disabled={isSubmitting || isTransferring}
                      required
                    >
                      <SelectTrigger id="recipient">
                        <SelectValue placeholder="Selecciona un destinatario">
                          {recipientAddress && recipient ? (
                            `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)} (${recipient.role})`
                          ) : (
                            "Selecciona un destinatario"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {users.length === 0 ? (
                          <SelectItem value="" disabled>
                            No hay usuarios disponibles
                          </SelectItem>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.userAddress} value={user.userAddress}>
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="font-mono text-sm">{user.userAddress.slice(0, 6)}...{user.userAddress.slice(-4)}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{user.role}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {recipient && (
                    <div className="mt-2 text-sm">
                      <p className="text-muted-foreground">
                        Rol: <span className="font-medium">{recipient.role}</span>
                        {recipient.status === UserStatus.Approved && (
                          <span className="ml-2 text-green-600">✓ Aprobado</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Cantidad *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    min="1"
                    max={balance?.toString() || undefined}
                    disabled={isSubmitting || isTransferring}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo disponible: {balance?.toString() || "0"}
                  </p>
                </div>

                {error && <ErrorMessage message={error} />}
                {contractError && <ErrorMessage message={contractError} />}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isTransferring || !balance || balance === BigInt(0)}
                    className="flex-1"
                  >
                    {isSubmitting || isTransferring ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Transferiendo...
                      </>
                    ) : (
                      "Transferir"
                    )}
                  </Button>
                  <Link href={`/tokens/${tokenId}`}>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

