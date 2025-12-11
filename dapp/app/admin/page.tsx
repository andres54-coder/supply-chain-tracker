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
import { useAdmin } from "@/hooks/useAdmin";
import { Users, Package, ArrowLeftRight, Settings } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { account, isConnected } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { isAdmin, isLoading: isLoadingAdmin } = useAdmin();

  // Protección de ruta: solo admin puede acceder
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (!userLoading && !isLoadingAdmin && !isAdmin) {
        router.push("/");
    }
  }, [isConnected, isAdmin, userLoading, isLoadingAdmin, router]);

  if (!isConnected || userLoading || isLoadingAdmin) {
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

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona usuarios y supervisa el sistema
            </p>
          </div>

          {/* Accesos rápidos */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Aprobar, rechazar y gestionar usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/users">
                  <Button className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Ver Usuarios
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas del Sistema</CardTitle>
                <CardDescription>
                  Vista general del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <span className="font-medium">Operativo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Red:</span>
                    <span className="font-medium">Anvil Local</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Funciones de Administrador</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Aprobar o rechazar solicitudes de registro de usuarios</li>
                <li>• Ver todos los usuarios del sistema</li>
                <li>• Filtrar usuarios por rol y estado</li>
                <li>• Supervisar la actividad del sistema</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

