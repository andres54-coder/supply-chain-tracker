"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useContract } from "@/hooks/useContract";
import { useAdmin } from "@/hooks/useAdmin";
import { UserStatus, UserRole } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export default function Home() {
  const { isConnected, account } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { requestUserRole, isLoading: isRequestingRole, error: contractError } = useContract();
  const { isAdmin, isLoading: isLoadingAdmin } = useAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Redirigir a dashboard si el usuario está aprobado (excepto admin que puede ir a admin)
  useEffect(() => {
    if (isConnected && user && user.status === UserStatus.Approved) {
      // Si es admin, no redirigir automáticamente (puede elegir ir a admin o dashboard)
      if (user.role === "Admin") {
        return;
      }
      router.push("/dashboard");
    }
  }, [isConnected, user, router]);

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole || !account) {
      setSubmitError("Por favor selecciona un rol");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const success = await requestUserRole(selectedRole);
      
      if (success) {
        setSubmitSuccess(true);
        // Invalidar query para refrescar datos del usuario
        queryClient.invalidateQueries({ queryKey: ["user", account] });
        // Resetear formulario después de un momento
        setTimeout(() => {
          setSelectedRole("");
          setSubmitSuccess(false);
        }, 3000);
      } else {
        setSubmitError(contractError || "Error al registrar el rol");
      }
    } catch (error: any) {
      setSubmitError(error.message || "Error al registrar el rol");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Supply Chain Tracker
            </h1>
            <p className="text-lg text-muted-foreground">
              Sistema de trazabilidad blockchain para cadenas de suministro
            </p>
          </div>

          {!isConnected ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Conecta tu Wallet</CardTitle>
                <CardDescription>
                  Necesitas conectar tu wallet MetaMask para comenzar
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <ConnectWalletButton size="lg" />
              </CardContent>
            </Card>
          ) : userLoading || isLoadingAdmin ? (
            <Card className="w-full">
              <CardContent className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-4 text-muted-foreground">Cargando información del usuario...</span>
              </CardContent>
            </Card>
          ) : user && user.role === "Admin" ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Bienvenido Administrador</CardTitle>
                <CardDescription>
                  Eres el administrador del sistema. Puedes gestionar usuarios y supervisar la cadena de suministro.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Link href="/admin">
                  <Button size="lg" className="w-full">
                    Ir al Panel de Administración
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : !user ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Registro de Usuario</CardTitle>
                <CardDescription>
                  Selecciona tu rol en la cadena de suministro para registrarte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRoleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value) => setSelectedRole(value as UserRole)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Producer">Producer - Productor de materias primas</SelectItem>
                        <SelectItem value="Factory">Factory - Transformador de materias primas</SelectItem>
                        <SelectItem value="Retailer">Retailer - Distribuidor minorista</SelectItem>
                        <SelectItem value="Consumer">Consumer - Consumidor final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {submitError && <ErrorMessage message={submitError} />}
                  {contractError && <ErrorMessage message={contractError} />}
                  
                  {submitSuccess && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                      ✓ Solicitud enviada correctamente. Espera la aprobación del administrador.
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedRole || isSubmitting || isRequestingRole}
                  >
                    {isSubmitting || isRequestingRole ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Enviando solicitud...
                      </>
                    ) : (
                      "Registrar Rol"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : user.status === UserStatus.Pending ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Solicitud Pendiente</CardTitle>
                <CardDescription>
                  Tu solicitud está siendo revisada por un administrador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Rol solicitado:</strong> {user.role}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Un administrador revisará tu solicitud pronto. Recibirás una notificación cuando sea aprobada.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : user.status === UserStatus.Rejected ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-destructive">Solicitud Rechazada</CardTitle>
                <CardDescription>
                  Tu solicitud de registro fue rechazada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tu solicitud para el rol <strong>{user.role}</strong> fue rechazada por un administrador.
                </p>
                <p className="text-sm text-muted-foreground">
                  Contacta a un administrador para más información o intenta registrarte con otro rol.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </>
  );
}

