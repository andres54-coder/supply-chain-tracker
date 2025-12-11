"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useContract } from "@/hooks/useContract";
import { useAdmin } from "@/hooks/useAdmin";
import { UserStatus, User } from "@/types";
import { ArrowLeft, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { JsonRpcProvider } from "ethers";
import { getContract } from "@/contracts/config";
import { NETWORK_CONFIG } from "@/contracts/config";

export default function AdminUsersPage() {
  const router = useRouter();
  const { account, isConnected } = useMetaMask();
  const { changeStatusUser, getUserInfo, isLoading: isProcessing } = useContract();
  const { isAdmin, isLoading: isLoadingAdmin, adminAddress } = useAdmin();
  const queryClient = useQueryClient();

  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Protección de ruta: solo admin puede acceder
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (!isLoadingAdmin && !isAdmin) {
        router.push("/");
    }
  }, [isConnected, isAdmin, isLoadingAdmin, router]);

  // Función para obtener todos los usuarios
  const fetchUsers = useCallback(async () => {
      if (!account) return;

      setIsLoading(true);
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
                console.warn(`Unknown user status: ${statusNumber} for user ${userData.userAddress}, defaulting to Pending`);
                status = UserStatus.Pending;
            }
            
              usersList.push({
                id: BigInt(userData.id.toString()),
                userAddress: userData.userAddress,
                role: userData.role,
              status,
              });
            }
          } catch (error) {
            // Si falla, probablemente el usuario no existe, continuar
            continue;
          }
        }

        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
  }, [account]);

  // Obtener todos los usuarios al cargar
  useEffect(() => {
    if (account && isAdmin) {
      fetchUsers();
    }
  }, [account, isAdmin, fetchUsers]);

  const handleStatusChange = async (userAddress: string, newStatus: UserStatus) => {
    setSelectedUser(userAddress);
    try {
      const success = await changeStatusUser(userAddress, newStatus);
      if (success) {
        // Invalidar queries relacionadas con el usuario
        queryClient.invalidateQueries({ queryKey: ["user", userAddress] });
        // Refrescar lista de usuarios sin recargar la página
        await fetchUsers();
      }
    } finally {
      setSelectedUser(null);
    }
  };

  if (!isConnected || isLoadingAdmin) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    if (filterRole !== "all" && user.role !== filterRole) return false;
    if (filterStatus !== "all" && user.status.toString() !== filterStatus) return false;
    return true;
  });

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
              <p className="text-muted-foreground mt-2">
                Aprobar, rechazar y gestionar usuarios del sistema
              </p>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Filtrar por Rol</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="Producer">Producer</SelectItem>
                      <SelectItem value="Factory">Factory</SelectItem>
                      <SelectItem value="Retailer">Retailer</SelectItem>
                      <SelectItem value="Consumer">Consumer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Filtrar por Estado</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value={UserStatus.Pending.toString()}>Pendiente</SelectItem>
                      <SelectItem value={UserStatus.Approved.toString()}>Aprobado</SelectItem>
                      <SelectItem value={UserStatus.Rejected.toString()}>Rechazado</SelectItem>
                      <SelectItem value={UserStatus.Canceled.toString()}>Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de usuarios */}
          <Card>
            <CardHeader>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                {filteredUsers.length} usuario(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay usuarios para mostrar
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dirección</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.userAddress}>
                          <TableCell>
                            <AddressDisplay address={user.userAddress} showCopyButton={false} />
                          </TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <StatusBadge status={user.status} type="user" />
                          </TableCell>
                          <TableCell>
                            {user.status === UserStatus.Pending && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(user.userAddress, UserStatus.Approved)}
                                  disabled={isProcessing || selectedUser === user.userAddress}
                                >
                                  {selectedUser === user.userAddress && isProcessing ? (
                                    <LoadingSpinner size="sm" className="mr-2" />
                                  ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                  )}
                                  Aprobar
                                </Button>
                                {/* El admin no puede rechazarse a sí mismo */}
                                {adminAddress && user.userAddress.toLowerCase() !== adminAddress.toLowerCase() && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStatusChange(user.userAddress, UserStatus.Rejected)}
                                  disabled={isProcessing || selectedUser === user.userAddress}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Rechazar
                                </Button>
                                )}
                              </div>
                            )}
                            {user.status === UserStatus.Approved && (
                              <>
                                {/* El admin no puede rechazarse a sí mismo */}
                                {adminAddress && user.userAddress.toLowerCase() !== adminAddress.toLowerCase() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(user.userAddress, UserStatus.Rejected)}
                                disabled={isProcessing || selectedUser === user.userAddress}
                              >
                                Rechazar
                              </Button>
                                )}
                                {adminAddress && user.userAddress.toLowerCase() === adminAddress.toLowerCase() && (
                                  <span className="text-sm text-muted-foreground">Admin</span>
                                )}
                              </>
                            )}
                            {user.status === UserStatus.Rejected && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(user.userAddress, UserStatus.Approved)}
                                disabled={isProcessing || selectedUser === user.userAddress}
                              >
                                Aprobar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nota sobre obtención de usuarios */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Para obtener la lista completa de usuarios, el contrato necesitaría una función
                adicional que retorne todos los usuarios. Por ahora, esta página muestra usuarios conocidos o aquellos
                obtenidos mediante eventos.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

